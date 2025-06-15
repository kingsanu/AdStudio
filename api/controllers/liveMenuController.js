/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");
const LiveMenu = require("../models/liveMenu");

// Cloud storage API endpoint
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for live menu images in cloud storage
const STORAGE_FOLDER = "editor/livemenu";

const liveMenuController = {
  // Get or create user's single live menu
  getUserLiveMenu: async (req, res) => {
    try {
      const { userId: rawUserId } = req.query;

      if (!rawUserId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Extract just the ID part if userId contains city and name
      let userId = rawUserId;
      if (userId && userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      console.log(`Getting live menu for user: ${userId}`);

      // Find user's live menu (each user can have only one)
      let liveMenu = await LiveMenu.findOne({ userId });

      if (liveMenu) {
        // Return existing live menu
        return res.status(200).json({
          message: "User live menu found",
          liveMenu: {
            id: liveMenu._id.toString(),
            title: liveMenu.title,
            description: liveMenu.description,
            templateUrl: liveMenu.templateUrl,
            templateData: liveMenu.templateData,
            pageImages: liveMenu.pageImages,
            tags: liveMenu.tags,
            isPublic: liveMenu.isPublic,
            createdAt: liveMenu.createdAt,
            updatedAt: liveMenu.updatedAt,
          },
        });
      } else {
        // Create a new live menu for the user
        const defaultTitle = `${userId}'s Live Menu`;

        liveMenu = new LiveMenu({
          title: defaultTitle,
          description: "My live menu display for TV",
          userId,
          templateId: null,
          templateUrl: null,
          templateData: null,
          pageImages: [],
          tags: [],
          isPublic: false,
        });

        await liveMenu.save();

        return res.status(201).json({
          message: "New live menu created for user",
          liveMenu: {
            id: liveMenu._id.toString(),
            title: liveMenu.title,
            description: liveMenu.description,
            templateUrl: liveMenu.templateUrl,
            templateData: liveMenu.templateData,
            pageImages: liveMenu.pageImages,
            tags: liveMenu.tags,
            isPublic: liveMenu.isPublic,
            createdAt: liveMenu.createdAt,
            updatedAt: liveMenu.updatedAt,
          },
        });
      }
    } catch (error) {
      console.error("Error getting/creating user live menu:", error);
      res.status(500).json({
        message: "Failed to get or create user live menu",
        error: error.message,
      });
    }
  },

  // Update user's live menu
  updateUserLiveMenu: async (req, res) => {
    try {
      const {
        userId: rawUserId,
        templateUrl,
        templateData,
        title,
        description,
        pageImages,
      } = req.body;

      if (!rawUserId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Extract just the ID part if userId contains city and name
      let userId = rawUserId;
      if (userId && userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      // Find user's live menu
      const liveMenu = await LiveMenu.findOne({ userId });

      if (!liveMenu) {
        return res.status(404).json({
          message: "User live menu not found",
        });
      }

      // Update fields if provided
      if (templateUrl !== undefined) liveMenu.templateUrl = templateUrl;
      if (templateData !== undefined) liveMenu.templateData = templateData;
      if (title !== undefined) liveMenu.title = title;
      if (description !== undefined) liveMenu.description = description;
      if (pageImages !== undefined) liveMenu.pageImages = pageImages;

      // Save the updated live menu
      await liveMenu.save();

      console.log(`Updated live menu for user: ${userId}`);

      res.status(200).json({
        message: "Live menu updated successfully",
        liveMenu: {
          id: liveMenu._id.toString(),
          title: liveMenu.title,
          description: liveMenu.description,
          templateUrl: liveMenu.templateUrl,
          templateData: liveMenu.templateData,
          pageImages: liveMenu.pageImages,
          tags: liveMenu.tags,
          isPublic: liveMenu.isPublic,
          createdAt: liveMenu.createdAt,
          updatedAt: liveMenu.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating user live menu:", error);
      res.status(500).json({
        message: "Failed to update user live menu",
        error: error.message,
      });
    }
  },

  // Upload live menu template JSON to cloud storage
  uploadLiveMenuTemplate: async (req, res) => {
    try {
      const { packedData, userId: rawUserId } = req.body;

      if (!packedData || !rawUserId) {
        return res.status(400).json({
          message: "Packed data and user ID are required",
        });
      }

      // Extract just the ID part if userId contains city and name
      let userId = rawUserId;
      if (userId && userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      console.log(`Uploading live menu template for user: ${userId}`);

      // Generate a unique filename with timestamp
      const timestamp = Date.now();
      const templateFilename = `livemenu_template_${timestamp}.json`;

      // Add folder prefix for cloud storage
      const cloudTemplateFilename = `${STORAGE_FOLDER}/${userId}/${templateFilename}`;

      console.log(`Using filename: ${cloudTemplateFilename}`);

      // Save template file temporarily to disk
      const tempDir = os.tmpdir();
      const templateData =
        typeof packedData === "string"
          ? packedData
          : JSON.stringify(packedData);
      const templatePath = path.join(tempDir, templateFilename);
      fs.writeFileSync(templatePath, templateData);

      // Create form data for template upload
      const formData = new FormData();
      formData.append("stream", fs.createReadStream(templatePath));
      formData.append("filename", cloudTemplateFilename);
      formData.append("senitize", "false");

      // Upload to cloud storage
      const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
        headers: formData.getHeaders(),
      });

      console.log("Template upload response:", uploadResponse.data);

      // Clean up temporary file
      fs.unlinkSync(templatePath);

      // Construct the template URL
      const templateUrl = `https://business.foodyqueen.com/uploads/${cloudTemplateFilename}`;

      console.log(`Template uploaded successfully: ${templateUrl}`);

      res.status(200).json({
        success: true,
        templateUrl,
        message: "Live menu template uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading live menu template:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload live menu template",
        error: error.message,
      });
    }
  },

  // Upload live menu page image
  uploadLiveMenuImage: async (req, res) => {
    try {
      const { base64, pageIndex, liveMenuId: rawLiveMenuId } = req.body;

      if (!base64 || pageIndex === undefined || !rawLiveMenuId) {
        return res.status(400).json({
          message: "Base64 image, page index, and live menu ID are required",
        });
      }

      // Extract just the ID part if liveMenuId contains extra data
      let liveMenuId = rawLiveMenuId;
      if (liveMenuId && liveMenuId.includes("_")) {
        liveMenuId = liveMenuId.split("_").pop() || liveMenuId;
      }

      console.log(
        `Uploading image for live menu: ${liveMenuId}, page: ${pageIndex}`
      );

      // Find the live menu
      const liveMenu = await LiveMenu.findById(liveMenuId);
      if (!liveMenu) {
        return res.status(404).json({
          message: "Live menu not found",
        });
      }

      // Generate filename
      const filename = `livemenu_page_${pageIndex}.png`;

      // Create form data for image upload
      const formData = new FormData();
      const imageBuffer = Buffer.from(base64, "base64");

      // Create a temporary file
      const tempDir = os.tmpdir();
      const imagePath = path.join(tempDir, filename);
      fs.writeFileSync(imagePath, imageBuffer);

      // Create cloud filename with live menu ID folder
      const cloudFilename = `${STORAGE_FOLDER}/${liveMenuId}/${filename}`;

      formData.append("stream", fs.createReadStream(imagePath));
      formData.append("filename", cloudFilename);
      formData.append("senitize", "false");

      // Upload to cloud storage
      const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
        headers: formData.getHeaders(),
      });

      console.log("Image upload response:", uploadResponse.data);

      // Clean up temporary file
      fs.unlinkSync(imagePath);

      // Use the original URL from cloud storage response
      const imageUrl = uploadResponse.data;

      console.log(`Image uploaded successfully: ${imageUrl}`);

      // Update live menu with the new image
      const existingImageIndex = liveMenu.pageImages.findIndex(
        (img) => img.pageIndex === parseInt(pageIndex)
      );

      if (existingImageIndex !== -1) {
        // Update existing image
        console.log(`Updating existing image at index ${existingImageIndex}`);
        liveMenu.pageImages[existingImageIndex].url = imageUrl;
      } else {
        // Add new image
        console.log(`Adding new image for pageIndex ${pageIndex}`);
        liveMenu.pageImages.push({
          url: imageUrl,
          pageIndex: parseInt(pageIndex),
        });
      }

      // Sort pageImages by pageIndex
      liveMenu.pageImages.sort((a, b) => a.pageIndex - b.pageIndex);
      console.log(
        `Updated live menu pageImages after sort:`,
        liveMenu.pageImages
      );

      // Save the live menu
      await liveMenu.save();
      console.log(`Live menu saved with ${liveMenu.pageImages.length} images`);

      // Return success response with URL
      res.status(200).json({
        success: true,
        imageUrl,
        liveMenuId,
        pageIndex,
      });
    } catch (error) {
      console.error("Error uploading live menu image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload live menu image",
        error: error.message,
      });
    }
  },
};

module.exports = liveMenuController;
