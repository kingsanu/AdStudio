const { Schema, default: mongoose } = require("mongoose");

// Schema for individual font styles
const fontStyleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    style: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
); // Disable _id for subdocuments

// Main font schema
const fontSchema = new Schema({
  family: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true, // Index for faster searches
  },
  styles: [fontStyleSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  img:{
    type:String,
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
fontSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better search performance
fontSchema.index({ family: "text" });
fontSchema.index({ "styles.name": "text" });
fontSchema.index({ "styles.style": 1 });

const Font = mongoose.model("Font", fontSchema);

module.exports = Font;
