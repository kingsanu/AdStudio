/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
const mongoose = require("mongoose");
const Customer = require("../models/customer");

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use your actual MongoDB connection string here
    const mongoURI =
      "mongodb+srv://kingsanu:jigar2016@cluster0.fpoa8nq.mongodb.net/canva";
    console.log(`Connecting to MongoDB at ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return false;
  }
};

// Main function to add sample customers
const addTestCustomers = async () => {
  // Use the specific outlet ID provided
  const outletId = "682f2b4c76299c69d4684650";

  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Sample customer data with different segments
    const sampleCustomers = [
      // VIP customers
      {
        phoneNumber: "919876543210",
        outletId,
        name: "Rahul Sharma",
        totalPayments: 15000,
        email: "rahul.sharma@example.com",
        customerSegment: "vip",
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        phoneNumber: "919876543211",
        outletId,
        name: "Priya Patel",
        totalPayments: 12500,
        email: "priya.patel@example.com",
        customerSegment: "vip",
        lastVisit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },

      // Regular customers
      {
        phoneNumber: "919876543212",
        outletId,
        name: "Amit Kumar",
        totalPayments: 5000,
        email: "amit.kumar@example.com",
        customerSegment: "regular",
        lastVisit: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        phoneNumber: "919876543213",
        outletId,
        name: "Sneha Gupta",
        totalPayments: 3500,
        email: "sneha.gupta@example.com",
        customerSegment: "regular",
        lastVisit: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },

      // New customers
      {
        phoneNumber: "919876543214",
        outletId,
        name: "Vikram Singh",
        totalPayments: 800,
        email: "vikram.singh@example.com",
        customerSegment: "new",
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        phoneNumber: "919876543215",
        outletId,
        name: "Neha Verma",
        totalPayments: 500,
        email: "neha.verma@example.com",
        customerSegment: "new",
        lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },

      // Inactive customers
      {
        phoneNumber: "919876543216",
        outletId,
        name: "Rajesh Khanna",
        totalPayments: 2000,
        email: "rajesh.khanna@example.com",
        customerSegment: "inactive",
        lastVisit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },
      {
        phoneNumber: "919876543217",
        outletId,
        name: "Meera Joshi",
        totalPayments: 1500,
        email: "meera.joshi@example.com",
        customerSegment: "inactive",
        lastVisit: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      },

      // Additional customers with different phone formats
      {
        phoneNumber: "9876543218", // Without country code
        outletId,
        name: "Arjun Reddy",
        totalPayments: 3000,
        email: "arjun.reddy@example.com",
        customerSegment: "regular",
        lastVisit: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      },
      {
        phoneNumber: "919876543219", // Without  but with country code
        outletId,
        name: "Kavita Sharma",
        totalPayments: 8000,
        email: "kavita.sharma@example.com",
        customerSegment: "regular",
        lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },

      // Customers with no email
      {
        phoneNumber: "919876543220",
        outletId,
        name: "Suresh Kumar",
        totalPayments: 1200,
        customerSegment: "new",
        lastVisit: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },

      // High-value customers
      {
        phoneNumber: "919876543221",
        outletId,
        name: "Ananya Desai",
        totalPayments: 25000,
        email: "ananya.desai@example.com",
        customerSegment: "vip",
        lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },

      // Very inactive customer
      {
        phoneNumber: "919876543222",
        outletId,
        name: "Mohan Lal",
        totalPayments: 500,
        email: "mohan.lal@example.com",
        customerSegment: "inactive",
        lastVisit: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
      },

      // Additional requested customers
      {
        phoneNumber: "917508670783",
        outletId,
        name: "Kanish",
        totalPayments: 7500,
        email: "kanish@example.com",
        customerSegment: "regular",
        lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
      {
        phoneNumber: "91884927575",
        outletId,
        name: "Jigar",
        totalPayments: 12000,
        email: "jigar@example.com",
        customerSegment: "vip",
        lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    // Check for existing customers with these phone numbers
    const phoneNumbers = sampleCustomers.map((c) => c.phoneNumber);
    const existingCustomers = await Customer.find({
      phoneNumber: { $in: phoneNumbers },
      outletId,
    });

    if (existingCustomers.length > 0) {
      console.log(
        `Found ${existingCustomers.length} existing customers with the same phone numbers.`
      );

      // Get phone numbers of existing customers
      const existingPhoneNumbers = existingCustomers.map((c) => c.phoneNumber);

      // Filter out customers that already exist
      const newCustomers = sampleCustomers.filter(
        (c) => !existingPhoneNumbers.includes(c.phoneNumber)
      );

      if (newCustomers.length === 0) {
        console.log(
          "All sample customers already exist. No new customers added."
        );
      } else {
        // Insert only new customers
        const result = await Customer.insertMany(newCustomers);
        console.log(
          `Successfully added ${result.length} new sample customers for outlet ${outletId}`
        );
      }
    } else {
      // Insert all sample customers
      const result = await Customer.insertMany(sampleCustomers);
      console.log(
        `Successfully added ${result.length} sample customers for outlet ${outletId}`
      );
    }

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error adding sample customers:", error);

    // Handle duplicate key errors
    if (error.name === "BulkWriteError" && error.code === 11000) {
      console.log(
        "Some customers already exist. Only new customers were added."
      );
    }

    // Close the connection
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
addTestCustomers();
