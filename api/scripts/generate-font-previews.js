#!/usr/bin/env node

/**
 * Generate font preview images using Canvas API
 * This script would create actual font preview images
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const Font = require('../models/font');
const connectDB = require('../config/db');

async function generateFontPreviews() {
  try {
    await connectDB();
    
    // Create previews directory if it doesn't exist
    const previewsDir = path.join(__dirname, '../public/font-previews');
    if (!fs.existsSync(previewsDir)) {
      fs.mkdirSync(previewsDir, { recursive: true });
    }

    const fonts = await Font.find({ isActive: true });
    
    for (const font of fonts) {
      try {
        // Create canvas
        const canvas = createCanvas(200, 32);
        const ctx = canvas.getContext('2d');
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 200, 32);
        
        // Set font (would need to load the actual font file)
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial'; // Fallback - would use actual font
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Draw font name
        ctx.fillText(font.family, 8, 16);
        
        // Save image
        const fileName = `${font.family.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
        const filePath = path.join(previewsDir, fileName);
        
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);
        
        // Update font document with preview image URL
        font.img = `/font-previews/${fileName}`;
        await font.save();
        
        console.log(`Generated preview for ${font.family}`);
        
      } catch (error) {
        console.error(`Error generating preview for ${font.family}:`, error);
      }
    }
    
    console.log('Font preview generation completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error generating font previews:', error);
    process.exit(1);
  }
}

// Note: This requires 'canvas' package: npm install canvas
// For now, this is just a template showing how it would work

module.exports = generateFontPreviews;

if (require.main === module) {
  console.log('Font preview generator (template)');
  console.log('To implement this, you would need:');
  console.log('1. npm install canvas');
  console.log('2. Load actual font files for rendering');
  console.log('3. Set up proper image hosting/serving');
  // generateFontPreviews();
}
