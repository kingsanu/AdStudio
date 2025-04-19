/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const templateRoutes = require("./routes/templates");
const uploadedImageRoutes = require("./routes/uploadedImages");
const imageProcessingRoutes = require("./routes/imageProcessing");

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
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

const fs = require("fs");
// const path = require("path");
// const axios = require("axios");

// Connect to MongoDB
connectDB();

// Use routes
app.use("/api", templateRoutes);
app.use("/api", uploadedImageRoutes);
app.use("/api", imageProcessingRoutes);

// Get port from environment variables or use 4000 as default
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server has started! Open http://localhost:${PORT}`);
});
app.use(express.static(__dirname + "/public")); //Serves resources from public folder
app.use(express.static(__dirname + "/json")); //Serves resources from public folder

/**
 * Upload template endpoint
 * Saves template data to the json/templates directory
 * and updates templates.json if it's a custom template
 */
// app.post("/api/upload-template", async (req, res) => {
//   try {
//     const { type, filename, base64, templateName, templateDesc } = req.body;

//     // Upload template base64 to external media service
//     const templateUploadResponse = await axios.post(
//       "http://business.foodyqueen.com/admin/uploadmedia",
//       {
//         base64: base64,
//       }
//     );

//     // Generate and upload thumbnail base64
//     const thumbnailUploadResponse = await axios.post(
//       "http://business.foodyqueen.com/admin/uploadmedia",
//       {
//         base64: base64, // In a real app, you'd generate a proper thumbnail here
//       }
//     );

//     // Ensure the templates directory exists
//     const templatesDir = path.join(__dirname, "json", "templates");
//     if (!fs.existsSync(templatesDir)) {
//       fs.mkdirSync(templatesDir, { recursive: true });
//     }

//     // Handle nested directories in the filename (e.g., document/file-id)
//     const filePath = path.join(templatesDir, filename);
//     const fileDir = path.dirname(filePath);

//     // Create all directories in the path if they don't exist
//     if (!fs.existsSync(fileDir)) {
//       fs.mkdirSync(fileDir, { recursive: true });
//     }

//     // Write the template data to a file
//     fs.writeFileSync(filePath, base64);

//     // If this is a custom template with name and description, add it to templates.json
//     if (templateName && templateDesc) {
//       const templatesJsonPath = path.join(__dirname, "json", "templates.json");
//       let templatesData;

//       try {
//         // Read the existing templates.json file
//         const templatesJson = fs.readFileSync(templatesJsonPath, "utf8");
//         templatesData = JSON.parse(templatesJson);
//       } catch (err) {
//         // If file doesn't exist or is invalid, create a new structure
//         templatesData = { data: [] };
//       }

//       // Add the new template to the templates data using uploaded URLs
//       templatesData.data.unshift({
//         img: thumbnailUploadResponse.data.url,
//         data: templateUploadResponse.data.url,
//         desc: templateDesc,
//         pages: 1, // Assuming single page for now
//         name: templateName,
//         custom: true, // Mark as custom template
//       });

//       // Write the updated templates data back to the file
//       fs.writeFileSync(
//         templatesJsonPath,
//         JSON.stringify(templatesData, null, 2)
//       );
//     }

//     // Return success response
//     res.status(200).json({
//       success: true,
//       message: "Template saved successfully",
//       filePath: `/api/json/templates/${filename}`,
//       templateUrl: templateUploadResponse.data.url,
//       thumbnailUrl: thumbnailUploadResponse.data.url,
//     });
//   } catch (error) {
//     console.error("Error saving template:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to save template",
//       error: error.message,
//     });
//   }
// });

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

  return filteredArray.slice(startIndex, endIndex);
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
 * Get fonts
 */
app.get("/api/fonts", async (req, res) => {
  fs.readFile("./json/fonts.json", "utf8", (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const { ps, pi, kw } = req.query;
    res.send(
      paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw)
    );
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
    res.send(
      paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw)
    );
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
      console.error(err);
      res.send(null);
      return;
    }
    const { ps, pi, kw } = req.query;
    res.send(
      paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw)
    );
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
      console.error(err);
      res.send(null);
      return;
    }
    const { ps, pi, kw } = req.query;
    res.send(
      paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw)
    );
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
      console.error(err);
      res.send(null);
      return;
    }
    const { ps, pi, kw } = req.query;
    res.send(
      paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw)
    );
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
