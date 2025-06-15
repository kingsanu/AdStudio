/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Schema, default: mongoose } = require("mongoose");

const campaignStatisticsSchema = new Schema(
  {
    totalTargets: {
      type: Number,
      default: 0,
    },
    sent: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const campaignErrorSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
    },
    error: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const whatsappCampaignSchema = new Schema({
  campaignName: {
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
    index: true,
  },
  outletId: {
    type: String,
    required: true,
    index: true,
  },
  whatsappUsername: {
    type: String,
    required: true,
    trim: true,
  },
  targetCustomers: [
    {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
        default: "pending",
      },
      sentAt: {
        type: Date,
        default: null,
      },
      deliveredAt: {
        type: Date,
        default: null,
      },
      error: {
        type: String,
        default: null,
      },
    },
  ],
  message: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
    default: null,
  },
  status: {
    type: String,
    enum: ["draft", "pending", "running", "completed", "failed", "cancelled"],
    default: "draft",
    index: true,
  },
  scheduledAt: {
    type: Date,
    default: null,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  statistics: {
    type: campaignStatisticsSchema,
    default: () => ({}),
  },
  errors: [campaignErrorSchema],
  campaignType: {
    type: String,
    enum: ["immediate", "scheduled", "recurring"],
    default: "immediate",
  },
  recurringSettings: {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: null,
    },
    interval: {
      type: Number,
      default: 1,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  customerFilters: {
    segments: [
      {
        type: String,
        enum: ["vip", "regular", "new", "inactive"],
      },
    ],
    minPayments: {
      type: Number,
      default: null,
    },
    maxPayments: {
      type: Number,
      default: null,
    },
    tags: [String],
  },
  isActive: {
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

// Indexes for efficient querying
whatsappCampaignSchema.index({ userId: 1, status: 1 });
whatsappCampaignSchema.index({ outletId: 1, status: 1 });
whatsappCampaignSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
whatsappCampaignSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Update statistics
  this.updateStatistics();

  next();
});

// Method to update campaign statistics
whatsappCampaignSchema.methods.updateStatistics = function () {
  const stats = {
    totalTargets: this.targetCustomers.length,
    sent: this.targetCustomers.filter(
      (c) => c.status === "sent" || c.status === "delivered"
    ).length,
    delivered: this.targetCustomers.filter((c) => c.status === "delivered")
      .length,
    failed: this.targetCustomers.filter((c) => c.status === "failed").length,
    pending: this.targetCustomers.filter((c) => c.status === "pending").length,
  };

  stats.successRate =
    stats.totalTargets > 0
      ? Math.round((stats.delivered / stats.totalTargets) * 100)
      : 0;

  this.statistics = stats;
};

// Method to mark customer as sent
whatsappCampaignSchema.methods.markCustomerSent = function (
  customerId,
  success = true,
  error = null
) {
  const customer = this.targetCustomers.id(customerId);
  if (customer) {
    customer.status = success ? "sent" : "failed";
    customer.sentAt = new Date();
    if (error) {
      customer.error = error;
      this.errors.push({
        phoneNumber: customer.phoneNumber,
        error: error,
      });
    }
  }
  return this.save();
};

// Static method to get campaigns by user
whatsappCampaignSchema.statics.findByUser = function (userId, options = {}) {
  const query = { userId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }

  if (options.outletId) {
    query.outletId = options.outletId;
  }

  return this.find(query)
    .populate("outletId", "name address")
    .populate("targetCustomers.customerId", "name phoneNumber")
    .sort({ createdAt: -1 });
};

const WhatsAppCampaign = mongoose.model(
  "WhatsAppCampaign",
  whatsappCampaignSchema
);

module.exports = WhatsAppCampaign;
