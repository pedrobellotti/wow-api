const axios = require('axios');

const DatabasePoolConnection = require('../../utils/database-connector');
const BlizzardTokenManager = require('../../managers/auth/blizzard-token-manager');

class RecipesManager {

    constructor() {
        this.databaseManager = new DatabasePoolConnection();
        let blizzardTokenManager = new BlizzardTokenManager();
        this.blizzardTokenManager = new BlizzardTokenManager();
    }

    async updatePrices() {
        let now = new Date();
        
    }

    async populateRecipeAndItemsTables() {
        function delay(time) {
            return new Promise(resolve => setTimeout(resolve, time));
        }

        try {
            const accessToken = await this.blizzardTokenManager.getToken();
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            let querySelect = await client.query('SELECT id, name, blizzard_id FROM recipes');
            let insertedRecipeItems = [];
            await client.query('BEGIN');
            for (let recipe of querySelect.rows) {
                console.log(`Processing recipe ${recipe.id} - ${recipe.name}`);
                let recipeInfo = {
                    "recipe_name": recipe.name,
                    "recipe_id": recipe.id,
                    "reagents": []
                };
                axios.get(`https://us.api.blizzard.com/data/wow/recipe/${recipe.blizzard_id}`, {
                    params: {
                        'namespace': 'static-us',
                        'locale': 'pt_BR'
                    },
                    headers: {
                        'Authorization': accessToken
                    }
                }).then(async function (response) {
                    for (let reagent of response.data?.reagents) {
                        let reagentId = 0;
                        let reagentName = '';
                        let findReagentId = await client.query('SELECT id, name FROM items WHERE blizzard_id = $1', [reagent.reagent.id]);
                        if (findReagentId.rows?.length > 0) {
                            reagentId = findReagentId.rows[0].id;
                            reagentName = findReagentId.rows[0].name;
                        }
                        else {
                            let insertedItem = await client.query('INSERT INTO items(name, blizzard_id) VALUES ($1, $2) RETURNING id, name', [reagent.reagent.name, reagent.reagent.id]);
                            reagentId = insertedItem.rows[0].id;
                            reagentName = insertedItem.rows[0].name;
                        }
                        let insertedRecipeItem = await client.query('INSERT INTO recipe_items(reagent_id, quantity, recipe_id) VALUES ($1, $2, $3) RETURNING id', [reagentId, reagent.quantity, recipe.id]);
                        recipeInfo.reagents.push({
                            "item_id": reagentId,
                            "item_name": reagentName,
                            "recipe_item_id": insertedRecipeItem.rows[0].id,
                            "quantity": reagent.quantity
                        })
                    }
                    if (response.data.crafted_item) {
                        let findCraftedItemId = await client.query('SELECT id, name FROM items WHERE blizzard_id = $1', [response.data.crafted_item.id]);
                        let craftedItemId = 0;
                        if (findCraftedItemId.rows?.length > 0) {
                            craftedItemId = findCraftedItemId.rows[0].id;
                        }
                        else {
                            let insertedCraftedItem = await client.query('INSERT INTO items(name, blizzard_id) VALUES ($1, $2) RETURNING id', [response.data.crafted_item.name, response.data.crafted_item.id]);
                            craftedItemId = insertedCraftedItem.rows[0].id;
                        }
                        await client.query('UPDATE recipes SET crafted_item_id = $1 WHERE id = $2', [craftedItemId, recipe.id]);
                    }
                    await client.query('UPDATE recipes SET crafted_quantity = $1 WHERE id = $2', [response.data.crafted_quantity.value, recipe.id]);
                    insertedRecipeItems.push(recipeInfo);
                }).catch(function (e) {
                    console.log("Request error: ", e);
                });
                console.log('Done, waiting 250ms');
                await delay(250);
            }
            await client.query('COMMIT');
            client.release();
            return insertedRecipeItems;
        }
        catch (e) {
            console.log('Error populating recipe and items table ', e);
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
    }

}

module.exports = RecipesManager;