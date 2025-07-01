import axios from "axios";
import { UPLOAD_IMAGE_ENDPOINT } from "@/constants";

interface VideoGenerationOptions {
  duration?: number;
  transitionEffect?: string;
  transition?: string; // Alternative naming for new endpoint
  resolution?: string;
  outputName?: string;
  audioUrl?: string;
  audioDuration?: number;
  slideTimings?: number[];
}

interface VideoGenerationResult {
  success: boolean;
  data?: {
    videoUrl: string;
    duration: number;
    cloudUrl?: string;
  };
  error?: string;
}

interface ImageUploadResult {
  success: boolean;
  data?: {
    imageUrl: string;
    cloudUrl?: string;
  };
  error?: string;
}

class VideoService {
  private readonly baseUrl: string;

constructor() {
  // For Vite apps, use import.meta.env with VITE_ prefix
  this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
}
  /**
   * Automatically generate media based on page count
   * - Single page: Upload as image
   * - Multiple pages: Create video slideshow with optional audio
   */
  async generateCampaignMedia(
    pageImages: string[],
    audioUrl?: string,
    audioDuration?: number
  ): Promise<{
    mediaUrl: string;
    mediaType: "image" | "video";
  }> {
    console.log(`[VideoService] 📥 Received ${pageImages.length} images for media generation`);
    
    if (pageImages.length === 0) {
      throw new Error("No pages provided");
    }

    // Log details about received images
    pageImages.forEach((dataUrl, index) => {
      const base64Data = dataUrl.split(',')[1];
      const imageSize = Math.round((base64Data.length * 3) / 4 / 1024);
      const preview = base64Data.substring(0, 30);
      const mimeType = dataUrl.split(';')[0].split(':')[1];
      console.log(`[VideoService] Input Image ${index + 1}: ${mimeType}, ~${imageSize}KB, preview: ${preview}...`);
    });

    if (pageImages.length === 1) {
      console.log('[VideoService] Single page detected - uploading as image');
      // Single page - upload as image
      const result = await this.uploadImage(pageImages[0]);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to upload image");
      }
      console.log('[VideoService] ✅ Image upload successful:', result.data.cloudUrl ?? result.data.imageUrl);
      return {
        mediaUrl: result.data.cloudUrl ?? result.data.imageUrl,
        mediaType: "image",
      };
    } else {
      console.log('[VideoService] Multiple pages detected - creating video slideshow');
      // Multiple pages - create video with optional audio
      const options: VideoGenerationOptions = {};
      
      if (audioUrl && audioDuration) {
        console.log(`[VideoService] Adding audio: ${audioUrl}, duration: ${audioDuration}s`);
        options.audioUrl = audioUrl;
        options.audioDuration = audioDuration;
        
        // Calculate slide timing based on audio duration
        const { slideDuration, slideTimings } = this.calculateSlideTiming(audioDuration, pageImages.length);
        options.duration = slideDuration;
        options.slideTimings = slideTimings;
        
        console.log(`[VideoService] Calculated slide duration: ${slideDuration}s`);
        console.log(`[VideoService] Slide timings:`, slideTimings);
      }
      
      const result = await this.createSlideshow(pageImages, options);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to create video");
      }
      console.log('[VideoService] ✅ Video creation successful:', result.data.cloudUrl ?? result.data.videoUrl);
      return {
        mediaUrl: result.data.cloudUrl ?? result.data.videoUrl,
        mediaType: "video",
      };
    }
  }
  /**
   * Upload a single image to cloud storage
   */
  async uploadImage(imageDataUrl: string): Promise<ImageUploadResult> {
    try {
      // Extract base64 data from data URL (remove data:image/png;base64, prefix)
      const base64Data = imageDataUrl.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid data URL format");
      }

      // Generate filename with timestamp
      const timestamp = Date.now();
      const filename = `campaign-image-${timestamp}.png`;

      const uploadResponse = await axios.post(
        UPLOAD_IMAGE_ENDPOINT,
        {
          base64: base64Data,
          filename: filename,
          userId: "campaign",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      if (uploadResponse.data?.url) {
        return {
          success: true,
          data: {
            imageUrl: uploadResponse.data.url,
            cloudUrl: uploadResponse.data.url,
          },
        };
      } else {
        return {
          success: false,
          error: uploadResponse.data.message ?? "Failed to upload image",
        };
      }
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      return {
        success: false,
        error: (error as Error).message ?? "Failed to upload image",
      };
    }
  }
  /**
   * Create a slideshow video from multiple images
   * Updated to use the more robust videoshow endpoint for better reliability
   */  async createSlideshow(
    imageDataUrls: string[],
    options: VideoGenerationOptions = {}  ): Promise<VideoGenerationResult> {
    try {
      console.log(`🔍 VideoService.createSlideshow called with ${imageDataUrls.length} images`);
      console.log("Options:", options);
      
      const formData = new FormData();

      // Convert each data URL to blob and append to form data
      for (let i = 0; i < imageDataUrls.length; i++) {
        console.log(`📸 Processing image ${i + 1}/${imageDataUrls.length}`);
        
        const dataUrl = imageDataUrls[i];
        console.log(`   - Data URL length: ${dataUrl.length} characters`);
        console.log(`   - Data URL prefix: ${dataUrl.substring(0, 50)}...`);
        
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        console.log(`   - Blob size: ${blob.size} bytes`);
        console.log(`   - Blob type: ${blob.type}`);
        
        formData.append("images", blob, `page-${i + 1}.png`);
        console.log(`   - Added to FormData as: page-${i + 1}.png`);
      }

      // Add options
      formData.append("duration", (options.duration ?? 3).toString());
      formData.append("transition", options.transition ?? options.transitionEffect ?? "fade");
      if (options.outputName) {
        formData.append("outputName", options.outputName);
      }
      if (options.audioUrl) {
        formData.append("audioUrl", options.audioUrl);
      }
      if (options.audioDuration) {
        formData.append("audioDuration", options.audioDuration.toString());
      }
      if (options.slideTimings) {
        formData.append("slideTimings", JSON.stringify(options.slideTimings));
      }
        console.log(`📤 Sending FormData with ${imageDataUrls.length} images to backend`);
      console.log(`   - Duration: ${options.duration ?? 3}s per image`);
      console.log(`   - Transition: ${options.transition ?? options.transitionEffect ?? "fade"}`);
      console.log(`   - Output name: ${options.outputName || "auto-generated"}`);
      
      // 🔍 DETAILED FORMDATA PREVIEW FOR TESTING
      console.log(`\n🔍 DETAILED FORMDATA PREVIEW:`);
      console.log(`   - FormData entries count: ${Array.from(formData.entries()).length}`);
        // Log all FormData entries
      for (const [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`   - Field "${key}": File/Blob`);
          console.log(`     • Name: ${(value as any).name || 'blob'}`);
          console.log(`     • Type: ${value.type}`);
          console.log(`     • Size: ${value.size} bytes (~${Math.round(value.size/1024)}KB)`);
        } else {
          console.log(`   - Field "${key}": "${value}"`);
        }
      }
      
      // Show original data URLs preview
      console.log(`\n📷 ORIGINAL DATA URLS PREVIEW:`);
      imageDataUrls.forEach((dataUrl, index) => {
        const mimeType = dataUrl.split(';')[0].split(':')[1];
        const base64Part = dataUrl.split(',')[1];
        const sizeKB = Math.round((base64Part.length * 3) / 4 / 1024);
        const preview = base64Part.substring(0, 50);
        console.log(`   Image ${index + 1}:`);
        console.log(`     • MIME: ${mimeType}`);
        console.log(`     • Size: ~${sizeKB}KB`);
        console.log(`     • Base64 preview: ${preview}...`);
        console.log(`     • Data URL length: ${dataUrl.length} chars`);
      });
      
      console.log(`\n📡 SENDING TO ENDPOINT: ${this.baseUrl}/video-processing/create-videoshow-slideshow`);

      const response = await axios.post(
        `${this.baseUrl}/video-processing/create-videoshow-slideshow`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 2 minutes timeout for video processing
        }      );

      console.log(`✅ Backend response received:`, response.data);

      if (response.data.success && (response.data.videoUrl || response.data.mediaUrl)) {
        return {
          success: true,
          data: {
            videoUrl: response.data.videoUrl || response.data.mediaUrl,
            duration: response.data.duration,
            cloudUrl: response.data.cloudUrl ?? response.data.videoUrl ?? response.data.mediaUrl,
          },
        };
      } else {
        return {
          success: false,
          error: response.data.message ?? "Failed to create video",
        };
      }
    } catch (error: unknown) {
      console.error("❌ Error creating slideshow:", error);
      return {
        success: false,
        error: (error as Error).message ?? "Failed to create slideshow video",      };
    }
  }

  /**
   * Calculate optimal slide timing based on audio duration and number of slides
   */
  calculateSlideTiming(audioDuration: number, slideCount: number): {
    slideDuration: number;
    totalDuration: number;
    slideTimings: number[];
  } {
    if (slideCount === 0) {
      return {
        slideDuration: 0,
        totalDuration: 0,
        slideTimings: [],
      };
    }

    // Minimum slide duration is 2 seconds, maximum is 8 seconds
    const minSlideDuration = 2;
    const maxSlideDuration = 8;
    
    let slideDuration = audioDuration / slideCount;
    
    // If slides would be too short, we'll need to repeat the sequence
    if (slideDuration < minSlideDuration) {
      slideDuration = minSlideDuration;
    } else if (slideDuration > maxSlideDuration) {
      // If slides would be too long, cap at max duration
      slideDuration = maxSlideDuration;
    }

    const totalVideoDuration = Math.max(audioDuration, slideCount * slideDuration);
    
    // Calculate when each slide should appear
    const slideTimings: number[] = [];
    let currentTime = 0;
    
    while (currentTime < audioDuration) {
      for (let i = 0; i < slideCount && currentTime < audioDuration; i++) {
        slideTimings.push(currentTime);
        currentTime += slideDuration;
      }
    }

    return {
      slideDuration,
      totalDuration: totalVideoDuration,
      slideTimings,
    };
  }

  /**
   * Get video processing progress (if supported by backend)
   */
  async getProcessingProgress(taskId: string): Promise<{
    progress: number;
    status: "processing" | "completed" | "failed";
    result?: {
      videoUrl?: string;
      duration?: number;
      cloudUrl?: string;
    };
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/video-processing/progress/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting progress:", error);
      return {
        progress: 0,
        status: "failed",
      };
    }
  }
}

export const videoService = new VideoService();
export default videoService;
