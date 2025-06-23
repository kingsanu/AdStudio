/**
 * Image Inspector - Check preserved image files for debugging
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function inspectImages() {
  const uploadsDir = path.join(__dirname, 'temp', 'uploads');
  const outputDir = path.join(__dirname, 'temp', 'output');
  
  console.log('🔍 INSPECTING PRESERVED IMAGE FILES');
  console.log('==================================');
  
  // Check uploads directory
  if (fs.existsSync(uploadsDir)) {
    const uploadFiles = fs.readdirSync(uploadsDir);
    const imageFiles = uploadFiles.filter(f => f.match(/\.(png|jpg|jpeg)$/i));
    
    console.log(`📂 Found ${imageFiles.length} image files in uploads:`);
    
    for (const file of imageFiles) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      // Calculate MD5 hash to detect identical files
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      console.log(`📸 ${file}:`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   MD5: ${hash}`);
      console.log(`   Modified: ${stats.mtime.toISOString()}`);
      console.log('');
    }
    
    // Group files by hash to find duplicates
    const hashGroups = {};
    for (const file of imageFiles) {
      const filePath = path.join(uploadsDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      if (!hashGroups[hash]) {
        hashGroups[hash] = [];
      }
      hashGroups[hash].push(file);
    }
    
    console.log('🔍 DUPLICATE ANALYSIS:');
    Object.keys(hashGroups).forEach(hash => {
      const files = hashGroups[hash];
      if (files.length > 1) {
        console.log(`❌ IDENTICAL FILES (Hash: ${hash.substring(0, 8)}...):`);
        files.forEach(file => console.log(`   - ${file}`));
      } else {
        console.log(`✅ UNIQUE FILE: ${files[0]} (Hash: ${hash.substring(0, 8)}...)`);
      }
    });
    
  } else {
    console.log('📂 No uploads directory found');
  }
  
  console.log('');
  
  // Check output directory
  if (fs.existsSync(outputDir)) {
    const outputFiles = fs.readdirSync(outputDir);
    const videoFiles = outputFiles.filter(f => f.match(/\.(mp4|avi|mov)$/i));
    
    console.log(`🎬 Found ${videoFiles.length} video files in output:`);
    
    for (const file of videoFiles) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      
      console.log(`🎥 ${file}:`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Modified: ${stats.mtime.toISOString()}`);
      console.log(`   Full path: ${filePath}`);
      console.log('');
    }
  } else {
    console.log('📂 No output directory found');
  }
}

// Function to clean up old files (optional)
function cleanupOldFiles(olderThanMinutes = 30) {
  const uploadsDir = path.join(__dirname, 'temp', 'uploads');
  const outputDir = path.join(__dirname, 'temp', 'output');
  const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
  
  console.log(`🧹 CLEANING UP FILES OLDER THAN ${olderThanMinutes} MINUTES`);
  console.log('================================================');
  
  [uploadsDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    let cleaned = 0;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed: ${file}`);
          cleaned++;
        } catch (error) {
          console.error(`❌ Could not remove ${file}:`, error.message);
        }
      }
    });
    
    console.log(`📁 ${path.basename(dir)}: ${cleaned} files cleaned up`);
  });
}

// Run inspection
inspectImages();

// Uncomment to clean up old files:
// cleanupOldFiles(30);
