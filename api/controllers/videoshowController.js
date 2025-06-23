const videoshow = require('videoshow');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const axios = require('axios');
const { CLOUD_STORAGE, EXTERNAL_APIS } = require('../config/constants');

// Configure fluent-ffmpeg paths for videoshow
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Access fluent-ffmpeg through videoshow and set paths
const ffmpeg = videoshow.ffmpeg;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Add a simple queue to prevent concurrent processing
const processingQueue = new Set();

/**
 * Calculate MD5 hash of a file
 */
function calculateMD5(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Enhanced Video Controller using videoshow library
 * Includes safeguards to prevent concurrent processing loops
 */
const videoshowController = {  createSlideshowVideo: async (req, res) => {
    const requestId = uuidv4();
    
    // Check if we're already processing too many requests
    if (processingQueue.size >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Server is busy processing other video requests. Please try again in a moment.',
        error: 'Too many concurrent requests'
      });
    }
    
    processingQueue.add(requestId);
    
    try {
      console.log(`=== Videoshow processing request ${requestId} ===`);
      console.log("Request files:", req.files ? req.files.length : 0);
      console.log("Request body:", req.body);
      
      // 🔍 ENHANCED DEBUGGING - Log all file details
      if (req.files) {
        console.log("📂 DETAILED FILE ANALYSIS:");
        req.files.forEach((file, index) => {
          console.log(`  File ${index + 1}:`);
          console.log(`    - Original name: ${file.originalname}`);
          console.log(`    - Field name: ${file.fieldname}`);
          console.log(`    - Filename: ${file.filename}`);
          console.log(`    - Path: ${file.path}`);
          console.log(`    - Size: ${file.size} bytes`);
          console.log(`    - Mimetype: ${file.mimetype}`);
          
          // Check if file actually exists
          if (fs.existsSync(file.path)) {
            const stats = fs.statSync(file.path);
            console.log(`    - File exists: YES (${stats.size} bytes on disk)`);
          } else {
            console.log(`    - File exists: NO ❌`);
          }
        });
      } else {
        console.log("❌ NO FILES RECEIVED IN REQUEST");
      }

      // Validate request
      if (!req.files || req.files.length === 0) {
        console.log("❌ VALIDATION FAILED: No images provided");
        return res.status(400).json({
          success: false,
          message: 'No images provided',
          error: 'At least one image is required'
        });
      }      // Process and validate images with enhanced logging
      const imagePaths = [];
      const imageHashes = [];
      console.log("🔍 PROCESSING AND VALIDATING IMAGES:");
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const filePath = file.path;
        
        console.log(`\n  Processing file ${i + 1}/${req.files.length}:`);
        console.log(`    - Path: ${filePath}`);
        
        // Validate file exists and is an image
        if (!fs.existsSync(filePath)) {
          console.log(`    - Status: ❌ FILE NOT FOUND`);
          continue;
        }
        
        const fileStats = fs.statSync(filePath);
        console.log(`    - File size: ${fileStats.size} bytes`);
        
        // Calculate MD5 hash
        const md5Hash = calculateMD5(filePath);
        console.log(`    - MD5 hash: ${md5Hash}`);
        
        const fileExtension = path.extname(file.originalname).toLowerCase();
        console.log(`    - Extension: ${fileExtension}`);
        
        if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension)) {
          console.log(`    - Status: ❌ INVALID FILE TYPE`);
          continue;
        }
        
        console.log(`    - Status: ✅ VALID IMAGE ADDED TO PROCESSING LIST`);
        imagePaths.push(filePath);
        imageHashes.push(md5Hash);
      }      console.log(`\n📊 FINAL IMAGE PROCESSING SUMMARY:`);
      console.log(`   - Total files received: ${req.files.length}`);
      console.log(`   - Valid images for processing: ${imagePaths.length}`);
      
      // Analyze image uniqueness by hash
      const uniqueHashes = new Set(imageHashes);
      console.log(`   - Unique images (by MD5): ${uniqueHashes.size}`);
      
      if (imageHashes.length > 1 && uniqueHashes.size === 1) {
        console.log(`⚠️  WARNING: ALL IMAGES ARE IDENTICAL! This will result in a video with repeated frames.`);
        console.log(`   - All images have the same MD5 hash: ${imageHashes[0]}`);
      } else if (uniqueHashes.size < imageHashes.length) {
        console.log(`⚠️  WARNING: Some images are duplicates!`);
        const hashCounts = {};
        imageHashes.forEach(hash => {
          hashCounts[hash] = (hashCounts[hash] || 0) + 1;
        });
        Object.entries(hashCounts).forEach(([hash, count]) => {
          if (count > 1) {
            console.log(`   - Hash ${hash} appears ${count} times`);
          }
        });
      } else {
        console.log(`✅ All images are unique - video will have varied content`);
      }
      
      if (imagePaths.length === 0) {
        console.log("❌ VALIDATION FAILED: No valid images found after processing");
        return res.status(400).json({
          success: false,
          message: 'No valid images found',
          error: 'Please provide valid image files (JPG, PNG, GIF, BMP)'
        });
      }

      console.log(`\n🎬 STARTING VIDEO CREATION WITH ${imagePaths.length} IMAGES:`);
      imagePaths.forEach((path, index) => {
        console.log(`   ${index + 1}. ${path}`);
      });

      // Parse options from request
      const duration = parseFloat(req.body.duration) || 2; // seconds per image
      const transition = req.body.transition || 'fade';
      const outputName = req.body.outputName || `slideshow_${uuidv4()}`;      // Configure videoshow options - optimized configuration
      const options = {
        fps: 30,
        loop: duration, // duration in seconds for EACH image
        transition: transition === 'fade', // Re-enable transitions
        transitionDuration: 0.5, // Shorter transition for better effect
        videoBitrate: 1024,
        videoCodec: 'libx264',
        size: '1280x720',
        format: 'mp4',
        pixelFormat: 'yuv420p',
      };

      console.log("Creating video with options:", options);
      console.log(`Each of the ${imagePaths.length} images will be shown for ${duration} seconds`);
      console.log("Expected total duration:", imagePaths.length * duration, "seconds");
      
      // Debug: log all image paths
      console.log("All image paths to be processed:");
      imagePaths.forEach((path, index) => {
        console.log(`  ${index + 1}. ${path}`);
      });

      // Ensure output directory exists
      const outputDir = path.join(__dirname, '..', 'temp', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `${outputName}.mp4`);
      console.log("Output path:", outputPath);

      // Create video using videoshow
      const videoInfo = await createVideoWithVideoshow(imagePaths, outputPath, options, requestId);      // Upload to cloud storage or serve locally
      let finalUrl = null;
      let shouldCleanupOutput = false;
      
      try {
        console.log("📤 Attempting to upload to cloud storage...");
        finalUrl = await uploadToCloud(outputPath, `${outputName}.mp4`);
        console.log(`✅ Video uploaded to cloud: ${finalUrl}`);
        shouldCleanupOutput = true; // Only cleanup if successfully uploaded
      } catch (uploadError) {
        console.error("❌ Cloud upload failed:", uploadError.message);
        // Fallback to local serving
        finalUrl = `http://localhost:${process.env.PORT || 4000}/temp/output/${path.basename(outputPath)}`;
        console.log("Using local fallback URL:", finalUrl);
        shouldCleanupOutput = false; // Keep file for local serving
      }      // 🚫 CLEANUP DISABLED FOR DEBUGGING - Keep input files for inspection
      console.log("🔍 DEBUGGING MODE: Input files preserved for inspection:");
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        if (fs.existsSync(imagePath)) {
          const stats = fs.statSync(imagePath);
          const hash = imageHashes[i] || calculateMD5(imagePath);
          console.log(`📁 Preserved: ${imagePath} (${stats.size} bytes, MD5: ${hash})`);
        }
      }
      // Uncomment below to re-enable cleanup:
      /*
      for (const imagePath of imagePaths) {
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Cleaned up input file: ${imagePath}`);
          }
        } catch (cleanupError) {
          console.warn(`Warning: Could not clean up ${imagePath}:`, cleanupError.message);
        }
      }
      */      // 🚫 OUTPUT FILE CLEANUP DISABLED FOR DEBUGGING
      if (shouldCleanupOutput) {
        console.log("🔍 DEBUGGING MODE: Output file preserved for inspection:");
        console.log(`📁 Output file kept: ${outputPath}`);
        // Uncomment below to re-enable cleanup:
        /*
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
            console.log(`Cleaned up output file: ${outputPath}`);
          }
        } catch (cleanupError) {
          console.warn(`Warning: Could not clean up output file:`, cleanupError.message);
        }
        */
      } else {
        console.log(`📁 Keeping output file locally: ${outputPath}`);
      }// Send response
      const response = {
        message: "Video slideshow created successfully",
        success: true,
        videoUrl: finalUrl,
        mediaUrl: finalUrl,
        mediaType: "video",
        cloudUrl: finalUrl,
        duration: videoInfo.duration,
        imagesProcessed: imagePaths.length,
        isLocal: !shouldCleanupOutput // Indicates if video is served locally
      };

      console.log(`✅ Request ${requestId} completed successfully`);
      res.json(response);

    } catch (error) {
      console.error(`❌ Error in request ${requestId}:`, error.message);
      res.status(500).json({
        success: false,
        message: 'Error creating slideshow video',
        error: error.message
      });
    } finally {
      // Always remove from processing queue
      processingQueue.delete(requestId);
    }
  }
};

/**
 * Create video using videoshow with proper error handling and progress limiting
 */
function createVideoWithVideoshow(imagePaths, outputPath, options, requestId) {
  return new Promise((resolve, reject) => {
    console.log(`Creating videoshow with ${imagePaths.length} images for request ${requestId}`);
    console.log(`Image paths:`, imagePaths.map(p => path.basename(p)));
    
    // Verify all image files exist and are readable
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image ${i + 1} not found: ${imagePath}`);
        return reject(new Error(`Image file not found: ${imagePath}`));
      }
      
      const stats = fs.statSync(imagePath);
      console.log(`📸 Image ${i + 1}: ${path.basename(imagePath)} (${stats.size} bytes)`);
    }
    
    let lastProgressTime = Date.now();
    const progressThrottle = 2000; // Only log progress every 2 seconds
    
    // Use videoshow with the images array
    const videoBuilder = videoshow(imagePaths, options);
    
    videoBuilder
      .save(outputPath)
      .on('start', (commandLine) => {
        console.log(`Videoshow started for ${requestId}:`);
        console.log(`FFmpeg command: ${commandLine}`);
        console.log(`📸 Processing ${imagePaths.length} images with ${options.loop}s each`);
      })
      .on('progress', (progress) => {
        const now = Date.now();
        if (now - lastProgressTime > progressThrottle) {
          console.log(`Videoshow progress for ${requestId}: ${Math.round(progress.percent)}% done`);
          lastProgressTime = now;
        }
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`Videoshow error for ${requestId}:`, err);
        console.error(`FFmpeg stdout:`, stdout);
        console.error(`FFmpeg stderr:`, stderr);
        reject(err);
      })
      .on('end', () => {
        console.log(`✅ Videoshow completed for ${requestId}`);
        
        // Check if output file exists and has reasonable size
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          console.log(`🎬 Output video: ${stats.size} bytes`);
        }
        
        // Calculate total duration
        const totalDuration = imagePaths.length * options.loop;
        console.log(`🎬 Final video duration: ${totalDuration} seconds (${imagePaths.length} images × ${options.loop}s each)`);
        
        resolve({
          path: outputPath,
          duration: totalDuration,
          isImage: false
        });
      });
  });
}

/**
 * Upload video to cloud storage using the same logic as videoProcessingController
 */
async function uploadToCloud(filePath, fileName) {
  let cloudUrl = null;
  let uploadSuccess = false;

  // Primary cloud storage: FoodyQueen API (same as original controller)
  const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";
  const STORAGE_FOLDER = "editor/videos";

  try {
    console.log(`🔄 Uploading to FoodyQueen cloud storage: ${CLOUD_STORAGE_API}`);

    const formData = new FormData();
    const mediaFile = fs.createReadStream(filePath);
    const cloudFilename = `${STORAGE_FOLDER}/${fileName}`;

    // Use the exact same format as the original controller
    formData.append("stream", mediaFile);
    formData.append("filename", cloudFilename);
    formData.append("senitize", "false");

    const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
      headers: formData.getHeaders(),
      timeout: 60000, // 60 second timeout
    });

    console.log("📤 Upload response:", uploadResponse.data);

    // The FoodyQueen API returns the URL directly as the response data
    if (
      uploadResponse.data &&
      typeof uploadResponse.data === "string" &&
      uploadResponse.data.startsWith("http")
    ) {
      cloudUrl = uploadResponse.data;
      uploadSuccess = true;
      console.log("✅ Successfully uploaded to FoodyQueen cloud:", cloudUrl);
    } else if (uploadResponse.data && uploadResponse.data.url) {
      cloudUrl = uploadResponse.data.url;
      uploadSuccess = true;
      console.log("✅ Successfully uploaded to FoodyQueen cloud:", cloudUrl);
    } else {
      console.error("❌ FoodyQueen cloud upload failed:", uploadResponse.data);
    }
  } catch (uploadError) {
    console.error(`❌ Error uploading to FoodyQueen cloud:`, uploadError.message);
  }

  // If FoodyQueen upload failed, try the configured UPLOAD_MEDIA_API as fallback
  if (!uploadSuccess && EXTERNAL_APIS.UPLOAD_MEDIA) {
    try {
      console.log(`🔄 Trying fallback upload to: ${EXTERNAL_APIS.UPLOAD_MEDIA}`);
      const fallbackFormData = new FormData();
      const mediaFile = fs.createReadStream(filePath);

      fallbackFormData.append("media", mediaFile, fileName);

      const uploadResponse = await axios.post(
        EXTERNAL_APIS.UPLOAD_MEDIA,
        fallbackFormData,
        {
          headers: fallbackFormData.getHeaders(),
          timeout: 60000,
        }
      );

      console.log("📤 Fallback upload response:", uploadResponse.data);

      if (uploadResponse.data.success || uploadResponse.data.url) {
        cloudUrl = uploadResponse.data.url || uploadResponse.data.cloudUrl;
        uploadSuccess = true;
        console.log("✅ Successfully uploaded via fallback:", cloudUrl);
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback upload failed:`, fallbackError.message);
    }
  }

  if (!uploadSuccess) {
    throw new Error('All cloud upload attempts failed');
  }

  return cloudUrl;
}

module.exports = videoshowController;
