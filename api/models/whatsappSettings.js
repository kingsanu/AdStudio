/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Schema, default: mongoose } = require("mongoose");

const whatsappSettingsSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Each user can have only one WhatsApp settings entry
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  connectionStatus: {
    type: String,
    enum: ["checking", "disconnected", "connecting", "connected", "error"],
    default: "disconnected",
  },
  lastChecked: {
    type: Date,
    default: Date.now,
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
whatsappSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const WhatsAppSettings = mongoose.model(
  "WhatsAppSettings",
  whatsappSettingsSchema
);

module.exports = WhatsAppSettings;
