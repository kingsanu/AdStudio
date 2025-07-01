/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import {
  FavoriteTemplate,
  FavoriteTemplateWithDetails,
} from "@/models/FavoriteTemplate";

const API_BASE_URL = "http://localhost:4000";

export interface TextTemplate {
  _id: string;
  title: string;
  description: string;
  templateUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string;
  userId: string;
  isPublic: boolean;
}

// Helper function to get favorites from localStorage
const getFavoritesFromStorage = (userId: string): FavoriteTemplate[] => {
  const favoritesJson = localStorage.getItem(`text_favorites_${userId}`);
  if (favoritesJson) {
    try {
      return JSON.parse(favoritesJson);
    } catch (error) {
      console.error("Error parsing text favorites from localStorage:", error);
      return [];
    }
  }
  return [];
};

// Helper function to save favorites to localStorage
const saveFavoritesToStorage = (
  userId: string,
  favorites: FavoriteTemplate[]
) => {
  localStorage.setItem(`text_favorites_${userId}`, JSON.stringify(favorites));
};

export const textTemplateService = {
  // Get all text templates with optional filtering and pagination
  async getTextTemplates(
    options: {
      userId?: string;
      isPublic?: boolean;
      onlyMine?: boolean;
      keyword?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<TextTemplate[]> {
    try {
      const {
        userId,
        isPublic,
        onlyMine,
        keyword,
        page = 1,
        limit = 10,
      } = options;

      // Build query parameters
      const params = new URLSearchParams();

      if (userId) {
        params.append("userId", userId);
      }

      if (isPublic !== undefined) {
        params.append("isPublic", isPublic.toString());
      }

      if (onlyMine !== undefined) {
        params.append("onlyMine", onlyMine.toString());
      }

      if (keyword) {
        params.append("kw", keyword);
      }

      // Add pagination parameters
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await axios.get(
        `${API_BASE_URL}/api/text-templates${queryString}`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching text templates:", error);
      return [];
    }
  },

  // Get text template by ID
  async getTextTemplateById(id: string): Promise<TextTemplate | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/text-templates/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching text template with ID ${id}:`, error);
      return null;
    }
  },

  // Helper function to fix image URLs
  fixImageUrl(url: string): string {
    // Check if the URL is from the blob storage
    if (url.includes("foodyqueen.blob.core.windows.net/blob")) {
      return url;
    }

    // Check if the URL is from the business API
    if (url.includes("business.foodyqueen.com/blob")) {
      return url.replace(
        "business.foodyqueen.com/blob",
        "foodyqueen.blob.core.windows.net/blob"
      );
    }

    // If it's a relative URL, prepend the API base URL
    if (url.startsWith("/")) {
      return `${API_BASE_URL}${url}`;
    }

    return url;
  },

  // Add a text template to favorites
  addToFavorites(templateId: string, userId: string): boolean {
    try {
      const favorites = getFavoritesFromStorage(userId);

      // Check if already in favorites
      if (favorites.some((fav) => fav.templateId === templateId)) {
        return true; // Already a favorite
      }

      // Add to favorites
      const newFavorite: FavoriteTemplate = {
        templateId,
        userId,
        createdAt: new Date().toISOString(),
      };

      favorites.push(newFavorite);
      saveFavoritesToStorage(userId, favorites);
      return true;
    } catch (error) {
      console.error("Error adding text template to favorites:", error);
      return false;
    }
  },

  // Remove a text template from favorites
  removeFromFavorites(templateId: string, userId: string): boolean {
    try {
      let favorites = getFavoritesFromStorage(userId);

      // Filter out the template to remove
      favorites = favorites.filter((fav) => fav.templateId !== templateId);

      saveFavoritesToStorage(userId, favorites);
      return true;
    } catch (error) {
      console.error("Error removing text template from favorites:", error);
      return false;
    }
  },

  // Check if a text template is in favorites
  isFavorite(templateId: string, userId: string): boolean {
    try {
      const favorites = getFavoritesFromStorage(userId);
      return favorites.some((fav) => fav.templateId === templateId);
    } catch (error) {
      console.error("Error checking if text template is favorite:", error);
      return false;
    }
  },

  // Get all favorite text templates for a user
  async getFavoriteTextTemplates(
    userId: string
  ): Promise<FavoriteTemplateWithDetails[]> {
    try {
      const favorites = getFavoritesFromStorage(userId);

      if (favorites.length === 0) {
        return [];
      }

      // Get template details for each favorite
      const favoriteTemplatesWithDetails: FavoriteTemplateWithDetails[] = [];

      for (const favorite of favorites) {
        try {
          const template = await this.getTextTemplateById(favorite.templateId);
          if (template) {
            favoriteTemplatesWithDetails.push({
              ...favorite,
              title: template.title,
              description: template.description,
              thumbnailUrl: template.thumbnailUrl,
              templateUrl: template.templateUrl,
              isPublic: template.isPublic,
            });
          }
        } catch (templateError) {
          console.error(
            `Error fetching details for text template ${favorite.templateId}:`,
            templateError
          );
          // Still include the favorite, but without details
          favoriteTemplatesWithDetails.push(favorite);
        }
      }

      return favoriteTemplatesWithDetails;
    } catch (error) {
      console.error("Error getting favorite text templates:", error);
      return [];
    }
  },

  // Save a new text template
  async saveTextTemplate(templateData: {
    packedData: any;
    previewImage: string;
    templateName: string;
    templateDesc: string;
    tags?: string[];
    userId: string;
    isPublic?: boolean;
  }): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/upload-text-template`,
        templateData
      );

      if (
        response.data &&
        response.data.template &&
        response.data.template.id
      ) {
        return {
          success: true,
          templateId: response.data.template.id,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error saving text template:", error);
      let errorMessage = "Failed to save text template";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Update an existing text template
  async updateTextTemplate(
    templateId: string,
    templateData: {
      packedData: any;
      previewImage: string;
      templateName: string;
      templateDesc: string;
      tags?: string[];
      userId: string;
      isPublic?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/upload-text-template/${templateId}`,
        templateData
      );

      return { success: true };
    } catch (error) {
      console.error(`Error updating text template ${templateId}:`, error);
      let errorMessage = "Failed to update text template";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Delete a text template
  async deleteTextTemplate(
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.delete(`${API_BASE_URL}/api/text-templates/${templateId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting text template ${templateId}:`, error);
      let errorMessage = "Failed to delete text template";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
