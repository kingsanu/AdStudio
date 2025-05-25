/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
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

// Route to proxy a template by filename or complete URL
router.get("/proxy-template/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log("Proxying template:", filename);

    // Check if it's a complete URL or just a filename
    const isCompleteUrl =
      filename.startsWith("http://") || filename.startsWith("https://");

    // Function to handle the response based on file type
    const handleResponse = async (url) => {
      try {
        console.log(`Fetching from URL: ${url}`);

        // Check if it's a JSON file
        if (url.endsWith(".json")) {
          const response = await axios.get(url);
          return res.json(response.data);
        } else {
          // For non-JSON files, fetch as binary and convert to base64
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
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error.message);
        throw error;
      }
    };

    if (isCompleteUrl) {
      // If it's a complete URL, use it directly
      console.log(`Using complete URL: ${filename}`);
      await handleResponse(filename);
    } else {
      // If it's just a filename, try different folder structures
      console.log("Cloud storage base URL:", CLOUD_STORAGE.BASE_URL);

      const hasEditorPrefix = filename.startsWith("editor/");
      const possiblePaths = [];

      if (hasEditorPrefix) {
        // If it already has editor/ prefix, use as is
        possiblePaths.push(filename);
      } else {
        // Try new folder structure first, then fallback to old structure
        possiblePaths.push(`editor/templates/${filename}`);
        possiblePaths.push(`editor/${filename}`);
      }

      let lastError;
      for (const path of possiblePaths) {
        try {
          const url = `${CLOUD_STORAGE.BASE_URL}/${path}`;
          console.log(`Trying to fetch template from: ${url}`);
          await handleResponse(url);
          return; // Success, exit the function
        } catch (error) {
          console.log(`Failed to fetch from ${path}:`, error.message);
          lastError = error;
        }
      }

      // If all paths failed, throw the last error
      throw lastError;
    }
  } catch (error) {
    console.error("Error proxying template:", error);
    res.status(500).json({
      message: "Failed to proxy template",
      error: error.message,
    });
  }
});

// Route to proxy a template by path or complete URL
router.get("/proxy-template-path/*", async (req, res) => {
  try {
    // Get the full path from the URL
    const fullPath = req.params[0];
    console.log("Proxying template path:", fullPath);

    // Check if it's a complete URL or just a path
    const isCompleteUrl =
      fullPath.startsWith("http://") || fullPath.startsWith("https://");

    // Function to handle the response based on file type
    const handleResponse = async (url) => {
      try {
        console.log(`Fetching from URL: ${url}`);

        // Check if it's a JSON file
        if (url.endsWith(".json")) {
          const response = await axios.get(url);
          return res.json(response.data);
        } else {
          // For non-JSON files, fetch as binary and convert to base64
          const response = await axios.get(url, {
            responseType: "arraybuffer",
          });

          // Convert binary data to base64
          const base64Data = Buffer.from(response.data, "binary").toString(
            "base64"
          );

          // Get content type from response headers
          // Get content type from response headers
          const contentType = response.headers["content-type"];

          // Send base64 encoded data with content type
          return res.json({
            data: base64Data,
            contentType: contentType,
          });
        }
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error.message);
        throw error;
      }
    };

    if (isCompleteUrl) {
      // If it's a complete URL, use it directly
      console.log(`Using complete URL: ${fullPath}`);
      await handleResponse(fullPath);
    } else {
      // If it's just a path, handle it with the cloud storage base URL
      console.log("Cloud storage base URL:", CLOUD_STORAGE.BASE_URL);

      // Check if the path already has the editor/ prefix
      const hasEditorPrefix = fullPath.startsWith("editor/");
      const possiblePaths = [];

      if (hasEditorPrefix) {
        // If it already has editor/ prefix, use as is
        possiblePaths.push(fullPath);
      } else {
        // Try new folder structure first, then fallback to old structure
        possiblePaths.push(`editor/templates/${fullPath}`);
        possiblePaths.push(`editor/${fullPath}`);
      }

      let lastError;
      for (const path of possiblePaths) {
        try {
          const url = `${CLOUD_STORAGE.BASE_URL}/${path}`;
          console.log(`Trying to fetch template from: ${url}`);
          await handleResponse(url);
          return; // Success, exit the function
        } catch (error) {
          console.log(`Failed to fetch from ${path}:`, error.message);
          lastError = error;
        }
      }

      // If all paths failed, throw the last error
      throw lastError;
    }
  } catch (error) {
    console.error("Error proxying template by path:", error);
    res.status(500).json({
      message: "Failed to proxy template",
      error: error.message,
    });
  }
});

module.exports = router;
