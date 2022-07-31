const axios = require('axios');

const BlizzardTokenManager = require('../../managers/auth/blizzard-token-manager');

class WowTokenManager {

    constructor() {
        this.blizzardTokenManager = new BlizzardTokenManager();
    }

    async getTokenPrice(namespace) {
        try {
            const accessToken = await this.blizzardTokenManager.getToken();
            let response = await axios.get('https://us.api.blizzard.com/data/wow/token/', {
                params: {
                    'namespace': namespace,
                },
                headers: {
                    'Authorization': accessToken
                }
            });
            let formattedResponse = {
                "price": response.data.price,
                "last_updated": new Date(response.data.last_updated_timestamp).toISOString()
            }
            return formattedResponse;
        }
        catch (e) {
            console.log('Error getting WoW token price ', e);
            throw e;
        }
    }
}

module.exports = WowTokenManager;