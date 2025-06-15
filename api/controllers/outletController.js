/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const MongoOutlet = require("../models/outlet");

const outletController = {
  // Get all outlets with optional filtering
  getOutlets: async (req, res) => {
    try {
      const {
        userId,
        search,
        page = 1,
        limit = 20,
        sortBy = "updatedAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = { isActive: true };

      if (userId) {
        query.userId = userId;
      }

      if (search) {
        query.$or = [
          { Name: { $regex: search, $options: "i" } },
          { Address: { $regex: search, $options: "i" } },
          { City: { $regex: search, $options: "i" } },
          { Landmark: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const outlets = await MongoOutlet.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await MongoOutlet.countDocuments(query);

      // Convert to standard format
      const standardOutlets = outlets.map((outlet) =>
        outlet.toStandardFormat()
      );

      res.json({
        success: true,
        data: standardOutlets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching outlets:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch outlets",
        error: error.message,
      });
    }
  },

  // Get outlet by ID
  getOutletById: async (req, res) => {
    try {
      const { id } = req.params;

      const outlet = await MongoOutlet.findById(id);

      if (!outlet) {
        return res.status(404).json({
          success: false,
          message: "Outlet not found",
        });
      }

      res.json({
        success: true,
        data: outlet.toStandardFormat(),
      });
    } catch (error) {
      console.error("Error fetching outlet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch outlet",
        error: error.message,
      });
    }
  },

  // Create new outlet
  createOutlet: async (req, res) => {
    try {
      const outletData = req.body;

      // Check for duplicate outlet name for the same user
      const existingOutlet = await MongoOutlet.findOne({
        name: outletData.name,
        userId: outletData.userId,
        isActive: true,
      });

      if (existingOutlet) {
        return res.status(400).json({
          success: false,
          message: "Outlet with this name already exists",
        });
      }

      const outlet = new MongoOutlet(outletData);
      await outlet.save();

      res.status(201).json({
        success: true,
        data: outlet,
        message: "Outlet created successfully",
      });
    } catch (error) {
      console.error("Error creating outlet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create outlet",
        error: error.message,
      });
    }
  },

  // Update outlet
  updateOutlet: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const outlet = await MongoOutlet.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!outlet) {
        return res.status(404).json({
          success: false,
          message: "Outlet not found",
        });
      }

      res.json({
        success: true,
        data: outlet,
        message: "Outlet updated successfully",
      });
    } catch (error) {
      console.error("Error updating outlet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update outlet",
        error: error.message,
      });
    }
  },

  // Delete outlet (soft delete)
  deleteOutlet: async (req, res) => {
    try {
      const { id } = req.params;

      const outlet = await MongoOutlet.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!outlet) {
        return res.status(404).json({
          success: false,
          message: "Outlet not found",
        });
      }

      res.json({
        success: true,
        message: "Outlet deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting outlet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete outlet",
        error: error.message,
      });
    }
  },

  // Get outlets by user
  getOutletsByUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const outlets = await MongoOutlet.findByUserId(userId);

      // Convert to standard format
      const standardOutlets = outlets.map((outlet) =>
        outlet.toStandardFormat()
      );

      res.json({
        success: true,
        data: standardOutlets,
      });
    } catch (error) {
      console.error("Error fetching outlets by user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch outlets",
        error: error.message,
      });
    }
  },

  // Get or create default outlet for user
  getOrCreateDefaultOutlet: async (req, res) => {
    try {
      const { userId } = req.params;
      const { name = "Main Outlet", businessName = "My Business" } = req.body;

      // Check if user already has an outlet
      let outlet = await MongoOutlet.findOne({
        userId,
        isActive: true,
      });

      if (!outlet) {
        // Create default outlet
        outlet = new MongoOutlet({
          name,
          businessName,
          userId,
        });
        await outlet.save();
      }

      res.json({
        success: true,
        data: outlet,
        message:
          outlet.createdAt === outlet.updatedAt
            ? "Default outlet created"
            : "Outlet found",
      });
    } catch (error) {
      console.error("Error getting or creating default outlet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get or create outlet",
        error: error.message,
      });
    }
  },

  // Get outlet by LinkCode (for existing restaurant data)
  getOutletByLinkCode: async (req, res) => {
    try {
      const { linkCode } = req.params;

      const outlet = await MongoOutlet.findByLinkCode(parseInt(linkCode));

      if (!outlet) {
        return res.status(404).json({
          success: false,
          message: "Outlet not found",
        });
      }

      res.json({
        success: true,
        data: outlet.toStandardFormat(),
      });
    } catch (error) {
      console.error("Error fetching outlet by LinkCode:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch outlet",
        error: error.message,
      });
    }
  },

  // Associate existing restaurant outlet with user
  associateOutletWithUser: async (req, res) => {
    try {
      const { linkCode } = req.params;
      const { userId } = req.body;

      const outlet = await MongoOutlet.findByLinkCode(parseInt(linkCode));

      if (!outlet) {
        return res.status(404).json({
          success: false,
          message: "Outlet not found",
        });
      }

      // Update the outlet with userId
      outlet.userId = userId;
      await outlet.save();

      res.json({
        success: true,
        data: outlet.toStandardFormat(),
        message: "Outlet associated with user successfully",
      });
    } catch (error) {
      console.error("Error associating outlet with user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to associate outlet",
        error: error.message,
      });
    }
  },

  // Get all outlets (for admin/debugging)
  getAllOutlets: async (req, res) => {
    try {
      const outlets = await MongoOutlet.find({}).limit(10); // Limit for safety

      const standardOutlets = outlets.map((outlet) =>
        outlet.toStandardFormat()
      );

      res.json({
        success: true,
        data: standardOutlets,
        total: outlets.length,
      });
    } catch (error) {
      console.error("Error fetching all outlets:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch outlets",
        error: error.message,
      });
    }
  },
};

module.exports = outletController;
