/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const Background = require("../models/background");
const Illustration = require("../models/illustration");
const Icon = require("../models/icon");
const ThreeDImage = require("../models/threeDImage");

const getBackgrounds = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.pi) || 0;
    const pageSize = parseInt(req.query.ps) || 20;
    const keyword = req.query.kw || "";

    // Create query object
    let query = {};

    // Add keyword search if provided
    if (keyword) {
      query = {
        $or: [{ desc: { $regex: keyword, $options: "i" } }],
      };
    }

    // Find backgrounds with pagination and sort by createdAt in descending order (newest first)
    const backgrounds = await Background.find(query)
      .sort({ createdAt: -1 })
      .skip(page * pageSize)
      .limit(pageSize);

    // Get total count for pagination
    const total = await Background.countDocuments(query);

    res.status(200).json({
      success: true,
      data: backgrounds,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching backgrounds:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getIllustrations = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.pi) || 0;
    const pageSize = parseInt(req.query.ps) || 20;
    const keyword = req.query.kw || "";

    // Create query object
    let query = {};

    // Add keyword search if provided
    if (keyword) {
      query = {
        $or: [{ desc: { $regex: keyword, $options: "i" } }],
      };
    }

    // Find illustrations with pagination and sort by createdAt in descending order (newest first)
    const illustrations = await Illustration.find(query)
      .sort({ createdAt: -1 })
      .skip(page * pageSize)
      .limit(pageSize);

    // Get total count for pagination
    const total = await Illustration.countDocuments(query);

    res.status(200).json({
      success: true,
      data: illustrations,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching illustrations:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getIcons = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.pi) || 0;
    const pageSize = parseInt(req.query.ps) || 20;
    const keyword = req.query.kw || "";

    // Create query object
    let query = {};

    // Add keyword search if provided
    if (keyword) {
      query = {
        $or: [{ desc: { $regex: keyword, $options: "i" } }],
      };
    }

    // Find icons with pagination and sort by createdAt in descending order (newest first)
    const icons = await Icon.find(query)
      .sort({ createdAt: -1 })
      .skip(page * pageSize)
      .limit(pageSize);

    // Get total count for pagination
    const total = await Icon.countDocuments(query);

    res.status(200).json({
      success: true,
      data: icons,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching icons:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getThreeDImages = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.pi) || 0;
    const pageSize = parseInt(req.query.ps) || 20;
    const keyword = req.query.kw || "";

    // Create query object
    let query = {};

    // Add keyword search if provided
    if (keyword) {
      query = {
        $or: [{ desc: { $regex: keyword, $options: "i" } }],
      };
    }

    // Find 3D images with pagination and sort by createdAt in descending order (newest first)
    const threeDImages = await ThreeDImage.find(query)
      .sort({ createdAt: -1 })
      .skip(page * pageSize)
      .limit(pageSize);

    // Get total count for pagination
    const total = await ThreeDImage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: threeDImages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching 3D images:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getBackgrounds,
  getIllustrations,
  getIcons,
  getThreeDImages,
};
