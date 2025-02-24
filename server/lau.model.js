const mongoose = require('mongoose');
const lauSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    properties: {
        GISCO_ID: String,
        CNTR_CODE: String,
        LAU_ID: String,
        LAU_NAME: String,
        POP_2023: Number,
        POP_DENS_2023: Number,
        AREA_KM2: Number,
        YEAR: Number
    },
    geometry: {
        type: {
            type: String,
            required: true
        },
        coordinates: {
            type: Array,
            required: true
        }
    }
});

const Lau = mongoose.model('Lau', lauSchema);


// add spatial index to geometry field
Lau.collection.createIndex({ geometry: '2dsphere' });

module.exports = Lau;