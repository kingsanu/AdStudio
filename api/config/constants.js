/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

// Load environment variables
require("dotenv").config();

const CLOUD_STORAGE = {
  BASE_URL: process.env.CLOUD_STORAGE_BASE_URL,
};

// External API endpoints
const EXTERNAL_APIS = {
  UPLOAD_MEDIA: process.env.UPLOAD_MEDIA_API,
};

module.exports = { CLOUD_STORAGE, EXTERNAL_APIS };
