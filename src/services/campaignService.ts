import axios from "axios";

const API_BASE_URL = "https://adstudioserver.foodyqueen.com/api";

export interface CampaignTarget {
  customerId: string;
  phoneNumber: string;
  name: string;
  status: "pending" | "sent" | "delivered" | "failed";
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
}

export interface CampaignStatistics {
  totalTargets: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  successRate: number;
}

export interface CampaignError {
  phoneNumber: string;
  error: string;
  timestamp: string;
}

export interface CustomerFilters {
  segments?: string[];
  minPayments?: number;
  maxPayments?: number;
  tags?: string[];
}

export interface Campaign {
  _id: string;
  campaignName: string;
  description?: string;
  userId: string;
  outletId: string;
  whatsappUsername: string;
  targetCustomers: CampaignTarget[];
  message: string;
  imageUrl?: string;
  status:
    | "draft"
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  statistics: CampaignStatistics;
  errors: CampaignError[];
  campaignType: "immediate" | "scheduled" | "recurring";
  customerFilters?: CustomerFilters;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  outletId_populated?: {
    _id: string;
    name: string;
    address: string;
  };
}

export interface CampaignFilters {
  userId?: string;
  outletId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CampaignResponse {
  success: boolean;
  data: Campaign[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export interface CreateCampaignData {
  campaignName: string;
  description?: string;
  userId: string;
  outletId: string;
  whatsappUsername: string;
  message: string;
  imageUrl?: string;
  campaignType?: "immediate" | "scheduled" | "recurring";
  scheduledAt?: string;
  customerFilters?: CustomerFilters;
  targetCustomers?: Array<{
    customerId: string;
    phoneNumber: string;
    name: string;
  }>;
}

export interface CampaignStatisticsOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  failedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
  averageSuccessRate: number;
}

export interface WhatsAppAccount {
  username: string;
  status: "connected" | "disconnected" | "connecting";
  qrCode?: string;
  qrContentType?: string;
  lastActive?: string;
  deviceInfo?: {
    platform: string;
    pushname: string;
    phone: {
      device_manufacturer: string;
      device_model: string;
      os_version: string;
      wa_version: string;
    };
  };
}

export const campaignService = {
  // Get all campaigns with optional filtering
  async getCampaigns(filters: CampaignFilters = {}): Promise<CampaignResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/campaigns?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      throw error;
    }
  },

  // Get campaign by ID
  async getCampaign(
    id: string
  ): Promise<{ success: boolean; data: Campaign; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching campaign:", error);
      throw error;
    }
  },

  // Alias for getCampaign
  getCampaignById(id: string) {
    return this.getCampaign(id);
  },

  // Check WhatsApp account status
  async getWhatsAppStatus(
    username: string
  ): Promise<{ success: boolean; data: WhatsAppAccount; message?: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/${username}/status`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      throw error;
    }
  },

  // Get all WhatsApp accounts for user
  async getWhatsAppAccounts(
    userId: string
  ): Promise<{ success: boolean; data: WhatsAppAccount[]; message?: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/accounts?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching WhatsApp accounts:", error);
      throw error;
    }
  },

  // Connect to WhatsApp
  async connectWhatsApp(username: string): Promise<{
    success: boolean;
    data: { qrCode?: string; qrContentType?: string };
    message: string;
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/${username}/connect`
      );
      return response.data;
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      throw error;
    }
  },

  // Disconnect from WhatsApp
  async disconnectWhatsApp(
    username: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/${username}/disconnect`
      );
      return response.data;
    } catch (error) {
      console.error("Error disconnecting from WhatsApp:", error);
      throw error;
    }
  },

  // Create new campaign
  async createCampaign(
    campaignData: CreateCampaignData
  ): Promise<{ success: boolean; data: Campaign; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/campaigns`,
        campaignData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  },

  // Update campaign
  async updateCampaign(
    id: string,
    campaignData: Partial<CreateCampaignData>
  ): Promise<{ success: boolean; data: Campaign; message: string }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/campaigns/${id}`,
        campaignData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating campaign:", error);
      throw error;
    }
  },

  // Delete campaign
  async deleteCampaign(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      throw error;
    }
  },

  // Launch campaign
  async launchCampaign(
    id: string
  ): Promise<{ success: boolean; data: Campaign; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/campaigns/${id}/launch`
      );
      return response.data;
    } catch (error) {
      console.error("Error launching campaign:", error);
      throw error;
    }
  },

  // Retry failed campaign
  async retryCampaign(
    id: string
  ): Promise<{ success: boolean; data?: Campaign; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/campaigns/${id}/retry`
      );
      return response.data;
    } catch (error) {
      console.error("Error retrying campaign:", error);
      throw error;
    }
  },

  // Get campaign statistics overview
  async getCampaignStatistics(
    filters: { userId?: string; outletId?: string } = {}
  ): Promise<{ success: boolean; data: CampaignStatisticsOverview }> {
    try {
      const params = new URLSearchParams();

      if (filters.userId) params.append("userId", filters.userId);
      if (filters.outletId) params.append("outletId", filters.outletId);

      const response = await axios.get(
        `${API_BASE_URL}/campaigns/statistics?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching campaign statistics:", error);
      throw error;
    }
  },

  // Helper function to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  },

  // Helper function to get status icon
  getStatusIcon(status: string): string {
    switch (status) {
      case "draft":
        return "📝";
      case "pending":
        return "⏳";
      case "running":
        return "🚀";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "cancelled":
        return "🚫";
      default:
        return "❓";
    }
  },

  // Helper function to format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Helper function to calculate time ago
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  },

  // Helper function to validate WhatsApp username
  validateWhatsAppUsername(username: string): boolean {
    // Basic validation for WhatsApp username
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  },
};
