import axios from "axios";
import { API_BASE_URL } from "./config";
import { WHATSAPP_API, WhatsAppConnectionState } from "@/constants/whatsapp";

export interface WhatsAppSettings {
  _id: string;
  userId: string;
  username: string;
  connectionStatus: WhatsAppConnectionState;
  lastChecked: string;
  createdAt: string;
  updatedAt: string;
}

export const whatsappService = {
  // Get WhatsApp settings for a user
  async getSettings(userId: string): Promise<WhatsAppSettings | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/whatsapp-settings/${userId}`
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
      const response = await axios.post(
        `${API_BASE_URL}/api/whatsapp-settings`,
        {
          userId,
          username,
        }
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
      console.error("Error saving WhatsApp settings:", error);
      return null;
    }
  },

  // Delete WhatsApp settings for a user
  async deleteSettings(userId: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/api/whatsapp-settings/${userId}`);

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
        `${API_BASE_URL}/api/whatsapp-status/${userId}`
      );

      if (response.data) {
        // Handle both response formats: either status or state property
        let connectionStatus = WhatsAppConnectionState.DISCONNECTED;

        if (response.data.success && response.data.state === "CONNECTED") {
          // New response format: { success: true, state: "CONNECTED", message: "session_connected" }
          connectionStatus = WhatsAppConnectionState.CONNECTED;
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
        status: WhatsAppConnectionState.ERROR,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error checking WhatsApp connection status:", error);
      return {
        status: WhatsAppConnectionState.ERROR,
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
        `${API_BASE_URL}/api/whatsapp-restart/${userId}`
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
        status: WhatsAppConnectionState.ERROR,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error restarting WhatsApp session:", error);
      return {
        status: WhatsAppConnectionState.ERROR,
        lastChecked: new Date().toISOString(),
      };
    }
  },

  // Start a new WhatsApp session
  async startSession(
    userId: string
  ): Promise<{ success: boolean; message: string; state?: string }> {
    try {
      console.log(`Starting WhatsApp session for user ${userId}`);
      const response = await axios.get(
        `${API_BASE_URL}/api/whatsapp-start/${userId}`
      );

      // Handle both response formats
      return {
        success: response.data && response.data.success,
        message: response.data?.message || "Session started successfully",
        state: response.data?.state, // Include state from new response format if available
      };
    } catch (error) {
      console.error("Error starting WhatsApp session:", error);

      return {
        success: false,
        message: "Failed to start WhatsApp session",
      };
    }
  },

  // Get QR code URL for WhatsApp connection
  getQRCodeUrl(username: string): string {
    // Use the backend API to proxy the QR code request
    // This ensures proper handling of CORS and authentication
    return `${API_BASE_URL}/api/whatsapp-qr/${username}?t=${Date.now()}`;

    // Direct access to WhatsApp API is not used here to avoid CORS issues
    // The backend proxy handles the actual request to:
    // WHATSAPP_API.GET_QR_CODE(username)
  },

  // Send WhatsApp message
  async sendMessage(
    username: string,
    number: string,
    message: string,
    document?: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(WHATSAPP_API.SEND_MESSAGE(username), {
        number,
        message,
        document,
      });

      return response.data && response.data.success;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return false;
    }
  },
};
