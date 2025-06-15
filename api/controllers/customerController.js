/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const MongoCustomer = require("../models/customer");
const MongoOutlet = require("../models/outlet");

const customerController = {
  // Get all customers with optional filtering
  getCustomers: async (req, res) => {
    try {
      const {
        outletId,
        segment,
        minPayments,
        search,
        page = 1,
        limit = 20,
        sortBy = "updatedAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = { isActive: true };

      if (outletId) {
        query.outletId = outletId;
      }

      if (segment) {
        query.customerSegment = segment;
      }

      if (minPayments) {
        query.totalPayments = { $gte: parseInt(minPayments) };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const customers = await MongoCustomer.find(query)
        .populate("outletId", "name address")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await MongoCustomer.countDocuments(query);

      res.json({
        success: true,
        data: customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
        error: error.message,
      });
    }
  },

  // Get customer by ID
  getCustomerById: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await MongoCustomer.findById(id).populate(
        "outletId",
        "name address phone email"
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer",
        error: error.message,
      });
    }
  },

  // Create new customer
  createCustomer: async (req, res) => {
    try {
      const customerData = req.body;

      // Validate outlet exists
      if (customerData.outletId) {
        const outlet = await MongoOutlet.findById(customerData.outletId);
        if (!outlet) {
          return res.status(400).json({
            success: false,
            message: "Invalid outlet ID",
          });
        }
      }

      // Check for duplicate phone number in the same outlet
      const existingCustomer = await MongoCustomer.findOne({
        phoneNumber: customerData.phoneNumber,
        outletId: customerData.outletId,
        isActive: true,
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message:
            "Customer with this phone number already exists in this outlet",
        });
      }

      const customer = new MongoCustomer(customerData);
      await customer.save();

      // Populate outlet data for response
      await customer.populate("outletId", "name address");

      res.status(201).json({
        success: true,
        data: customer,
        message: "Customer created successfully",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create customer",
        error: error.message,
      });
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const customer = await MongoCustomer.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("outletId", "name address");

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.json({
        success: true,
        data: customer,
        message: "Customer updated successfully",
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update customer",
        error: error.message,
      });
    }
  },

  // Delete customer (soft delete)
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await MongoCustomer.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete customer",
        error: error.message,
      });
    }
  },

  // Get customers by outlet
  getCustomersByOutlet: async (req, res) => {
    try {
      const { outletId } = req.params;
      const { segment, minPayments } = req.query;
      console.log(outletId);
      const options = {};
      if (segment) options.segment = segment;
      if (minPayments) options.minPayments = parseInt(minPayments);

      const customers = await MongoCustomer.find({
        // outletId,
        // options,
      });
      console.log("customers");
      console.log(customers);
      console.log("customers");
      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      console.error("Error fetching customers by outlet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
        error: error.message,
      });
    }
  },

  // Add payment to customer
  addPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid payment amount is required",
        });
      }

      const customer = await MongoCustomer.findById(id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      await customer.addPayment(amount);
      await customer.populate("outletId", "name address");

      res.json({
        success: true,
        data: customer,
        message: "Payment added successfully",
      });
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add payment",
        error: error.message,
      });
    }
  },

  // Bulk import customers
  bulkImportCustomers: async (req, res) => {
    try {
      const { customers, outletId } = req.body;

      if (!Array.isArray(customers) || customers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Valid customers array is required",
        });
      }

      // Validate outlet exists
      const outlet = await MongoOutlet.findById(outletId);
      if (!outlet) {
        return res.status(400).json({
          success: false,
          message: "Invalid outlet ID",
        });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const customerData of customers) {
        try {
          customerData.outletId = outletId;

          // Check for duplicate
          const existing = await MongoCustomer.findOne({
            phoneNumber: customerData.phoneNumber,
            outletId: outletId,
            isActive: true,
          });

          if (existing) {
            results.failed++;
            results.errors.push({
              phoneNumber: customerData.phoneNumber,
              error: "Customer already exists",
            });
            continue;
          }

          const customer = new MongoCustomer(customerData);
          await customer.save();
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            phoneNumber: customerData.phoneNumber || "Unknown",
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Import completed. ${results.success} customers imported, ${results.failed} failed.`,
      });
    } catch (error) {
      console.error("Error bulk importing customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import customers",
        error: error.message,
      });
    }
  },
};

module.exports = customerController;
