/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");
const WhatsAppSettings = require("../api/models/whatsappSettings");

// MongoDB connection string - update this to match your database
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/adstudio";

// Outlet ID to create WhatsApp settings for
const OUTLET_ID = "682f2b4c76299c69d4684650";

// Sample WhatsApp settings data
const whatsappSettingsData = {
  userId: OUTLET_ID,
  username: `session_${OUTLET_ID}_${Date.now()}`, // Generate a unique session ID
  connectionStatus: "disconnected", // Start as disconnected
  lastChecked: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function createWhatsAppSettings() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Clear existing WhatsApp settings for this outlet (optional)
    console.log(`Clearing existing WhatsApp settings for outlet ${OUTLET_ID}...`);
    await WhatsAppSettings.deleteMany({ userId: OUTLET_ID });
    console.log("Existing WhatsApp settings cleared.");

    // Create WhatsApp settings
    console.log("Creating WhatsApp settings...");
    const createdSettings = await WhatsAppSettings.create(whatsappSettingsData);
    console.log("Successfully created WhatsApp settings!");
    console.log("Settings:", {
      userId: createdSettings.userId,
      username: createdSettings.username,
      connectionStatus: createdSettings.connectionStatus,
      lastChecked: createdSettings.lastChecked,
    });

    console.log("\nWhatsApp settings creation completed successfully!");
  } catch (error) {
    console.error("Error creating WhatsApp settings:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Run the script
if (require.main === module) {
  createWhatsAppSettings();
}

module.exports = { createWhatsAppSettings, whatsappSettingsData };
