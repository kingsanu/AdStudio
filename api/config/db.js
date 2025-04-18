const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config();

// MongoDB connection URL from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Check if MongoDB URI is provided
if (!MONGODB_URI) {
  console.error(
    "MongoDB URI is not defined. Please set the MONGODB_URI environment variable."
  );
  process.exit(1);
}
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection errors after initial connection
mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

// Handle connection success
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

// Handle disconnection
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
    process.exit(1);
  }
});

module.exports = connectDB;
