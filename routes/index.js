const express = require('express');
const app = express();

const User = require('./user');
app.use('/payment', require('./payment'));


app.use('/user', User);


module.exports = app;