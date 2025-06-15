/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");

// Get campaign statistics (must be before /:id route)
router.get("/campaigns/statistics", campaignController.getCampaignStatistics);

// Get all campaigns with optional filtering
router.get("/campaigns", campaignController.getCampaigns);

// Get campaign by ID
router.get("/campaigns/:id", campaignController.getCampaignById);

// Create new campaign
router.post("/campaigns", campaignController.createCampaign);

// Update campaign
router.put("/campaigns/:id", campaignController.updateCampaign);

// Delete campaign (soft delete)
router.delete("/campaigns/:id", campaignController.deleteCampaign);

// Launch campaign
router.post("/campaigns/:id/launch", campaignController.launchCampaign);

// Retry failed campaign
router.post("/campaigns/:id/retry", campaignController.retryCampaign);

module.exports = router;
