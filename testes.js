const fs = require('fs');

try {
    const data = fs.readFileSync('ah.json', 'utf8');
    dataJson = JSON.parse(data);
    dataFilter = dataJson.auctions.filter(auction => auction.item.id === 171276);


    dataFilter = dataFilter.reduce(function(prev, curr) {
        return prev.unit_price < curr.unit_price ? prev : curr;
    });

    console.log(dataFilter);
    console.log(dataFilter.length);
} catch (err) {
    console.error(err);
}