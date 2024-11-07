// simple express app

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    // send /views/index.html
    res.sendFile(__dirname + '/client/index.html');
    }
);

// static files on root
app.use(express.static('client'));
app.listen(3000, () => {
    console.log('Server is running on port 3000');
    }
);
