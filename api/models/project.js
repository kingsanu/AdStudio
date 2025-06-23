const { Schema, default: mongoose } = require("mongoose");

const projectSchema = new Schema({
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
    index: true, // Index for efficient user queries
  },  // Store design data URL (blob storage) instead of raw JSON
  projectDataUrl: {
    type: String,
    required: false, // Set after cloud upload
    default: "",
  },
  // Backup: Small essential data for quick preview/recovery
  projectMetadata: {
    canvasSize: {
      width: { type: Number, default: 1080 },
      height: { type: Number, default: 1080 }
    },
    backgroundColor: { type: String, default: 'white' },
    layerCount: { type: Number, default: 0 },
    lastLayerType: { type: String, default: 'unknown' },
  },
  thumbnailUrl: {
    type: String,
    required: false, // Set after cloud upload
    default: "",
  },  status: {
    type: String,
    enum: ['draft', 'completed', 'archived', 'shared'],
    default: 'draft',
    index: true, // Index for status filtering
  },
  // Enhanced project properties
  category: {
    type: String,
    enum: [
      'social-media', 'presentation', 'poster', 'flyer', 
      'business-card', 'logo', 'banner', 'kiosk', 
      'live-menu', 'whatsapp-campaign', 'coupon-campaign', 'other'
    ],
    default: 'other',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // Collaboration and sharing
  isShared: {
    type: Boolean,
    default: false,
  },
  sharedWith: [{
    userId: String,
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Version control for auto-save
  version: {
    type: Number,
    default: 1,
  },
  previousVersions: [{
    version: Number,
    projectDataUrl: String,
    createdAt: Date,
    changeDescription: String,
  }],
  // Analytics and usage
  viewCount: {
    type: Number,
    default: 0,
  },
  editCount: {
    type: Number,
    default: 0,
  },
  lastOpenedAt: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
  },  // File management
  fileSize: {
    type: Number, // Size in bytes of the JSON file
    default: 0,
  },
  originalTemplateId: {
    type: String, // Reference to template if created from template
    default: null,
  },
  // Campaign linkages
  campaignId: {
    type: String, // Reference to WhatsApp campaign, coupon campaign, etc.
    default: null,
  },
  campaignType: {
    type: String,
    enum: ['whatsapp', 'coupon', 'kiosk', 'live-menu', null],
    default: null,
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by creation date
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastModified: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by last modified
  },
});

// Compound indexes for efficient queries
projectSchema.index({ userId: 1, status: 1 }); // User's projects by status
projectSchema.index({ userId: 1, lastModified: -1 }); // User's recent projects
projectSchema.index({ userId: 1, category: 1 }); // User's projects by category

// Update timestamps before saving
projectSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Virtual for checking if project was recently modified (within 24 hours)
projectSchema.virtual('isRecentlyModified').get(function() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.lastModified > dayAgo;
});

// Instance method to generate consistent filenames
projectSchema.methods.generateFilenames = function() {
  const sanitizedTitle = this.title
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  const sanitizedUserId = this.userId.replace(/[^a-zA-Z0-9_-]/g, "");
  
  return {
    projectData: `project_${sanitizedUserId}_${this._id}_${sanitizedTitle}.json`,
    thumbnail: `thumbnail_${sanitizedUserId}_${this._id}_${sanitizedTitle}.png`,
  };
};

// Static method to find user's recent projects
projectSchema.statics.findRecentByUser = function(userId, limit = 10) {
  return this.find({ userId, status: { $ne: 'archived' } })
    .sort({ lastModified: -1 })
    .limit(limit)
    .select('title thumbnailUrl status category lastModified createdAt projectMetadata');
};

// Static method to find projects by category
projectSchema.statics.findByCategory = function(userId, category, limit = 20) {
  return this.find({ userId, category, status: { $ne: 'archived' } })
    .sort({ lastModified: -1 })
    .limit(limit);
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
