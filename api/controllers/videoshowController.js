const videoshow = require('videoshow');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const axios = require('axios');
const { CLOUD_STORAGE, EXTERNAL_APIS } = require('../config/constants');

// Configure fluent-ffmpeg paths - use environment variables if available
const ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static');
const ffprobePath = process.env.FFPROBE_PATH || require('@ffprobe-installer/ffprobe').path;

console.log('🔧 FFmpeg Configuration:');
console.log('  FFmpeg path:', ffmpegPath);
console.log('  FFprobe path:', ffprobePath);

// Verify FFmpeg exists
if (!fs.existsSync(ffmpegPath)) {
  console.error('❌ FFmpeg not found at:', ffmpegPath);
  console.error('Please check your FFMPEG_PATH environment variable');
} else {
  console.log('✅ FFmpeg found at:', ffmpegPath);
}

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
const videoshowController = {
  createSlideshowVideo: async (req, res) => {
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
      }

      // Process and validate images with enhanced logging
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
      }

      console.log(`\n📊 FINAL IMAGE PROCESSING SUMMARY:`);
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
      let duration = parseFloat(req.body.duration) || 2; // FIXED: Changed const to let
      const transition = req.body.transition || 'fade';
      const outputName = req.body.outputName || `slideshow_${uuidv4()}`;
      const audioUrl = req.body.audioUrl;
      const audioDuration = parseFloat(req.body.audioDuration) || 0;
      const slideTimings = req.body.slideTimings ? JSON.parse(req.body.slideTimings) : null;
      
      // 🔍 AUDIO DEBUG - Enhanced logging
      console.log("🔍 AUDIO DEBUG:");
      console.log("  audioUrl:", audioUrl);
      console.log("  audioUrl type:", typeof audioUrl);
      console.log("  audioUrl length:", audioUrl ? audioUrl.length : 'N/A');
      console.log("  audioDuration:", audioDuration);
      console.log("  audioDuration type:", typeof audioDuration);
      console.log("  slideTimings:", slideTimings);
      
      // Adjust video duration based on audio if provided
      if (audioUrl && audioDuration > 0) {
        const calculatedDuration = audioDuration / imagePaths.length;
        // Use calculated duration but keep within reasonable bounds (2-8 seconds per slide)
        const adjustedDuration = Math.max(2, Math.min(8, calculatedDuration));
        duration = adjustedDuration; // FIXED: Now this works because duration is let
        console.log(`🎵 Adjusted slide duration to ${duration}s based on audio length (${audioDuration}s ÷ ${imagePaths.length} slides)`);
      }
      
      // Configure videoshow options - optimized configuration
      const options = {
        fps: 30,
        loop: duration, // Use adjusted duration in seconds for EACH image
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
      console.log("Expected total video duration:", imagePaths.length * duration, "seconds");
      if (audioUrl) {
        console.log(`Audio duration: ${audioDuration}s - will be added in post-processing`);
      }
      
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
      const videoInfo = await createVideoWithVideoshow(imagePaths, outputPath, options, requestId);
      
      // Post-process with audio if provided
      let finalOutputPath = outputPath;
      if (audioUrl && audioDuration) {
        try {
          console.log('🎵 Adding audio track to video...');
          finalOutputPath = await addAudioToVideo(outputPath, audioUrl, audioDuration, requestId);
          console.log('✅ Audio successfully integrated');
        } catch (audioError) {
          console.error('❌ Audio integration failed:', audioError.message);
          console.log('📹 Proceeding with video-only slideshow');
          // Continue with original video without audio
          finalOutputPath = outputPath;
        }
      }

      // Upload to cloud storage or serve locally
      let finalUrl = null;
      let shouldCleanupOutput = false;
      
      try {
        console.log("📤 Attempting to upload to cloud storage...");
        finalUrl = await uploadToCloud(finalOutputPath, `${outputName}.mp4`);
        console.log(`✅ Video uploaded to cloud: ${finalUrl}`);
        shouldCleanupOutput = true; // Only cleanup if successfully uploaded
      } catch (uploadError) {
        console.error("❌ Cloud upload failed:", uploadError.message);
        // Fallback to local serving
        finalUrl = `http://localhost:${process.env.PORT || 4000}/temp/output/${path.basename(finalOutputPath)}`;
        console.log("Using local fallback URL:", finalUrl);
        shouldCleanupOutput = false; // Keep file for local serving
      }
      
      // Ensure finalUrl is not empty
      if (!finalUrl) {
        finalUrl = `http://localhost:${process.env.PORT || 4000}/temp/output/${path.basename(finalOutputPath)}`;
        console.log("Final URL was empty, using local fallback:", finalUrl);
        shouldCleanupOutput = false;
      }

      // 🚫 CLEANUP DISABLED FOR DEBUGGING - Keep input files for inspection
      console.log("🔍 DEBUGGING MODE: Input files preserved for inspection:");
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        if (fs.existsSync(imagePath)) {
          const stats = fs.statSync(imagePath);
          const hash = imageHashes[i] || calculateMD5(imagePath);
          console.log(`📁 Preserved: ${imagePath} (${stats.size} bytes, MD5: ${hash})`);
        }
      }

      // 🚫 OUTPUT FILE CLEANUP DISABLED FOR DEBUGGING
      if (shouldCleanupOutput) {
        console.log("🔍 DEBUGGING MODE: Output file preserved for inspection:");
        console.log(`📁 Output file kept: ${finalOutputPath}`);
      } else {
        console.log(`📁 Keeping output file locally: ${finalOutputPath}`);
      }

      // Send response
      const response = {
        message: "Video slideshow created successfully",
        success: true,
        videoUrl: finalUrl,
        mediaUrl: finalUrl,
        mediaType: "video",
        cloudUrl: finalUrl,
        duration: videoInfo.duration,
        imagesProcessed: imagePaths.length,
        isLocal: !shouldCleanupOutput, // Indicates if video is served locally
        audioProcessed: audioUrl && audioDuration > 0 && finalOutputPath !== outputPath
      };

      console.log(`✅ Request ${requestId} completed successfully`);
      console.log(`🎵 Audio was ${response.audioProcessed ? 'successfully added' : 'not processed'}`);
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
 * Add audio track to existing video using FFmpeg
 */
async function addAudioToVideo(videoPath, audioUrl, audioDuration, requestId) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🎵 Adding audio to video for request ${requestId}`);
      
      // Validate inputs
      if (!audioUrl) {
        console.log('⚠️ No audio URL provided, skipping audio addition');
        return resolve(videoPath);
      }
      
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }
      
      // Download audio if it's a URL (improved error handling)
      let localAudioPath = audioUrl;
      if (audioUrl.startsWith('http')) {
        console.log('📥 Downloading audio file...');
        
        try {
          const audioResponse = await axios.get(audioUrl, { 
            responseType: 'stream',
            timeout: 30000 // 30 second timeout
          });
          
          const audioFilename = `temp_audio_${requestId}.mp3`;
          localAudioPath = path.join(__dirname, '..', 'temp', audioFilename);
          
          // Ensure temp directory exists
          const tempDir = path.dirname(localAudioPath);
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          const writer = fs.createWriteStream(localAudioPath);
          audioResponse.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          console.log(`✅ Audio downloaded to: ${localAudioPath}`);
        } catch (downloadError) {
          console.error('❌ Failed to download audio:', downloadError.message);
          throw new Error(`Audio download failed: ${downloadError.message}`);
        }
      }
      
      // Verify audio file exists
      if (!fs.existsSync(localAudioPath)) {
        throw new Error(`Audio file not found: ${localAudioPath}`);
      }
      
      // Create output path for video with audio
      const outputDir = path.dirname(videoPath);
      const baseName = path.basename(videoPath, '.mp4');
      const outputWithAudio = path.join(outputDir, `${baseName}_with_audio.mp4`);
      
      console.log(`🔧 Combining video and audio:`);
      console.log(`   Video: ${videoPath}`);
      console.log(`   Audio: ${localAudioPath}`);
      console.log(`   Output: ${outputWithAudio}`);
      
      // Configure FFmpeg properly - use the same paths as configured at module level
      const ffmpeg = require('fluent-ffmpeg');
      const currentFfmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static');
      const currentFfprobePath = process.env.FFPROBE_PATH || require('@ffprobe-installer/ffprobe').path;
      
      console.log('🔧 Audio processing FFmpeg paths:');
      console.log('  FFmpeg:', currentFfmpegPath);
      console.log('  FFprobe:', currentFfprobePath);
      
      ffmpeg.setFfmpegPath(currentFfmpegPath);
      ffmpeg.setFfprobePath(currentFfprobePath);
      
      // Use FFmpeg to combine video and audio
      ffmpeg(videoPath)
        .input(localAudioPath)
        .outputOptions([
          '-c:v copy', // Copy video stream without re-encoding
          '-c:a aac',  // Encode audio as AAC
          '-b:a 128k', // Audio bitrate
          '-map 0:v:0', // Map video from first input
          '-map 1:a:0', // Map audio from second input
          '-shortest'   // End when shortest stream ends
        ])
        .output(outputWithAudio)
        .on('start', (commandLine) => {
          console.log(`🎬 FFmpeg audio merge started: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`🎵 Audio merge progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log(`✅ Audio successfully added to video`);
          
          // Verify output file was created
          if (!fs.existsSync(outputWithAudio)) {
            throw new Error('Output video with audio was not created');
          }
          
          const outputStats = fs.statSync(outputWithAudio);
          console.log(`🎬 Final video with audio: ${outputStats.size} bytes`);
          
          // Clean up temporary files
          cleanupTempFiles(localAudioPath, audioUrl);
          
          resolve(outputWithAudio);
        })
        .on('error', (err) => {
          console.error(`❌ Error adding audio to video:`, err);
          
          // Clean up on error
          cleanupTempFiles(localAudioPath, audioUrl);
          if (fs.existsSync(outputWithAudio)) {
            try {
              fs.unlinkSync(outputWithAudio);
            } catch (e) {
              console.warn('Could not clean up failed output file:', e.message);
            }
          }
          
          // Don't silently fall back - report the error
          throw new Error(`Audio processing failed: ${err.message}`);
        })
        .run();
        
    } catch (error) {
      console.error(`❌ Error in addAudioToVideo:`, error.message);
      
      // Clean up any temp files
      if (localAudioPath && localAudioPath !== audioUrl && fs.existsSync(localAudioPath)) {
        try {
          fs.unlinkSync(localAudioPath);
        } catch (e) {
          console.warn('Could not clean up temp audio file:', e.message);
        }
      }
      
      // Re-throw the error instead of silently falling back
      throw error;
    }
  });
}

/**
 * Helper function for cleanup
 */
function cleanupTempFiles(localAudioPath, originalAudioUrl) {
  try {
    if (localAudioPath !== originalAudioUrl && fs.existsSync(localAudioPath)) {
      fs.unlinkSync(localAudioPath);
      console.log('🧹 Cleaned up temporary audio file');
    }
  } catch (cleanupError) {
    console.warn('⚠️ Could not clean up temporary audio file:', cleanupError.message);
  }
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