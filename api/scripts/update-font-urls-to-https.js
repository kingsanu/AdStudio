#!/usr/bin/env node

/* eslint-disable no-undef */
const path = require("path");

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
 * Update all font URLs from HTTP to HTTPS
 */
async function updateFontUrlsToHttps() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected to MongoDB successfully!");

    // Find all fonts with HTTP URLs
    console.log("Finding fonts with HTTP URLs...");
    const fontsWithHttpUrls = await Font.find({
      "styles.url": { $regex: /^http:\/\//, $options: "i" }
    });

    console.log(`Found ${fontsWithHttpUrls.length} fonts with HTTP URLs`);

    if (fontsWithHttpUrls.length === 0) {
      console.log("No fonts with HTTP URLs found. All URLs are already HTTPS or other protocols.");
      process.exit(0);
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Update each font
    for (const font of fontsWithHttpUrls) {
      try {
        console.log(`Updating font: ${font.family}`);
        
        // Update each style URL from HTTP to HTTPS
        let hasChanges = false;
        font.styles.forEach((style) => {
          if (style.url && style.url.startsWith('http://')) {
            const oldUrl = style.url;
            style.url = style.url.replace(/^http:\/\//, 'https://');
            console.log(`  - Updated style "${style.name}": ${oldUrl} -> ${style.url}`);
            hasChanges = true;
          }
        });

        // Save if there were changes
        if (hasChanges) {
          font.updatedAt = new Date();
          await font.save();
          updatedCount++;
          console.log(`  ✓ Updated font: ${font.family}`);
        }

      } catch (error) {
        console.error(`  ✗ Error updating font ${font.family}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n=== Update Summary ===");
    console.log(`Successfully updated: ${updatedCount} fonts`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${updatedCount + errorCount}`);

    // Verify the update
    const remainingHttpFonts = await Font.find({
      "styles.url": { $regex: /^http:\/\//, $options: "i" }
    });

    console.log(`Remaining fonts with HTTP URLs: ${remainingHttpFonts.length}`);

    if (remainingHttpFonts.length > 0) {
      console.log("\nRemaining HTTP URLs:");
      remainingHttpFonts.forEach((font) => {
        font.styles.forEach((style) => {
          if (style.url && style.url.startsWith('http://')) {
            console.log(`- ${font.family} (${style.name}): ${style.url}`);
          }
        });
      });
    }

    // Show some sample updated fonts
    const sampleUpdatedFonts = await Font.find({
      "styles.url": { $regex: /^https:\/\//, $options: "i" }
    }).limit(5);

    console.log("\nSample fonts with HTTPS URLs:");
    sampleUpdatedFonts.forEach((font) => {
      const httpsStyles = font.styles.filter(style => style.url && style.url.startsWith('https://'));
      if (httpsStyles.length > 0) {
        console.log(`- ${font.family}: ${httpsStyles[0].url}`);
      }
    });

    console.log("\nFont URL update completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Error updating font URLs:", error);
    process.exit(1);
  }
}

// Dry run mode - shows what would be updated without making changes
async function dryRunUpdateFontUrls() {
  try {
    console.log("=== DRY RUN MODE ===");
    console.log("This will show what would be updated without making actual changes.\n");
    
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected to MongoDB successfully!");

    // Find all fonts with HTTP URLs
    const fontsWithHttpUrls = await Font.find({
      "styles.url": { $regex: /^http:\/\//, $options: "i" }
    });

    console.log(`Found ${fontsWithHttpUrls.length} fonts with HTTP URLs that would be updated:`);

    if (fontsWithHttpUrls.length === 0) {
      console.log("No fonts with HTTP URLs found. All URLs are already HTTPS or other protocols.");
      process.exit(0);
    }

    fontsWithHttpUrls.forEach((font) => {
      console.log(`\nFont: ${font.family}`);
      font.styles.forEach((style) => {
        if (style.url && style.url.startsWith('http://')) {
          const newUrl = style.url.replace(/^http:\/\//, 'https://');
          console.log(`  - ${style.name}: ${style.url} -> ${newUrl}`);
        }
      });
    });

    console.log(`\nTotal fonts that would be updated: ${fontsWithHttpUrls.length}`);
    console.log("\nTo actually perform the update, run: node scripts/update-font-urls-to-https.js --execute");
    
    process.exit(0);

  } catch (error) {
    console.error("Error in dry run:", error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const executeMode = args.includes('--execute');
const dryRunMode = args.includes('--dry-run') || !executeMode;

// Run the appropriate function
if (require.main === module) {
  if (executeMode) {
    console.log("Starting font URL update to HTTPS...\n");
    updateFontUrlsToHttps();
  } else {
    dryRunUpdateFontUrls();
  }
}

module.exports = { updateFontUrlsToHttps, dryRunUpdateFontUrls };
