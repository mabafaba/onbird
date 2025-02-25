// enable env variables
const axios = require('axios');
const mongoose = require('mongoose');
const LocalGroupChat = require('./localGroupChat.model');

const signal_api_url = 'http://localhost:8080/v1/';

const dotenv = require('dotenv');
require('dotenv').config();
const clientNumber = process.env.CLIENT_NUMBER;
clientnumberUrlEncoded = encodeURIComponent(clientNumber);

if (!clientNumber) {
    throw new Error('CLIENT_NUMBER is not defined in the environment variables.');
}
console.log('Client number:', clientNumber.substring(0, 5));

// sh code to create env variable:
// echo "export CLIENT_NUMBER=+1234567890" >> ~/.bashrc
const sendMessageToGroup = async (groupId, message) => {
    // replace + with %2B
    return axios.post(`${signal_api_url}groups/${clientnumberUrlEncoded}/${groupId}/message`, {
        message: message
    }, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .catch(error => {
        console.error('Error sending message to group:', error);
    });
}




const getSignalGroup = async (groupId) => {
    // replace + with %2B
    return axios.get(`${signal_api_url}groups/${clientnumberUrlEncoded}/${groupId}`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).catch(error => {
        console.error('Error getting signal group:', error);
    }
    );
};

const createLocalGroupChat = async (geojson, name, description) => {
    const { type, geometry, properties } = geojson;
    if (!type || !geometry || !properties) {
        throw new Error('Type, geometry, and properties are required.');
    }

    if (!properties.zipcode) {
        throw new Error('Zip code required in properties.');
    }

    if (!properties.name) {
        throw new Error('Name required in properties.');
    }

    if (Object.keys(properties).length > 2) {
        throw new Error('Only zipcode and invite link are allowed in properties.');
    }

    // if (geometry.type !== 'Point' || geometry.coordinates.length !== 2) {
    //     throw new Error('Invalid geometry, must be a Point with 2 coordinates.');
    // }

    if (type !== 'Feature') {
        throw new Error('Invalid type, must be "Feature".');
    }
    

    

    // if coordinates are not numeric, convert them to numbers
    const validateCoordinates = (coordinates) => {
        if (Array.isArray(coordinates)) {
            return coordinates.map(validateCoordinates);
        }
        return Number(coordinates);
    }

    geojson.geometry.coordinates = validateCoordinates(geojson.geometry.coordinates);


    const signalGroupData = {
        type: 'Feature',
        geometry: geojson.geometry,
        properties: {
            zipcode: geojson.properties.zipcode
        },
        signal: {
            name: name,
            memberCount: 0,
            description: description,
            invite_link: null
        }
    };

    const newSignalGroup = new LocalGroupChat(signalGroupData);
    console.log('newSignalGroup:', newSignalGroup);
    return newSignalGroup.save();
};

const registerLocalGroupChat = async (localGroupChat, members) => {
    
    // make sure members contains self
    if (!members.includes(clientNumber)) {
        members.push(clientNumber);
    }
    // make sure members is unique
    members = [...new Set(members)];
    const response = await axios.post(`${signal_api_url}groups/${clientnumberUrlEncoded}`, {
        description: localGroupChat.signal.description,
        expiration_time: 0,
        group_link: "enabled",
        members: members,
        name: localGroupChat.signal.name,
        permissions: {
            add_members: 'only-admins',
            edit_group: 'only-admins'
        }
    }, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).catch(error => {
        console.error('Error registering local group chat:', error);
    }
    );


    const data = response.data;

    // get group details 
    const signalGroupDetails = await getSignalGroup(data.id); // http response
    // throw error if response is not 200
    if (signalGroupDetails.status !== 200) {
        throw new Error('Error getting signal group details.');
    }

    if (!data.id || !signalGroupDetails.data.members || !signalGroupDetails.data.invite_link) {
        throw new Error('Incomplete data received from Signal API.');
    }

    localGroupChat.signal.id = data.id;
    localGroupChat.signal.memberCount = signalGroupDetails.data.members.length;
    localGroupChat.signal.invite_link = signalGroupDetails.data.invite_link;

    const updatedChat = await localGroupChat.save();

    if (!updatedChat) {
        throw new Error('Error updating local group chat.');
    }

    return updatedChat;
};

const joinLocalGroupChat = async (_id, phoneNumber) => {


    // 


    // check if chat exists
    const existingChat = await LocalGroupChat.findOne({ _id: new mongoose.Types.ObjectId(_id) });

    if (!existingChat) {
        throw new Error('Local group chat does not exist.');
    }

    if (!existingChat.signal.id) {
        console.log('registering local group chat:', existingChat);
        return registerLocalGroupChat(existingChat, [phoneNumber]);
    } else {
        groupId = existingChat.signal.id;

    console.log('Joining local group chat:', groupId);
     response = await axios.post(`${signal_api_url}groups/${clientnumberUrlEncoded}/${groupId}/members`, {
        members: [phoneNumber]
    }, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).catch(error => {
        console.error('Error joining the local group chat:', error);
    }
    );


    if (response.status !== 200 && response.status !== 204) {
        throw new Error('Error joining the local group chat.');
    }
    

    // increase member count
    existingChat.signal.memberCount += 1;
    await existingChat.save();
    }
    return existingChat;
};

module.exports = {
    sendMessageToGroup,
    getSignalGroup,
    createLocalGroupChat,
    registerLocalGroupChat,
    joinLocalGroupChat
};