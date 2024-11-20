//mongodb
require('./config/database');

const app = require('express')();
const port = 3000;
const UserRouter = require('./api/user1')

//For acceppting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.listen(port,() =>
{
    console.log(`Server running on port ${port}`);
})