// router to find geometries from LAU database
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Lau = require('./lau.model');

router.get('/geometries', async (req, res) => {
    try {
        const geometries = await Lau.find().limit(10);
        res.json(geometries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// find geometries intersecting with a given geojson feature
router.post('/intersect', async (req, res) => {
    const { type, geometry } = req.body;
    if (!type || !geometry || !geometry.coordinates) {
        return res.status(400).json({ message: 'Type and geometry.coordinates are required.' });
    }

    try {
        const intersectingGeometries = await Lau.find({
            geometry: {
                $geoIntersects: {
                    $geometry: {
                        type,
                        coordinates: geometry.coordinates
                    }
                }
            }
        });

        res.json(intersectingGeometries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// curl -X POST -H "Content-Type: application/json" -d '{"type":"Point","geometry":{"coordinates":[13.404954,52.520008]}}' http://localhost:3000/lau/intersect

// test intersect route using a sample geojson feature
router.get('/test', async (_, res) => {
    // line through berlin and hamburg
    const type = 'LineString';
    const coordinates = [[13.404954, 52.520008], [9.993682, 53.551086]];
    const geometry = { type, coordinates };

    try {
        const intersectingGeometries = await Lau.find({
            geometry: {
                $geoIntersects: {
                    $geometry: geometry
                }
            }
        });

        res.json(intersectingGeometries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;