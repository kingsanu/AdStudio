const Font = require("../models/font");
const fontCache = require("../utils/fontCache");

/**
 * Paginate array with filter functionality
 */
function paginateData(data, size = 30, index = 0, keyword = "") {
  const startIndex = index * size;
  const endIndex = startIndex + size;
  let filteredData = data;

  if (keyword && keyword !== "") {
    const lowerCaseKeyword = keyword.toLowerCase();
    filteredData = data.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(lowerCaseKeyword)
    );
  }

  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      total: filteredData.length,
      page: index,
      pageSize: size,
      hasMore: endIndex < filteredData.length,
    },
  };
}

/**
 * Get all fonts at once (no pagination)
 */
const getAllFonts = async (req, res) => {
  try {
    // Check cache first
    const cachedResult = fontCache.getAllFonts();
    if (cachedResult) {
      console.log(`[FontController] Serving all fonts from cache (${cachedResult.length} fonts)`);
      return res.json({
        data: cachedResult,
        total: cachedResult.length,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[FontController] Fetching all fonts from database`);
    const fonts = await Font.find({ isActive: true })
      .select("family styles img")
      .sort("family")
      .lean(); // Use lean() for better performance

    // Transform data to match the expected format
    const transformedFonts = fonts.map((font) => ({
      family: font.family,
      img: font.img, // Include preview image
      styles: font.styles.map((style) => ({
        name: style.name,
        style: style.style,
        url: style.url,
      })),
    }));

    // Cache all fonts for 3 days
    fontCache.setAllFonts(transformedFonts);
    console.log(`[FontController] Cached ${transformedFonts.length} fonts for 3 days`);

    res.json({
      data: transformedFonts,
      total: transformedFonts.length,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching all fonts:", error);
    res.status(500).json({ error: "Failed to fetch fonts" });
  }
};

/**
 * Get fonts with pagination and filtering (legacy endpoint)
 */
const getFonts = async (req, res) => {
  try {
    const { ps = 30, pi = 0, kw = "", popular = false } = req.query;

    // Check cache first
    const cacheQuery = { ps, pi, kw, popular };
    const cachedResult = fontCache.getFontList(cacheQuery);
    if (cachedResult) {
      console.log(`[FontController] Serving fonts from cache for query:`, cacheQuery);
      return res.json(cachedResult);
    }

    // Build query for filtering
    let query = { isActive: true };
    if (kw && kw !== "") {
      query.$or = [
        { family: { $regex: kw, $options: "i" } },
        { "styles.name": { $regex: kw, $options: "i" } },
        { "styles.style": { $regex: kw, $options: "i" } },
      ];
    }

    console.log(`[FontController] Fetching fonts from database for query:`, cacheQuery);

    // Define popular font families for quick loading
    const popularFontFamilies = [
      'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
      'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Lucida Console',
      'Tahoma', 'Courier New', 'Palatino', 'Garamond', 'Bookman',
      'Avant Garde', 'Calibri', 'Cambria', 'Candara', 'Century Gothic',
      'Franklin Gothic Medium'
    ];

    let sortCriteria = "family";
    if (popular === "true" || popular === true) {
      // For popular fonts, prioritize the popular families first
      query.family = { $in: popularFontFamilies };
    }

    const fonts = await Font.find(query)
      .select("family styles img")
      .sort(sortCriteria)
      .lean(); // Use lean() for better performance

    // Transform data to match the expected format from fonts.json
    const transformedFonts = fonts.map((font) => ({
      family: font.family,
      img: font.img, // Include preview image
      styles: font.styles.map((style) => ({
        name: style.name,
        style: style.style,
        url: style.url,
      })),
    }));

    const result = paginateData(transformedFonts, +ps, +pi, kw);
    
    // Cache the result
    fontCache.setFontList(cacheQuery, result);
    console.log(`[FontController] Cached fonts result for query:`, cacheQuery);
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching fonts:", error);
    res.status(500).json({ error: "Failed to fetch fonts" });
  }
};

/**
 * Get a specific font by family name
 */
const getFontByFamily = async (req, res) => {
  try {
    const { family } = req.params;

    // Check cache first
    const cachedResult = fontCache.getFontFamily(family);
    if (cachedResult) {
      console.log(`[FontController] Serving font family '${family}' from cache`);
      return res.json(cachedResult);
    }

    console.log(`[FontController] Fetching font family '${family}' from database`);
    const font = await Font.findOne({
      family: { $regex: new RegExp(`^${family}$`, "i") },
      isActive: true,
    }).lean();

    if (!font) {
      return res.status(404).json({ error: "Font not found" });
    }

    const transformedFont = {
      family: font.family,
      img: font.img, // Include preview image
      styles: font.styles.map((style) => ({
        name: style.name,
        style: style.style,
        url: style.url,
      })),
    };

    // Cache the result
    fontCache.setFontFamily(family, transformedFont);
    console.log(`[FontController] Cached font family '${family}'`);

    res.json(transformedFont);
  } catch (error) {
    console.error("Error fetching font:", error);
    res.status(500).json({ error: "Failed to fetch font" });
  }
};

/**
 * Create a new font
 */
const createFont = async (req, res) => {
  try {
    const { family, styles } = req.body;

    if (!family || !styles || !Array.isArray(styles)) {
      return res.status(400).json({
        error: "Family and styles array are required",
      });
    }

    // Check if font family already exists
    const existingFont = await Font.findOne({ family });
    if (existingFont) {
      return res.status(409).json({
        error: "Font family already exists",
      });
    }

    const font = new Font({
      family,
      styles,
    });

    await font.save();
    res.status(201).json(font);
  } catch (error) {
    console.error("Error creating font:", error);
    res.status(500).json({ error: "Failed to create font" });
  }
};

/**
 * Update a font
 */
const updateFont = async (req, res) => {
  try {
    const { id } = req.params;
    const { family, styles, isActive } = req.body;

    const font = await Font.findById(id);
    if (!font) {
      return res.status(404).json({ error: "Font not found" });
    }

    if (family) font.family = family;
    if (styles) font.styles = styles;
    if (typeof isActive === "boolean") font.isActive = isActive;

    await font.save();
    res.json(font);
  } catch (error) {
    console.error("Error updating font:", error);
    res.status(500).json({ error: "Failed to update font" });
  }
};

/**
 * Delete a font (soft delete by setting isActive to false)
 */
const deleteFont = async (req, res) => {
  try {
    const { id } = req.params;

    const font = await Font.findById(id);
    if (!font) {
      return res.status(404).json({ error: "Font not found" });
    }

    font.isActive = false;
    await font.save();

    res.json({ message: "Font deleted successfully" });
  } catch (error) {
    console.error("Error deleting font:", error);
    res.status(500).json({ error: "Failed to delete font" });
  }
};

module.exports = {
  getFonts,
  getAllFonts,
  getFontByFamily,
  createFont,
  updateFont,
  deleteFont,
};
