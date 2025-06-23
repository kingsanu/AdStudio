/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");

const iconSchema = new mongoose.Schema(
  {
    img: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      default: "",
    },
      trend: {
      type: Boolean,
      default: false,
    }  
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Icon", iconSchema);
