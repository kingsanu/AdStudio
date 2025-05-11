/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");

const IllustrationSchema = new mongoose.Schema(
  {
    img: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Illustration", IllustrationSchema);
