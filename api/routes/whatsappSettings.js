const express = require("express");
const router = express.Router();
const whatsappSettingsController = require("../controllers/whatsappSettingsController");

// Get WhatsApp settings for a user
router.get(
  "/whatsapp-settings/:userId",
  whatsappSettingsController.getWhatsAppSettings
);

// Create or update WhatsApp settings
router.post(
  "/whatsapp-settings",
  whatsappSettingsController.saveWhatsAppSettings
);

// Delete WhatsApp settings
router.delete(
  "/whatsapp-settings/:userId",
  whatsappSettingsController.deleteWhatsAppSettings
);

// Start WhatsApp session
router.get("/whatsapp-start/:userId", whatsappSettingsController.startSession);

// Check WhatsApp connection status
router.get(
  "/whatsapp-status/:userId",
  whatsappSettingsController.checkConnectionStatus
);

// Restart WhatsApp session
router.get(
  "/whatsapp-restart/:userId",
  whatsappSettingsController.restartSession
);

// Get WhatsApp QR code
router.get("/whatsapp-qr/:username", whatsappSettingsController.getQRCode);

module.exports = router;
