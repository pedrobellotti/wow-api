
const DatabasePoolConnection = require('../../utils/database-connector');

class LogsManager {

    constructor() {
        this.databaseManager = new DatabasePoolConnection();
    }

    async saveRouteLog(route, request, response, status) {
        try {
            let req = {
                "params": request?.params || null,
                "query": request?.query || null,
                "body": request?.body || null,
                "headers": request?.rawHeaders || null
            }
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            await client.query('BEGIN');
            await client.query('INSERT INTO logs(route, request, status, response) VALUES ($1, $2, $3, $4)', [route, req, status, response]);
            await client.query('COMMIT');
            client.release();
        }
        catch (e) {
            console.log(`Error saving route log. Error ${e}. Parameters: ${route}, ${request}, ${status}, ${response}`);
            if(client) {
                await client.query('ROLLBACK');
                client.release();
            }
        }
    }
}

module.exports = LogsManager;