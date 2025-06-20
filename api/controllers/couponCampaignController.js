/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const CouponCampaign = require("../models/couponCampaign");

const couponCampaignController = {
  // Get all coupon campaigns with optional filtering
  getCouponCampaigns: async (req, res) => {
    try {
      const {
        userId,
        outletId,
        status,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = { isActive: true };

      if (userId) {
        query.userId = userId;
      }

      if (outletId) {
        query.outletId = outletId;
      }

      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const campaigns = await CouponCampaign.find(query)
        .populate("outletId", "name address")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CouponCampaign.countDocuments(query);

      res.json({
        success: true,
        data: campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching coupon campaigns:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch coupon campaigns",
        error: error.message,
      });
    }
  },

  // Get coupon campaign by ID
  getCouponCampaignById: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await CouponCampaign.findById(id).populate(
        "outletId",
        "name address phone email"
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Coupon campaign not found",
        });
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error("Error fetching coupon campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch coupon campaign",
        error: error.message,
      });
    }
  },

  // Create new coupon campaign
  createCouponCampaign: async (req, res) => {
    try {
      const campaignData = req.body;

      // Validate required fields
      const requiredFields = [
        "campaignName",
        "userId",
        "outletId",
        "discountPercentage",
        "validity",
        "numberOfCoupons",
      ];

      for (const field of requiredFields) {
        if (!campaignData[field]) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`,
          });
        }
      }

      // Validate validity date
      const validityDate = new Date(campaignData.validity);
      if (validityDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Validity date must be greater than today",
        });
      }

      // Create the campaign
      const campaign = new CouponCampaign(campaignData);

      // Generate coupon codes
      campaign.generateCouponCodes();

      // Set status to active if not specified
      if (!campaignData.status) {
        campaign.status = "active";
      }

      await campaign.save();

      // Populate data for response
      await campaign.populate("outletId", "name address");

      res.status(201).json({
        success: true,
        data: campaign,
        message: "Coupon campaign created successfully",
      });
    } catch (error) {
      console.error("Error creating coupon campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create coupon campaign",
        error: error.message,
      });
    }
  },

  // Update coupon campaign
  updateCouponCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.statistics; // Statistics are auto-calculated
      delete updateData.couponCodes; // Coupon codes shouldn't be updated directly

      const campaign = await CouponCampaign.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("outletId", "name address");

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Coupon campaign not found",
        });
      }

      res.json({
        success: true,
        data: campaign,
        message: "Coupon campaign updated successfully",
      });
    } catch (error) {
      console.error("Error updating coupon campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update coupon campaign",
        error: error.message,
      });
    }
  },

  // Delete coupon campaign (soft delete)
  deleteCouponCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await CouponCampaign.findByIdAndUpdate(
        id,
        { isActive: false, status: "completed" },
        { new: true }
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Coupon campaign not found",
        });
      }

      res.json({
        success: true,
        message: "Coupon campaign deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting coupon campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete coupon campaign",
        error: error.message,
      });
    }
  },

  // Use a coupon code
  useCouponCode: async (req, res) => {
    try {
      const { code } = req.params;
      const { phoneNumber, customerName } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
      }

      const campaign = await CouponCampaign.findValidCoupon(code);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired coupon code",
        });
      }

      const result = campaign.useCouponCode(code, phoneNumber, customerName);
      if (!result.success) {
        return res.status(400).json(result);
      }

      await campaign.save();

      res.json({
        success: true,
        message: result.message,
        data: {
          campaignName: campaign.campaignName,
          discountPercentage: campaign.discountPercentage,
          code,
        },
      });
    } catch (error) {
      console.error("Error using coupon code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to use coupon code",
        error: error.message,
      });
    }
  },

  // Get coupon campaign statistics
  getCouponCampaignStatistics: async (req, res) => {
    try {
      const { userId, outletId } = req.query;

      const query = { isActive: true };
      if (userId) query.userId = userId;
      if (outletId) query.outletId = outletId;

      const campaigns = await CouponCampaign.find(query);

      const stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "active").length,
        expiredCampaigns: campaigns.filter((c) => c.status === "expired")
          .length,
        completedCampaigns: campaigns.filter((c) => c.status === "completed")
          .length,
        totalCouponsGenerated: campaigns.reduce(
          (sum, c) => sum + c.statistics.totalGenerated,
          0
        ),
        totalCouponsUsed: campaigns.reduce(
          (sum, c) => sum + c.statistics.totalUsed,
          0
        ),
        averageUsageRate: 0,
      };

      if (stats.totalCampaigns > 0) {
        const totalUsageRate = campaigns.reduce(
          (sum, c) => sum + c.statistics.usageRate,
          0
        );
        stats.averageUsageRate = Math.round(
          totalUsageRate / stats.totalCampaigns
        );
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching coupon campaign statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message,
      });
    }
  },

  // Validate a coupon code (without using it)
  validateCouponCode: async (req, res) => {
    try {
      const { code } = req.params;

      const campaign = await CouponCampaign.findValidCoupon(code);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired coupon code",
        });
      }

      const coupon = campaign.couponCodes.find(
        (c) => c.code === code && !c.isUsed
      );
      res.json({
        success: true,
        data: {
          code,
          campaignName: campaign.campaignName,
          discountPercentage: campaign.discountPercentage,
          validity: campaign.validity,
          isValid: !!coupon,
        },
        message: "Coupon code is valid",
      });
    } catch (error) {
      console.error("Error validating coupon code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate coupon code",
        error: error.message,
      });
    }
  },

  // Get coupon codes for a campaign
  getCouponCodes: async (req, res) => {
    try {
      const { campaignId } = req.params;
      const {
        status = "all", // 'all', 'used', 'unused'
        page = 1,
        limit = 50,
        sortBy = "generatedAt",
        sortOrder = "desc",
      } = req.query;

      const campaign = await CouponCampaign.findById(campaignId);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      let filteredCodes = campaign.couponCodes;

      // Filter by status
      if (status === "used") {
        filteredCodes = campaign.couponCodes.filter((code) => code.isUsed);
      } else if (status === "unused") {
        filteredCodes = campaign.couponCodes.filter((code) => !code.isUsed);
      }

      // Sort codes
      filteredCodes.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === "generatedAt" || sortBy === "usedAt") {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }

        if (sortOrder === "desc") {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Paginate
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedCodes = filteredCodes.slice(skip, skip + parseInt(limit));

      res.json({
        success: true,
        data: {
          codes: paginatedCodes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredCodes.length,
            pages: Math.ceil(filteredCodes.length / parseInt(limit)),
          },
          summary: {
            total: campaign.couponCodes.length,
            used: campaign.couponCodes.filter((code) => code.isUsed).length,
            unused: campaign.couponCodes.filter((code) => !code.isUsed).length,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching coupon codes:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch coupon codes",
        error: error.message,
      });
    }
  },
};

module.exports = couponCampaignController;
