const DatabasePoolConnection = require('../../utils/database-connector');
const { tokenSecret } = require('../environment/environment-variables')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class UsersManager {

    constructor() {
        this.databaseManager = new DatabasePoolConnection();
    }

    // This function is called in every route that has token auth enabled
    async validateToken(req, res, next) {
        let authorizationHeader = req.headers['authorization'];
        let token = authorizationHeader && authorizationHeader.split(' ')[1];
        if (token == null) {
            return res.sendStatus(401).send("No token present");
        }
        jwt.verify(token, tokenSecret, (err, authenticatedUser) => {
            if (err) {
                return res.status(403).send("Invalid token");
            }
            else {
                req.user = authenticatedUser;
                next();
            }
        });
    }

    async createUser(username, password) {
        try {
            let hashedPassword = await bcrypt.hash(password, 10);
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            await client.query('BEGIN');
            await client.query('INSERT INTO users(username, hashed_password) VALUES ($1, $2)', [username, hashedPassword]);
            await client.query('COMMIT');
            client.release();
            return { "user": username };
        }
        catch (e) {
            console.log('Error creating user ', e);
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
    }

    async generateToken(username, password) {
        try {
            let pool = await this.databaseManager.configurePool();
            let userResult = await pool.query('SELECT username, hashed_password FROM users WHERE username = $1', [username]);
            if (userResult.rows.length > 0) {
                if (await bcrypt.compare(password, userResult.rows[0].hashed_password)) {
                    return { "token": jwt.sign({ "user": username, "password": userResult.rows[0].hashed_password }, tokenSecret) };
                }
                else {
                    return "Wrong password";
                }
            }
            else {
                return "User not found";
            }
        }
        catch (e) {
            console.log('Error generating token ', e);
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
    }
}

module.exports = UsersManager;