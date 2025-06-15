import axios from "axios";
import { USER_LIVEMENU_ENDPOINT, UPLOAD_LIVEMENU_TEMPLATE_ENDPOINT } from "canva-editor/utils/constants/api";

export interface LiveMenuData {
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

export interface LiveMenuResponse {
  message: string;
  liveMenu: LiveMenuData;
}

class LiveMenuService {
  /**
   * Get or create user's single live menu
   */
  async getUserLiveMenu(userId: string): Promise<LiveMenuResponse> {
    try {
      const response = await axios.get(USER_LIVEMENU_ENDPOINT, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting user live menu:", error);
      throw new Error("Failed to get user live menu");
    }
  }

  /**
   * Update user's live menu
   */
  async updateUserLiveMenu(
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
  ): Promise<LiveMenuResponse> {
    try {
      const response = await axios.put(USER_LIVEMENU_ENDPOINT, {
        userId,
        ...updates,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user live menu:", error);
      throw new Error("Failed to update user live menu");
    }
  }

  /**
   * Save live menu template and update live menu
   */
  async saveLiveMenuTemplate(
    userId: string,
    packedData: any,
    title?: string,
    description?: string
  ): Promise<LiveMenuResponse> {
    try {
      // First, upload the template JSON to cloud storage
      console.log("Uploading live menu template to cloud storage");
      const templateResponse = await axios.post(UPLOAD_LIVEMENU_TEMPLATE_ENDPOINT, {
        packedData,
        userId,
      });

      // Get the template URL from the response
      const templateUrl = templateResponse.data.templateUrl;
      console.log("Live menu template URL:", templateUrl);

      // Update the user's live menu with the new template
      const updateData: any = {
        templateUrl,
        templateData: packedData,
      };

      if (title) updateData.title = title;
      if (description) updateData.description = description;

      return await this.updateUserLiveMenu(userId, updateData);
    } catch (error) {
      console.error("Error saving live menu template:", error);
      throw new Error("Failed to save live menu template");
    }
  }

  /**
   * Load user's live menu in editor
   */
  async loadUserLiveMenuInEditor(userId: string): Promise<{
    liveMenuId: string;
    templateUrl?: string;
    templateData?: any;
  }> {
    try {
      const response = await this.getUserLiveMenu(userId);
      const liveMenu = response.liveMenu;

      return {
        liveMenuId: liveMenu.id,
        templateUrl: liveMenu.templateUrl,
        templateData: liveMenu.templateData,
      };
    } catch (error) {
      console.error("Error loading user live menu for editor:", error);
      throw new Error("Failed to load user live menu for editor");
    }
  }

  /**
   * Auto-save live menu changes
   */
  async autoSaveLiveMenu(
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
        await this.saveLiveMenuTemplate(userId, packedData);
        console.log("Live menu auto-saved successfully");
      } catch (error) {
        console.error("Live menu auto-save failed:", error);
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

export const liveMenuService = new LiveMenuService();
