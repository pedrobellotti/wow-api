const port = process.env.APP_PORT;
const databaseUser = process.env.DATABASE_USER;
const databaseHost = process.env.DATABASE_HOST;
const databaseName = process.env.DATABASE_NAME;
const databasePassword = process.env.DATABASE_PASSWORD;
const databasePort = process.env.DATABASE_PORT;
const databaseConnectionLimit = process.env.DATABASE_CONNECTION_LIMIT;

module.exports = {
    port,
    databaseUser,
    databaseHost,
    databaseName,
    databasePassword,
    databasePort,
    databaseConnectionLimit
}