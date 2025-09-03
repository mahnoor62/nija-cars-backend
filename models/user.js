const {DataTypes} = require('sequelize');
const sequelize = require('../config');

const User = sequelize.define('User', {

    email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        unique: true
    },
    radeemCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    paymentIntent: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = User;

