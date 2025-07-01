/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");

const Template = require("./../models/template");
const UploadedImage = require("./../models/uploadedImage");

// Cloud storage API endpoint
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for templates in cloud storage
const STORAGE_FOLDER = "editor/templates";

const templateController = {
  // Upload image to cloud storage
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

      // Add folder prefix to filename
      const folderFilename = `${STORAGE_FOLDER}/${filename}`;

      // Create a temporary file
      const tempDir = os.tmpdir();
      const imagePath = path.join(tempDir, filename);
      fs.writeFileSync(imagePath, imageBuffer);

      formData.append("stream", fs.createReadStream(imagePath));
      formData.append("filename", folderFilename);
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

  // Save template and its metadata
  saveTemplate: async (req, res) => {
    try {
      const {
        packedData,
        previewImage,
        templateName,
        templateDesc,
        tags = [],
        userId = "default-user", // Replace with actual user ID from auth
        isPublic = false, // Default to private templates
        isKiosk = false, // Default to non-kiosk templates
      } = req.body;

      // ALWAYS create a new template when using POST /upload-template
      // The frontend will use PUT /upload-template/:id when it wants to update
      console.log(
        `Creating new template "${templateName}" for user ${userId}`
      );

      // Generate consistent filenames based on user ID and template name
      // This ensures we overwrite the same files when updating, saving storage
      const sanitizedName = templateName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");

      // Use consistent naming pattern to match the update function
      // Create filenames for local storage and cloud storage
      const localTemplateFilename = `template_${sanitizedUserId}_${sanitizedName}.json`;
      const localThumbnailFilename = `thumbnail_${sanitizedUserId}_${sanitizedName}.png`;

      // Add folder prefix for cloud storage
      const cloudTemplateFilename = `${STORAGE_FOLDER}/${localTemplateFilename}`;
      const cloudThumbnailFilename = `${STORAGE_FOLDER}/${localThumbnailFilename}`;

      console.log(
        `Using filenames: ${cloudTemplateFilename} and ${cloudThumbnailFilename}`
      );

      // Save files temporarily to disk
      const tempDir = os.tmpdir();

      // Save template file
      const templateData =
        typeof packedData === "string"
          ? packedData
          : JSON.stringify(packedData);
      const templatePath = path.join(tempDir, localTemplateFilename);
      fs.writeFileSync(templatePath, templateData);

      // Create form data for template upload
      const templateFormData = new FormData();
      templateFormData.append("stream", fs.createReadStream(templatePath));
      templateFormData.append("filename", cloudTemplateFilename);
      templateFormData.append("senitize", "false");

      // Save thumbnail file (only if preview image is provided)
      let thumbnailPath = null;
      let thumbnailFormData = null;
      
      if (previewImage && previewImage.trim() !== "") {
        console.log("📸 Processing preview image for new template...");
        const thumbnailBase64 = previewImage.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const thumbnailBuffer = Buffer.from(thumbnailBase64, "base64");
        thumbnailPath = path.join(tempDir, localThumbnailFilename);
        fs.writeFileSync(thumbnailPath, thumbnailBuffer);

        // Create form data for thumbnail upload
        thumbnailFormData = new FormData();
        thumbnailFormData.append("stream", fs.createReadStream(thumbnailPath));
        thumbnailFormData.append("filename", cloudThumbnailFilename);
        thumbnailFormData.append("senitize", "false");
      } else {
        console.log("⚠️ No preview image provided for new template");
      }

      // Upload files (conditionally include thumbnail)
      const uploadPromises = [
        axios.post(CLOUD_STORAGE_API, templateFormData, {
          headers: templateFormData.getHeaders(),
        })
      ];
      
      if (thumbnailFormData) {
        uploadPromises.push(
          axios.post(CLOUD_STORAGE_API, thumbnailFormData, {
            headers: thumbnailFormData.getHeaders(),
          })
        );
      }
      
      const uploadResults = await Promise.all(uploadPromises);
      const templateUploadRes = uploadResults[0];
      const thumbnailUploadRes = uploadResults[1] || null;

      // Clean up temporary files
      fs.unlinkSync(templatePath);
      if (thumbnailPath) {
        fs.unlinkSync(thumbnailPath);
      }
      console.log(templateUploadRes);
      console.log(thumbnailUploadRes?.data || "No thumbnail", "thumbnail data");
      // Get URLs from cloud storage responses
      const templateUrl = templateUploadRes.data;
      const thumbnailUrl = thumbnailUploadRes?.data || "";

      // Create template metadata
      const template = new Template({
        title: templateName,
        description: templateDesc,
        userId,
        templateUrl,
        thumbnailUrl,
        tags,
        isPublic,
        isKiosk,
      });

      await template.save();

      res.status(201).json({
        message: "Template saved successfully",
        template: {
          id: template._id,
          title: template.title,
          templateUrl: template.templateUrl,
          thumbnailUrl: template.thumbnailUrl,
        },
      });
    } catch (error) {
      console.error("Error saving template:", error);
      res.status(500).json({
        message: "Failed to save template",
        error: error.message,
      });
    }
  },

  // Get all templates
  getAllTemplates: async (req, res) => {
    try {
      const { userId, isPublic, onlyMine, kw, ps = 10, pi = 0 } = req.query;
      const pageSize = parseInt(ps);
      const pageIndex = parseInt(pi);

      // Build query based on parameters
      let query = {};

      // Filter by visibility
      if (isPublic === "true") {
        query.isPublic = true;
      }

      // Filter by user's templates
      if (onlyMine === "true" && userId) {
        query.userId = userId;
      } else if (userId && !onlyMine) {
        // Show public templates or user's private templates
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
      const totalCount = await Template.countDocuments(query);

      // Apply pagination
      const templates = await Template.find(query)
        .select(
          "title description templateUrl thumbnailUrl tags createdAt isPublic userId"
        )
        .sort("-createdAt")
        .skip(pageIndex * pageSize)
        .limit(pageSize);

      console.log("Query:", query);
      console.log(
        `Found templates: ${templates.length}, Page: ${pageIndex}, Size: ${pageSize}, Total: ${totalCount}`
      );

      // Return both the templates and pagination info
      res.json({
        data: templates,
        pagination: {
          total: totalCount,
          page: pageIndex,
          pageSize: pageSize,
          hasMore: (pageIndex + 1) * pageSize < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({
        message: "Failed to fetch templates",
        error: error.message,
      });
    }
  },

  // Get template by ID
  getTemplateById: async (req, res) => {
    try {
      const template = await Template.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch template",
        error: error.message,
      });
    }
  },

  // Update an existing template
  updateTemplate: async (req, res) => {
    try {
      const templateId = req.params.id;

      // Check if template exists
      const existingTemplate = await Template.findById(templateId);
      if (!existingTemplate) {
        console.log(`Template ${templateId} not found, creating new template instead`);
        // If template doesn't exist, create a new one
        return templateController.saveTemplate(req, res);
      }

      const {
        packedData,
        previewImage,
        templateName,
        templateDesc,
        tags = existingTemplate.tags,
        isPublic = existingTemplate.isPublic,
        isKiosk = existingTemplate.isKiosk,
        userId = existingTemplate.userId,
      } = req.body;

      // Verify user has permission to update this template
      if (userId !== existingTemplate.userId) {
        console.warn(
          `User ${userId} attempted to update template owned by ${existingTemplate.userId}`
        );
        // Still allow the update but log the warning
      }

      // Create consistent filenames based on user ID and template name
      const sanitizedName = templateName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");

      // Use consistent naming pattern to match the save function
      // Create filenames for local storage and cloud storage
      const localTemplateFilename = `template_${sanitizedUserId}_${sanitizedName}.json`;
      const localThumbnailFilename = `thumbnail_${sanitizedUserId}_${sanitizedName}.png`;

      // Add folder prefix for cloud storage
      const cloudTemplateFilename = `${STORAGE_FOLDER}/${localTemplateFilename}`;
      const cloudThumbnailFilename = `${STORAGE_FOLDER}/${localThumbnailFilename}`;

      console.log(
        `Using filenames: ${cloudTemplateFilename} and ${cloudThumbnailFilename}`
      );

      // Save files temporarily to disk
      const tempDir = os.tmpdir();

      // Save template file
      const templateData =
        typeof packedData === "string"
          ? packedData
          : JSON.stringify(packedData);
      const templatePath = path.join(tempDir, localTemplateFilename);
      fs.writeFileSync(templatePath, templateData);

      // Save thumbnail file
      const thumbnailBase64 = previewImage.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const thumbnailBuffer = Buffer.from(thumbnailBase64, "base64");
      const thumbnailPath = path.join(tempDir, localThumbnailFilename);
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      // Create form data for template upload
      const templateFormData = new FormData();
      templateFormData.append("stream", fs.createReadStream(templatePath));
      templateFormData.append("filename", cloudTemplateFilename);
      templateFormData.append("senitize", "false");

      // Create form data for thumbnail upload
      const thumbnailFormData = new FormData();
      thumbnailFormData.append("stream", fs.createReadStream(thumbnailPath));
      thumbnailFormData.append("filename", cloudThumbnailFilename);
      thumbnailFormData.append("senitize", "false");

      // Upload files
      const [templateUploadRes, thumbnailUploadRes] = await Promise.all([
        axios.post(CLOUD_STORAGE_API, templateFormData, {
          headers: templateFormData.getHeaders(),
        }),
        axios.post(CLOUD_STORAGE_API, thumbnailFormData, {
          headers: thumbnailFormData.getHeaders(),
        }),
      ]);

      // Clean up temporary files
      fs.unlinkSync(templatePath);
      fs.unlinkSync(thumbnailPath);

      // Get URLs from cloud storage responses
      const templateUrl = templateUploadRes.data;
      const thumbnailUrl = thumbnailUploadRes.data;

      // Update template metadata
      existingTemplate.title = templateName || existingTemplate.title;
      existingTemplate.description =
        templateDesc || existingTemplate.description;
      existingTemplate.templateUrl = templateUrl;
      existingTemplate.thumbnailUrl = thumbnailUrl;
      existingTemplate.tags = tags;
      existingTemplate.isPublic = isPublic;
      existingTemplate.isKiosk = isKiosk;
      existingTemplate.updatedAt = new Date();

      await existingTemplate.save();

      res.status(200).json({
        message: "Template updated successfully",
        template: {
          id: existingTemplate._id,
          title: existingTemplate.title,
          templateUrl: existingTemplate.templateUrl,
          thumbnailUrl: existingTemplate.thumbnailUrl,
        },
      });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({
        message: "Failed to update template",
        error: error.message,
      });
    }
  },

  // Delete template
  deleteTemplate: async (req, res) => {
    try {
      const template = await Template.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Note: Files in cloud storage might need to be deleted through their API
      await template.deleteOne();

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete template",
        error: error.message,
      });
    }
  },

  // Proxy template from cloud storage
  proxyTemplate: async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Fetch the template from the cloud storage URL
      const response = await axios.get(url);

      // Return the template data
      res.json(response.data);
    } catch (error) {
      console.error("Error proxying template:", error);
      res.status(500).json({
        message: "Failed to proxy template",
        error: error.message,
      });
    }
  },
};

module.exports = templateController;
