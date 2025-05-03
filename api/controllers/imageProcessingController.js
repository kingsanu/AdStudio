/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");

// Load environment variables
require("dotenv").config();

// FastAPI service endpoint for background removal
const REMOVE_BG_API =
  process.env.REMOVE_BG_API || "http://bgremove.foodyqueen.com/rbg";

// Log the API endpoint being used
console.log(`Using background removal API: ${REMOVE_BG_API}`);

const imageProcessingController = {
  // Remove background from image
  removeBackground: async (req, res) => {
    try {
      const { imageUrl, imageData } = req.body;

      if (!imageUrl && !imageData) {
        return res.status(400).json({
          message: "Missing image data or URL",
        });
      }

      let imageBuffer;

      // If image data is provided as base64
      if (imageData) {
        // Remove data URL prefix if present
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(base64Data, "base64");
      }
      // If image URL is provided
      else if (imageUrl) {
        try {
          // Check if the URL is a data URL
          if (imageUrl.startsWith("data:image")) {
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, "base64");
          } else {
            // Download the image from a regular URL
            const response = await axios.get(imageUrl, {
              responseType: "arraybuffer",
              // Add timeout to prevent hanging requests
              timeout: 60000,
            });
            imageBuffer = Buffer.from(response.data);
          }
        } catch (error) {
          console.error("Error downloading image:", error);
          return res.status(400).json({
            message: "Could not download image from URL",
            error: error.message,
          });
        }
      }

      // Create form data for the FastAPI request
      const formData = new FormData();

      // Create a temporary file
      const tempDir = os.tmpdir();
      const tempFilename = `temp_image_${Date.now()}.png`;
      const imagePath = path.join(tempDir, tempFilename);
      fs.writeFileSync(imagePath, imageBuffer);

      // Add the file to form data
      formData.append("file", fs.createReadStream(imagePath), {
        filename: tempFilename,
        contentType: "image/png",
      });

      // Send request to FastAPI service
      let processResponse;
      try {
        processResponse = await axios.post(REMOVE_BG_API, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          responseType: "arraybuffer",
          timeout: 30000, // 30 seconds timeout for processing
        });
        console.log("proces=====", processResponse);
      } catch (error) {
        console.error("Error calling FastAPI service:", error);
        // Clean up the temporary file
        fs.unlinkSync(imagePath);

        return res.status(500).json({
          message: "Error processing image with FastAPI service",
          error: error.message,
          details:
            "The background removal service might be unavailable. Please check if the FastAPI service is running at " +
            REMOVE_BG_API,
        });
      }

      // Clean up the temporary file
      fs.unlinkSync(imagePath);

      // Convert the response to base64
      const processedImageBase64 = Buffer.from(processResponse.data).toString(
        "base64"
      );

      // Return the processed image as base64
      return res.status(200).json({
        message: "Background removed successfully",
        processedImage: `data:image/png;base64,${processedImageBase64}`,
      });
    } catch (error) {
      console.error("Error removing background:", error);
      return res.status(500).json({
        message: "Error removing background",
        error: error.message,
      });
    }
  },
};

module.exports = imageProcessingController;
