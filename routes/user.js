const express = require('express');
const router = express.Router();
const {
    updateUsersGameStatus
} = require('../controller/user');


// POST request to update user score
router.get('/get-all-users', updateUsersGameStatus);


module.exports = router;