/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Buffer } = require("node:buffer");
const { CLOUD_STORAGE } = require("../config/constants");

// Route to proxy an image by path
router.get("/proxy-image/*", async (req, res) => {
  try {
    // Get the full path from the URL
    const fullPath = req.params[0];
    console.log("Proxying image path:", fullPath);
    console.log("Cloud storage base URL:", CLOUD_STORAGE.BASE_URL);

    // Check if the path already has the editor/media/ prefix
    const hasMediaPrefix = fullPath.startsWith("editor/media/");

    // Function to handle the response for image files
    const handleResponse = async (url) => {
      try {
        // For images, fetch as binary and convert to base64
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000, // 10 second timeout
        });

        // Convert binary data to base64
        const base64Data = Buffer.from(response.data, "binary").toString(
          "base64"
        );

        // Get content type from response headers
        const contentType = response.headers["content-type"] || "image/png";

        // Send base64 encoded data with content type
        return res.json({
          url: `data:${contentType};base64,${base64Data}`,
          contentType: contentType,
        });
      } catch (error) {
        console.error("Error fetching image:", error.message);
        throw error;
      }
    };

    // Try different paths to find the image
    const paths = [];

    // Try with editor/media prefix if not already present
    if (!hasMediaPrefix) {
      paths.push(`editor/media/${fullPath}`);
    }

    // Always try the original path
    paths.push(fullPath);

    // Try each path until one works
    let lastError = null;
    for (const path of paths) {
      try {
        const url = `${CLOUD_STORAGE.BASE_URL}/${path}`;
        console.log(`Trying to fetch image from: ${url}`);
        return await handleResponse(url);
      } catch (error) {
        console.log(`Failed to fetch from ${path}:`, error.message);
        lastError = error;
        // Continue to the next path
      }
    }

    // If we get here, all paths failed
    throw lastError || new Error("Failed to fetch image from any path");
  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to proxy image",
      error: error.message,
    });
  }
});

module.exports = router;
