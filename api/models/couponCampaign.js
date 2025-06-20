/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Schema, default: mongoose } = require("mongoose");

const couponCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      phoneNumber: {
        type: String,
        default: null,
      },
      customerName: {
        type: String,
        default: null,
      },
      usedAt: {
        type: Date,
        default: null,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const couponCampaignSchema = new Schema({
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

  // Coupon details
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  validity: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: "Validity date must be greater than today",
    },
  },
  numberOfCoupons: {
    type: Number,
    required: true,
    min: 1,
    max: 10000,
  },

  // Generated coupon codes
  couponCodes: [couponCodeSchema],

  // Campaign status
  status: {
    type: String,
    enum: ["draft", "active", "expired", "completed"],
    default: "draft",
    index: true,
  },

  // Statistics
  statistics: {
    totalGenerated: {
      type: Number,
      default: 0,
    },
    totalUsed: {
      type: Number,
      default: 0,
    },
    usageRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Template information
  templateData: {
    type: Schema.Types.Mixed,
    default: null,
  },
  templateImageUrl: {
    type: String,
    default: null,
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
couponCampaignSchema.index({ userId: 1, status: 1 });
couponCampaignSchema.index({ outletId: 1, status: 1 });
couponCampaignSchema.index({ createdAt: -1 });
couponCampaignSchema.index({ validity: 1 });
couponCampaignSchema.index({ "couponCodes.code": 1 });

// Update the updatedAt timestamp before saving
couponCampaignSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Update statistics
  this.updateStatistics();

  // Check if campaign should be expired
  if (this.validity < new Date() && this.status === "active") {
    this.status = "expired";
  }

  next();
});

// Method to update campaign statistics
couponCampaignSchema.methods.updateStatistics = function () {
  const stats = {
    totalGenerated: this.couponCodes.length,
    totalUsed: this.couponCodes.filter((c) => c.isUsed).length,
  };

  stats.usageRate =
    stats.totalGenerated > 0
      ? Math.round((stats.totalUsed / stats.totalGenerated) * 100)
      : 0;

  this.statistics = stats;
};

// Method to generate coupon codes
couponCampaignSchema.methods.generateCouponCodes = function () {
  const codes = [];
  const existingCodes = new Set(this.couponCodes.map((c) => c.code));

  while (codes.length < this.numberOfCoupons) {
    const code = this.generateUniqueCode();
    if (!existingCodes.has(code)) {
      codes.push({
        code,
        isUsed: false,
        usedBy: {},
        generatedAt: new Date(),
      });
      existingCodes.add(code);
    }
  }

  this.couponCodes = codes;
  return codes;
};

// Method to generate a unique coupon code
couponCampaignSchema.methods.generateUniqueCode = function () {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CP${timestamp}${random}`;
};

// Method to use a coupon code
couponCampaignSchema.methods.useCouponCode = function (
  code,
  phoneNumber,
  customerName
) {
  const coupon = this.couponCodes.find((c) => c.code === code && !c.isUsed);
  if (!coupon) {
    return { success: false, message: "Invalid or already used coupon code" };
  }

  if (this.validity < new Date()) {
    return { success: false, message: "Coupon has expired" };
  }

  coupon.isUsed = true;
  coupon.usedBy = {
    phoneNumber,
    customerName,
    usedAt: new Date(),
  };

  return { success: true, message: "Coupon code used successfully" };
};

// Static method to find campaigns by user
couponCampaignSchema.statics.findByUser = function (userId, options = {}) {
  const query = { userId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }

  if (options.outletId) {
    query.outletId = options.outletId;
  }

  return this.find(query)
    .populate("outletId", "name address")
    .sort({ createdAt: -1 });
};

// Static method to find valid coupon by code
couponCampaignSchema.statics.findValidCoupon = function (code) {
  return this.findOne({
    "couponCodes.code": code,
    "couponCodes.isUsed": false,
    validity: { $gt: new Date() },
    status: "active",
    isActive: true,
  });
};

const CouponCampaign = mongoose.model("CouponCampaign", couponCampaignSchema);

module.exports = CouponCampaign;
