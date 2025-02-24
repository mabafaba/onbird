// simple express app

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const localGroupChatRouter = require('./server/localGroupChat.router.js');
const lauRouter = require('./server/lau.router.js');
const encryptionRouter = require('./server/encryption.js');
// app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '101mb'}));

// connect mongoose database

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/onbird');


app.get('/', (req, res) => {
    // send /views/index.html
    res.sendFile(__dirname + '/client/index.html');
    }
);

app.use('/groups', localGroupChatRouter);
app.use('/lau', lauRouter);
app.use('/encryption', encryptionRouter);

// serve client folder on root
app.use(express.static('client'));

app.listen("0031", () => {
    console.log('Server is running on port 0031');
    }
);
