/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Schema, default: mongoose } = require("mongoose");

// Schema matching your existing MongoOutlet data structure
const mongoOutletSchema = new Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    RestaurantPhone: {
      type: String,
      trim: true,
      default: "",
    },
    GSTNumber: {
      type: String,
      trim: true,
      default: "",
    },
    EnableRoyalty: {
      type: Boolean,
      default: false,
    },
    RoyaltyMinAmt: {
      type: Number,
      default: 0,
    },
    RoyaltyDiscount: {
      type: Number,
      default: 0,
    },
    Landmark: {
      type: String,
      trim: true,
      default: "",
    },
    EnableInclusiveTaxExceptOnline: {
      type: Boolean,
      default: true,
    },
    ZomatoID: {
      type: String,
      default: null,
    },
    SwiggyID: {
      type: String,
      default: null,
    },
    BusinessId: {
      type: Number,
      default: 0,
    },
    LinkCode: {
      type: Number,
      default: null,
    },
    ParcelVoiceReady: {
      type: Boolean,
      default: false,
    },
    SelfOrderProperties: {
      PrimaryColor: {
        type: String,
        default: "#FF5200",
      },
      PayTM_QRCODE_MID: {
        type: String,
        default: null,
      },
      PayTM_QRCODE_Value: {
        type: String,
        default: null,
      },
      PayTM_EDC_MID: {
        type: String,
        default: null,
      },
      PayTM_EDC_Value: {
        type: String,
        default: null,
      },
      PayTM_EDC_TID: {
        type: String,
        default: null,
      },
      SliderImages: [
        {
          type: String,
        },
      ],
    },
    ZwigatoCredential: {
      UserName: {
        type: String,
        default: null,
      },
      Key: {
        type: String,
        default: null,
      },
    },
    QRCode: {
      type: String,
      default: null,
    },
    ZomatoURL: {
      type: String,
      default: null,
    },
    SwiggyURL: {
      type: String,
      default: null,
    },
    City: {
      type: String,
      trim: true,
      default: "",
    },
    Address: {
      type: String,
      trim: true,
      default: "",
    },
    ZipCode: {
      type: String,
      trim: true,
      default: "",
    },
    Lang: {
      type: Number,
      default: null,
    },
    Long: {
      type: Number,
      default: null,
    },
    // Additional fields for WhatsApp campaign integration
    userId: {
      type: String,
      required: false, // Make optional for existing data
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "mongooutlets", // Use your existing collection name
    strict: false, // Allow additional fields that might exist in your data
  }
);

// Helper methods for MongoOutlet schema
mongoOutletSchema.methods.toStandardFormat = function () {
  return {
    _id: this._id,
    name: this.Name,
    address: this.Address,
    phone: this.RestaurantPhone,
    city: this.City,
    zipCode: this.ZipCode,
    userId: this.userId,
    businessName: this.Name,
    isActive: this.isActive !== false, // Default to true if not set
    // Map other fields as needed
    gstNumber: this.GSTNumber,
    landmark: this.Landmark,
    linkCode: this.LinkCode,
    businessId: this.BusinessId,
  };
};

// Static method to find by user
mongoOutletSchema.statics.findByUserId = function (userId) {
  return this.find({ userId: userId });
};

// Static method to find by LinkCode
mongoOutletSchema.statics.findByLinkCode = function (linkCode) {
  return this.findOne({ LinkCode: linkCode });
};

// Static method to find by BusinessId
mongoOutletSchema.statics.findByBusinessId = function (businessId) {
  return this.findOne({ BusinessId: businessId });
};

const MongoOutlet = mongoose.model("MongoOutlet", mongoOutletSchema);

module.exports = MongoOutlet;
