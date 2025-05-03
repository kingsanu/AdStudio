const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController.js");
const axios = require("axios");
const { CLOUD_STORAGE } = require("../config/constants");

// Route to save a new template
router.post("/upload-template", templateController.saveTemplate);

// Route to update an existing template
router.put("/upload-template/:id", templateController.updateTemplate);

// Route to upload an image
router.post("/upload-image", templateController.uploadImage);

// Route to get all templates
router.get("/templates", templateController.getAllTemplates);

// Route to get a specific template by ID
router.get("/templates/:id", templateController.getTemplateById);

// Route to delete a template
router.delete("/templates/:id", templateController.deleteTemplate);
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/proxy-template/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log("Filename:", filename);
    console.log("Cloud storage base URL:", CLOUD_STORAGE.BASE_URL);

    // Check if the filename already has the editor/ prefix
    const hasEditorPrefix = filename.startsWith("editor/");

    // Function to handle the response based on file type
    const handleResponse = async (url) => {
      // Check if it's a JSON file
      if (filename.endsWith(".json")) {
        const response = await axios.get(url);
        return res.json(response.data);
      } else {
        // For non-JSON files (like images), fetch as binary and convert to base64
        const response = await axios.get(url, {
          responseType: "arraybuffer",
        });

        // Convert binary data to base64
        const base64Data = Buffer.from(response.data, "binary").toString(
          "base64"
        );

        // Get content type from response headers
        const contentType = response.headers["content-type"];

        // Send base64 encoded data with content type
        return res.json({
          data: base64Data,
          contentType: contentType,
        });
      }
    };

    // Try to fetch the template with the editor/ prefix first if it doesn't have it
    try {
      const prefixedFilename = hasEditorPrefix
        ? filename
        : `editor/${filename}`;
      const url = `${CLOUD_STORAGE.BASE_URL}/${prefixedFilename}`;
      console.log(url);
      console.log(
        `Trying to fetch template with prefixed filename: ${prefixedFilename}`
      );
      await handleResponse(url);
    } catch (prefixError) {
      // If that fails and the filename had the prefix, we're out of options
      if (hasEditorPrefix) {
        throw prefixError;
      }

      // If the prefixed version failed, try the original filename as fallback
      console.log(
        `Trying to fetch template with original filename: ${filename}`
      );
      await handleResponse(`${CLOUD_STORAGE.BASE_URL}/${filename}`);
    }
  } catch (error) {
    console.error("Error proxying template:", error);
    res.status(500).json({
      message: "Failed to proxy template",
      error: error.message,
    });
  }
});

module.exports = router;
