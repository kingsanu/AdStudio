const { Schema, default: mongoose } = require("mongoose");

const textTemplateSchema = new Schema({
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
  // Add a type field to distinguish text templates from regular templates
  templateType: {
    type: String,
    default: "text",
    enum: ["text"],
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
textTemplateSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const TextTemplate = mongoose.model("TextTemplate", textTemplateSchema);

module.exports = TextTemplate;
