/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");
const Background = require("../models/background");
const Illustration = require("../models/illustration");
const Icon = require("../models/icon");
const ThreeDImage = require("../models/threeDImage");

// Sample data for different media types
const sampleBackgrounds = [
  {
    img: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=600&fit=crop",
    desc: "Abstract gradient background",
  },
  {
    img: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop",
    desc: "Blue gradient background",
  },
  {
    img: "https://images.unsplash.com/photo-1558051815-0f081363e55d?w=800&h=600&fit=crop",
    desc: "Purple gradient background",
  },
  {
    img: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&h=600&fit=crop",
    desc: "Pink gradient background",
  },
  {
    img: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&h=600&fit=crop",
    desc: "Green gradient background",
  },
];

const sampleIllustrations = [
  {
    img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
    desc: "Business illustration",
  },
  {
    img: "https://images.unsplash.com/photo-1543269664-647887873cbb?w=400&h=400&fit=crop",
    desc: "Technology illustration",
  },
  {
    img: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=400&fit=crop",
    desc: "Creative illustration",
  },
  {
    img: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
    desc: "Marketing illustration",
  },
];

const sampleIcons = [
  {
    img: "https://api.iconify.design/mdi:heart.svg?color=%23ff0000&width=64&height=64",
    desc: "Heart icon",
  },
  {
    img: "https://api.iconify.design/mdi:star.svg?color=%23ffd700&width=64&height=64",
    desc: "Star icon",
  },
  {
    img: "https://api.iconify.design/mdi:home.svg?color=%234285f4&width=64&height=64",
    desc: "Home icon",
  },
  {
    img: "https://api.iconify.design/mdi:email.svg?color=%2334a853&width=64&height=64",
    desc: "Email icon",
  },
  {
    img: "https://api.iconify.design/mdi:phone.svg?color=%23ea4335&width=64&height=64",
    desc: "Phone icon",
  },
];

const sample3DImages = [
  {
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
    desc: "3D geometric shape",
  },
  {
    img: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop",
    desc: "3D abstract form",
  },
  {
    img: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400&h=400&fit=crop",
    desc: "3D render object",
  },
];

async function populateMediaData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/canva-editor"
    );

    console.log("Connected to MongoDB");

    // Clear existing data
    await Background.deleteMany({});
    await Illustration.deleteMany({});
    await Icon.deleteMany({});
    await ThreeDImage.deleteMany({});

    console.log("Cleared existing media data");

    // Insert sample data
    await Background.insertMany(sampleBackgrounds);
    console.log(`Inserted ${sampleBackgrounds.length} backgrounds`);

    await Illustration.insertMany(sampleIllustrations);
    console.log(`Inserted ${sampleIllustrations.length} illustrations`);

    await Icon.insertMany(sampleIcons);
    console.log(`Inserted ${sampleIcons.length} icons`);

    await ThreeDImage.insertMany(sample3DImages);
    console.log(`Inserted ${sample3DImages.length} 3D images`);

    console.log("Media data population completed successfully!");
  } catch (error) {
    console.error("Error populating media data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
populateMediaData();
