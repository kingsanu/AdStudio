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
  TERMINATE_SESSION: (username) =>
    `${WHATSAPP_API.BASE_URL}/session/terminate/${username}`,
  GET_QR_CODE: (username) =>
    `${WHATSAPP_API.BASE_URL}/session/qr/${username}/image`,
  GET_QR_DATA: (username) => `${WHATSAPP_API.BASE_URL}/session/qr/${username}`,
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
          // Return 422 status to trigger frontend termination logic
          return res.status(422).json({
            message: "Session already exists",
            error: error.response.data.error,
            success: false,
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

  // Start WhatsApp session with custom session ID
  startSessionWithCustomId: async (req, res) => {
    try {
      const { userId } = req.params;
      const { sessionId } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          message: "Session ID is required",
        });
      }

      // Find or create WhatsApp settings for the user
      let settings = await WhatsAppSettings.findOne({ userId });

      if (!settings) {
        settings = new WhatsAppSettings({
          userId,
          username: sessionId,
          connectionStatus: "disconnected",
        });
      } else {
        settings.username = sessionId;
      }

      await settings.save();

      try {
        // Call the WhatsApp API to start a session with custom ID
        const response = await axios.get(
          WHATSAPP_API.START_SESSION(sessionId),
          {
            timeout: 90000,
          }
        );
        console.log(response.data);
        // Update the connection status to connecting
        settings.connectionStatus = "connecting";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "WhatsApp session started successfully",
          status: "connecting",
          lastChecked: settings.lastChecked,
          success: true,
          sessionId: sessionId,
          data: response.data,
        });
      } catch (error) {
        console.error("Error starting WhatsApp session with custom ID:", error);

        // Check if the error is because the session already exists
        if (
          error.response &&
          error.response.data &&
          error.response.data.error &&
          error.response.data.error.includes("Session already exists")
        ) {
          // Return 422 status to trigger frontend termination logic
          return res.status(422).json({
            message: "Session already exists",
            error: error.response.data.error,
            success: false,
            sessionExists: true,
            sessionId: sessionId,
          });
        }

        // This is a real error
        settings.connectionStatus = "error";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(500).json({
          message: "Error starting WhatsApp session",
          status: "error",
          lastChecked: settings.lastChecked,
          error: error.response?.data?.error || error.message,
          success: false,
        });
      }
    } catch (error) {
      console.error("Error in startSessionWithCustomId:", error);
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
        console.log(response);
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
        // console.error("Error checking WhatsApp connection status:", error);

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

  // Terminate WhatsApp session
  terminateSession: async (req, res) => {
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
        // Call the WhatsApp API to terminate session
        const response = await axios.get(
          WHATSAPP_API.TERMINATE_SESSION(settings.username),
          {
            timeout: 10000, // 10 second timeout
          }
        );

        // Update the connection status to disconnected
        settings.connectionStatus = "disconnected";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "WhatsApp session terminated successfully",
          status: "disconnected",
          lastChecked: settings.lastChecked,
          apiResponse: response.data,
          success: true,
        });
      } catch (error) {
        console.error("Error terminating WhatsApp session:", error);

        // Update the settings with error status
        settings.connectionStatus = "error";
        settings.lastChecked = new Date();
        await settings.save();

        return res.status(200).json({
          message: "Error terminating WhatsApp session",
          status: "error",
          lastChecked: settings.lastChecked,
          error: error.message,
          success: false,
        });
      }
    } catch (error) {
      console.error("Error in terminateSession:", error);
      return res.status(500).json({
        message: "Error terminating WhatsApp session",
        error: error.message,
        success: false,
      });
    }
  },

  // Get WhatsApp QR code data as base64
  getQRData: async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          message: "Session ID is required",
        });
      }

      try {
        console.log("Fetching QR data for session:", sessionId);
        // Call the WhatsApp API to get the QR code data (not image)
        const response = await axios.get(WHATSAPP_API.GET_QR_DATA(sessionId), {
          timeout: 90000, // Increased timeout to 90 seconds to align with WhatsApp automation improvements
        });

        console.log("WhatsApp QR API response:", {
          status: response.status,
          data: response.data,
        });

        // Check if the response contains QR data
        if (response.data && response.data.success && response.data.qr) {
          // QR data is available
          return res.status(200).json({
            success: true,
            qr: response.data.qr, // This should be the QR data (base64 or data URL)
            sessionId: sessionId,
            contentType: "image/png", // QR codes are typically PNG
            message: "QR code data retrieved successfully",
          });
        } else {
          // QR is not ready - this is normal, not an error
          const message =
            response.data?.message || "QR code not ready or already scanned";
          console.log("QR not ready (normal):", message);

          return res.status(200).json({
            success: true,
            qrReady: false,
            message: message,
            sessionId: sessionId,
            // Don't include 'qr' field when not ready
          });
        }
      } catch (error) {
        console.error("Error getting WhatsApp QR data:", error);

        // Handle timeout errors specifically
        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          console.log(
            "WhatsApp QR API timeout - this is normal during QR generation"
          );
          return res.status(200).json({
            success: true,
            qrReady: false,
            message: "QR code generation in progress, please wait...",
            sessionId: sessionId,
            timeout: true,
          });
        }

        // Check if it's a specific WhatsApp API error
        if (error.response) {
          console.log("WhatsApp API error response:", {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });

          // Try to parse the error response
          let errorMessage = "Error getting WhatsApp QR data";
          if (error.response.data) {
            try {
              const errorData =
                typeof error.response.data === "string"
                  ? JSON.parse(error.response.data)
                  : error.response.data;
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              errorMessage = error.response.data.toString();
            }
          }

          return res.status(error.response.status).json({
            success: false,
            message: errorMessage,
            error: error.response.data,
            sessionId: sessionId,
          });
        }

        // Handle connection errors (WhatsApp service not reachable)
        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
          console.log("WhatsApp automation service not reachable");
          return res.status(503).json({
            success: false,
            message:
              "WhatsApp automation service is currently unavailable. Please try again later.",
            error: "Service unavailable",
            sessionId: sessionId,
            serviceDown: true,
          });
        }

        return res.status(500).json({
          success: false,
          message: "Error getting WhatsApp QR data",
          error: error.message,
          sessionId: sessionId,
        });
      }
    } catch (error) {
      console.error("Error in getQRData:", error);
      return res.status(500).json({
        success: false,
        message: "Error getting WhatsApp QR data",
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
          success: false,
          message: "Username is required",
        });
      }

      try {
        console.log("fetching qr code");
        // Call the WhatsApp API to get the QR code
        const response = await axios.get(WHATSAPP_API.GET_QR_CODE(username), {
          timeout: 60000,
          responseType: "arraybuffer", // Get as arraybuffer for easier conversion
        });

        // Convert the arraybuffer to base64
        const base64Data = Buffer.from(response.data, "binary").toString(
          "base64"
        );

        // Get content type from response headers
        const contentType = response.headers["content-type"] || "image/png";

        // Return JSON response with base64 data
        return res.json({
          success: true,
          qr: base64Data,
          contentType: contentType,
          message: "QR code fetched successfully",
        });
      } catch (error) {
        console.error("Error getting WhatsApp QR code:", error);

        // Check if it's a timeout or connection error
        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          return res.json({
            success: false,
            qrReady: false,
            timeout: true,
            message: "QR code generation is taking longer than expected",
          });
        }

        // Check if service is down
        if (error.response?.status === 503 || error.code === "ECONNREFUSED") {
          return res.json({
            success: false,
            serviceDown: true,
            message: "WhatsApp service is currently unavailable",
          });
        }

        // Return error response
        return res.status(500).json({
          success: false,
          message: "Error getting WhatsApp QR code",
          error: error.message,
        });
      }
    } catch (error) {
      console.error("Error in getQRCode:", error);
      return res.status(500).json({
        success: false,
        message: "Error getting WhatsApp QR code",
        error: error.message,
      });
    }
  },
};

module.exports = whatsappSettingsController;
