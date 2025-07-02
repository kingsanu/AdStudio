import axios from "axios";

const API_BASE_URL = "https://adstudioserver.foodyqueen.com/api";

export interface Outlet {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  userId: string;
  businessName: string;
  businessType: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutletFilters {
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OutletResponse {
  success: boolean;
  data: Outlet[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export interface CreateOutletData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  userId: string;
  businessName?: string;
  businessType?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export const outletService = {
  // Get all outlets with optional filtering
  async getOutlets(filters: OutletFilters = {}): Promise<OutletResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/outlets?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching outlets:", error);
      throw error;
    }
  },

  // Get outlet by ID
  async getOutletById(
    id: string
  ): Promise<{ success: boolean; data: Outlet; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/outlets/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching outlet:", error);
      throw error;
    }
  },

  // Create new outlet
  async createOutlet(
    outletData: CreateOutletData
  ): Promise<{ success: boolean; data: Outlet; message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/outlets`, outletData);
      return response.data;
    } catch (error) {
      console.error("Error creating outlet:", error);
      throw error;
    }
  },

  // Update outlet
  async updateOutlet(
    id: string,
    outletData: Partial<CreateOutletData>
  ): Promise<{ success: boolean; data: Outlet; message: string }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/outlets/${id}`,
        outletData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating outlet:", error);
      throw error;
    }
  },

  // Delete outlet
  async deleteOutlet(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/outlets/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting outlet:", error);
      throw error;
    }
  },

  // Get outlets by user
  async getOutletsByUser(
    userId: string
  ): Promise<{ success: boolean; data: Outlet[] }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/outlets/user/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching outlets by user:", error);
      throw error;
    }
  },

  // Get or create default outlet for user
  async getOrCreateDefaultOutlet(
    userId: string,
    options: { name?: string; businessName?: string } = {}
  ): Promise<{ success: boolean; data: Outlet; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/outlets/user/${userId}/default`,
        options
      );
      return response.data;
    } catch (error) {
      console.error("Error getting or creating default outlet:", error);
      throw error;
    }
  },
};
