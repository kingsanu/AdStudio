#!/usr/bin/env node

/* eslint-disable no-undef */
const path = require("path");
const fs = require("fs");

// Load environment variables
const dotenv = require("dotenv");
const result = dotenv.config({ path: path.join(__dirname, "../.env") });

if (result.error) {
  console.error("Error loading .env file:", result.error);
  process.exit(1);
}

const connectDB = require("../config/db");
const Font = require("../models/font");

/**
 * Import fonts from fonts.json into MongoDB
 */
async function importFonts() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected to MongoDB successfully!");

    // Read fonts.json file
    const fontsPath = path.join(__dirname, "../json/fonts.json");
    console.log("Reading fonts from:", fontsPath);

    if (!fs.existsSync(fontsPath)) {
      throw new Error(`Fonts file not found at ${fontsPath}`);
    }

    const fontsData = JSON.parse(fs.readFileSync(fontsPath, "utf8"));

    if (!fontsData.data || !Array.isArray(fontsData.data)) {
      throw new Error("Invalid fonts.json structure - expected data array");
    }

    console.log(`Found ${fontsData.data.length} font families to import`);

    // Clear existing fonts (optional - comment out if you want to preserve existing data)
    console.log("Clearing existing fonts...");
    await Font.deleteMany({});

    // Import fonts in batches for better performance
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < fontsData.data.length; i += batchSize) {
      const batch = fontsData.data.slice(i, i + batchSize);

      try {
        // Prepare font documents
        const fontDocuments = batch.map((fontData) => ({
          family: fontData.family,
          img: fontData.img, // Include preview image if available
          styles: fontData.styles || [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // Insert batch
        await Font.insertMany(fontDocuments, { ordered: false });
        imported += batch.length;
        console.log(
          `Imported batch ${Math.floor(i / batchSize) + 1}: ${
            batch.length
          } fonts (Total: ${imported})`
        );
      } catch (batchError) {
        console.error(
          `Error importing batch ${Math.floor(i / batchSize) + 1}:`,
          batchError.message
        );
        errors += batch.length;
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`Successfully imported: ${imported} font families`);
    console.log(`Errors: ${errors}`);
    console.log(`Total processed: ${imported + errors}`);

    // Verify the import
    const totalFonts = await Font.countDocuments();
    console.log(`Total fonts in database: ${totalFonts}`);

    // Show some sample fonts
    const sampleFonts = await Font.find().limit(5).select("family styles img");
    console.log("\nSample imported fonts:");
    sampleFonts.forEach((font) => {
      console.log(`- ${font.family} (${font.styles.length} styles)${font.img ? ' [has preview image]' : ''}`);
    });

    console.log("\nFont import completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error importing fonts:", error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importFonts();
}

module.exports = importFonts;
