//mongodb

const connectDB = require("./config/database")
const express = require('express');

const app = express();
const path = require('path');
const port = 5500;
const Userrouter = require('./api/user1');
const router = require('./api/music');

const cors = require('cors');
// app.use(cors());
app.use(cors({ origin: '*'}));

//For accepting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user',Userrouter);
app.use('/',router);

// app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));


connectDB();
app.listen(port,() =>
{
    console.log(`Server running on port ${port}`);
})
// console.log(process.env.AUTH_EMAIL,process.env.AUTH_PASS);