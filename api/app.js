/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Load environment variables
const path = require("path");
const dotenv = require("dotenv");
const result = dotenv.config();

if (result.error) {
  console.error("Error loading .env file:", result.error);
} else {
  console.log("Environment variables loaded successfully");
  console.log(
    "MONGODB_URI:",
    process.env.MONGODB_URI ? "Defined" : "Not defined"
  );
  console.log("PORT:", process.env.PORT);
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const templateRoutes = require("./routes/templates");
const textTemplateRoutes = require("./routes/textTemplates");
const uploadedImageRoutes = require("./routes/uploadedImages");
const imageProcessingRoutes = require("./routes/imageProcessing");
const videoProcessingRoutes = require("./routes/videoProcessing");
const whatsappSettingsRoutes = require("./routes/whatsappSettings");
const mediaRoutes = require("./routes/media");
const mediaUploadRoutes = require("./routes/mediaUpload");
const imageProxyRoutes = require("./routes/imageProxy");
const kioskRoutes = require("./routes/kiosk");
const liveMenuRoutes = require("./routes/liveMenu");
const customerRoutes = require("./routes/customers");
const campaignRoutes = require("./routes/campaigns");
const couponCampaignRoutes = require("./routes/couponCampaigns");
const outletRoutes = require("./routes/outlets");
const fontRoutes = require("./routes/fonts");

const app = express();
// Increase JSON body size limit
app.use(express.json({ limit: "100mb" }));

// Also increase URL-encoded body size limit if you're using it
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// Configure CORS to allow connections from adstudio.foodyqueen.com
app.use(
  cors({
    origin: [
      "http://adstudio.foodyqueen.com",
      "https://adstudio.foodyqueen.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

const fs = require("fs");

// Connect to MongoDB
connectDB();

// Use routes
app.use("/api", templateRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api", textTemplateRoutes);
app.use("/api", uploadedImageRoutes);
app.use("/api", imageProcessingRoutes);
app.use("/api", videoProcessingRoutes);
app.use("/api", whatsappSettingsRoutes);
app.use("/api/media/upload", mediaUploadRoutes);
app.use("/api", imageProxyRoutes);
app.use("/api", kioskRoutes);
app.use("/api", liveMenuRoutes);
app.use("/api", customerRoutes);
app.use("/api", campaignRoutes);
app.use("/api", couponCampaignRoutes);
app.use("/api", outletRoutes);
app.use("/api/fonts", fontRoutes);

// Get port from environment variables or use 4000 as default
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server has started! Open http://localhost:${PORT}`);
});

app.use(express.static(__dirname + "/public")); //Serves resources from public folder
app.use(express.static(__dirname + "/json")); //Serves resources from public folder
app.use('/temp', express.static(__dirname + "/temp")); //Serves video output files

function paginateArrayWithFilter(array, size = 30, index = 0, keyword = "") {
  const startIndex = index * size;
  const endIndex = startIndex + size;
  let filteredArray = array;

  if (keyword && keyword !== "") {
    const lowerCaseKeyword = keyword.toLowerCase();
    filteredArray = array.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(lowerCaseKeyword)
    );
  }

  const paginatedData = filteredArray.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      total: filteredArray.length,
      page: index,
      pageSize: size,
      hasMore: endIndex < filteredArray.length,
    },
  };
}

function handleFontStyleName(fontName, style) {
  if (style === "regular") return fontName + " Regular";

  const fontStrong = parseInt(style);
  if (style.includes("italic")) {
    return fontName + (fontStrong ? ` Italic Bold ${fontStrong}` : " Italic");
  }

  if (!fontStrong) return fontName + " Regular";
  return fontName + ` Bold ${fontStrong}`;
}

function searchKeywords(query, data) {
  if (!query) return [];
  const lowerCaseQuery = query.toLowerCase();
  const uniqueKeywords = new Set();

  data.forEach((item) => {
    const lowerCaseDesc = item.desc.toLowerCase();
    const keywords = lowerCaseDesc.split(" ");

    keywords.forEach((keyword) => {
      if (keyword.includes(lowerCaseQuery)) {
        uniqueKeywords.add(keyword);
      }
    });
  });

  return Array.from(uniqueKeywords);
}

/**
 * Get draft fonts
 */
app.get("/api/draft-fonts", async (req, res) => {
  console.log(req.query);
  fs.readFile("./json/draft-fonts.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const filtered = JSON.parse(jsonString).items.map((font) => {
      return {
        family: font.family,
        styles: Object.keys(font.files).map((style) => {
          return {
            name: handleFontStyleName(font.family, style),
            style,
            url: font.files[style],
          };
        }),
      };
    });
    res.send({ data: filtered });
  });
});

/**
 * Search templates
 */
// app.get("/api/templates", async (req, res) => {
//   try {
//     const { ps = 30, pi = 0, kw = "" } = req.query;
//     const templates = await Template.find()
//       .select("title description templateUrl thumbnailUrl tags createdAt")
//       .sort("-createdAt");

//     res.send(paginateArrayWithFilter(templates, +ps, +pi, kw));
//   } catch (err) {
//     console.error(err);
//     res.status(500).send(null);
//   }
// });

/**
 * Search template keywords
 */
app.get("/api/template-suggestion", async (req, res) => {
  fs.readFile("./json/templates.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const rs = searchKeywords(req.query.kw, JSON.parse(jsonString).data);
    res.send(rs.map((kw, idx) => ({ id: idx + 1, name: kw })));
  });
});

/**
 * Search text templates
 */
app.get("/api/texts", async (req, res) => {
  fs.readFile("./json/texts.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const { ps, pi, kw } = req.query;
    const result = paginateArrayWithFilter(
      JSON.parse(jsonString).data,
      +ps,
      +pi,
      kw
    );
    res.json(result);
  });
});

/**
 * Search text keywords
 */
app.get("/api/text-suggestion", async (req, res) => {
  fs.readFile("./json/texts.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const rs = searchKeywords(req.query.kw, JSON.parse(jsonString).data);
    res.send(rs.map((kw, idx) => ({ id: idx + 1, name: kw })));
  });
});

/**
 * Search frames
 */
app.get("/api/frames", async (req, res) => {
  fs.readFile("./json/frames.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error("Error reading frames.json:", err);
      res.send(null);
      return;
    }
    try {
      const jsonData = JSON.parse(jsonString);
      console.log(
        "Frames data loaded, count:",
        jsonData.data ? jsonData.data.length : 0
      );
      const { ps = 30, pi = 0, kw = "" } = req.query;
      const result = paginateArrayWithFilter(jsonData.data, +ps, +pi, kw);
      res.json(result);
    } catch (parseErr) {
      console.error("Error parsing frames.json:", parseErr);
      res.json({
        data: [],
        pagination: {
          total: 0,
          page: +pi,
          pageSize: +ps,
          hasMore: false,
        },
      });
    }
  });
});

/**
 * Search frame keywords
 */
app.get("/api/frame-suggestion", async (req, res) => {
  fs.readFile("./json/frames.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const rs = searchKeywords(req.query.kw, JSON.parse(jsonString).data);
    res.send(rs.map((kw, idx) => ({ id: idx + 1, name: kw })));
  });
});

/**
 * Search shapes
 */
app.get("/api/shapes", async (req, res) => {
  fs.readFile("./json/shapes.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error("Error reading shapes.json:", err);
      res.send(null);
      return;
    }
    try {
      const jsonData = JSON.parse(jsonString);
      console.log(
        "Shapes data loaded, count:",
        jsonData.data ? jsonData.data.length : 0
      );
      const { ps = 30, pi = 0, kw = "" } = req.query;
      const result = paginateArrayWithFilter(jsonData.data, +ps, +pi, kw);
      res.json(result);
    } catch (parseErr) {
      console.error("Error parsing shapes.json:", parseErr);
      res.json({
        data: [],
        pagination: {
          total: 0,
          page: +pi,
          pageSize: +ps,
          hasMore: false,
        },
      });
    }
  });
});

/**
 * Search shape keywords
 */
app.get("/api/shape-suggestion", async (req, res) => {
  fs.readFile("./json/shapes.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const rs = searchKeywords(req.query.kw, JSON.parse(jsonString).data);
    res.send(rs.map((kw, idx) => ({ id: idx + 1, name: kw })));
  });
});

/**
 * Search images
 */
app.get("/api/images", async (req, res) => {
  fs.readFile("./json/images.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error("Error reading images.json:", err);
      res.send(null);
      return;
    }
    try {
      const jsonData = JSON.parse(jsonString);
      console.log(
        "Images data loaded, count:",
        jsonData.data ? jsonData.data.length : 0
      );
      const { ps = 30, pi = 0, kw = "" } = req.query;
      const result = paginateArrayWithFilter(jsonData.data, +ps, +pi, kw);
      res.json(result);
    } catch (parseErr) {
      console.error("Error parsing images.json:", parseErr);
      res.json({
        data: [],
        pagination: {
          total: 0,
          page: +pi,
          pageSize: +ps,
          hasMore: false,
        },
      });
    }
  });
});

/**
 * Search image keywords
 */
app.get("/api/image-suggestion", async (req, res) => {
  fs.readFile("./json/images.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const rs = searchKeywords(req.query.kw, JSON.parse(jsonString).data);
    res.send(rs.map((kw, idx) => ({ id: idx + 1, name: kw })));
  });
});

/**
 * Emergency save endpoint for critical sync operations
 * This endpoint is called when the page is about to be unloaded
 * and we need to save data using sendBeacon
 */
app.post("/api/emergency-save", (req, res) => {
  try {
    console.log("Emergency save request received");

    // For now, just acknowledge the save attempt
    // In a production environment, you would implement
    // actual data persistence logic here

    const { data, action } = req.body;

    if (data && action === "emergency_save") {
      console.log("Emergency save data received, length:", data.length);
      // Store in temporary location for recovery
      // This could be implemented with Redis, file system, or database
    }

    // Return success immediately for beacon requests
    res.status(200).json({
      success: true,
      message: "Emergency save acknowledged",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Emergency save error:", error);
    res.status(500).json({
      success: false,
      error: "Emergency save failed",
    });
  }
});

module.exports = app;
