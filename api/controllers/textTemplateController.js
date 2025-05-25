/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");

const TextTemplate = require("./../models/textTemplate");

// Cloud storage API endpoint
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for text templates in cloud storage
const STORAGE_FOLDER = "editor/text-templates";

const textTemplateController = {
  // Save text template and its metadata
  saveTextTemplate: async (req, res) => {
    try {
      const {
        packedData,
        previewImage,
        templateName,
        templateDesc,
        tags = [],
        userId = "default-user", // Replace with actual user ID from auth
        isPublic = false, // Default to private templates
      } = req.body;

      // Check if a template with the same name and user already exists
      const existingTemplate = await TextTemplate.findOne({
        title: templateName,
        userId: userId,
      });

      if (existingTemplate) {
        return res.status(400).json({
          message: "A text template with this name already exists",
        });
      }

      // Sanitize user ID and template name for filenames
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, "_");
      const sanitizedName = templateName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "_");

      // Use consistent naming pattern to match the update function
      // Create filenames for local storage and cloud storage
      const localTemplateFilename = `text_template_${sanitizedUserId}_${sanitizedName}.json`;
      const localThumbnailFilename = `text_thumbnail_${sanitizedUserId}_${sanitizedName}.png`;

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

      // Create template metadata
      const textTemplate = new TextTemplate({
        title: templateName,
        description: templateDesc,
        userId,
        templateUrl,
        thumbnailUrl,
        tags,
        isPublic,
        templateType: "text", // Explicitly set the template type
      });

      // Save to database
      await textTemplate.save();

      res.status(201).json({
        message: "Text template saved successfully",
        template: {
          id: textTemplate._id,
          title: textTemplate.title,
          description: textTemplate.description,
          thumbnailUrl: textTemplate.thumbnailUrl,
          templateUrl: textTemplate.templateUrl,
          tags: textTemplate.tags,
          isPublic: textTemplate.isPublic,
          createdAt: textTemplate.createdAt,
        },
      });
    } catch (error) {
      console.error("Error saving text template:", error);
      res.status(500).json({
        message: "Failed to save text template",
        error: error.message,
      });
    }
  },

  // Get all text templates
  getAllTextTemplates: async (req, res) => {
    try {
      const {
        userId,
        isPublic,
        onlyMine,
        kw,
        includePublic,
        ps = 10,
        pi = 0,
      } = req.query;
      const pageSize = parseInt(ps);
      const pageIndex = parseInt(pi);

      // Build query based on parameters
      let query = { templateType: "text" }; // Always filter by templateType

      // Filter by visibility
      if (isPublic === "true") {
        query.isPublic = true;
      }

      // Filter by user's templates
      if (onlyMine === "true" && userId) {
        query.userId = userId;
      } else if (userId && !onlyMine) {
        // Show public templates or user's private templates
        query = {
          templateType: "text", // Keep the templateType filter
          $or: [{ isPublic: true }, { userId }],
        };
      } else if (includePublic === "true") {
        // If includePublic is true, show all public templates
        // If userId is also provided, include their private templates too
        if (userId) {
          query = {
            templateType: "text",
            $or: [{ isPublic: true }, { userId }],
          };
        } else {
          query = {
            templateType: "text",
            isPublic: true,
          };
        }
      }

      // Search by keyword if provided
      if (kw) {
        const keywordRegex = new RegExp(kw, "i");
        if (query.$or) {
          // If $or already exists (from userId filter), we need to use $and
          query = {
            $and: [
              { templateType: "text" },
              { $or: query.$or },
              {
                $or: [
                  { title: keywordRegex },
                  { description: keywordRegex },
                  { tags: keywordRegex },
                ],
              },
            ],
          };
        } else {
          // Simple case - just add $or to the existing query
          query.$or = [
            { title: keywordRegex },
            { description: keywordRegex },
            { tags: keywordRegex },
          ];
        }
      }

      // Get total count for pagination info
      const totalCount = await TextTemplate.countDocuments(query);

      // Apply pagination
      const textTemplates = await TextTemplate.find(query)
        .select(
          "title description templateUrl thumbnailUrl tags createdAt isPublic userId"
        )
        .sort("-createdAt")
        .skip(pageIndex * pageSize)
        .limit(pageSize);

      console.log("Query:", query);
      console.log(
        `Found text templates: ${textTemplates.length}, Page: ${pageIndex}, Size: ${pageSize}, Total: ${totalCount}`
      );

      // Return both the templates and pagination info
      res.json({
        data: textTemplates,
        pagination: {
          total: totalCount,
          page: pageIndex,
          pageSize: pageSize,
          hasMore: (pageIndex + 1) * pageSize < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching text templates:", error);
      res.status(500).json({
        message: "Failed to fetch text templates",
        error: error.message,
      });
    }
  },

  // Get text template by ID
  getTextTemplateById: async (req, res) => {
    try {
      const textTemplate = await TextTemplate.findById(req.params.id);
      if (!textTemplate) {
        return res.status(404).json({ message: "Text template not found" });
      }
      res.json(textTemplate);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch text template",
        error: error.message,
      });
    }
  },

  // Update an existing text template
  updateTextTemplate: async (req, res) => {
    try {
      const templateId = req.params.id;

      // Check if template exists
      const existingTemplate = await TextTemplate.findById(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Text template not found" });
      }

      const {
        packedData,
        previewImage,
        templateName,
        templateDesc,
        tags = existingTemplate.tags,
        isPublic = existingTemplate.isPublic,
        userId = existingTemplate.userId,
      } = req.body;

      // Verify user has permission to update this template
      if (userId !== existingTemplate.userId) {
        console.warn(
          `User ${userId} attempted to update text template owned by ${existingTemplate.userId}`
        );
        // Still allow the update but log the warning
      }

      // Sanitize user ID and template name for filenames
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, "_");
      const sanitizedName = templateName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "_");

      // Use the same filenames as before to overwrite existing files
      // Create filenames for local storage and cloud storage
      const localTemplateFilename = `text_template_${sanitizedUserId}_${sanitizedName}.json`;
      const localThumbnailFilename = `text_thumbnail_${sanitizedUserId}_${sanitizedName}.png`;

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

      // Update template in database
      const updatedTemplate = await TextTemplate.findByIdAndUpdate(
        templateId,
        {
          title: templateName,
          description: templateDesc,
          templateUrl,
          thumbnailUrl,
          tags,
          isPublic,
          templateType: "text", // Ensure template type is set on update
          updatedAt: new Date(),
        },
        { new: true }
      );

      res.status(200).json({
        message: "Text template updated successfully",
        template: {
          id: updatedTemplate._id,
          title: updatedTemplate.title,
          description: updatedTemplate.description,
          thumbnailUrl: updatedTemplate.thumbnailUrl,
          templateUrl: updatedTemplate.templateUrl,
          tags: updatedTemplate.tags,
          isPublic: updatedTemplate.isPublic,
          updatedAt: updatedTemplate.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating text template:", error);
      res.status(500).json({
        message: "Failed to update text template",
        error: error.message,
      });
    }
  },

  // Delete a text template
  deleteTextTemplate: async (req, res) => {
    try {
      const templateId = req.params.id;

      // Check if template exists
      const existingTemplate = await TextTemplate.findById(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Text template not found" });
      }

      // Delete template from database
      await TextTemplate.findByIdAndDelete(templateId);

      // Note: We're not deleting files from cloud storage to avoid complexity
      // and potential issues with shared resources

      res.status(200).json({
        message: "Text template deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting text template:", error);
      res.status(500).json({
        message: "Failed to delete text template",
        error: error.message,
      });
    }
  },
};

module.exports = textTemplateController;
