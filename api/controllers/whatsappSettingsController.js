/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const WhatsAppSettings = require("../models/whatsappSettings");
const axios = require("axios");

const WHATSAPP_API = {
  BASE_URL: "http://whatsapp.foodyqueen.com",
  START_SESSION: (username) =>
    `${WHATSAPP_API.BASE_URL}/session/start/${username}`,
  CHECK_STATUS: (username) =>
    `${WHATSAPP_API.BASE_URL}/session/status/${username}`,
  RESTART_SESSION: (username) =>
    `${WHATSAPP_API.BASE_URL}/session/restart/${username}`,
  GET_QR_CODE: (username) =>
    `${WHATSAPP_API.BASE_URL}/session/qr/${username}/image`,
};

const whatsappSettingsController = {
  // Get WhatsApp settings for a user
  getWhatsAppSettings: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Find WhatsApp settings for the user
      const settings = await WhatsAppSettings.findOne({ userId });

      if (!settings) {
        return res.status(404).json({
          message: "WhatsApp settings not found for this user",
        });
      }

      return res.status(200).json({
        message: "WhatsApp settings retrieved successfully",
        settings,
      });
    } catch (error) {
      console.error("Error retrieving WhatsApp settings:", error);
      return res.status(500).json({
        message: "Error retrieving WhatsApp settings",
        error: error.message,
      });
    }
  },

  // Create or update WhatsApp settings for a user
  saveWhatsAppSettings: async (req, res) => {
    try {
      const { userId, username } = req.body;

      if (!userId || !username) {
        return res.status(400).json({
          message: "User ID and WhatsApp username are required",
        });
      }

      // Find existing settings or create new ones
      let settings = await WhatsAppSettings.findOne({ userId });

      if (settings) {
        // Update existing settings
        settings.username = username;
        settings.updatedAt = new Date();
        await settings.save();
      } else {
        // Create new settings
        settings = new WhatsAppSettings({
          userId,
          username,
        });
        await settings.save();
      }

      return res.status(200).json({
        message: "WhatsApp settings saved successfully",
        settings,
      });
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
      return res.status(500).json({
        message: "Error saving WhatsApp settings",
        error: error.message,
      });
    }
  },

  // Delete WhatsApp settings for a user
  deleteWhatsAppSettings: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Find and delete WhatsApp settings
      const result = await WhatsAppSettings.deleteOne({ userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "WhatsApp settings not found for this user",
        });
      }

      return res.status(200).json({
        message: "WhatsApp settings deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting WhatsApp settings:", error);
      return res.status(500).json({
        message: "Error deleting WhatsApp settings",
        error: error.message,
      });
    }
  },

  // Start a WhatsApp session
  startSession: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Find WhatsApp settings for the user
      const settings = await WhatsAppSettings.findOne({ userId });

      if (!settings) {
        return res.status(404).json({
          message: "WhatsApp settings not found for this user",
          status: "disconnected",
        });
      }

      try {
        // Call the WhatsApp API to start a session
        await axios.get(WHATSAPP_API.START_SESSION(settings.username), {
          timeout: 60000, // 10 second timeout
        });

        // Update the connection status to connecting
        settings.connectionStatus = "connecting";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "WhatsApp session started successfully",
          status: "connecting",
          lastChecked: settings.lastChecked,
          success: true,
        });
      } catch (error) {
        console.error("Error starting WhatsApp session:", error);

        // Check if the error is because the session already exists
        if (
          error.response &&
          error.response.data &&
          error.response.data.error &&
          error.response.data.error.includes("Session already exists")
        ) {
          // This is not a real error for our purposes
          // Update the settings with connecting status
          settings.connectionStatus = "connecting";
          settings.lastChecked = new Date();
          await settings.save();

          return res.status(200).json({
            message: "WhatsApp session already exists",
            status: "connecting",
            lastChecked: settings.lastChecked,
            success: true,
            sessionExists: true,
          });
        }

        // This is a real error
        // Update the settings with error status
        settings.connectionStatus = "error";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "Error starting WhatsApp session",
          status: "error",
          lastChecked: settings.lastChecked,
          error: error.response?.data?.error || error.message,
          success: false,
        });
      }
    } catch (error) {
      console.error("Error in startSession:", error);
      return res.status(500).json({
        message: "Error starting WhatsApp session",
        error: error.message,
        success: false,
      });
    }
  },

  // Check WhatsApp connection status
  checkConnectionStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Find WhatsApp settings for the user
      const settings = await WhatsAppSettings.findOne({ userId });

      if (!settings) {
        return res.status(404).json({
          message: "WhatsApp settings not found for this user",
          status: "disconnected",
        });
      }

      try {
        // Call the WhatsApp API to check status
        const response = await axios.get(
          WHATSAPP_API.CHECK_STATUS(settings.username),
          {
            timeout: 60000, // 10 second timeout
          }
        );

        // Update the connection status based on the response
        let connectionStatus = "disconnected";

        // Handle both response formats: either status or state property
        if (response.data) {
          if (response.data.success && response.data.state === "CONNECTED") {
            // New response format: { success: true, state: "CONNECTED", message: "session_connected" }
            connectionStatus = "connected";
          } else if (response.data.status === "CONNECTED") {
            // Old response format with status property
            connectionStatus = "connected";
          } else if (
            response.data.status === "CONNECTING" ||
            response.data.state === "CONNECTING"
          ) {
            connectionStatus = "connecting";
          } else {
            connectionStatus = "disconnected";
          }
        }

        // Update the settings with the new status
        settings.connectionStatus = connectionStatus;
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "WhatsApp connection status checked successfully",
          status: connectionStatus,
          lastChecked: settings.lastChecked,
        });
      } catch (error) {
        console.error("Error checking WhatsApp connection status:", error);

        // Update the settings with error status
        settings.connectionStatus = "error";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "Error checking WhatsApp connection status",
          status: "error",
          lastChecked: settings.lastChecked,
          error: error.message,
        });
      }
    } catch (error) {
      console.error("Error in checkConnectionStatus:", error);
      return res.status(500).json({
        message: "Error checking WhatsApp connection status",
        error: error.message,
      });
    }
  },

  // Restart WhatsApp session
  restartSession: async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Find WhatsApp settings for the user
      const settings = await WhatsAppSettings.findOne({ userId });

      if (!settings) {
        return res.status(404).json({
          message: "WhatsApp settings not found for this user",
        });
      }

      try {
        // Call the WhatsApp API to restart session
        const response = await axios.get(
          WHATSAPP_API.RESTART_SESSION(settings.username),
          {
            timeout: 10000, // 10 second timeout
          }
        );

        // Update the connection status to connecting
        settings.connectionStatus = "connecting";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "WhatsApp session restart initiated",
          status: "connecting",
          lastChecked: settings.lastChecked,
          apiResponse: response.data,
        });
      } catch (error) {
        console.error("Error restarting WhatsApp session:", error);

        // Update the settings with error status
        settings.connectionStatus = "error";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "Error restarting WhatsApp session",
          status: "error",
          lastChecked: settings.lastChecked,
          error: error.message,
        });
      }
    } catch (error) {
      console.error("Error in restartSession:", error);
      return res.status(500).json({
        message: "Error restarting WhatsApp session",
        error: error.message,
      });
    }
  },

  // Get WhatsApp QR code
  getQRCode: async (req, res) => {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({
          message: "Username is required",
        });
      }

      try {
        console.log("fetching qr code");
        // Call the WhatsApp API to get the QR code
        const response = await axios.get(WHATSAPP_API.GET_QR_CODE(username), {
          timeout: 60000, // 10 second timeout
          responseType: "stream", // Important: get the response as a stream
        });

        // Set the appropriate headers
        res.setHeader("Content-Type", response.headers["content-type"]);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        // Pipe the image data directly to the response
        response.data.pipe(res);
      } catch (error) {
        console.error("Error getting WhatsApp QR code:", error);

        // Return a 500 error with the error message
        return res.status(500).json({
          message: "Error getting WhatsApp QR code",
          error: error.message,
        });
      }
    } catch (error) {
      console.error("Error in getQRCode:", error);
      return res.status(500).json({
        message: "Error getting WhatsApp QR code",
        error: error.message,
      });
    }
  },
};

module.exports = whatsappSettingsController;
