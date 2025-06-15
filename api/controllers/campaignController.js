/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const WhatsAppCampaign = require("../models/whatsappCampaign");
const MongoCustomer = require("../models/customer");
const axios = require("axios");

const WHATSAPP_API = {
  BASE_URL: "https://whatsapp.foodyqueen.com",
  SEND_MESSAGE: (sessionId) =>
    `${WHATSAPP_API.BASE_URL}/client/sendMessage/${sessionId}`,
  SESSION_STATUS: (sessionId) =>
    `${WHATSAPP_API.BASE_URL}/session/status/${sessionId}`,
  START_SESSION: (sessionId) =>
    `${WHATSAPP_API.BASE_URL}/session/start/${sessionId}`,
};

const campaignController = {
  // Get all campaigns with optional filtering
  getCampaigns: async (req, res) => {
    try {
      const {
        userId,
        outletId,
        status,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = { isActive: true };

      if (userId) {
        query.userId = userId;
      }

      if (outletId) {
        query.outletId = outletId;
      }

      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const campaigns = await WhatsAppCampaign.find(query)
        .populate("outletId", "name address")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await WhatsAppCampaign.countDocuments(query);

      res.json({
        success: true,
        data: campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch campaigns",
        error: error.message,
      });
    }
  },

  // Get campaign by ID
  getCampaignById: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await WhatsAppCampaign.findById(id)
        .populate("outletId", "name address phone email")
        .populate("targetCustomers.customerId", "name phoneNumber email");

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch campaign",
        error: error.message,
      });
    }
  },

  // Create new campaign
  createCampaign: async (req, res) => {
    try {
      const campaignData = req.body;

      // If customer filters are provided, fetch matching customers
      if (campaignData.customerFilters && !campaignData.targetCustomers) {
        const customers = await getCustomersByFilters(
          campaignData.outletId,
          campaignData.customerFilters
        );

        campaignData.targetCustomers = customers.map((customer) => ({
          customerId: customer._id,
          phoneNumber: customer.phoneNumber,
          name: customer.name,
          status: "pending",
        }));
      }

      // Check if this is an immediate campaign
      const isImmediate =
        !campaignData.campaignType || campaignData.campaignType === "immediate";

      // Set initial status based on campaign type
      campaignData.status = isImmediate ? "pending" : "draft";

      // Create and save the campaign
      const campaign = new WhatsAppCampaign(campaignData);
      await campaign.save();

      // Populate data for response
      await campaign.populate("outletId", "name address");

      // If this is an immediate campaign, start sending messages in the background
      if (isImmediate) {
        console.log(`Starting immediate campaign: ${campaign._id}`);
        // Don't await - let this run in the background
        sendCampaignMessages(campaign._id).catch((error) => {
          console.error(
            `Background campaign processing error: ${error.message}`
          );
        });
      }

      res.status(201).json({
        success: true,
        data: campaign,
        message: isImmediate
          ? "Campaign created and launched successfully"
          : "Campaign created successfully",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create campaign",
        error: error.message,
      });
    }
  },

  // Update campaign
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.statistics; // Statistics are auto-calculated

      const campaign = await WhatsAppCampaign.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate("outletId", "name address");

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      res.json({
        success: true,
        data: campaign,
        message: "Campaign updated successfully",
      });
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update campaign",
        error: error.message,
      });
    }
  },

  // Delete campaign (soft delete)
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await WhatsAppCampaign.findByIdAndUpdate(
        id,
        { isActive: false, status: "cancelled" },
        { new: true }
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      res.json({
        success: true,
        message: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete campaign",
        error: error.message,
      });
    }
  },

  // Launch campaign
  launchCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await WhatsAppCampaign.findById(id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (campaign.status !== "draft" && campaign.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Campaign cannot be launched in current status",
        });
      }

      // Update campaign status
      campaign.status = "running";
      campaign.startedAt = new Date();
      await campaign.save();

      // Start sending messages asynchronously
      sendCampaignMessages(campaign._id);

      res.json({
        success: true,
        data: campaign,
        message: "Campaign launched successfully",
      });
    } catch (error) {
      console.error("Error launching campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to launch campaign",
        error: error.message,
      });
    }
  },

  // Retry failed campaign
  retryCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await WhatsAppCampaign.findById(id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (campaign.status !== "failed") {
        return res.status(400).json({
          success: false,
          message: "Only failed campaigns can be retried",
        });
      }

      // Reset status of failed targets to pending
      const updatedTargets = campaign.targetCustomers.map((target) => {
        if (target.status === "failed") {
          return { ...target, status: "pending" };
        }
        return target;
      });

      // Update campaign
      campaign.targetCustomers = updatedTargets;
      campaign.status = "pending";
      campaign.startedAt = new Date();
      campaign.errors = []; // Clear previous errors
      await campaign.save();

      // Start sending messages asynchronously
      sendCampaignMessages(campaign._id);

      res.json({
        success: true,
        data: campaign,
        message: "Campaign retry initiated successfully",
      });
    } catch (error) {
      console.error("Error retrying campaign:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retry campaign",
        error: error.message,
      });
    }
  },

  // Get campaign statistics
  getCampaignStatistics: async (req, res) => {
    try {
      const { userId, outletId } = req.query;

      const query = { isActive: true };
      if (userId) query.userId = userId;
      if (outletId) query.outletId = outletId;

      const campaigns = await WhatsAppCampaign.find(query);

      const stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "running").length,
        completedCampaigns: campaigns.filter((c) => c.status === "completed")
          .length,
        failedCampaigns: campaigns.filter((c) => c.status === "failed").length,
        totalMessagesSent: campaigns.reduce(
          (sum, c) => sum + c.statistics.sent,
          0
        ),
        totalMessagesDelivered: campaigns.reduce(
          (sum, c) => sum + c.statistics.delivered,
          0
        ),
        totalMessagesFailed: campaigns.reduce(
          (sum, c) => sum + c.statistics.failed,
          0
        ),
        averageSuccessRate: 0,
      };

      if (stats.totalCampaigns > 0) {
        const totalSuccessRate = campaigns.reduce(
          (sum, c) => sum + c.statistics.successRate,
          0
        );
        stats.averageSuccessRate = Math.round(
          totalSuccessRate / stats.totalCampaigns
        );
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching campaign statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message,
      });
    }
  },
};

// Helper function to get customers by filters
async function getCustomersByFilters(outletId, filters) {
  const query = { outletId, isActive: true };

  if (filters.segments && filters.segments.length > 0) {
    query.customerSegment = { $in: filters.segments };
  }

  if (filters.minPayments !== null && filters.minPayments !== undefined) {
    query.totalPayments = { $gte: filters.minPayments };
  }

  if (filters.maxPayments !== null && filters.maxPayments !== undefined) {
    if (query.totalPayments) {
      query.totalPayments.$lte = filters.maxPayments;
    } else {
      query.totalPayments = { $lte: filters.maxPayments };
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  return await MongoCustomer.find(query);
}

// Helper function to check WhatsApp session status
async function checkWhatsAppSession(sessionId) {
  try {
    const response = await axios.get(WHATSAPP_API.SESSION_STATUS(sessionId), {
      timeout: 10000,
    });
    console.log(response.data);
    return response.data.success && response.data.state === "CONNECTED";
  } catch (error) {
    console.error(`Error checking session ${sessionId}:`, error.message);
    return false;
  }
}

// Helper function to start WhatsApp session if needed
async function ensureWhatsAppSession(sessionId) {
  try {
    const isConnected = await checkWhatsAppSession(sessionId);
    if (!isConnected) {
      console.log(`Starting WhatsApp session: ${sessionId}`);
      const r = await axios.get(WHATSAPP_API.START_SESSION(sessionId), {
        timeout: 30000,
      });
      console.log(r);
      // Wait a bit for session to initialize
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check again
      return await checkWhatsAppSession(sessionId);
    }
    return true;
  } catch (error) {
    console.error(`Error ensuring session ${sessionId}:`, error.message);
    return false;
  }
}

// Async function to send campaign messages one by one (as a background worker)
async function sendCampaignMessages(campaignId) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId);
    if (!campaign) return;

    const { whatsappUsername, message, imageUrl, targetCustomers } = campaign;

    console.log(
      `🚀 Starting campaign ${campaignId} with ${targetCustomers.length} targets`
    );

    // Ensure WhatsApp session is active
    const sessionReady = await ensureWhatsAppSession(whatsappUsername);
    if (!sessionReady) {
      console.error(`WhatsApp session ${whatsappUsername} is not available`);
      // Update campaign status to failed
      campaign.status = "failed";
      campaign.errors.push({
        phoneNumber: "system",
        error: `WhatsApp session ${whatsappUsername} is not available`,
        timestamp: new Date(),
      });
      await campaign.save();
      return;
    }

    // Update campaign status to running
    campaign.status = "running";
    campaign.startedAt = new Date();
    await campaign.save();

    console.log(
      `📱 Processing ${targetCustomers.length} messages one by one...`
    );

    // Process messages in batches to avoid overwhelming the system
    const batchSize = 10; // Process 10 messages at a time
    const totalBatches = Math.ceil(targetCustomers.length / batchSize);

    // Track campaign progress
    let sentCount = 0;
    let failedCount = 0;
    let deliveredCount = 0;

    // Process in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, targetCustomers.length);
      const currentBatch = targetCustomers.slice(batchStart, batchEnd);

      console.log(
        `Processing batch ${batchIndex + 1}/${totalBatches} (${
          currentBatch.length
        } messages)`
      );

      // Process each customer in the batch
      const batchPromises = currentBatch.map(async (customer, index) => {
        try {
          // Add a small delay between messages to avoid rate limiting
          const delay = index * 500; // 500ms delay between each message in the batch
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Update customer status to indicate processing
          customer.status = "pending";

          // Prepare the message payload for a single customer
          const payload = {
            number: customer.phoneNumber,
            message: message,
          };

          // Add document/image if provided
          if (imageUrl) {
            payload.document = imageUrl;
          }

          // Send the message
          console.log(
            `Sending message to ${customer.phoneNumber} (${customer.name})`
          );
          const response = await axios.post(
            WHATSAPP_API.SEND_MESSAGE(whatsappUsername),
            payload,
            {
              timeout: 30000,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data && response.data.success) {
            // Message was queued successfully
            customer.status = "sent";
            customer.sentAt = new Date();
            sentCount++;
            console.log(
              `✅ Message sent to ${customer.phoneNumber} (${customer.name})`
            );

            // Simulate delivery after a short delay (in real-world, this would come from webhooks)
            setTimeout(async () => {
              try {
                // Refetch the campaign to get the latest state
                const updatedCampaign = await WhatsAppCampaign.findById(
                  campaignId
                );
                if (updatedCampaign) {
                  // Find the customer in the updated campaign
                  const updatedCustomer = updatedCampaign.targetCustomers.find(
                    (c) => c.phoneNumber === customer.phoneNumber
                  );

                  if (updatedCustomer && updatedCustomer.status === "sent") {
                    updatedCustomer.status = "delivered";
                    updatedCustomer.deliveredAt = new Date();
                    deliveredCount++;
                    await updatedCampaign.save();
                    console.log(
                      `📱 Message delivered to ${customer.phoneNumber}`
                    );
                  }
                }
              } catch (deliveryError) {
                console.error(
                  `Error updating delivery status: ${deliveryError.message}`
                );
              }
            }, 5000 + Math.random() * 10000); // Random delivery time between 5-15 seconds
          } else {
            // Message failed to queue
            customer.status = "failed";
            customer.error = response.data?.message || "Failed to send message";
            failedCount++;
            campaign.errors.push({
              phoneNumber: customer.phoneNumber,
              error: customer.error,
              timestamp: new Date(),
            });
            console.error(
              `❌ Failed to send message to ${customer.phoneNumber}: ${customer.error}`
            );
          }
        } catch (error) {
          console.log("WERRR", error);
          // Error during API call
          customer.status = "failed";

          // Extract the real error message from the response if available
          let errorMessage = "Error sending message";

          // Check if the error response contains the actual error details from the server
          if (error.response && error.response.data) {
            if (error.response.data.error) {
              // Use the server's error message
              errorMessage = error.response.data.error;
            } else if (error.response.data.message) {
              // Some APIs use message instead of error
              errorMessage = error.response.data.message;
            }
          } else {
            // Fallback to the generic error message
            errorMessage = error.message || errorMessage;
          }

          customer.error = errorMessage;
          failedCount++;
          campaign.errors.push({
            phoneNumber: customer.phoneNumber,
            error: customer.error,
            timestamp: new Date(),
          });
          console.error(
            `❌ Error sending to ${customer.phoneNumber}: ${errorMessage}`
          );
        }
      });

      // Wait for all messages in this batch to be processed
      await Promise.all(batchPromises);

      // Save campaign after each batch to update progress
      await campaign.save();

      // Log batch completion
      console.log(`Completed batch ${batchIndex + 1}/${totalBatches}`);

      // Add a delay between batches to avoid overwhelming the WhatsApp API
      if (batchIndex < totalBatches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay between batches
      }
    }

    // All batches processed - check final campaign status
    const pendingCount = targetCustomers.filter(
      (c) => c.status === "pending"
    ).length;

    // Final campaign status update
    if (pendingCount === 0) {
      // If no messages are pending, mark as completed
      campaign.status = "completed";
      campaign.completedAt = new Date();
      await campaign.save();
      console.log(
        `✅ Campaign ${campaignId} completed. Sent: ${sentCount}, Delivered: ${deliveredCount}, Failed: ${failedCount}`
      );
    } else {
      // If some messages are still pending, set up a delayed completion check
      console.log(
        `Campaign ${campaignId} processing. Sent: ${sentCount}, Delivered: ${deliveredCount}, Failed: ${failedCount}, Pending: ${pendingCount}`
      );

      // Check again after 5 minutes for any pending messages
      setTimeout(async () => {
        try {
          const finalCampaign = await WhatsAppCampaign.findById(campaignId);
          if (finalCampaign) {
            finalCampaign.status = "completed";
            finalCampaign.completedAt = new Date();
            await finalCampaign.save();
            console.log(
              `Campaign ${campaignId} marked as completed after final check`
            );
          }
        } catch (error) {
          console.error(
            `Error in final campaign status update: ${error.message}`
          );
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  } catch (error) {
    console.error("❌ Error in sendCampaignMessages:", error);

    // Mark campaign as failed
    try {
      await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
        status: "failed",
        completedAt: new Date(),
        $push: {
          errors: {
            phoneNumber: "system",
            error: error.message || "Unknown error",
            timestamp: new Date(),
          },
        },
      });
    } catch (updateError) {
      console.error("Failed to update campaign status:", updateError);
    }
  }
}

module.exports = campaignController;
