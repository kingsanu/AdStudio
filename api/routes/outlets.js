/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const outletController = require("../controllers/outletController");

// Get all outlets (for admin/debugging) - must be before /:id route
router.get("/outlets/all", outletController.getAllOutlets);

// Get all outlets with optional filtering
router.get("/outlets", outletController.getOutlets);

// Get outlet by ID
router.get("/outlets/:id", outletController.getOutletById);

// Create new outlet
router.post("/outlets", outletController.createOutlet);

// Update outlet
router.put("/outlets/:id", outletController.updateOutlet);

// Delete outlet (soft delete)
router.delete("/outlets/:id", outletController.deleteOutlet);

// Get outlets by user
router.get("/outlets/user/:userId", outletController.getOutletsByUser);

// Get or create default outlet for user
router.post(
  "/outlets/user/:userId/default",
  outletController.getOrCreateDefaultOutlet
);

// Get outlet by LinkCode (for existing restaurant data)
router.get("/outlets/linkcode/:linkCode", outletController.getOutletByLinkCode);

// Associate existing restaurant outlet with user
router.post(
  "/outlets/linkcode/:linkCode/associate",
  outletController.associateOutletWithUser
);

module.exports = router;
