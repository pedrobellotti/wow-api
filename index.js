//NPM imports
require('dotenv').config();
const express = require('express');
const app = express();
const axios = require('axios');

//Manager imports
const WowTokenManager = require('./managers/wow-token/wow-token-manager');
const ProfessionsManager = require('./managers/professions/professions-manager');
const RecipesManager = require('./managers/recipes/recipes-manager');

//Manager instances
const wowTokenManager = new WowTokenManager();
const professionsManager = new ProfessionsManager();
const recipesManager = new RecipesManager();

//Environment variables
const { port, accessTokenHeader } = require('./managers/environment/environment-variables');

// Routes
// Test
app.get('/test', (req, res) => {
    res.send('API is working!');
});

// Get wow token price
app.get('/tokenPrice', async (req, res) => {
    try {
        let wowToken = await wowTokenManager.getTokenPrice('dynamic-us');
        res.status(200);
        res.send(wowToken);
    }
    catch {
        res.status(500);
        res.send("Error while processing your request.");
    }
});

// Get auction house data
app.get('/auctionHouse', async (req, res) => {
    let response = await axios.get('https://us.api.blizzard.com/data/wow/connected-realm/3209/auctions', {
        params: {
            'namespace': 'dynamic-us',
            'locale': 'pt_BR',
        },
        headers: {
            'Authorization': accessTokenHeader
        }
    });
    res.send(response.data);
});

// Populate professions table
app.get('/populateProfessions', async(req, res) => {
    try {
        let professions = await professionsManager.populateProfessionsTable();
        res.status(200);
        res.send(professions);
    }
    catch {
        res.status(500);
        res.send("Error while processing your request.");
    }
})

// Populate profession tier table
app.get('/populateProfessionsTiers', async(req, res) => {
    try {
        let tiers = await professionsManager.populateProfessionsTierTable();
        res.status(200);
        res.send(tiers);
    }
    catch {
        res.status(500);
        res.send("Error while processing your request.");
    }
})


// Populate recipe table
app.get('/populateRecipes', async(req, res) => {
    try {
        let recipes = await professionsManager.populateProfessionTierRecipesTable();
        res.status(200);
        res.send(recipes);
    }
    catch {
        res.status(500);
        res.send("Error while processing your request.");
    }
})

// Populate recipe and items table
app.get('/populateRecipesAndItems', async(req, res) => {
    try {
        let recipesAndItems = await recipesManager.populateRecipeAndItemsTables();
        res.status(200);
        res.send(recipesAndItems);
    }
    catch {
        res.status(500);
        res.send("Error while processing your request.");
    }
})

// Start app
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
