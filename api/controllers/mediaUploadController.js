/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");

// Import models
const Background = require("../models/background");
const Illustration = require("../models/illustration");
const Icon = require("../models/icon");
const ThreeDImage = require("../models/threeDImage");
const Image = require("../models/image");

// Cloud storage API endpoint
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for uploaded media in cloud storage
const STORAGE_FOLDER = "editor/media";

const mediaUploadController = {
  // Upload image to cloud storage and save metadata
  uploadImage: async (req, res) => {
    try {
      const { base64, filename, tags, contentType } = req.body;

      if (!base64) {
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      // Upload image to cloud storage
      const imageUrl = await uploadToCloudStorage(
        base64,
        filename,
        "images",
        contentType
      );

      // Save image metadata to database
      const image = new Image({
        img: imageUrl,
        desc: tags || "",
      });

      await image.save();

      // Return the URL and metadata
      res.status(200).json({
        success: true,
        data: image,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error.message,
      });
    }
  },

  // Upload background to cloud storage and save metadata
  uploadBackground: async (req, res) => {
    try {
      const { base64, filename, tags, contentType } = req.body;

      if (!base64) {
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      // Upload image to cloud storage
      const imageUrl = await uploadToCloudStorage(
        base64,
        filename,
        "backgrounds",
        contentType
      );

      // Save background metadata to database
      const background = new Background({
        img: imageUrl,
        desc: tags || "",
      });

      await background.save();

      // Return the URL and metadata
      res.status(200).json({
        success: true,
        data: background,
      });
    } catch (error) {
      console.error("Error uploading background:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload background",
        error: error.message,
      });
    }
  },

  // Upload illustration to cloud storage and save metadata
  uploadIllustration: async (req, res) => {
    try {
      const { base64, filename, tags, contentType } = req.body;

      if (!base64) {
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      // Upload image to cloud storage
      const imageUrl = await uploadToCloudStorage(
        base64,
        filename,
        "illustrations",
        contentType
      );
      console.log(filename);

      // Save illustration metadata to database
      const illustration = new Illustration({
        img: imageUrl,
        desc: tags || "",
      });

      await illustration.save();

      // Return the URL and metadata
      res.status(200).json({
        success: true,
        data: illustration,
      });
    } catch (error) {
      console.error("Error uploading illustration:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload illustration",
        error: error.message,
      });
    }
  },

  // Upload icon to cloud storage and save metadata
  uploadIcon: async (req, res) => {
    try {
      const { base64, filename, tags, contentType } = req.body;

      if (!base64) {
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      // Upload image to cloud storage
      const imageUrl = await uploadToCloudStorage(
        base64,
        filename,
        "icons",
        contentType
      );

      // Save icon metadata to database
      const icon = new Icon({
        img: imageUrl,
        desc: tags || "",
      });

      await icon.save();

      // Return the URL and metadata
      res.status(200).json({
        success: true,
        data: icon,
      });
    } catch (error) {
      console.error("Error uploading icon:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload icon",
        error: error.message,
      });
    }
  },

  // Upload 3D image to cloud storage and save metadata
  uploadThreeDImage: async (req, res) => {
    try {
      const { base64, filename, tags, contentType } = req.body;

      if (!base64) {
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      // Upload image to cloud storage
      const imageUrl = await uploadToCloudStorage(
        base64,
        filename,
        "3dimages",
        contentType
      );

      // Save 3D image metadata to database
      const threeDImage = new ThreeDImage({
        img: imageUrl,
        desc: tags || "",
      });

      await threeDImage.save();

      // Return the URL and metadata
      res.status(200).json({
        success: true,
        data: threeDImage,
      });
    } catch (error) {
      console.error("Error uploading 3D image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload 3D image",
        error: error.message,
      });
    }
  },
};

// Helper function to upload to cloud storage
async function uploadToCloudStorage(base64, filename, subfolder, contentType) {
  // Create form data for image upload
  const formData = new FormData();
  const imageBuffer = Buffer.from(base64, "base64");

  // Create a temporary file
  const tempDir = os.tmpdir();
  const imagePath = path.join(tempDir, filename);
  fs.writeFileSync(imagePath, imageBuffer);

  // Create cloud filename with subfolder
  const cloudFilename = `${STORAGE_FOLDER}/${subfolder}/${filename}`;

  formData.append("stream", fs.createReadStream(imagePath));
  formData.append("filename", cloudFilename);
  formData.append("senitize", "false");

  // Add content type if provided
  if (contentType) {
    formData.append("contentType", contentType);
  }

  // Upload to cloud storage
  const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
    headers: formData.getHeaders(),
  });

  // Clean up temporary file
  fs.unlinkSync(imagePath);

  // Return the URL from cloud storage
  return uploadResponse.data;
}

module.exports = mediaUploadController;
