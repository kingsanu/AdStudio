# Customer Data Creation Script

This script creates sample customer data for testing the WhatsApp campaign functionality.

## Usage

### Prerequisites

- MongoDB should be running
- Node.js environment should be set up
- Database connection string should be configured

### Running the Script

1. **Using Node directly:**

   ```bash
   node scripts/createCustomerData.js
   ```

2. **Using npm script (if added to package.json):**
   ```bash
   npm run create-customers
   ```

### What the Script Does

1. **Connects to MongoDB** using the connection string from environment variables or defaults to localhost
2. **Clears existing customers** for the specified outlet ID (682f2b4c76299c69d4684650)
3. **Creates 25 sample customers** with the following distribution:
   - **5 VIP Customers** (₹18,500 - ₹32,000 spent)
   - **8 Regular Customers** (₹4,800 - ₹9,200 spent)
   - **5 New Customers** (₹650 - ₹1,200 spent)
   - **5 Inactive Customers** (₹2,900 - ₹6,800 spent, last visit 4-8 months ago)
   - **2 Additional customers** for variety

### Customer Segments

- **VIP**: High-value customers with total payments ≥ ₹10,000
- **Regular**: Moderate spenders with payments between ₹1,000 - ₹9,999
- **New**: Recent customers with payments < ₹1,000
- **Inactive**: Customers who haven't visited in 4+ months

### Sample Data Structure

Each customer includes:

- Phone number (Indian format: +91xxxxxxxxxx)
- Name (Indian names for authenticity)
- Email address
- Total payments amount
- Customer segment
- Last visit date
- Outlet ID (682f2b4c76299c69d4684650)

### Output

The script provides:

- Progress logs during execution
- Summary by customer segment
- Total count and spending per segment
- Success/error messages

### Environment Variables

- `MONGODB_URI`: MongoDB connection string (defaults to `mongodb://localhost:27017/adstudio`)

### Notes

- The script will **delete existing customers** for the specified outlet before creating new ones
- All customers are created with the outlet ID: `682f2b4c76299c69d4684650`
- Phone numbers are sequential for easy testing: +919876543210 to +919876543236
- Last visit dates are realistic and varied to test different scenarios
