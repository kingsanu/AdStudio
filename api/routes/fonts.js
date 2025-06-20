const express = require("express");
const router = express.Router();
const {
  getFonts,
  getFontByFamily,
  createFont,
  updateFont,
  deleteFont,
} = require("../controllers/fontController");

// Get all fonts with pagination and filtering
router.get("/", getFonts);

// Get a specific font by family name
router.get("/family/:family", getFontByFamily);

// Create a new font
router.post("/", createFont);

// Update a font
router.put("/:id", updateFont);

// Delete a font (soft delete)
router.delete("/:id", deleteFont);

module.exports = router;
