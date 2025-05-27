import axios from "axios";
import { USER_KIOSK_ENDPOINT, UPLOAD_KIOSK_TEMPLATE_ENDPOINT } from "canva-editor/utils/constants/api";

export interface KioskData {
  id: string;
  title: string;
  description: string;
  templateUrl?: string;
  templateData?: any;
  pageImages: Array<{
    url: string;
    pageIndex: number;
  }>;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KioskResponse {
  message: string;
  kiosk: KioskData;
}

class KioskService {
  /**
   * Get or create user's single kiosk
   */
  async getUserKiosk(userId: string): Promise<KioskResponse> {
    try {
      const response = await axios.get(USER_KIOSK_ENDPOINT, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting user kiosk:", error);
      throw new Error("Failed to get user kiosk");
    }
  }

  /**
   * Update user's kiosk
   */
  async updateUserKiosk(
    userId: string,
    updates: {
      title?: string;
      description?: string;
      templateUrl?: string;
      templateData?: any;
      pageImages?: Array<{
        url: string;
        pageIndex: number;
      }>;
    }
  ): Promise<KioskResponse> {
    try {
      const response = await axios.put(USER_KIOSK_ENDPOINT, {
        userId,
        ...updates,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user kiosk:", error);
      throw new Error("Failed to update user kiosk");
    }
  }

  /**
   * Save kiosk template and update kiosk
   */
  async saveKioskTemplate(
    userId: string,
    packedData: any,
    title?: string,
    description?: string
  ): Promise<KioskResponse> {
    try {
      // First, upload the template JSON to cloud storage
      console.log("Uploading kiosk template to cloud storage");
      const templateResponse = await axios.post(UPLOAD_KIOSK_TEMPLATE_ENDPOINT, {
        packedData,
        userId,
      });

      // Get the template URL from the response
      const templateUrl = templateResponse.data.templateUrl;
      console.log("Template URL:", templateUrl);

      // Update the user's kiosk with the new template
      const updateData: any = {
        templateUrl,
        templateData: packedData,
      };

      if (title) updateData.title = title;
      if (description) updateData.description = description;

      const kioskResponse = await this.updateUserKiosk(userId, updateData);

      return kioskResponse;
    } catch (error) {
      console.error("Error saving kiosk template:", error);
      throw new Error("Failed to save kiosk template");
    }
  }

  /**
   * Load user's kiosk in editor
   */
  async loadUserKioskInEditor(userId: string): Promise<{
    kioskId: string;
    templateUrl?: string;
    templateData?: any;
  }> {
    try {
      const response = await this.getUserKiosk(userId);
      const kiosk = response.kiosk;

      return {
        kioskId: kiosk.id,
        templateUrl: kiosk.templateUrl,
        templateData: kiosk.templateData,
      };
    } catch (error) {
      console.error("Error loading user kiosk for editor:", error);
      throw new Error("Failed to load user kiosk for editor");
    }
  }

  /**
   * Auto-save kiosk changes
   */
  async autoSaveKiosk(
    userId: string,
    packedData: any,
    debounceMs: number = 2000
  ): Promise<void> {
    // Implement debounced auto-save
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await this.saveKioskTemplate(userId, packedData);
        console.log("Kiosk auto-saved successfully");
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, debounceMs);
  }

  private autoSaveTimeout: NodeJS.Timeout | null = null;

  /**
   * Clear auto-save timeout
   */
  clearAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }
}

// Export singleton instance
export const kioskService = new KioskService();
export default kioskService;
