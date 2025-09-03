const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

module.exports = sequelize;



// through tecshield user
//
// MAIL_HOST=rugstoriches.apis.tecshield.net
// MAIL_PORT=465
// MAIL_PASS=FmfrsMdT=A-H
// MAIL_USER=noreplay@rugstoriches.apis.tecshield.net
// MAIL_FROM='noreplay@rugstoriches.apis.tecshield.net'