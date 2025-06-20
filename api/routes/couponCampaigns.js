/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const couponCampaignController = require("../controllers/couponCampaignController");

// Get coupon campaign statistics (must be before /:id route)
router.get(
  "/coupon-campaigns/statistics",
  couponCampaignController.getCouponCampaignStatistics
);

// Get all coupon campaigns with optional filtering
router.get("/coupon-campaigns", couponCampaignController.getCouponCampaigns);

// Get coupon campaign by ID
router.get(
  "/coupon-campaigns/:id",
  couponCampaignController.getCouponCampaignById
);

// Get coupon codes for a campaign
router.get(
  "/coupon-campaigns/:campaignId/codes",
  couponCampaignController.getCouponCodes
);

// Create new coupon campaign
router.post("/coupon-campaigns", couponCampaignController.createCouponCampaign);

// Update coupon campaign
router.put(
  "/coupon-campaigns/:id",
  couponCampaignController.updateCouponCampaign
);

// Delete coupon campaign (soft delete)
router.delete(
  "/coupon-campaigns/:id",
  couponCampaignController.deleteCouponCampaign
);

// Validate coupon code
router.get(
  "/coupon-campaigns/validate/:code",
  couponCampaignController.validateCouponCode
);

// Use coupon code
router.post(
  "/coupon-campaigns/use/:code",
  couponCampaignController.useCouponCode
);

module.exports = router;
