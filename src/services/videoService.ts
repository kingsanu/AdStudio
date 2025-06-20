import axios from "axios";
import { UPLOAD_IMAGE_ENDPOINT } from "@/constants";

interface VideoGenerationOptions {
  duration?: number;
  transitionEffect?: string;
  resolution?: string;
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
    this.baseUrl = "https://adstudioserver.foodyqueen.com/api";
  }

  /**
   * Automatically generate media based on page count
   * - Single page: Upload as image
   * - Multiple pages: Create video slideshow
   */
  async generateCampaignMedia(pageImages: string[]): Promise<{
    mediaUrl: string;
    mediaType: "image" | "video";
  }> {
    if (pageImages.length === 0) {
      throw new Error("No pages provided");
    }

    if (pageImages.length === 1) {
      // Single page - upload as image
      const result = await this.uploadImage(pageImages[0]);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to upload image");
      }
      return {
        mediaUrl: result.data.cloudUrl ?? result.data.imageUrl,
        mediaType: "image",
      };
    } else {
      // Multiple pages - create video
      const result = await this.createSlideshow(pageImages);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to create video");
      }
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
   */
  async createSlideshow(
    imageDataUrls: string[],
    options: VideoGenerationOptions = {}
  ): Promise<VideoGenerationResult> {
    try {
      const formData = new FormData();

      // Convert each data URL to blob and append to form data
      for (let i = 0; i < imageDataUrls.length; i++) {
        const response = await fetch(imageDataUrls[i]);
        const blob = await response.blob();
        formData.append("images", blob, `page-${i + 1}.png`);
      } // Add options
      formData.append("duration", (options.duration ?? 3).toString());
      formData.append("transitionEffect", options.transitionEffect ?? "fade");
      formData.append("resolution", options.resolution ?? "1920x1080");

      const response = await axios.post(
        `${this.baseUrl}/video-processing/create-slideshow-video`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 2 minutes timeout for video processing
        }
      );
      if (response.data.success && response.data.videoUrl) {
        return {
          success: true,
          data: {
            videoUrl: response.data.videoUrl,
            duration: response.data.duration,
            cloudUrl: response.data.cloudUrl ?? response.data.videoUrl,
          },
        };
      } else {
        return {
          success: false,
          error: response.data.message ?? "Failed to create video",
        };
      }
    } catch (error: unknown) {
      console.error("Error creating slideshow:", error);
      return {
        success: false,
        error: (error as Error).message ?? "Failed to create slideshow video",
      };
    }
  }

  /**
   * Get video processing progress (if supported by backend)
   */ async getProcessingProgress(taskId: string): Promise<{
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
