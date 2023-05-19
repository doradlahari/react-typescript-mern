const mongoose = require("mongoose");

const loginDetails = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("loggedinusers", loginDetails);