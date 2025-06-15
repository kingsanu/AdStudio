# Test Data Scripts

This directory contains scripts for adding test data to the database.

## Adding Test Customers

The `add-test-customers.js` script adds sample customer data to the database for testing the WhatsAppCampaignDialog component.

### Usage

Run the script from the project root directory:

```bash
node api/scripts/add-test-customers.js
```

### What it does

- Adds 13 sample customers with different segments (vip, regular, new, inactive)
- Uses the outlet ID: `6840bdba6f25b2e0d65f8a60`
- Includes customers with different phone number formats
- Includes customers with and without email addresses
- Includes customers with different payment totals and visit histories
- Checks for existing customers to avoid duplicates

### Sample Data

The script adds the following types of customers:

1. **VIP Customers** (high payment totals, recent visits)
2. **Regular Customers** (medium payment totals)
3. **New Customers** (low payment totals, very recent visits)
4. **Inactive Customers** (haven't visited in a long time)

This variety of customer data allows for testing all filtering options in the WhatsAppCampaignDialog component.
