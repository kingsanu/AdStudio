/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("node:buffer");
const fs = require("fs");
const os = require("os");
const path = require("node:path");

const Project = require("./../models/project");

// Cloud storage API endpoint (reusing existing infrastructure)
const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";

// Define folder name for projects in cloud storage
const STORAGE_FOLDER = "editor/projects";

const projectController = {
  // Save project (new or update existing)
  saveProject: async (req, res) => {
    try {
      const {
        projectId, // Optional: if updating existing project
        title,
        description = "",
        packedData, // The design JSON data
        previewImage, // Base64 thumbnail
        status = "draft",
        category = "other",        tags = [],
        userId,
        projectMetadata = {}, // Canvas size, layer info, etc.
        campaignId = null, // Link to campaign if applicable
        campaignType = null, // Type of campaign: whatsapp, coupon, etc.
      } = req.body;

      console.log(`Saving project: ${title} for user: ${userId}`);

      let project;
      let isNewProject = !projectId;

      // Find existing project or create new one
      if (projectId) {
        project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
          return res.status(404).json({
            success: false,
            message: "Project not found or access denied",
          });
        }
        isNewProject = false;
      } else {
        // Create new project
        project = new Project({
          title,
          description,
          userId,
          status,          category,
          tags,
          projectMetadata,
          campaignId,
          campaignType,
          projectDataUrl: "", // Will be set after upload
          thumbnailUrl: "", // Will be set after upload
        });
      }

      // Update project fields
      project.title = title;
      project.description = description;
      project.status = status;      project.category = category;
      project.tags = tags;
      project.projectMetadata = { ...project.projectMetadata, ...projectMetadata };
      project.editCount = (project.editCount || 0) + 1;
      
      // Update campaign linking if provided
      if (campaignId) {
        project.campaignId = campaignId;
      }
      if (campaignType) {
        project.campaignType = campaignType;
      }

      // Save project first to get ID for filename generation
      if (isNewProject) {
        await project.save();
      }

      // Generate filenames
      const filenames = project.generateFilenames();
      
      // Cloud storage filenames with folder prefix
      const cloudProjectFilename = `${STORAGE_FOLDER}/${filenames.projectData}`;
      const cloudThumbnailFilename = `${STORAGE_FOLDER}/${filenames.thumbnail}`;

      console.log(`Using filenames: ${cloudProjectFilename} and ${cloudThumbnailFilename}`);

      // Prepare files for upload
      const tempDir = os.tmpdir();

      // 1. Save project JSON data
      const projectData = typeof packedData === "string" 
        ? packedData 
        : JSON.stringify(packedData);
      
      const projectPath = path.join(tempDir, filenames.projectData);
      fs.writeFileSync(projectPath, projectData);

      // Calculate file size
      const stats = fs.statSync(projectPath);
      project.fileSize = stats.size;

      // 2. Save thumbnail
      const thumbnailBase64 = previewImage.replace(/^data:image\/\w+;base64,/, "");
      const thumbnailBuffer = Buffer.from(thumbnailBase64, "base64");
      const thumbnailPath = path.join(tempDir, filenames.thumbnail);
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      // Upload project data to cloud storage
      const projectFormData = new FormData();
      projectFormData.append("stream", fs.createReadStream(projectPath));
      projectFormData.append("filename", cloudProjectFilename);
      projectFormData.append("senitize", "false");

      console.log("Uploading project data to cloud storage...");
      const projectUploadResponse = await axios.post(CLOUD_STORAGE_API, projectFormData, {
        headers: projectFormData.getHeaders(),
      });

      // Upload thumbnail to cloud storage
      const thumbnailFormData = new FormData();
      thumbnailFormData.append("stream", fs.createReadStream(thumbnailPath));
      thumbnailFormData.append("filename", cloudThumbnailFilename);
      thumbnailFormData.append("senitize", "false");

      console.log("Uploading thumbnail to cloud storage...");
      const thumbnailUploadResponse = await axios.post(CLOUD_STORAGE_API, thumbnailFormData, {
        headers: thumbnailFormData.getHeaders(),
      });

      // Clean up temporary files
      fs.unlinkSync(projectPath);
      fs.unlinkSync(thumbnailPath);

      // Update project with URLs
      project.projectDataUrl = projectUploadResponse.data;
      project.thumbnailUrl = thumbnailUploadResponse.data;

      // Version control: if this is an update, save previous version
      if (!isNewProject && project.version) {
        if (!project.previousVersions) {
          project.previousVersions = [];
        }
        
        // Keep only last 5 versions to save storage
        if (project.previousVersions.length >= 5) {
          project.previousVersions.shift();
        }
        
        project.previousVersions.push({
          version: project.version,
          projectDataUrl: project.projectDataUrl,
          createdAt: new Date(),
          changeDescription: `Auto-save version ${project.version}`,
        });
        
        project.version += 1;
      }

      // Save final project
      await project.save();

      console.log(`Project saved successfully: ${project._id}`);

      res.status(200).json({
        success: true,
        message: isNewProject ? "Project created successfully" : "Project updated successfully",
        data: {
          projectId: project._id,
          title: project.title,
          thumbnailUrl: project.thumbnailUrl,
          status: project.status,
          category: project.category,
          lastModified: project.lastModified,
          version: project.version,
        },
      });

    } catch (error) {
      console.error("Error saving project:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save project",
        error: error.message,
      });
    }
  },

  // Get user's projects with pagination and filtering
  getUserProjects: async (req, res) => {
    try {
      const { 
        userId, 
        status, 
        category, 
        ps = 20, 
        pi = 0, 
        sortBy = "lastModified",
        sortOrder = "desc",
        kw // keyword search
      } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const pageSize = parseInt(ps);
      const pageIndex = parseInt(pi);

      // Build query
      let query = { userId };

      // Filter by status
      if (status && status !== 'all') {
        query.status = status;
      } else {
        // Exclude archived by default
        query.status = { $ne: 'archived' };
      }

      // Filter by category
      if (category && category !== 'all') {
        query.category = category;
      }

      // Search by keyword
      if (kw) {
        const keywordRegex = new RegExp(kw, "i");
        query.$or = [
          { title: keywordRegex },
          { description: keywordRegex },
          { tags: keywordRegex },
        ];
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get total count
      const totalCount = await Project.countDocuments(query);

      // Get projects
      const projects = await Project.find(query)
        .select('title description thumbnailUrl status category tags lastModified createdAt projectMetadata viewCount')
        .sort(sortOptions)
        .skip(pageIndex * pageSize)
        .limit(pageSize);

      res.json({
        success: true,
        data: projects,
        pagination: {
          total: totalCount,
          page: pageIndex,
          pageSize: pageSize,
          hasMore: (pageIndex + 1) * pageSize < totalCount,
        },
      });

    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
        error: error.message,
      });
    }
  },

  // Get recent projects (for dashboard)
  getRecentProjects: async (req, res) => {
    try {
      const { userId, limit = 8 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const projects = await Project.findRecentByUser(userId, parseInt(limit));

      res.json({
        success: true,
        data: projects,
      });

    } catch (error) {
      console.error("Error fetching recent projects:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent projects",
        error: error.message,
      });
    }
  },

  // Get project by ID (includes full project data)
  getProjectById: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      const project = await Project.findOne({ _id: id, userId });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found or access denied",
        });
      }

      // Increment view count
      project.viewCount = (project.viewCount || 0) + 1;
      project.lastOpenedAt = new Date();
      await project.save();

      res.json({
        success: true,
        data: project,
      });

    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project",
        error: error.message,
      });
    }
  },

  // Delete project
  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      const project = await Project.findOne({ _id: id, userId });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found or access denied",
        });
      }

      // Archive instead of hard delete (safer)
      project.status = 'archived';
      await project.save();

      res.json({
        success: true,
        message: "Project archived successfully",
      });

    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete project",
        error: error.message,
      });
    }
  },

  // Duplicate project
  duplicateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, newTitle } = req.body;

      const originalProject = await Project.findOne({ _id: id, userId });

      if (!originalProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found or access denied",
        });
      }

      // Get original project data from cloud storage
      const projectDataResponse = await axios.get(originalProject.projectDataUrl);
      const projectData = projectDataResponse.data;

      // Create new project with duplicated data
      const duplicatedProject = new Project({
        title: newTitle || `${originalProject.title} (Copy)`,
        description: originalProject.description,
        userId: originalProject.userId,
        status: 'draft',
        category: originalProject.category,
        tags: [...originalProject.tags],
        projectMetadata: { ...originalProject.projectMetadata },
        originalTemplateId: originalProject._id, // Reference to original
      });

      // Use the saveProject logic to handle file uploads
      req.body = {
        title: duplicatedProject.title,
        description: duplicatedProject.description,
        packedData: projectData,
        previewImage: `data:image/png;base64,${Buffer.from('').toString('base64')}`, // Placeholder
        status: duplicatedProject.status,
        category: duplicatedProject.category,
        tags: duplicatedProject.tags,
        userId: duplicatedProject.userId,
        projectMetadata: duplicatedProject.projectMetadata,
      };

      // Call saveProject to handle the duplication
      return projectController.saveProject(req, res);

    } catch (error) {
      console.error("Error duplicating project:", error);
      res.status(500).json({
        success: false,
        message: "Failed to duplicate project",
        error: error.message,
      });
    }
  },

  // Get project statistics for user
  getProjectStats: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const stats = await Project.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            draftProjects: {
              $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] }
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            totalViews: { $sum: "$viewCount" },
            totalEdits: { $sum: "$editCount" },
            avgTimeSpent: { $avg: "$timeSpent" },
          }
        }
      ]);

      const result = stats[0] || {
        totalProjects: 0,
        draftProjects: 0,
        completedProjects: 0,
        totalViews: 0,
        totalEdits: 0,
        avgTimeSpent: 0,
      };

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project statistics",
        error: error.message,
      });
    }
  },
};

module.exports = projectController;
