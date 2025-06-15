/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require("mongoose");
const MongoCustomer = require("../api/models/customer");

// MongoDB connection string - update this to match your database
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/adstudio";

// Outlet ID to create customers for
const OUTLET_ID = "682f2b4c76299c69d4684650";

// Sample customer data with various segments and payment amounts
const customerData = [
  // VIP Customers (high spenders)
  {
    phoneNumber: "+919876543210",
    name: "Rajesh Kumar",
    totalPayments: 25000,
    email: "rajesh.kumar@email.com",
    customerSegment: "vip",
    lastVisit: new Date("2024-01-15"),
  },
  {
    phoneNumber: "+919876543211",
    name: "Priya Sharma",
    totalPayments: 18500,
    email: "priya.sharma@email.com",
    customerSegment: "vip",
    lastVisit: new Date("2024-01-14"),
  },
  {
    phoneNumber: "+919876543212",
    name: "Amit Patel",
    totalPayments: 32000,
    email: "amit.patel@email.com",
    customerSegment: "vip",
    lastVisit: new Date("2024-01-16"),
  },
  {
    phoneNumber: "+919876543213",
    name: "Sunita Gupta",
    totalPayments: 22500,
    email: "sunita.gupta@email.com",
    customerSegment: "vip",
    lastVisit: new Date("2024-01-13"),
  },
  {
    phoneNumber: "+919876543214",
    name: "Vikram Singh",
    totalPayments: 28000,
    email: "vikram.singh@email.com",
    customerSegment: "vip",
    lastVisit: new Date("2024-01-17"),
  },

  // Regular Customers (moderate spenders)
  {
    phoneNumber: "+919876543215",
    name: "Neha Agarwal",
    totalPayments: 8500,
    email: "neha.agarwal@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-12"),
  },
  {
    phoneNumber: "+919876543216",
    name: "Rohit Verma",
    totalPayments: 6200,
    email: "rohit.verma@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-11"),
  },
  {
    phoneNumber: "+919876543217",
    name: "Kavita Joshi",
    totalPayments: 7800,
    email: "kavita.joshi@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-10"),
  },
  {
    phoneNumber: "+919876543218",
    name: "Manoj Tiwari",
    totalPayments: 5500,
    email: "manoj.tiwari@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-09"),
  },
  {
    phoneNumber: "+919876543219",
    name: "Deepika Rao",
    totalPayments: 9200,
    email: "deepika.rao@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-08"),
  },
  {
    phoneNumber: "+919876543220",
    name: "Sanjay Mehta",
    totalPayments: 4800,
    email: "sanjay.mehta@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-07"),
  },
  {
    phoneNumber: "+919876543221",
    name: "Pooja Bansal",
    totalPayments: 6700,
    email: "pooja.bansal@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-06"),
  },
  {
    phoneNumber: "+919876543222",
    name: "Arjun Reddy",
    totalPayments: 7300,
    email: "arjun.reddy@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-05"),
  },

  // New Customers (recent joiners with low spending)
  {
    phoneNumber: "+919876543223",
    name: "Anita Desai",
    totalPayments: 850,
    email: "anita.desai@email.com",
    customerSegment: "new",
    lastVisit: new Date("2024-01-18"),
  },
  {
    phoneNumber: "+919876543224",
    name: "Karan Malhotra",
    totalPayments: 1200,
    email: "karan.malhotra@email.com",
    customerSegment: "new",
    lastVisit: new Date("2024-01-17"),
  },
  {
    phoneNumber: "+919876543225",
    name: "Ritu Saxena",
    totalPayments: 650,
    email: "ritu.saxena@email.com",
    customerSegment: "new",
    lastVisit: new Date("2024-01-16"),
  },
  {
    phoneNumber: "+919876543226",
    name: "Gaurav Chopra",
    totalPayments: 950,
    email: "gaurav.chopra@email.com",
    customerSegment: "new",
    lastVisit: new Date("2024-01-15"),
  },
  {
    phoneNumber: "+919876543227",
    name: "Meera Nair",
    totalPayments: 1100,
    email: "meera.nair@email.com",
    customerSegment: "new",
    lastVisit: new Date("2024-01-14"),
  },

  // Inactive Customers (haven't visited recently)
  {
    phoneNumber: "+919876543228",
    name: "Suresh Yadav",
    totalPayments: 4200,
    email: "suresh.yadav@email.com",
    customerSegment: "inactive",
    lastVisit: new Date("2023-08-15"), // 6+ months ago
  },
  {
    phoneNumber: "+919876543229",
    name: "Lakshmi Iyer",
    totalPayments: 3800,
    email: "lakshmi.iyer@email.com",
    customerSegment: "inactive",
    lastVisit: new Date("2023-07-20"), // 6+ months ago
  },
  {
    phoneNumber: "+919876543230",
    name: "Rahul Jain",
    totalPayments: 5600,
    email: "rahul.jain@email.com",
    customerSegment: "inactive",
    lastVisit: new Date("2023-09-10"), // 4+ months ago
  },
  {
    phoneNumber: "+919876543231",
    name: "Shweta Kapoor",
    totalPayments: 2900,
    email: "shweta.kapoor@email.com",
    customerSegment: "inactive",
    lastVisit: new Date("2023-06-25"), // 7+ months ago
  },
  {
    phoneNumber: "+919876543232",
    name: "Ashok Pandey",
    totalPayments: 4700,
    email: "ashok.pandey@email.com",
    customerSegment: "inactive",
    lastVisit: new Date("2023-08-30"), // 5+ months ago
  },

  // Additional customers for variety
  {
    phoneNumber: "+919876543233",
    name: "Divya Bhatt",
    totalPayments: 12500,
    email: "divya.bhatt@email.com",
    customerSegment: "vip",
    lastVisit: new Date("2024-01-19"),
  },
  {
    phoneNumber: "+919876543234",
    name: "Nitin Agrawal",
    totalPayments: 3400,
    email: "nitin.agrawal@email.com",
    customerSegment: "regular",
    lastVisit: new Date("2024-01-04"),
  },
  {
    phoneNumber: "+919876543235",
    name: "Sneha Kulkarni",
    totalPayments: 750,
    email: "sneha.kulkarni@email.com",
    customerSegment: "new",
    lastVisit: new Date("2024-01-19"),
  },
  {
    phoneNumber: "+919876543236",
    name: "Harish Sinha",
    totalPayments: 6800,
    email: "harish.sinha@email.com",
    customerSegment: "inactive",
    lastVisit: new Date("2023-05-15"), // 8+ months ago
  },
];

async function createCustomers() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Clear existing customers for this outlet (optional)
    console.log(`Clearing existing customers for outlet ${OUTLET_ID}...`);
    await MongoCustomer.deleteMany({ outletId: OUTLET_ID });
    console.log("Existing customers cleared.");

    // Create customers with the specified outlet ID
    console.log("Creating new customers...");
    const customersToCreate = customerData.map((customer) => ({
      ...customer,
      outletId: OUTLET_ID,
    }));

    const createdCustomers = await MongoCustomer.insertMany(customersToCreate);
    console.log(`Successfully created ${createdCustomers.length} customers!`);

    // Display summary by segment
    const summary = await MongoCustomer.aggregate([
      { $match: { outletId: OUTLET_ID } },
      {
        $group: {
          _id: "$customerSegment",
          count: { $sum: 1 },
          totalSpent: { $sum: "$totalPayments" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("\nCustomer Summary by Segment:");
    summary.forEach((segment) => {
      console.log(
        `${segment._id}: ${
          segment.count
        } customers, Total Spent: ₹${segment.totalSpent.toLocaleString()}`
      );
    });

    console.log("\nCustomer data creation completed successfully!");
  } catch (error) {
    console.error("Error creating customers:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Run the script
if (require.main === module) {
  createCustomers();
}

module.exports = { createCustomers, customerData };
