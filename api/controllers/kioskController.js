/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");
const Kiosk = require("../models/kiosk");

// Cloud storage API endpoint
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for kiosk images in cloud storage
const STORAGE_FOLDER = "editor/kiosk";

const kioskController = {
  // Get or create user's single kiosk
  getUserKiosk: async (req, res) => {
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

      // Check if user already has a kiosk
      let kiosk = await Kiosk.findOne({ userId });

      if (kiosk) {
        // Return existing kiosk
        return res.status(200).json({
          message: "User kiosk found",
          kiosk: {
            id: kiosk._id.toString(),
            title: kiosk.title,
            description: kiosk.description,
            templateUrl: kiosk.templateUrl,
            templateData: kiosk.templateData,
            pageImages: kiosk.pageImages,
            tags: kiosk.tags,
            isPublic: kiosk.isPublic,
            createdAt: kiosk.createdAt,
            updatedAt: kiosk.updatedAt,
          },
        });
      } else {
        // Create a new kiosk for the user
        const defaultTitle = `${userId}'s Kiosk`;

        kiosk = new Kiosk({
          title: defaultTitle,
          description: "My personal kiosk display",
          userId,
          templateId: null,
          templateUrl: null,
          templateData: null,
          pageImages: [],
          tags: [],
          isPublic: false,
        });

        await kiosk.save();

        return res.status(201).json({
          message: "New kiosk created for user",
          kiosk: {
            id: kiosk._id.toString(),
            title: kiosk.title,
            description: kiosk.description,
            templateUrl: kiosk.templateUrl,
            templateData: kiosk.templateData,
            pageImages: kiosk.pageImages,
            tags: kiosk.tags,
            isPublic: kiosk.isPublic,
            createdAt: kiosk.createdAt,
            updatedAt: kiosk.updatedAt,
          },
        });
      }
    } catch (error) {
      console.error("Error getting/creating user kiosk:", error);
      res.status(500).json({
        message: "Failed to get or create user kiosk",
        error: error.message,
      });
    }
  },

  // Update user's kiosk
  updateUserKiosk: async (req, res) => {
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

      // Find user's kiosk
      const kiosk = await Kiosk.findOne({ userId });

      if (!kiosk) {
        return res.status(404).json({
          message: "User kiosk not found",
        });
      }

      // Update kiosk fields
      if (title !== undefined) kiosk.title = title;
      if (description !== undefined) kiosk.description = description;
      if (templateUrl !== undefined) kiosk.templateUrl = templateUrl;
      if (templateData !== undefined) kiosk.templateData = templateData;
      if (pageImages !== undefined) kiosk.pageImages = pageImages;

      kiosk.updatedAt = new Date();

      await kiosk.save();

      res.status(200).json({
        message: "Kiosk updated successfully",
        kiosk: {
          id: kiosk._id.toString(),
          title: kiosk.title,
          description: kiosk.description,
          templateUrl: kiosk.templateUrl,
          templateData: kiosk.templateData,
          pageImages: kiosk.pageImages,
          tags: kiosk.tags,
          isPublic: kiosk.isPublic,
          createdAt: kiosk.createdAt,
          updatedAt: kiosk.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating user kiosk:", error);
      res.status(500).json({
        message: "Failed to update user kiosk",
        error: error.message,
      });
    }
  },

  // Upload template JSON for kiosk
  uploadKioskTemplate: async (req, res) => {
    try {
      const { packedData, userId = "anonymous" } = req.body;

      if (!packedData) {
        return res.status(400).json({
          message: "Missing template data",
        });
      }

      // Generate a unique filename with timestamp
      const timestamp = Date.now();
      const templateFilename = `kiosk_template_${timestamp}.json`;

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
      const templateFormData = new FormData();
      templateFormData.append("stream", fs.createReadStream(templatePath));
      templateFormData.append("filename", cloudTemplateFilename);
      templateFormData.append("senitize", "false");

      // Upload to cloud storage
      const templateUploadRes = await axios.post(
        CLOUD_STORAGE_API,
        templateFormData,
        {
          headers: templateFormData.getHeaders(),
        }
      );

      // Clean up temporary file
      fs.unlinkSync(templatePath);

      // Get URL from cloud storage response
      const templateUrl = templateUploadRes.data;

      // Return the URL
      res.status(200).json({
        templateUrl,
        message: "Template JSON uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading kiosk template:", error);
      res.status(500).json({
        message: "Failed to upload kiosk template",
        error: error.message,
      });
    }
  },

  // Create or update user's kiosk (upsert logic for single kiosk per user)
  createKiosk: async (req, res) => {
    try {
      const {
        userId: rawUserId,
        templateUrl,
        tags = [],
        isPublic = false,
      } = req.body;

      // Extract just the ID part if userId contains city and name
      let userId = rawUserId;
      if (userId && userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      if (!templateUrl) {
        return res.status(400).json({
          message: "Template URL is required",
        });
      }

      // Check if user already has a kiosk
      let kiosk = await Kiosk.findOne({ userId });

      if (kiosk) {
        // Update existing kiosk
        kiosk.templateUrl = templateUrl;
        kiosk.tags = tags;
        kiosk.isPublic = isPublic;
        kiosk.updatedAt = new Date();
        // Clear existing page images - they will be re-uploaded
        kiosk.pageImages = [];
        
        await kiosk.save();

        console.log(`Updated existing kiosk for user ${userId}`);
        
        return res.status(200).json({
          message: "Kiosk updated successfully",
          kiosk: {
            id: kiosk._id.toString(),
            title: kiosk.title || `Kiosk Display`,
            description: kiosk.description || "Updated kiosk display",
            templateUrl: kiosk.templateUrl,
            userId: kiosk.userId,
            updatedAt: kiosk.updatedAt,
          },
        });
      } else {
        // Create a new kiosk
        kiosk = new Kiosk({
          title: `Kiosk Display`,
          description: "Restaurant kiosk display",
          userId,
          templateUrl,
          pageImages: [],
          tags,
          isPublic,
        });

        await kiosk.save();

        console.log(`Created new kiosk for user ${userId}`);

        return res.status(201).json({
          message: "Kiosk created successfully",
          kiosk: {
            id: kiosk._id.toString(),
            title: kiosk.title,
            description: kiosk.description,
            templateUrl: kiosk.templateUrl,
            userId: kiosk.userId,
            createdAt: kiosk.createdAt,
          },
        });
      }
    } catch (error) {
      console.error("Error creating/updating kiosk:", error);
      res.status(500).json({
        message: "Failed to create or update kiosk",
        error: error.message,
      });
    }
  },

  // Upload kiosk page image to cloud storage and add to kiosk
  uploadKioskImage: async (req, res) => {
    try {
      const { base64, filename, kioskId, pageIndex = 0 } = req.body;
      console.log(
        `Received upload request for kiosk ${kioskId}, page ${pageIndex}, filename: ${filename}`
      );
      console.log(`Base64 data preview: ${base64.substring(0, 50)}...`);

      if (!base64) {
        console.error("Missing image data");
        return res.status(400).json({
          message: "Missing image data",
        });
      }

      if (!kioskId) {
        console.error("Missing kiosk ID");
        return res.status(400).json({
          message: "Missing kiosk ID",
        });
      }

      // Find the kiosk
      const kiosk = await Kiosk.findById(kioskId);
      if (!kiosk) {
        return res.status(404).json({
          message: "Kiosk not found",
        });
      }

      // Create form data for image upload
      const formData = new FormData();
      const imageBuffer = Buffer.from(base64, "base64");

      // Create a temporary file
      const tempDir = os.tmpdir();
      const imagePath = path.join(tempDir, filename);
      fs.writeFileSync(imagePath, imageBuffer);

      // Create cloud filename with user ID folder
      const cloudFilename = `${STORAGE_FOLDER}/${kiosk.userId}/${filename}`;

      formData.append("stream", fs.createReadStream(imagePath));
      formData.append("filename", cloudFilename);
      formData.append("senitize", "false");

      // Upload to cloud storage
      const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
        headers: formData.getHeaders(),
      });

      // Clean up temporary file
      fs.unlinkSync(imagePath);

      // Get the URL from the response
      const imageUrl = uploadResponse.data;

      // Add the image to the kiosk's pageImages array
      console.log(`Current kiosk pageImages:`, kiosk.pageImages);

      // First check if an image with this pageIndex already exists
      const existingImageIndex = kiosk.pageImages.findIndex(
        (img) => img.pageIndex === parseInt(pageIndex)
      );
      console.log(
        `Checking for existing image at pageIndex ${pageIndex}, found: ${
          existingImageIndex !== -1
        }`
      );

      if (existingImageIndex !== -1) {
        // Update existing image
        console.log(`Updating existing image at index ${existingImageIndex}`);
        kiosk.pageImages[existingImageIndex].url = imageUrl;
      } else {
        // Add new image
        console.log(`Adding new image for pageIndex ${pageIndex}`);
        kiosk.pageImages.push({
          url: imageUrl,
          pageIndex: parseInt(pageIndex),
        });
      }

      // Sort pageImages by pageIndex
      kiosk.pageImages.sort((a, b) => a.pageIndex - b.pageIndex);
      console.log(`Updated kiosk pageImages after sort:`, kiosk.pageImages);

      // Save the kiosk
      await kiosk.save();
      console.log(`Kiosk saved with ${kiosk.pageImages.length} images`);

      // Return success response with URL
      res.status(200).json({
        success: true,
        imageUrl,
        kioskId,
        pageIndex,
      });
    } catch (error) {
      console.error("Error uploading kiosk image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload kiosk image",
        error: error.message,
      });
    }
  },

  // Get all kiosks
  getAllKiosks: async (req, res) => {
    try {
      const {
        userId: rawUserId,
        isPublic,
        onlyMine,
        kw,
        ps = 10,
        pi = 0,
      } = req.query;
      const pageSize = parseInt(ps);
      const pageIndex = parseInt(pi);

      // Extract just the ID part if userId contains city and name
      let userId = rawUserId;
      if (userId && userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      // Build query based on parameters
      let query = {};

      // Filter by visibility
      if (isPublic === "true") {
        query.isPublic = true;
      }

      // Filter by user's kiosks
      if (onlyMine === "true" && userId) {
        query.userId = userId;
      } else if (userId && !onlyMine) {
        // Show public kiosks or user's private kiosks
        query = { $or: [{ isPublic: true }, { userId }] };
      }

      // Search by keyword if provided
      if (kw) {
        const keywordRegex = new RegExp(kw, "i");
        query.$or = [
          { title: keywordRegex },
          { description: keywordRegex },
          { tags: keywordRegex },
        ];
      }

      // Get total count for pagination info
      const totalCount = await Kiosk.countDocuments(query);

      // Apply pagination
      const kiosks = await Kiosk.find(query)
        .select(
          "title description pageImages tags createdAt isPublic userId templateId templateUrl"
        )
        .sort("-createdAt")
        .skip(pageIndex * pageSize)
        .limit(pageSize);

      // Return both the kiosks and pagination info
      res.json({
        data: kiosks,
        pagination: {
          total: totalCount,
          page: pageIndex,
          pageSize: pageSize,
          hasMore: (pageIndex + 1) * pageSize < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching kiosks:", error);
      res.status(500).json({
        message: "Failed to fetch kiosks",
        error: error.message,
      });
    }
  },

  // Get kiosk by ID
  getKioskById: async (req, res) => {
    try {
      const kiosk = await Kiosk.findById(req.params.id);
      if (!kiosk) {
        return res.status(404).json({ message: "Kiosk not found" });
      }

      // We now store templateData directly in the kiosk model
      // No need to fetch from template model

      res.json(kiosk);
    } catch (error) {
      console.error("Error fetching kiosk:", error);
      res.status(500).json({
        message: "Failed to fetch kiosk",
        error: error.message,
      });
    }
  },

  // Delete kiosk
  deleteKiosk: async (req, res) => {
    try {
      const kiosk = await Kiosk.findById(req.params.id);
      if (!kiosk) {
        return res.status(404).json({ message: "Kiosk not found" });
      }

      // Note: Files in cloud storage might need to be deleted through their API
      await kiosk.deleteOne();

      res.json({ message: "Kiosk deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete kiosk",
        error: error.message,
      });
    }
  },
};

module.exports = kioskController;
