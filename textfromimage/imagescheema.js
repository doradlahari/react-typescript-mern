const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: String,
    filePath: String,
    text: String,
    audio: String
});

const textExtractionFromImage = mongoose.model('Image', imageSchema);
module.exports = textExtractionFromImage