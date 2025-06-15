/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Schema, default: mongoose } = require("mongoose");

const customerSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index for faster queries
    },
    outletId: {
      type: String,
      required: true,
      index: true, // Index for filtering by outlet
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalPayments: {
      type: Number,
      default: 0,
      min: 0, // Ensure non-negative values
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },

    customerSegment: {
      type: String,
      enum: ["vip", "regular", "new", "inactive"],
      default: "new",
    },
    lastVisit: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for efficient filtering by outlet and phone
customerSchema.index({ outletId: 1, phoneNumber: 1 }, { unique: true });

// Index for customer segment filtering
customerSchema.index({ outletId: 1, customerSegment: 1 });

// Update the updatedAt timestamp before saving
customerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find customers by outlet
customerSchema.statics.findByOutlet = function (outletId, options = {}) {
  const query = { outletId };

  // Add additional filters if provided
  if (options.segment) {
    query.customerSegment = options.segment;
  }

  if (options.minPayments) {
    query.totalPayments = { $gte: options.minPayments };
  }

  return this.find(query).sort({ updatedAt: -1 });
};

// Instance method to update payment total
customerSchema.methods.addPayment = function (amount) {
  this.totalPayments += amount;
  this.lastVisit = new Date();
  this.visitCount += 1;
  this.averageOrderValue = this.totalPayments / this.visitCount;

  // Update customer segment based on total payments
  if (this.totalPayments >= 10000) {
    this.customerSegment = "vip";
  } else if (this.totalPayments >= 1000) {
    this.customerSegment = "regular";
  }

  return this.save();
};

const MongoCustomer = mongoose.model("Customer", customerSchema);

module.exports = MongoCustomer;
