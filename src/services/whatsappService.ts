/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

export type WhatsAppConnectionState =
  | "checking"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface WhatsAppSettings {
  _id: string;
  userId: string;
  username: string;
  connectionStatus: WhatsAppConnectionState;
  lastChecked: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppStatusResponse {
  message: string;
  settings?: WhatsAppSettings;
  status?: WhatsAppConnectionState;
  lastChecked?: string;
  isConnected?: boolean;
  error?: string;
}

export const whatsappService = {
  // Get WhatsApp settings for a user
  async getSettings(userId: string): Promise<WhatsAppSettings | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp-settings/${userId}`
      );

      if (response.data && response.data.settings) {
        // Store in localStorage for offline access
        localStorage.setItem(
          "whatsapp_settings",
          JSON.stringify(response.data.settings)
        );
        return response.data.settings;
      }

      return null;
    } catch (error) {
      console.error("Error fetching WhatsApp settings:", error);

      // Try to get from localStorage if API call fails
      const cachedSettings = localStorage.getItem("whatsapp_settings");
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }

      return null;
    }
  },

  // Save WhatsApp settings for a user
  async saveSettings(
    userId: string,
    username: string
  ): Promise<WhatsAppSettings | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp-settings`, {
        userId,
        username,
      });

      if (response.data && response.data.settings) {
        // Store in localStorage for offline access
        localStorage.setItem(
          "whatsapp_settings",
          JSON.stringify(response.data.settings)
        );
        return response.data.settings;
      }

      return null;
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
      return null;
    }
  },

  // Delete WhatsApp settings for a user
  async deleteSettings(userId: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/whatsapp-settings/${userId}`);

      // Remove from localStorage
      localStorage.removeItem("whatsapp_settings");

      return true;
    } catch (error) {
      console.error("Error deleting WhatsApp settings:", error);
      return false;
    }
  },

  // Get WhatsApp settings from localStorage (for offline access)
  getLocalSettings(): WhatsAppSettings | null {
    const settings = localStorage.getItem("whatsapp_settings");
    return settings ? JSON.parse(settings) : null;
  },

  // Check WhatsApp connection status
  async checkConnectionStatus(
    userId: string
  ): Promise<{ status: WhatsAppConnectionState; lastChecked: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp-status/${userId}`
      );

      if (response.data) {
        // Handle both response formats: either status or state property
        let connectionStatus: WhatsAppConnectionState = "disconnected";

        if (response.data.success && response.data.state === "CONNECTED") {
          // New response format: { success: true, state: "CONNECTED", message: "session_connected" }
          connectionStatus = "connected";
        } else if (response.data.status) {
          // Old response format with status property
          connectionStatus = response.data.status;
        }

        // Update local storage with the latest status
        const settings = await this.getSettings(userId);
        if (settings) {
          settings.connectionStatus = connectionStatus;
          settings.lastChecked = response.data.lastChecked;
          localStorage.setItem("whatsapp_settings", JSON.stringify(settings));
        }

        return {
          status: connectionStatus,
          lastChecked: response.data.lastChecked,
        };
      }

      return {
        status: "error",
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error checking WhatsApp connection status:", error);
      return {
        status: "error",
        lastChecked: new Date().toISOString(),
      };
    }
  },

  // Restart WhatsApp session
  async restartSession(
    userId: string
  ): Promise<{ status: WhatsAppConnectionState; lastChecked: string }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp-restart/${userId}`
      );

      if (response.data) {
        // Update local storage with the latest status
        const settings = await this.getSettings(userId);
        if (settings) {
          settings.connectionStatus = response.data.status;
          settings.lastChecked = response.data.lastChecked;
          localStorage.setItem("whatsapp_settings", JSON.stringify(settings));
        }

        return {
          status: response.data.status,
          lastChecked: response.data.lastChecked,
        };
      }

      return {
        status: "error",
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error restarting WhatsApp session:", error);
      return {
        status: "error",
        lastChecked: new Date().toISOString(),
      };
    }
  },

  // Terminate WhatsApp session
  async terminateSession(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Terminating WhatsApp session for user ${userId}`);
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp-terminate/${userId}`
      );

      return {
        success: response.data && response.data.success,
        message: response.data?.message || "Session terminated successfully",
      };
    } catch (error) {
      console.error("Error terminating WhatsApp session:", error);

      return {
        success: false,
        message: "Failed to terminate WhatsApp session",
      };
    }
  },

  // Start a new WhatsApp session (with automatic termination if session exists)
  async startSession(
    userId: string
  ): Promise<{ success: boolean; message: string; state?: string }> {
    try {
      console.log(`Starting WhatsApp session for user ${userId}`);
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp-start/${userId}`
      );
      console.log(response);
      // Handle both response formats
      return {
        success: response.data && response.data.success,
        message: response.data?.message || "Session started successfully",
        state: response.data?.state, // Include state from new response format if available
      };
    } catch (error: any) {
      console.error("Error starting WhatsApp session:", error);

      // Check if error is "session already exists"
      if (
        error.response?.status === 422 &&
        error.response?.data?.error?.includes("Session already exists")
      ) {
        console.log("Session already exists, terminating and retrying...");

        // Terminate existing session
        const terminateResult = await this.terminateSession(userId);

        if (terminateResult.success) {
          // Wait a bit for termination to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Retry starting session
          try {
            const retryResponse = await axios.get(
              `${API_BASE_URL}/whatsapp-start/${userId}`
            );

            return {
              success: retryResponse.data && retryResponse.data.success,
              message:
                retryResponse.data?.message ||
                "Session started successfully after termination",
              state: retryResponse.data?.state,
            };
          } catch (retryError) {
            console.error("Error retrying session start:", retryError);
            return {
              success: false,
              message: "Failed to start session after termination",
            };
          }
        } else {
          return {
            success: false,
            message: "Failed to terminate existing session",
          };
        }
      }

      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to start WhatsApp session",
      };
    }
  },

  // Get QR code URL for WhatsApp connection
  getQRCodeUrl(username: string): string {
    // Use the backend API to proxy the QR code request
    // This ensures proper handling of CORS and authentication
    return `${API_BASE_URL}/whatsapp-qr/${username}?t=${Date.now()}`;

    // Direct access to WhatsApp API is not used here to avoid CORS issues
    // The backend proxy handles the actual request to:
    // WHATSAPP_API.GET_QR_CODE(username)
  },

  // Helper function to get status color
  getStatusColor(status: WhatsAppConnectionState): string {
    switch (status) {
      case "connected":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "connecting":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "disconnected":
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
      case "checking":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      case "error":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  },

  // Helper function to get status icon
  getStatusIcon(status: WhatsAppConnectionState): string {
    switch (status) {
      case "connected":
        return "✅";
      case "connecting":
        return "🔄";
      case "disconnected":
        return "❌";
      case "checking":
        return "🔍";
      case "error":
        return "⚠️";
      default:
        return "❓";
    }
  },

  // Helper function to get status text
  getStatusText(status: WhatsAppConnectionState): string {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      case "checking":
        return "Checking...";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  },
};
