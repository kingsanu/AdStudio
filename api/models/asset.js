/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "icon", "illustration", "background"],
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Asset", AssetSchema);
