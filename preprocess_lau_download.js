// load file
const fs = require('fs');
const path = require('path');

lau_geojson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data/LAU_RG_01M_2023_4326.geojson')));
lau_feautures = lau_geojson.features;
// save file
fs.writeFileSync(path.resolve(__dirname, 'data/lau_features.json'), JSON.stringify(lau_feautures));
