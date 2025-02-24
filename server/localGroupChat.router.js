const express = require('express');
const LocalGroupChat = require('./localGroupChat.model');
const Lau = require('./lau.model');
const router = express.Router();

const turf = require('@turf/turf');

const signal = require('./signal');

const findByZipCode = async (zipCode, except = []) => {
    const exceptIds = except.map(chat => chat._id);
    return LocalGroupChat.findOne({ 
        'properties.zipcode': zipCode,
        _id: { $nin: exceptIds }
    });
};

const findClosest = async (geojson, except = []) => {
    const exceptIds = except.map(chat => chat._id);
    return LocalGroupChat.findOne({
        _id: { $nin: exceptIds },
        geometry: {
            $near: {
                $geometry: geojson.geometry
            }
        }
    });
};

const findLargest = async (except = []) => {
    const exceptIds = except.map(chat => chat._id);
    return LocalGroupChat.findOne({ _id: { $nin: exceptIds } }).sort({ 'properties.memberCount': -1 });
};


const findIntersectingLAU = async (geojson, except = []) => {
    console.log('finding intersecting LAU');
    console.log(geojson);
    const lau = await Lau.findOne({
        geometry: {
            $geoIntersects: {
                $geometry: geojson.geometry
            }
        }
    });
    console.log('found lau', lau);
    return lau;
};


router.post('/recommended', async (req, res) => {
    console.log('recommended');

    const geojson = req.body.geojson;
    if (!geojson || !geojson.geometry || !geojson.properties) {
        res.status(400).json({ message: 'Invalid geojson' });
        return;
    }
    if(!geojson.properties.zipcode) {
        res.status(400).json({ message: 'Zip code required in properties.' });
        return;
    }
    if(!geojson.properties.name) {
        res.status(400).json({ message: 'Name required in properties.' });
        return;
    }
    console.log('find largest');

   // recommend the largest group chat
    const largest = await findLargest();
    let except = [];
    if (largest) {
        except.push(largest);
    }
    console.log('find by zip code');

    // if closest > 1.5km, recommend for the zip code
    const zipCode = req.body.zipCode;
    var zipCodeChat = await findByZipCode(zipCode, except);
    if (!zipCodeChat) {
       // create
       zipCodeChat = await signal.createLocalGroupChat(geojson, geojson.properties.name, geojson.properties.description || '');
    }
    console.log('searching for intersecting LAU', geojson);
    const lau = await findIntersectingLAU(geojson, except);
    console.log("found lau", lau);
    if(!lau) {
        res.status(400).json({ message: 'No LAU found for the given geometry.' });
        return;
    }
    var lauChat = await LocalGroupChat.findOne({ formalAdminGeometry: lau._id });
    console.log("found lauChat", lauChat);

    // is there already a chat for this LAU?
    if (!lauChat) {
        console.log('creating new chat for LAU with name: ', lau.properties.LAU_NAME);
        
        let geomtry = lau.geometry;

        lauChat = await signal.createLocalGroupChat(
            {
                type: 'Feature',
                geometry: geomtry,
                properties: {
                    zipcode: 'none',
                    name: lau.properties.LAU_NAME
                }
            },
            lau.properties.LAU_NAME,
            "coordination chat for " + lau.properties.LAU_NAME
        );

        lauChat.formalAdminGeometry = lau._id;
        await lauChat.save();
    }
    console.log('settled on lauChat', lauChat);

    if(lauChat) {
        except.push(lauChat);
    }
    const closest = await findClosest(geojson, except);
    if (closest) {
        except.push(closest);
    }
    

    const recommendation = [];
    

    if(lauChat) {
        recommendation.push({
            reason: 'Larger Area Coordination',
            _id: lauChat._id,
            name: lauChat.signal.name,
            description: lauChat.signal.description,
            memberCount: lauChat.signal.memberCount
        });
    }

    if (largest) {
        recommendation.push({
            reason: 'largest',
            _id: largest._id,
            name: largest.signal.name,
            description: largest.signal.description,
            memberCount: largest.signal.memberCount
        });
    }
    if (zipCodeChat) {
        recommendation.push({
            reason: 'your zip code',
            _id: zipCodeChat._id,
            name: zipCodeChat.signal.name,
            description: zipCodeChat.signal.description,
            memberCount: zipCodeChat.signal.memberCount
        });

    if (closest) {
        recommendation.push({
            reason: 'otherwise closest',
            _id: closest._id,
            name: closest.signal.name,
            description: closest.signal.description,
            memberCount: closest.signal.memberCount
        });
    }

    }

    // make sure recommendations are unique (_id)
    const unique = [];
    const seen = new Set();
    for (const chat of recommendation) {
        if (!seen.has(chat._id.toString())) {
            seen.add(chat._id.toString());
            unique.push(chat);
        }
    }
    // log all names
    console.log('recommendations:', recommendation);

   
    
    res.json(unique);
    
});


router.post('/join', async (req, res) => {
    const phonenumber = req.body.phonenumber;
    let groupChats = req.body._ids;
    const mongoose = require('mongoose');


    // unique group chats 
    groupChats = [...new Set(groupChats)];
    const objectIds = groupChats.map(id => new mongoose.Types.ObjectId(id));
    const chats = await LocalGroupChat.find({ _id: { $in: objectIds } });
    // warnign if not all chats found
    if (chats.length !== groupChats.length) {
        console.warn('not all chats in db, ignoring ', groupChats.length - chats.length);
    }
    const results = await Promise.all(chats.map(async (chat) => {
        if (chat.signal.id) {
            console.log('chat ', chat.signal.id.substring(0, 8), '.. exists, joining ');
            const joined = await signal.joinLocalGroupChat(chat, phonenumber);
            console.log("✅");
            return joined;
        } else {
            console.log('registering chat on signal..');
            const joined = await signal.registerLocalGroupChat(chat, [phonenumber]);
            console.log("✅");
            return joined;
        }
    }));
    res.json(results);


});




console.log('\x1b[31m%s\x1b[0m', 'DELETE /groups VULNERABLE ENDPOINT OPEN');
console.log('\x1b[31m%s\x1b[0m', 'GET    /groups VULNERABLE ENDPOINT OPEN');

router.get('/', async (req, res) => {
    try {
        const chats = await LocalGroupChat.find();
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/delete', async (req, res) => {
    try {
        await LocalGroupChat.deleteMany();
        res.json({ message: 'All local group chats deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
