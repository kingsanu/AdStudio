const videoshow = require('videoshow');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const axios = require('axios');
const { spawn } = require('child_process');

// Configure fluent-ffmpeg paths for videoshow
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

/**
 * Alternative video controller that uses FFmpeg directly
 * This ensures all images are properly processed in sequence
 */
const alternativeVideoController = {
  createSlideshowVideo: async (req, res) => {
    const requestId = uuidv4();
    
    try {
      console.log(`=== Alternative FFmpeg slideshow ${requestId} ===`);
      console.log("Request files:", req.files ? req.files.length : 0);

      // Validate and process images
      const imagePaths = [];
      for (const file of req.files || []) {
        if (!fs.existsSync(file.path)) continue;
        
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension)) {
          imagePaths.push(file.path);
          console.log(`✓ Valid image: ${path.basename(file.path)}`);
        }
      }

      if (imagePaths.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid images found'
        });
      }

      // Parse options
      const duration = parseFloat(req.body.duration) || 3;
      const outputName = req.body.outputName || `slideshow_${uuidv4()}`;
      
      // Create output directory
      const outputDir = path.join(__dirname, '..', 'temp', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `${outputName}.mp4`);
      
      // Create slideshow using direct FFmpeg approach
      await createSlideshowWithFFmpeg(imagePaths, outputPath, duration, requestId);
      
      // Upload to cloud
      const cloudUrl = await uploadToCloud(outputPath, `${outputName}.mp4`);
      
      // Clean up
      for (const imagePath of imagePaths) {
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (e) {
          console.warn(`Could not clean up ${imagePath}`);
        }
      }
      
      // Clean up output if uploaded successfully
      if (cloudUrl && cloudUrl.includes('blob.core.windows.net')) {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        } catch (e) {
          console.warn(`Could not clean up output file`);
        }
      }

      res.json({
        message: "Video slideshow created successfully",
        success: true,
        videoUrl: cloudUrl,
        mediaUrl: cloudUrl,
        mediaType: "video",
        cloudUrl: cloudUrl,
        duration: imagePaths.length * duration,
        imagesProcessed: imagePaths.length,
        method: "ffmpeg-direct"
      });

    } catch (error) {
      console.error(`❌ Error in alternative controller ${requestId}:`, error.message);
      res.status(500).json({
        success: false,
        message: 'Error creating slideshow video',
        error: error.message
      });
    }
  }
};

/**
 * Create slideshow using direct FFmpeg commands
 */
function createSlideshowWithFFmpeg(imagePaths, outputPath, duration, requestId) {
  return new Promise((resolve, reject) => {
    console.log(`🎬 Creating slideshow with FFmpeg for ${requestId}`);
    console.log(`Images: ${imagePaths.length}, Duration each: ${duration}s`);
    
    // Simpler approach: create a concat demuxer file
    const concatFilePath = path.join(path.dirname(outputPath), `concat_${requestId}.txt`);
    
    // Create concat file content
    let concatContent = '';
    for (const imagePath of imagePaths) {
      concatContent += `file '${imagePath.replace(/\\/g, '/')}'\\n`;
      concatContent += `duration ${duration}\\n`;
    }
    // Add the last image again (required by concat demuxer)
    if (imagePaths.length > 0) {
      concatContent += `file '${imagePaths[imagePaths.length - 1].replace(/\\/g, '/')}'\\n`;
    }
    
    console.log('Creating concat file:', concatFilePath);
    console.log('Concat content:', concatContent);
    
    // Write concat file
    fs.writeFileSync(concatFilePath, concatContent);
    
    // Build FFmpeg command using concat demuxer
    const ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-y', // Overwrite output file
      outputPath
    ];
    
    console.log(`FFmpeg command: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);
    
    // Execute FFmpeg
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    
    let stderr = '';
    
    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log progress occasionally
      if (stderr.includes('time=')) {
        const timeMatch = stderr.match(/time=(\\d{2}:\\d{2}:\\d{2}\\.\\d{2})/);
        if (timeMatch) {
          console.log(`FFmpeg progress: ${timeMatch[1]}`);
        }
      }
    });
    
    ffmpegProcess.on('close', (code) => {
      // Clean up concat file
      try {
        if (fs.existsSync(concatFilePath)) {
          fs.unlinkSync(concatFilePath);
        }
      } catch (e) {
        console.warn('Could not clean up concat file');
      }
      
      if (code === 0) {
        console.log(`✅ FFmpeg completed for ${requestId}`);
        resolve();
      } else {
        console.error(`❌ FFmpeg failed with code ${code}`);
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg process failed with code ${code}`));
      }
    });
    
    ffmpegProcess.on('error', (error) => {
      console.error(`❌ FFmpeg spawn error:`, error);
      reject(error);
    });
  });
}

/**
 * Upload to cloud storage
 */
async function uploadToCloud(filePath, fileName) {
  const CLOUD_STORAGE_API = "https://business.foodyqueen.com/admin/UploadMedia";
  const STORAGE_FOLDER = "editor/videos";

  try {
    console.log(`🔄 Uploading ${fileName} to cloud...`);

    const formData = new FormData();
    const mediaFile = fs.createReadStream(filePath);
    const cloudFilename = `${STORAGE_FOLDER}/${fileName}`;

    formData.append("file", mediaFile, {
      filename: cloudFilename,
      contentType: "video/mp4",
    });

    const response = await axios.post(CLOUD_STORAGE_API, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000, // 2 minutes
    });

    if (response.data && response.data.url) {
      console.log(`✅ Successfully uploaded to cloud: ${response.data.url}`);
      return response.data.url;
    } else {
      throw new Error("Upload response did not contain URL");
    }
  } catch (error) {
    console.error("❌ Cloud upload failed:", error.message);
    throw error;
  }
}

module.exports = alternativeVideoController;
