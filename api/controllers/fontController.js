const Font = require("../models/font");

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
 * Get all fonts with pagination and filtering
 */
const getFonts = async (req, res) => {
  try {
    const { ps = 30, pi = 0, kw = "" } = req.query;

    // Build query for filtering
    let query = { isActive: true };
    if (kw && kw !== "") {
      query.$or = [
        { family: { $regex: kw, $options: "i" } },
        { "styles.name": { $regex: kw, $options: "i" } },
        { "styles.style": { $regex: kw, $options: "i" } },
      ];
    }

    const fonts = await Font.find(query)
      .select("family styles")
      .sort("family")
      .lean(); // Use lean() for better performance

    // Transform data to match the expected format from fonts.json
    const transformedFonts = fonts.map((font) => ({
      family: font.family,
      styles: font.styles.map((style) => ({
        name: style.name,
        style: style.style,
        url: style.url,
      })),
    }));

    const result = paginateData(transformedFonts, +ps, +pi, kw);
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

    const font = await Font.findOne({
      family: { $regex: new RegExp(`^${family}$`, "i") },
      isActive: true,
    }).lean();

    if (!font) {
      return res.status(404).json({ error: "Font not found" });
    }

    const transformedFont = {
      family: font.family,
      styles: font.styles.map((style) => ({
        name: style.name,
        style: style.style,
        url: style.url,
      })),
    };

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
  getFontByFamily,
  createFont,
  updateFont,
  deleteFont,
};
