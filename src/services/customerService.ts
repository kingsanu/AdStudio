import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

export interface Customer {
  _id: string;
  phoneNumber: string;
  outletId: string;
  name: string;
  totalPayments: number;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  anniversary?: string;
  customerSegment: "vip" | "regular" | "new" | "inactive";
  lastVisit?: string;
  visitCount: number;
  averageOrderValue: number;
  isActive: boolean;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  outletId_populated?: {
    _id: string;
    name: string;
    address: string;
  };
}

export interface CustomerFilters {
  outletId?: string;
  segment?: string;
  minPayments?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CustomerResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export interface CreateCustomerData {
  phoneNumber: string;
  outletId: string;
  name: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  anniversary?: string;
  customerSegment?: "vip" | "regular" | "new" | "inactive";
  notes?: string;
  tags?: string[];
}

export interface BulkImportData {
  customers: CreateCustomerData[];
  outletId: string;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{
    phoneNumber: string;
    error: string;
  }>;
}

export const customerService = {
  // Get all customers with optional filtering
  async getCustomers(filters: CustomerFilters = {}): Promise<CustomerResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/customers?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // Get customer by ID
  async getCustomerById(
    id: string
  ): Promise<{ success: boolean; data: Customer; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  // Create new customer
  async createCustomer(
    customerData: CreateCustomerData
  ): Promise<{ success: boolean; data: Customer; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers`,
        customerData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(
    id: string,
    customerData: Partial<CreateCustomerData>
  ): Promise<{ success: boolean; data: Customer; message: string }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/customers/${id}`,
        customerData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },

  // Get customers by outlet
  async getCustomersByOutlet(
    outletId: string,
    options: {
      segment?: string;
      minPayments?: number;
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ): Promise<{
    success: boolean;
    data: Customer[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      const params = new URLSearchParams();

      if (options.segment) params.append("segment", options.segment);
      if (options.minPayments)
        params.append("minPayments", options.minPayments.toString());
      if (options.page) params.append("page", options.page.toString());
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.search) params.append("search", options.search);

      const response = await axios.get(
        `${API_BASE_URL}/customers/outlet/${outletId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching customers by outlet:", error);
      throw error;
    }
  },

  // Add payment to customer
  async addPayment(
    id: string,
    amount: number
  ): Promise<{ success: boolean; data: Customer; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers/${id}/payment`,
        { amount }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
  },

  // Bulk import customers
  async bulkImportCustomers(
    importData: BulkImportData
  ): Promise<{ success: boolean; data: BulkImportResult; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers/bulk-import`,
        importData
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk importing customers:", error);
      throw error;
    }
  },

  // Helper function to format phone number
  formatPhoneNumber(phoneNumber: string, countryCode: string = "+91"): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Add country code if not present
    if (!cleaned.startsWith(countryCode.replace("+", ""))) {
      return `${countryCode}${cleaned}`;
    }

    return `+${cleaned}`;
  },

  // Helper function to validate phone number
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for phone number (10-15 digits)
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  // Helper function to get customer segment color
  getSegmentColor(segment: string): string {
    switch (segment) {
      case "vip":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "regular":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "new":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  },

  // Helper function to format currency
  formatCurrency(amount: number, currency: string = "₹"): string {
    return `${currency}${amount.toLocaleString("en-IN")}`;
  },
};
