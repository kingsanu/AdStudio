/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// File: api/models/illustration.js
const mongoose = require("mongoose");

const IllustrationSchema = new mongoose.Schema(
  {
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
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Illustration", IllustrationSchema);
