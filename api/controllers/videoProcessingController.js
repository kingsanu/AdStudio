/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const { CLOUD_STORAGE } = require("../config/constants");

// Set FFmpeg path if needed
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

// Create a slideshow video with transitions
const createSlideshow = async (images, options = {}) => {
  const {
    outputPath = path.join(__dirname, "output", `slideshow_${uuidv4()}.mp4`),
    duration = 3,
    transitionDuration = 1,
    transitionEffect = "fade", // fade, slideleft, slideright, slideup, slidedown, circlecrop, etc.
    fps = 30,
    resolution = "1920x1080",
    audioPath = null,
  } = options;

  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Start building the FFmpeg command
    let command = ffmpeg();

    // Add each image with the specified duration
    images.forEach((image) => {
      command = command
        .addInput(image)
        .inputOptions([`-loop 1`, `-t ${duration + transitionDuration}`]);
    });

    // Add audio if provided
    if (audioPath && fs.existsSync(audioPath)) {
      command = command.addInput(audioPath);
    }

    // Calculate total video duration
    const totalDuration =
      images.length * duration + (images.length - 1) * transitionDuration;

    // Complex filtergraph for transitions
    const filters = [];

    // First prepare all inputs to have the same dimensions
    for (let i = 0; i < images.length; i++) {
      filters.push(
        `[${i}:v]scale=${resolution}:force_original_aspect_ratio=decrease,pad=${resolution}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuva420p[v${i}]`
      );
    }

    // Then create the transition chain
    for (let i = 0; i < images.length - 1; i++) {
      filters.push(
        `[v${i}][v${
          i + 1
        }]xfade=transition=${transitionEffect}:duration=${transitionDuration}:offset=${
          duration * (i + 1) + transitionDuration * i
        }[v${i + 1}out]`
      );

      // Connect the chain
      if (i < images.length - 2) {
        filters.push(`[v${i + 1}out][v${i + 2}]`);
      }
    }

    // Audio handling
    if (audioPath && fs.existsSync(audioPath)) {
      filters.push(
        `[${images.length}:a]afade=t=out:st=${totalDuration - 3}:d=3[aout]`
      );
      command = command.outputOptions([
        "-map [v${images.length-1}out]",
        "-map [aout]",
      ]);
    } else {
      command = command.outputOptions(["-map [v${images.length-1}out]"]);
    }

    // Apply the filter complex
    command = command.complexFilter(filters.join(";"));

    // Set output options
    command = command
      .outputOptions([
        `-t ${totalDuration}`,
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-preset medium",
        "-crf 23",
        `-r ${fps}`,
      ])
      .output(outputPath);

    // Debug: Log the full command
    console.log("FFmpeg Command:", command._getArguments().join(" "));

    // Run the command
    command
      .on("start", (commandLine) => {
        console.log("FFmpeg process started:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${Math.floor(progress.percent)}% done`);
      })
      .on("end", () => {
        console.log("Slideshow created successfully");
        resolve({
          path: outputPath,
          duration: totalDuration,
        });
      })
      .on("error", (err) => {
        console.error("Error creating slideshow:", err);
        reject(err);
      })
      .run();
  });
};

// Example controller using the slideshow function
const slideshowController = {
  createSlideshowVideo: async (req, res) => {
    try {
      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "No images uploaded",
        });
      }

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

      // Create the slideshow
      const result = await createSlideshow(imagePaths, options);

      // Return the video URL
      const videoUrl = `/api/media/${path.basename(result.path)}`;
      return res.status(200).json({
        message: "Video created successfully",
        videoUrl,
        duration: result.duration,
      });
    } catch (error) {
      console.error("Error creating slideshow:", error);
      return res.status(500).json({
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
    const videoUrl = `${CLOUD_STORAGE.BASE_URL}/editor/${outputFilename}`;

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

module.exports = {
  createSlideshow: slideshowController.createSlideshowVideo,
  createRemotionSlideshow: createRemotionSlideshowController,
};
