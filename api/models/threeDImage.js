const mongoose = require('mongoose');

const ThreeDImageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
});

const ThreeDImage = mongoose.model('ThreeDImage', ThreeDImageSchema);

module.exports = ThreeDImage;