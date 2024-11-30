//mongodb

const connectDB = require("./config/database")
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const port = 5001;
const Userrouter = require('./api/user1');

app.use(cors({
    origin: 'http://localhost:5001', // Replace with your frontend origin
    methods: ['GET', 'POST'],       // Allowed HTTP methods
    credentials: true               // If using cookies or authentication tokens
  }));

//For acceppting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user',Userrouter);

// app.use(express.static(path.join(__dirname, 'public')));



connectDB();
app.listen(port,() =>
{
    console.log(`Server running on port ${port}`);
})
// console.log(process.env.AUTH_EMAIL,process.env.AUTH_PASS);