//mongodb

const connectDB=require("./config/database")
const app = require('express')();
const port = 5001;
const Userrouter = require('./api/user1');
const { applyTimestamps } = require('./models/user');

//For acceppting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user',Userrouter);

app.get('/', (req, res) => {
    res.send('Welcome to your Node.js authentication app!');
  });
  app.get('/user/signup', (req, res) => {
    res.send('Welcome to my Node.js authentication app!');
  });

connectDB();
app.listen(port,() =>
{
    console.log(`Server running on port ${port}`);
})