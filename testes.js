const fs = require('fs');

const itemsToLookFor = [
    {
        "id": 171276,
        "name": "Frasco",
        "price": 0,
        "recipe": [
            {
                "id": 180732,
                "name": "ampola",
                "price": 0,
                "quantity": 1
            },
            {
                "id": 171315,
                "name": "beladona",
                "price": 0,
                "quantity": 3
            },
            {
                "id": 168586,
                "name": "gloria",
                "price": 0,
                "quantity": 4
            },
            {
                "id": 168589,
                "name": "radicerne",
                "price": 0,
                "quantity": 4
            },
            {
                "id": 168583,
                "name": "broto",
                "price": 0,
                "quantity": 4
            },
            {
                "id": 170554,
                "name": "tocha",
                "price": 0,
                "quantity": 4
            }
        ]
    }
]

function getCheapestPrice(data, itemId) {
    dataFilter = data.auctions.filter(auction => auction.item.id === itemId);
    dataFilter = dataFilter.reduce(function(prev, curr) {
        return prev.unit_price < curr.unit_price ? prev : curr;
    });
    return dataFilter.unit_price
}

try {
    const data = fs.readFileSync('ah.json', 'utf8');
    dataJson = JSON.parse(data);

    for (let item of itemsToLookFor) {
        if(item.price === 0) {
            item.price = getCheapestPrice(dataJson, item.id);
        }
        let craftingCost = 0;
        for(let ingredient of item.recipe) {
            if(ingredient.price === 0) {
                ingredient.price = getCheapestPrice(dataJson, ingredient.id);
            }
            craftingCost += ingredient.price*ingredient.quantity
        }
        item['craftingCost'] = craftingCost
    }
    console.log(itemsToLookFor);
} catch (err) {
    console.error(err);
}