/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Buffer } = require("node:buffer");
const { CLOUD_STORAGE } = require("../config/constants");

// Route to proxy a font by path or complete URL
router.get("/proxy-font/*", async (req, res) => {
  try {
    // Get the full path from the URL
    const fullPath = req.params[0];
    console.log("Proxying font path:", fullPath);

    // Check if it's a complete URL or just a path
    const isCompleteUrl =
      fullPath.startsWith("http") || fullPath.startsWith("https");

    // Function to handle the response for font files
    const handleResponse = async (url) => {
      try {
        console.log(`Fetching font from URL: ${url}`);

        // For fonts, we need to handle different font types
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 15000, // 15 second timeout for fonts
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Get content type from response headers or determine from URL
        let contentType = response.headers["content-type"];
        
        if (!contentType) {
          // Determine content type from file extension
          if (url.includes('.woff2')) {
            contentType = 'font/woff2';
          } else if (url.includes('.woff')) {
            contentType = 'font/woff';
          } else if (url.includes('.ttf')) {
            contentType = 'font/ttf';
          } else if (url.includes('.otf')) {
            contentType = 'font/otf';
          } else {
            contentType = 'font/woff2'; // Default fallback
          }
        }

        // Set appropriate headers for font serving
        res.set({
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        });

        // Send the font data directly
        return res.send(Buffer.from(response.data));
      } catch (error) {
        console.error(`Error fetching font from ${url}:`, error.message);
        throw error;
      }
    };

    console.log(`Using complete URL: ${fullPath}`);
    return await handleResponse(fullPath);
  } catch (error) {
    console.error("Error proxying font:", error);
    res.status(500).json({
      success: false,
      message: "Failed to proxy font",
      error: error.message,
    });
  }
});

module.exports = router;
