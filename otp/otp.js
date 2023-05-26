const mongoose = require('mongoose');

const generateOTPValueSchema = new mongoose.Schema({
    otp: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const generateOTPValue = mongoose.model('GenerateOTPValue', generateOTPValueSchema);

module.exports = generateOTPValue;
