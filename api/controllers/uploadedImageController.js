const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");

const UploadedImage = require("./../models/uploadedImage");

// Cloud storage API endpoint
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for uploaded images in cloud storage
const STORAGE_FOLDER = "editor";

const uploadedImageController = {
  // Upload image to cloud storage and save metadata
  uploadImage: async (req, res) => {
    try {
      const { base64, filename, userId = "anonymous" } = req.body;

      if (!base64) {
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      // Create form data for image upload
      const formData = new FormData();
      const imageBuffer = Buffer.from(base64, "base64");

      // Create a temporary file
      const tempDir = os.tmpdir();
      const imagePath = path.join(tempDir, filename);
      fs.writeFileSync(imagePath, imageBuffer);

      // Create local and cloud filenames
      const localFilename = filename;
      const cloudFilename = `${STORAGE_FOLDER}/${filename}`;

      formData.append("stream", fs.createReadStream(imagePath));
      formData.append("filename", cloudFilename);
      formData.append("senitize", "false");

      // Upload to cloud storage
      const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
        headers: formData.getHeaders(),
      });

      // Clean up temporary file
      fs.unlinkSync(imagePath);

      // Get the URL from cloud storage
      const imageUrl = uploadResponse.data;

      // Save image metadata to database
      const uploadedImage = new UploadedImage({
        userId,
        url: imageUrl,
        filename,
      });

      await uploadedImage.save();

      // Return the URL and metadata
      res.status(200).json({
        url: imageUrl,
        _id: uploadedImage._id,
        filename: uploadedImage.filename,
        createdAt: uploadedImage.createdAt,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({
        message: "Failed to upload image",
        error: error.message,
      });
    }
  },

  // Get user's uploaded images
  getUserImages: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      const images = await UploadedImage.find({ userId })
        .sort("-createdAt")
        .select("url filename createdAt");

      res.json(images);
    } catch (error) {
      console.error("Error fetching user images:", error);
      res.status(500).json({
        message: "Failed to fetch user images",
        error: error.message,
      });
    }
  },

  // Delete an uploaded image
  deleteImage: async (req, res) => {
    try {
      const image = await UploadedImage.findById(req.params.id);

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Note: Files in cloud storage might need to be deleted through their API
      await image.deleteOne();

      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete image",
        error: error.message,
      });
    }
  },
};

module.exports = uploadedImageController;
