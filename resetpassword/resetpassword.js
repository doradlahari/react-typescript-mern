const mongoose = require('mongoose');

const resetPassword = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    conformPassword: {
        type: String,
        required: true
    }
});

const resetPasswordMethod = mongoose.model('Resetted Passwords', resetPassword);

module.exports = resetPasswordMethod;
