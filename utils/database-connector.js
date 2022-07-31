const { Pool } = require('pg');

const {
    databaseUser,
    databaseHost,
    databaseName,
    databasePassword,
    databasePort,
    databaseConnectionLimit
} = require('../managers/environment/environment-variables');

class DatabasePoolConnection {

	async createOrGetPool() {
		if(!global.databaseConnection) {
			global.databaseConnection = new Pool({
				user: databaseUser,
				host: databaseHost,
				database: databaseName,
				password: databasePassword,
				port:databasePort,
				max: databaseConnectionLimit,
			});
		}
		return global.databaseConnection;
	}

	async configurePool() {
		return Promise.resolve(this.createOrGetPool());
	}
}

module.exports = DatabasePoolConnection;