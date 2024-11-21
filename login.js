//mongodb

const connectDB=require("./config/database")
const express = require('express');
const app = express();
const path = require('path');
const port = 5001;
const Userrouter = require('./api/user1');
const { applyTimestamps } = require('./models/user');

//For acceppting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user',Userrouter);

app.use(express.static(path.join(__dirname, 'public')));

// Set up a route for your HTML file (optional, if you want to specify a different route)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

connectDB();
app.listen(port,() =>
{
    console.log(`Server running on port ${port}`);
})