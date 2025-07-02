import axios from "axios";

const API_BASE_URL = "https://adstudioserver.foodyqueen.com/api";

export interface CouponCode {
  code: string;
  isUsed: boolean;
  usedBy: {
    phoneNumber?: string;
    customerName?: string;
    usedAt?: string;
  };
  generatedAt: string;
}

export interface CouponCampaignStatistics {
  totalGenerated: number;
  totalUsed: number;
  usageRate: number;
}

export interface CouponCampaign {
  _id: string;
  campaignName: string;
  description?: string;
  userId: string;
  outletId: string;
  discountPercentage: number;
  validity: string;
  numberOfCoupons: number;
  couponCodes: CouponCode[];
  status: "draft" | "active" | "expired" | "completed";
  statistics: CouponCampaignStatistics;
  templateData?: unknown;
  templateImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  outletId_populated?: {
    _id: string;
    name: string;
    address: string;
  };
}

export interface CouponCampaignFilters {
  userId?: string;
  outletId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CouponCampaignResponse {
  success: boolean;
  data: CouponCampaign[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export interface CreateCouponCampaignData {
  campaignName: string;
  description?: string;
  userId: string;
  outletId: string;
  discountPercentage: number;
  validity: string;
  numberOfCoupons: number;
  templateData?: unknown;
  templateImageUrl?: string;
}

export interface CouponCampaignStatisticsOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  expiredCampaigns: number;
  completedCampaigns: number;
  totalCouponsGenerated: number;
  totalCouponsUsed: number;
  averageUsageRate: number;
}

export const couponCampaignService = {
  // Get all coupon campaigns with optional filtering
  async getCouponCampaigns(
    filters: CouponCampaignFilters = {}
  ): Promise<CouponCampaignResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/coupon-campaigns?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon campaigns:", error);
      throw error;
    }
  },

  // Get coupon campaign by ID
  async getCouponCampaign(
    id: string
  ): Promise<{ success: boolean; data: CouponCampaign; message?: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/coupon-campaigns/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon campaign:", error);
      throw error;
    }
  },

  // Create new coupon campaign
  async createCouponCampaign(
    campaignData: CreateCouponCampaignData
  ): Promise<{ success: boolean; data: CouponCampaign; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/coupon-campaigns`,
        campaignData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating coupon campaign:", error);
      throw error;
    }
  },

  // Update coupon campaign
  async updateCouponCampaign(
    id: string,
    campaignData: Partial<CreateCouponCampaignData>
  ): Promise<{ success: boolean; data: CouponCampaign; message: string }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/coupon-campaigns/${id}`,
        campaignData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating coupon campaign:", error);
      throw error;
    }
  },

  // Delete coupon campaign
  async deleteCouponCampaign(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/coupon-campaigns/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting coupon campaign:", error);
      throw error;
    }
  },

  // Get coupon campaign statistics overview
  async getCouponCampaignStatistics(
    filters: { userId?: string; outletId?: string } = {}
  ): Promise<{ success: boolean; data: CouponCampaignStatisticsOverview }> {
    try {
      const params = new URLSearchParams();

      if (filters.userId) params.append("userId", filters.userId);
      if (filters.outletId) params.append("outletId", filters.outletId);

      const response = await axios.get(
        `${API_BASE_URL}/coupon-campaigns/statistics?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon campaign statistics:", error);
      throw error;
    }
  },

  // Validate coupon code
  async validateCouponCode(code: string): Promise<{
    success: boolean;
    data?: {
      code: string;
      campaignName: string;
      discountPercentage: number;
      validity: string;
      isValid: boolean;
    };
    message: string;
  }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/coupon-campaigns/validate/${code}`
      );
      return response.data;
    } catch (error) {
      console.error("Error validating coupon code:", error);
      throw error;
    }
  },
  // Use coupon code
  async useCouponCode(
    code: string,
    phoneNumber: string,
    customerName?: string
  ): Promise<{
    success: boolean;
    data?: {
      campaignName: string;
      discountPercentage: number;
      code: string;
    };
    message: string;
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/coupon-campaigns/use/${code}`,
        { phoneNumber, customerName }
      );
      return response.data;
    } catch (error) {
      console.error("Error using coupon code:", error);
      throw error;
    }
  },

  // Get coupon codes for a campaign
  async getCouponCodes(
    campaignId: string,
    filters: {
      status?: "all" | "used" | "unused";
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{
    success: boolean;
    data: {
      codes: CouponCode[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      summary: {
        total: number;
        used: number;
        unused: number;
      };
    };
  }> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/coupon-campaigns/${campaignId}/codes?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon codes:", error);
      throw error;
    }
  },

  // Helper function to format dates
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Helper function to get time ago
  getTimeAgo: (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  },
};
