const { Schema, default: mongoose } = require("mongoose");

const templateSchema = new Schema({
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
  templateUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
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
  isKiosk: {
    type: Boolean,
    default: false,
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
templateSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;
