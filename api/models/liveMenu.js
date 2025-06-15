/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const liveMenuSchema = new Schema({
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
    default: false, // Live menus are typically private by default
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

// Update the updatedAt field before saving
liveMenuSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
liveMenuSchema.index({ userId: 1 });
liveMenuSchema.index({ createdAt: -1 });
liveMenuSchema.index({ isPublic: 1 });

module.exports = mongoose.model("LiveMenu", liveMenuSchema);
