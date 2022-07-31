const axios = require('axios');

const DatabasePoolConnection = require('../../utils/database-connector');

class BlizzardTokenManager {

    constructor() {
        this.databaseManager = new DatabasePoolConnection();
    }

    async generateToken(clientId, clientSecret) {
        try {
            let response = await axios.post(
                'https://us.battle.net/oauth/token',
                new URLSearchParams({
                    'grant_type': 'client_credentials'
                }),
                {
                    auth: {
                        username: clientId,
                        password: clientSecret
                    }
                }
            );
            return response.data;
        }
        catch (e) {
            console.log('Error generating auth token ', e);
            throw e;
        }
    }

    async getToken() {
        try {
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            let currentTokenQuery = await client.query('SELECT blizzard_client_id, blizzard_client_secret, blizzard_client_token, last_update FROM token_info WHERE id = 1');
            let currentTokenRows = currentTokenQuery.rows[0];
            //Tokens expire after 24 hours if not renewed
            let now = new Date();
            let lastUpdate = new Date(currentTokenRows.last_update);
            let timeDifferenceInHours = (now - lastUpdate)/36e5;
            if (timeDifferenceInHours < 23) {
                client.release();
                return currentTokenRows.blizzard_client_token;
            }
            else {
                let generatedToken = await this.generateToken(currentTokenRows.blizzard_client_id, currentTokenRows.blizzard_client_secret);
                let newToken = `${generatedToken.token_type} ${generatedToken.access_token}`;
                await client.query('BEGIN');
                await client.query('UPDATE token_info SET blizzard_client_token = $1, last_update = $2 WHERE id = 1', [newToken, now]);
                await client.query('COMMIT');
                client.release();
                return newToken;
            }
        }
        catch (e) {
            console.log('Error getting auth token ', e);
            if(client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
	}

}

module.exports = BlizzardTokenManager;