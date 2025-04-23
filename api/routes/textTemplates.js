/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
const textTemplateController = require("../controllers/textTemplateController.js");
const axios = require("axios");
const { GET_TEMPLATE_ENDPOINT } = require("../utils/constants");

// Route to save a new text template
router.post("/upload-text-template", textTemplateController.saveTextTemplate);

// Route to update an existing text template
router.put(
  "/upload-text-template/:id",
  textTemplateController.updateTextTemplate
);

// Route to get all text templates
router.get("/text-templates", textTemplateController.getAllTextTemplates);

// Route to get a specific text template by ID
router.get("/text-templates/:id", textTemplateController.getTextTemplateById);

// Route to delete a text template
router.delete("/text-templates/:id", textTemplateController.deleteTextTemplate);

// Route to get template data by filename
router.get("/get-text-template/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    // Check if the filename already has the editor/ prefix
    const hasEditorPrefix = filename.startsWith("editor/");

    // Try to fetch the template with the editor/ prefix first if it doesn't have it
    try {
      const prefixedFilename = hasEditorPrefix
        ? filename
        : `editor/${filename}`;
      console.log(
        `Trying to fetch template with prefixed filename: ${prefixedFilename}`
      );
      const response = await axios.get(
        `${GET_TEMPLATE_ENDPOINT}/${prefixedFilename}`
      );
      console.log(response.data[0].as);
      return res.json(response.data);
    } catch (prefixError) {
      // If that fails and the filename had the prefix, we're out of options
      if (hasEditorPrefix) {
        throw prefixError;
      }

      // If the prefixed version failed, try the original filename as fallback
      console.log(
        `Trying to fetch template with original filename: ${filename}`
      );
      const response = await axios.get(`${GET_TEMPLATE_ENDPOINT}/${filename}`);
      return res.json(response.data);
    }
  } catch (error) {
    console.error("Error fetching text template data:", error);
    res.status(500).json({
      message: "Failed to fetch text template data",
      error: error.message,
    });
  }
});

module.exports = router;
