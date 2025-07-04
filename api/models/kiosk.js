/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Schema, default: mongoose } = require("mongoose");

const kioskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  userId: {
    type: String,
    required: true,
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: "Template",
    required: false,
  },
  templateData: {
    type: Schema.Types.Mixed, // Use Mixed type for JSON data
    required: false, // Make it optional for backward compatibility
  },
  templateUrl: {
    type: String, // URL to the JSON file
    required: false, // Make it optional for backward compatibility
  },
  pageImages: [
    {
      url: {
        type: String,
        required: true,
      },
      pageIndex: {
        type: Number,
        required: true,
      },
    },
  ],
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  isPublic: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
kioskSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Kiosk = mongoose.model("Kiosk", kioskSchema);

module.exports = Kiosk;
