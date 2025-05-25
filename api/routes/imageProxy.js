/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Buffer } = require("node:buffer");
const { CLOUD_STORAGE } = require("../config/constants");

// Route to proxy an image by path or complete URL
router.get("/proxy-image/*", async (req, res) => {
  try {
    // Get the full path from the URL
    const fullPath = req.params[0];
    console.log("Proxying image path:", fullPath);

    // Check if it's a complete URL or just a path
    const isCompleteUrl =
      fullPath.startsWith("http") || fullPath.startsWith("https");

    // Function to handle the response for image files
    const handleResponse = async (url) => {
      try {
        console.log(`Fetching image from URL: ${url}`);

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
        console.error(`Error fetching image from ${url}:`, error.message);
        throw error;
      }
    };

    console.log(`Using complete URL: ${fullPath}`);
    return await handleResponse(fullPath);
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
