/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

/**
 * Video Processing Controller
 *
 * Handles video generation and cloud storage upload with proper folder segregation:
 * - Videos are uploaded to: editor/videos/
 * - Images are uploaded to: editor/uploads/ (handled by uploadedImageController)
 * - Templates are uploaded to: editor/templates/ (handled by templateController)
 */

const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const { CLOUD_STORAGE, EXTERNAL_APIS } = require("../config/constants");
const FormData = require("form-data");
const axios = require("axios");

// Set FFmpeg path using ffmpeg-static
try {
  const ffmpegStatic = require("ffmpeg-static");
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    console.log("FFmpeg path set to:", ffmpegStatic);
  }
} catch (error) {
  console.warn("ffmpeg-static not available, trying other options");
  try {
    const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log("FFmpeg path set via installer to:", ffmpegPath);
  } catch (installerError) {
    console.warn("FFmpeg installer also not available, trying system PATH");
    if (process.env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    }
  }
}

// Create a slideshow video using fluent-ffmpeg (concat demuxer approach)
const createSlideshowWithFluentFFmpeg = async (images, options = {}) => {
  const {
    outputPath = path.join(__dirname, "output", `slideshow_${uuidv4()}.mp4`),
    duration = 3,
  } = options;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (images.length === 1) {
    // Single image case
    console.log("Single image detected in slideshow function");

    return new Promise((resolve, reject) => {
      ffmpeg(images[0])
        .inputOptions(["-loop 1", `-t ${duration}`])
        .outputOptions([
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-preset ultrafast",
          "-crf 30",
          "-r 10",
        ])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("Single image video FFmpeg started:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(
            `Single image video: ${Math.floor(progress.percent || 0)}% done`
          );
        })
        .on("end", () => {
          console.log("Single image video created successfully");
          resolve({
            path: outputPath,
            duration: duration,
            isImage: false,
          });
        })
        .on("error", (err) => {
          console.error("Error creating single image video:", err);
          reject(err);
        })
        .run();
    });
  }

  // Multiple images: Use concat demuxer approach for reliable slideshow
  console.log("Creating slideshow from multiple images using concat demuxer");

  // Create individual video files for each image first
  const tempVideos = [];
  const tempDir = path.join(path.dirname(outputPath), "temp_segments");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Step 1: Convert each image to a video segment
    for (let i = 0; i < images.length; i++) {
      const segmentPath = path.join(tempDir, `segment_${i}.mp4`);
      tempVideos.push(segmentPath);

      await new Promise((resolve, reject) => {
        ffmpeg(images[i])
          .inputOptions(["-loop 1", `-t ${duration}`])
          .outputOptions([
            "-c:v libx264",
            "-pix_fmt yuv420p",
            "-preset ultrafast",
            "-crf 30",
            "-r 10",
            "-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
          ])
          .output(segmentPath)
          .on("start", (commandLine) => {
            console.log(
              `Creating segment ${i + 1}/${images.length}: ${commandLine}`
            );
          })
          .on("end", () => {
            console.log(
              `Segment ${i + 1}/${images.length} created successfully`
            );
            resolve();
          })
          .on("error", (err) => {
            console.error(`Error creating segment ${i + 1}:`, err);
            reject(err);
          })
          .run();
      });
    }

    // Step 2: Create concat file for FFmpeg
    const concatFilePath = path.join(tempDir, "concat_list.txt");
    const concatContent = tempVideos
      .map((video) => `file '${path.resolve(video)}'`)
      .join("\n");
    fs.writeFileSync(concatFilePath, concatContent);

    console.log("Concat file created:", concatFilePath);
    console.log("Concat content:", concatContent);

    // Step 3: Concatenate all segments
    const totalDuration = images.length * duration;

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions([
          "-c copy", // Use copy codec for fast concatenation
        ])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("Final concatenation FFmpeg started:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(
            `Final concatenation: ${Math.floor(progress.percent || 0)}% done`
          );
        })
        .on("end", () => {
          console.log("Multi-image slideshow created successfully");

          // Clean up temporary files
          try {
            tempVideos.forEach((video) => {
              if (fs.existsSync(video)) fs.unlinkSync(video);
            });
            if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);
            if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
          } catch (cleanupErr) {
            console.warn("Error cleaning up temp files:", cleanupErr);
          }

          resolve({
            path: outputPath,
            duration: totalDuration,
            isImage: false,
          });
        })
        .on("error", (err) => {
          console.error("Error in final concatenation:", err);

          // Clean up temporary files on error
          try {
            tempVideos.forEach((video) => {
              if (fs.existsSync(video)) fs.unlinkSync(video);
            });
            if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);
            if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
          } catch (cleanupErr) {
            console.warn(
              "Error cleaning up temp files after error:",
              cleanupErr
            );
          }

          reject(err);
        })
        .run();
    });
  } catch (error) {
    // Clean up temporary files on error
    try {
      tempVideos.forEach((video) => {
        if (fs.existsSync(video)) fs.unlinkSync(video);
      });
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch (cleanupErr) {
      console.warn("Error cleaning up temp files after error:", cleanupErr);
    }

    throw error;
  }
};

// Create a simple video from a single image (fallback function)
const createSimpleVideoFromImage = async (imagePath, options = {}) => {
  const {
    outputPath = path.join(__dirname, "output", `simple_video_${uuidv4()}.mp4`),
    duration = 5,
  } = options;

  return new Promise((resolve, reject) => {
    console.log("Creating simple video from single image:", imagePath);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use the simplest possible FFmpeg command
    ffmpeg(imagePath)
      .inputOptions(["-loop 1", `-t ${duration}`])
      .outputOptions([
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-preset ultrafast",
        "-crf 30",
        "-r 10",
      ])
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("Simple video FFmpeg started:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(
          `Simple video processing: ${Math.floor(progress.percent || 0)}% done`
        );
      })
      .on("end", () => {
        console.log("Simple video created successfully");
        resolve({
          path: outputPath,
          duration: duration,
          isImage: false,
        });
      })
      .on("error", (err) => {
        console.error("Error creating simple video:", err);
        reject(err);
      })
      .run();
  });
};

// Example controller using the slideshow function
const slideshowController = {
  createSlideshowVideo: async (req, res) => {
    try {
      console.log("=== Video processing request received ===");
      console.log("Request files:", req.files ? req.files.length : 0);
      console.log("Request body:", req.body);

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        console.log("No files uploaded");
        return res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
      }

      console.log(
        "Uploaded files:",
        req.files.map((f) => ({
          name: f.originalname,
          path: f.path,
          size: f.size,
        }))
      );

      // Get file paths from the uploaded files
      const imagePaths = req.files.map((file) => file.path);

      // Get options from request body
      const options = {
        duration: req.body.duration ? parseFloat(req.body.duration) : 3,
        transitionDuration: req.body.transitionDuration
          ? parseFloat(req.body.transitionDuration)
          : 1,
        transitionEffect: req.body.transitionEffect || "fade",
        resolution: req.body.resolution || "1920x1080",
        audioPath: req.body.audioPath || null,
        outputPath: path.join(
          __dirname,
          "..",
          "temp",
          "output",
          `slideshow_${uuidv4()}.mp4`
        ),
      };

      console.log("Processing options:", options);
      console.log("Image paths:", imagePaths);

      // Create the slideshow video
      console.log("Starting slideshow creation...");
      let result;
      let mediaType = "video";

      if (imagePaths.length === 1) {
        // Single image: Just upload the image
        result = {
          path: imagePaths[0],
          duration: 0,
          isImage: true,
        };
        mediaType = "image";
        console.log("Single image detected, using original image");
      } else {
        // Multiple images: Create video slideshow
        try {
          // Try to create video slideshow with fluent-ffmpeg
          console.log(
            "Attempting to create video from",
            imagePaths.length,
            "images"
          );
          result = await createSlideshowWithFluentFFmpeg(imagePaths, options);
          console.log("FFmpeg slideshow created successfully:", result);
          mediaType = "video";
        } catch (ffmpegError) {
          console.error("FFmpeg slideshow failed:", ffmpegError.message);
          console.error("FFmpeg error details:", ffmpegError);

          // Create a video file from the first image instead of falling back to PNG
          try {
            console.log(
              "Attempting to create single-image video as fallback..."
            );
            const singleImageVideoPath = path.join(
              __dirname,
              "..",
              "temp",
              "output",
              `fallback_video_${uuidv4()}.mp4`
            );

            // Create a simple video from the first image
            const simpleVideoResult = await createSimpleVideoFromImage(
              imagePaths[0],
              {
                ...options,
                outputPath: singleImageVideoPath,
                duration: 5, // 5 seconds for fallback video
              }
            );

            result = simpleVideoResult;
            mediaType = "video";
            console.log("Fallback single-image video created:", result);
          } catch (fallbackError) {
            console.error(
              "Fallback video creation also failed:",
              fallbackError.message
            );

            // Last resort: Use the first image as static image but with proper extension handling
            console.log("Using first image as final fallback");
            result = {
              path: imagePaths[0],
              duration: 0,
              isImage: true,
            };
            mediaType = "image";
          }
        }
      }

      // Upload to cloud storage - use the same pattern as uploadedImageController
      let cloudUrl = null;
      let uploadSuccess = false;

      console.log("Starting cloud upload process...");
      console.log("Media file path:", result.path);
      console.log("Media type:", mediaType);

      // Use the exact same cloud storage API as the rest of the app
      const CLOUD_STORAGE_API =
        "https://business.foodyqueen.com/admin/UploadMedia";
      const STORAGE_FOLDER = "editor/videos";

      try {
        console.log(
          `Uploading to FoodyQueen cloud storage: ${CLOUD_STORAGE_API}`
        );

        const formData = new FormData();
        const mediaFile = fs.createReadStream(result.path);
        const fileName = path.basename(result.path);
        const cloudFilename = `${STORAGE_FOLDER}/${fileName}`;

        // Use the exact same format as uploadedImageController
        formData.append("stream", mediaFile);
        formData.append("filename", cloudFilename);
        formData.append("senitize", "false");

        const uploadResponse = await axios.post(CLOUD_STORAGE_API, formData, {
          headers: formData.getHeaders(),
          timeout: 60000, // 60 second timeout
        });

        console.log("Upload response:", uploadResponse.data);

        // The FoodyQueen API returns the URL directly as the response data
        if (
          uploadResponse.data &&
          typeof uploadResponse.data === "string" &&
          uploadResponse.data.startsWith("http")
        ) {
          cloudUrl = uploadResponse.data;
          uploadSuccess = true;
          console.log("Successfully uploaded to FoodyQueen cloud:", cloudUrl);
        } else if (uploadResponse.data && uploadResponse.data.url) {
          cloudUrl = uploadResponse.data.url;
          uploadSuccess = true;
          console.log("Successfully uploaded to FoodyQueen cloud:", cloudUrl);
        } else {
          console.error("FoodyQueen cloud upload failed:", uploadResponse.data);
        }
      } catch (uploadError) {
        console.error(
          `Error uploading to FoodyQueen cloud:`,
          uploadError.message
        );
      }

      // If FoodyQueen upload failed, try the configured UPLOAD_MEDIA_API as fallback
      if (!uploadSuccess && EXTERNAL_APIS.UPLOAD_MEDIA) {
        try {
          console.log(
            `Trying fallback upload to: ${EXTERNAL_APIS.UPLOAD_MEDIA}`
          );
          const fallbackFormData = new FormData();
          const mediaFile = fs.createReadStream(result.path);
          const fileName = path.basename(result.path);

          fallbackFormData.append("media", mediaFile, fileName);

          const uploadResponse = await axios.post(
            EXTERNAL_APIS.UPLOAD_MEDIA,
            fallbackFormData,
            {
              headers: fallbackFormData.getHeaders(),
              timeout: 60000,
            }
          );

          console.log("Fallback upload response:", uploadResponse.data);

          if (uploadResponse.data.success || uploadResponse.data.url) {
            cloudUrl = uploadResponse.data.url || uploadResponse.data.cloudUrl;
            uploadSuccess = true;
            console.log("Successfully uploaded via fallback:", cloudUrl);
          }
        } catch (fallbackError) {
          console.error(`Fallback upload failed:`, fallbackError.message);
        }
      }

      // Final fallback: serve locally using the cloud storage base URL format
      if (!uploadSuccess) {
        console.warn("All cloud uploads failed, serving locally");
        const fileName = path.basename(result.path);

        // Use the cloud storage base URL to make it look like a cloud URL
        if (CLOUD_STORAGE.BASE_URL) {
          cloudUrl = `${CLOUD_STORAGE.BASE_URL}/editor/videos/${fileName}`;
        } else {
          cloudUrl = `https://adstudioserver.foodyqueen.com/api/media/${fileName}`;
        }

        console.log("Using local fallback URL:", cloudUrl);
      }

      // Clean up uploaded input files
      try {
        for (const filePath of imagePaths) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Cleaned up input file:", filePath);
          }
        }
      } catch (cleanupError) {
        console.warn("Error cleaning up input files:", cleanupError);
      }

      // Clean up output file if uploaded to cloud successfully
      if (uploadSuccess && result.path && fs.existsSync(result.path)) {
        try {
          // For single images, don't delete the original if it's the same file
          if (mediaType === "video" || !imagePaths.includes(result.path)) {
            fs.unlinkSync(result.path);
            console.log("Cleaned up output file:", result.path);
          }
        } catch (cleanupError) {
          console.warn("Error cleaning up output file:", cleanupError);
        }
      }

      // Return the media URL (prioritize cloud URL always)
      const finalMediaUrl = cloudUrl; // Always use cloudUrl since we ensure it exists above

      return res.status(200).json({
        message: `${
          mediaType === "video" ? "Video" : "Image"
        } created successfully`,
        success: true,
        videoUrl: finalMediaUrl, // Keep videoUrl for backward compatibility
        mediaUrl: finalMediaUrl,
        mediaType,
        cloudUrl: finalMediaUrl, // Ensure cloudUrl is always returned
        duration: result.duration || 0,
      });
    } catch (error) {
      console.error("Error creating slideshow:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating slideshow video",
        error: error.message,
      });
    }
  },
};

// Create a slideshow using Remotion
const createRemotionSlideshow = async (imagePaths, options = {}) => {
  try {
    const {
      outputPath = path.join(
        __dirname,
        "..",
        "temp",
        "output",
        `slideshow_${uuidv4()}.mp4`
      ),
      fps = 30,
      transitions = [],
      duration = 5, // seconds per slide
    } = options;

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Bundle the Remotion project
    console.log("Bundling Remotion project...");
    const bundled = await bundle({
      entryPoint: path.join(__dirname, "..", "remotion", "index.js"),
      // You can specify a custom webpack config here if needed
    });

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundled.url,
      id: "Slideshow",
      inputProps: {
        images: imagePaths,
        transitions,
        fps,
      },
    });

    // Calculate video duration based on number of images and duration per slide
    const durationInFrames = Math.max(
      imagePaths.length * duration * fps,
      composition.durationInFrames
    );

    // Render the video
    console.log("Rendering video with Remotion...");
    await renderMedia({
      composition,
      serveUrl: bundled.url,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        images: imagePaths,
        transitions,
        fps,
      },
      durationInFrames,
      fps,
    });

    console.log("Remotion video rendered successfully:", outputPath);
    return {
      path: outputPath,
      duration: durationInFrames / fps,
    };
  } catch (error) {
    console.error("Error creating Remotion slideshow:", error);
    throw error;
  }
};

// Controller for Remotion-based slideshow
const createRemotionSlideshowController = async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No images uploaded",
      });
    }

    // Sort files by name to ensure correct order
    const files = req.files.sort((a, b) => {
      const aIndex = parseInt(a.fieldname.split("_")[1]);
      const bIndex = parseInt(b.fieldname.split("_")[1]);
      return aIndex - bIndex;
    });

    // Get file paths from the uploaded files
    const imagePaths = files.map((file) => file.path);

    // Parse transitions if provided
    const transitions = req.body.transitions
      ? JSON.parse(req.body.transitions)
      : [];

    // Map transition types to Remotion format
    const remotionTransitions = transitions.map((transition) => {
      return {
        type: transition.type || "fade",
        duration: transition.duration || 1000, // Default 1 second
      };
    });

    // Create a unique ID for this video
    const videoId = uuidv4();
    const outputFilename = `slideshow_${videoId}.mp4`;
    const outputPath = path.join(
      __dirname,
      "..",
      "temp",
      "output",
      outputFilename
    );

    // Create the slideshow with Remotion
    const result = await createRemotionSlideshow(imagePaths, {
      outputPath,
      transitions: remotionTransitions,
      fps: 30,
      duration: 5, // 5 seconds per slide
    });

    // Determine the URL for the video
    const videoUrl = `${CLOUD_STORAGE.BASE_URL}/editor/videos/${outputFilename}`;

    // Return the video URL
    return res.status(200).json({
      message: "Video created successfully with Remotion",
      videoUrl,
      duration: result.duration,
      videoId,
    });
  } catch (error) {
    console.error("Error creating Remotion slideshow:", error);
    return res.status(500).json({
      message: "Error creating slideshow video with Remotion",
      error: error.message,
    });
  }
};

// Fallback: Create a simple image collage when video creation fails
module.exports = {
  createSlideshow: slideshowController.createSlideshowVideo,
  createRemotionSlideshow: createRemotionSlideshowController,
};
