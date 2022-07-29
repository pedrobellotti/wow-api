require('dotenv').config()
const express = require('express')
const axios = require('axios');

const app = express();
const port = 3000;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const accessTokenHeader = process.env.ACCESS_TOKEN_HEADER;

app.get('/', (req, res) => {
    res.send('API is working!');
})

app.get('/getAccessToken', async (req, res) => {
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
    res.send(response.data);
})

app.get('/tokenPrice', async (req, res) => {
    let response = await axios.get('https://us.api.blizzard.com/data/wow/token/', {
        params: {
            'namespace': 'dynamic-us',
        },
        headers: {
            'Authorization': accessTokenHeader
        }
    });
    res.send(response.data);
})

app.get('/auctionHouse', async (req, res) => {
    let response = await axios.get('https://us.api.blizzard.com/data/wow/connected-realm/3209/auctions', {
        params: {
            'namespace': 'dynamic-us',
            'locale': 'en_US',
        },
        headers: {
            'Authorization': accessTokenHeader
        }
    });
    res.send(response.data);
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

