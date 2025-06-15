/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

// Get all customers with optional filtering
router.get("/customers", customerController.getCustomers);

// Get customer by ID
router.get("/customers/:id", customerController.getCustomerById);

// Create new customer
router.post("/customers", customerController.createCustomer);

// Update customer
router.put("/customers/:id", customerController.updateCustomer);

// Delete customer (soft delete)
router.delete("/customers/:id", customerController.deleteCustomer);

// Get customers by outlet
router.get("/customers/outlet/:outletId", customerController.getCustomersByOutlet);

// Add payment to customer
router.post("/customers/:id/payment", customerController.addPayment);

// Bulk import customers
router.post("/customers/bulk-import", customerController.bulkImportCustomers);

module.exports = router;
