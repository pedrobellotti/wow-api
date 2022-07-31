const axios = require('axios');

const DatabasePoolConnection = require('../../utils/database-connector');
const BlizzardTokenManager = require('../../managers/auth/blizzard-token-manager');

class ProfessionsManager {

    constructor() {
        this.databaseManager = new DatabasePoolConnection();
        this.blizzardTokenManager = new BlizzardTokenManager();
    }

    async populateProfessionsTable() {
        try {
            const accessToken = await this.blizzardTokenManager.getToken();
            let response = await axios.get('https://us.api.blizzard.com/data/wow/profession/index', {
                params: {
                    'namespace': 'static-us',
                    'locale': 'pt_BR'
                },
                headers: {
                    'Authorization': accessToken
                }
            });
            let insertedProfessions = [];
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            await client.query('BEGIN');
            for (let profession of response.data.professions) {
                let insertedProfession = await client.query('INSERT INTO professions(name, blizzard_id) VALUES ($1, $2) RETURNING id', [profession.name, profession.id]);
                insertedProfessions.push({
                    "profession_id": insertedProfession.rows[0].id,
                    "profession_name": profession.name,
                    "profession_blizzard_id": profession.id
                })
            }
            await client.query('COMMIT');
            client.release();
            return insertedProfessions;
        }
        catch (e) {
            console.log('Error populating professions table ', e);
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
    }

    async populateProfessionsTierTable() {
        try {
            const accessToken = await this.blizzardTokenManager.getToken();
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            let querySelect = await client.query('SELECT id, name, blizzard_id FROM professions');
            let insertedTiers = [];
            await client.query('BEGIN');
            for (let profession of querySelect.rows) {
                let professionInfo = {
                    "profession_name": profession.name,
                    "profession_id": profession.id,
                    "inserted_tiers": []
                };
                let response = await axios.get(`https://us.api.blizzard.com/data/wow/profession/${profession.blizzard_id}`, {
                    params: {
                        'namespace': 'static-us',
                        'locale': 'pt_BR'
                    },
                    headers: {
                        'Authorization': accessToken
                    }
                });
                if (response.data.skill_tiers) {
                    for (let tier of response.data.skill_tiers) {
                        let insertedTier = await client.query('INSERT INTO profession_tiers(name, blizzard_id, profession_id) VALUES ($1, $2, $3) RETURNING id', [tier.name, tier.id, profession.id]);
                        professionInfo.inserted_tiers.push({
                            "tier_id": insertedTier.rows[0].id,
                            "tier_name": tier.name
                        });
                    }
                }
                insertedTiers.push(professionInfo);
            }
            await client.query('COMMIT');
            client.release();
            return insertedTiers;
        }
        catch (e) {
            console.log('Error populating profession tiers table ', e);
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
    }

    async populateProfessionTierRecipesTable() {
        try {
            const accessToken = await this.blizzardTokenManager.getToken();
            let pool = await this.databaseManager.configurePool();
            const client = await pool.connect();
            let querySelect = await client.query(`select pt.id as "professionTierId", p.blizzard_id as "professionBlizzardId", pt.id, pt.name, pt.blizzard_id as "tierBlizzardId" FROM profession_tiers pt inner join professions p on p.id = pt.profession_id WHERE pt.name like '%Shadowlands%'`);
            let insertedTiers = [];
            await client.query('BEGIN');
            for (let professionTier of querySelect.rows) {
                let professionTierInfo = {
                    "profession_tier_name": professionTier.name,
                    "profession_tier_id": professionTier.id,
                    "inserted_recipes": []
                };
                let response = await axios.get(`https://us.api.blizzard.com/data/wow/profession/${professionTier.professionBlizzardId}/skill-tier/${professionTier.tierBlizzardId}`, {
                    params: {
                        'namespace': 'static-us',
                        'locale': 'pt_BR'
                    },
                    headers: {
                        'Authorization': accessToken
                    }
                });
                if (response.data.categories) {
                    for (let category of response.data.categories) {
                        for (let recipe of category.recipes) {
                            let insertedRecipe = await client.query('INSERT INTO recipes(name, blizzard_id, category) VALUES ($1, $2, $3) RETURNING id', [recipe.name, recipe.id, category.name]);
                            let insertedRecipeTier = await client.query('INSERT INTO profession_tier_recipes(profession_tier_id, recipe_id) VALUES ($1, $2) RETURNING id', [professionTier.professionTierId, insertedRecipe.rows[0].id]);
                            professionTierInfo.inserted_recipes.push({
                                "recipe_id": insertedRecipe.rows[0].id,
                                "recipe_name": recipe.name,
                                "recipe_category": category.name,
                                "profession_tier_recipe_id": insertedRecipeTier.rows[0].id
                            });
                        }
                    }
                }
                insertedTiers.push(professionTierInfo);
            }
            await client.query('COMMIT');
            client.release();
            return insertedTiers;
        }
        catch (e) {
            console.log('Error populating profession tiers table ', e);
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw e;
        }
    }

}

module.exports = ProfessionsManager;