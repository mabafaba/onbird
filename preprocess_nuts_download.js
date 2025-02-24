// load file
const fs = require('fs');
const path = require('path');

geojson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data/nuts.geojson')));
feautures = geojson.features;
// save file
fs.writeFileSync(path.resolve(__dirname, 'data/nuts_features.json'), JSON.stringify(feautures));
