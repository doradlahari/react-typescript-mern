const mongoose = require('mongoose');

const users = new mongoose.Schema({
    email: {
        type: String,
        required: true
    }
});

const allUsers = mongoose.model('users', users);

module.exports = allUsers;
