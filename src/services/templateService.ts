import axios from "axios";
import {
  FavoriteTemplate,
  FavoriteTemplateWithDetails,
} from "@/models/FavoriteTemplate";

const API_BASE_URL = "http://localhost:4000";

export interface Template {
  _id: string;
  title: string;
  description: string;
  templateUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string;
  userId: string;
  pages?: number;
  isPublic: boolean;
}

export interface UploadedImage {
  _id: string;
  userId: string;
  url: string;
  filename: string;
  createdAt: string;
}

// Helper function to get favorites from localStorage
const getFavoritesFromStorage = (userId: string): FavoriteTemplate[] => {
  const favoritesJson = localStorage.getItem(`favorites_${userId}`);
  if (favoritesJson) {
    try {
      return JSON.parse(favoritesJson);
    } catch (error) {
      console.error("Error parsing favorites from localStorage:", error);
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
  localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
};

export const templateService = {
  // Get all templates with optional filtering and pagination
  async getTemplates(
    options: {
      userId?: string;
      isPublic?: boolean;
      onlyMine?: boolean;
      keyword?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<Template[]> {
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
        `${API_BASE_URL}/api/templates${queryString}`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching templates:", error);
      return [];
    }
  },

  // Get user's uploaded images
  async getUserImages(userId: string): Promise<UploadedImage[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user-images?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user images:", error);
      return [];
    }
  },

  // Get public images
  async getPublicImages(): Promise<UploadedImage[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public-images`);
      return response.data;
    } catch (error) {
      console.error("Error fetching public images:", error);
      return [];
    }
  },

  // Get template by ID
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching template with ID ${id}:`, error);
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
  // Add a template to favorites
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
      console.error("Error adding template to favorites:", error);
      return false;
    }
  },

  // Remove a template from favorites
  removeFromFavorites(templateId: string, userId: string): boolean {
    try {
      let favorites = getFavoritesFromStorage(userId);

      // Filter out the template to remove
      favorites = favorites.filter((fav) => fav.templateId !== templateId);

      saveFavoritesToStorage(userId, favorites);
      return true;
    } catch (error) {
      console.error("Error removing template from favorites:", error);
      return false;
    }
  },

  // Check if a template is in favorites
  isFavorite(templateId: string, userId: string): boolean {
    try {
      const favorites = getFavoritesFromStorage(userId);
      return favorites.some((fav) => fav.templateId === templateId);
    } catch (error) {
      console.error("Error checking if template is favorite:", error);
      return false;
    }
  },

  // Get all favorite templates for a user
  async getFavoriteTemplates(
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
          const template = await this.getTemplateById(favorite.templateId);
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
            `Error fetching details for template ${favorite.templateId}:`,
            templateError
          );
          // Still include the favorite, but without details
          favoriteTemplatesWithDetails.push(favorite);
        }
      }

      return favoriteTemplatesWithDetails;
    } catch (error) {
      console.error("Error getting favorite templates:", error);
      return [];
    }
  },
};
