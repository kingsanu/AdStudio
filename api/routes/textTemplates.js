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

// Route to get template data by filename or complete URL
router.get("/get-text-template/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    console.log("Text template filename/URL:", filename);

    // Check if it's a complete URL or just a filename
    const isCompleteUrl =
      filename.startsWith("http://") || filename.startsWith("https://");

    if (isCompleteUrl) {
      // If it's a complete URL, use it directly
      console.log(`Using complete URL: ${filename}`);
      try {
        const response = await axios.get(filename);
        return res.json(response.data);
      } catch (error) {
        console.error(`Error fetching from URL ${filename}:`, error.message);
        throw error;
      }
    } else {
      // If it's just a filename, handle it with the template endpoint

      // Check if the filename already has the editor/ prefix
      const hasEditorPrefix = filename.startsWith("editor/");
      console.log("Has editor prefix:", hasEditorPrefix);

      const possiblePaths = [];

      if (hasEditorPrefix) {
        // If it already has editor/ prefix, use as is
        possiblePaths.push(filename);
      } else {
        // Try new folder structure first, then fallback to old structure
        possiblePaths.push(`editor/text-templates/${filename}`);
        possiblePaths.push(`editor/${filename}`);
      }

      let lastError;
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to fetch text template from: ${path}`);
          const response = await axios.get(`${GET_TEMPLATE_ENDPOINT}/${path}`);
          return res.json(response.data);
        } catch (error) {
          console.log(`Failed to fetch from ${path}:`, error.message);
          lastError = error;
        }
      }

      // If all paths failed, throw the last error
      throw lastError;
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
