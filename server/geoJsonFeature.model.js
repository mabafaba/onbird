const mongoose = require("mongoose");
const geoJsonFeatureSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Feature'],
        required: true
    },
    geometry: {
        type: {
            type: String,
            enum: [
                "Point",
                "MultiPoint",
                "LineString",
                "MultiLineString",
                "Polygon",
                "MultiPolygon",
                "GeometryCollection"
            ],
            required: true
        },
        coordinates: {
            type: Array, // For Point
            required: true
        }
    },
    properties: {
        type: Object,
        required: true
    }
});

// Ensure a geospatial index
geoJsonFeatureSchema.index({ geometry: "2dsphere" });

const GeoJsonFeature = mongoose.model("GeoJsonFeature", geoJsonFeatureSchema);

module.exports = GeoJsonFeature;