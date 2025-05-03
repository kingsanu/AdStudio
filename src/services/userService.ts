import axios from "axios";
import { API_URLS } from "@/constants/api";

export interface UserDetails {
  userId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  whatsappUsername?: string; // Added WhatsApp username
  logo?: string;
  businessName?: string;
  businessType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  createdAt?: string;
  updatedAt?: string;
  restId?: number; // Added RestId for subscription determination
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
  };
}

export const userService = {
  // Get user details by user ID
  async getUserDetails(userId: string): Promise<UserDetails | null> {
    try {
      // Add timeout to prevent hanging requests
      // Use the correct API endpoint format with CheckOutletId
      const response = await axios.get(
        `${API_URLS.ADS_BASE_URL}/CheckOutletId?outletId=${userId}`,
        {
          timeout: 5000, // 5 second timeout
        }
      );

      // Check if the response contains valid user data
      if (response.data) {
        console.log("API Response:", response.data);

        // Map the API response to our UserDetails interface based on the actual response format
        const userData: UserDetails = {
          userId: response.data.ID || userId,
          name: response.data.Name || "User",
          phoneNumber: response.data.RestPhone || "",
          whatsappUsername:
            response.data.WhatsappUsername || response.data.RestPhone || "", // Use WhatsApp username if available, otherwise use phone number
          email: "", // Not provided in the response
          logo: "", // Not provided in the response
          businessName: response.data.Name || "",
          businessType: "", // Not provided in the response
          address: response.data.Address || "",
          city: response.data.City || "",
          state: "", // Not provided in the response
          country: "", // Not provided in the response
          zipCode: "", // Not provided in the response
          createdAt: response.data.CreatedOn || "",
          updatedAt: response.data.ModifiedOn || "",
          // Store RestId for subscription determination
          restId: response.data.RestId || 0,
        };

        return userData;
      } else {
        console.warn(
          `Invalid user data received for ID ${userId}:`,
          response.data
        );
        // Return a mock user object with the userId to prevent further API calls
        return {
          userId: userId,
          name: "User",
          phoneNumber: "",
          whatsappUsername: "",
        };
      }
    } catch (error) {
      console.error(`Error fetching user details for ID ${userId}:`, error);
      // Return a mock user object with the userId to prevent further API calls
      return {
        userId: userId,
        name: "User",
        phoneNumber: "",
        whatsappUsername: "",
      };
    }
  },

  // Update user details
  async updateUserDetails(
    userId: string,
    details: Partial<UserDetails>
  ): Promise<UserDetails | null> {
    try {
      // Use the correct API endpoint format
      const response = await axios.put(
        `${API_URLS.ADS_BASE_URL}/UpdateOutlet?outletId=${userId}`,
        details
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating user details for ID ${userId}:`, error);
      return null;
    }
  },

  // Update user preferences
  async updateUserPreferences(
    userId: string,
    preferences: UserDetails["preferences"]
  ): Promise<boolean> {
    try {
      // Use the correct API endpoint format
      // Note: This endpoint might need to be adjusted based on the actual API
      await axios.patch(
        `${API_URLS.ADS_BASE_URL}/UpdatePreferences?outletId=${userId}`,
        preferences
      );
      return true;
    } catch (error) {
      console.error(`Error updating user preferences for ID ${userId}:`, error);
      return false;
    }
  },

  // Get user subscription details
  async getUserSubscription(
    userId: string
  ): Promise<UserDetails["subscription"] | null> {
    try {
      // Check if we have cached subscription data and it's not too old (less than 24 hours old)
      const cachedSubscription = localStorage.getItem("subscription_data");
      const cachedTimestamp = localStorage.getItem("subscription_timestamp");
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // If we have cached data and it's recent, use it
      if (
        cachedSubscription &&
        cachedTimestamp &&
        now - parseInt(cachedTimestamp) < ONE_DAY
      ) {
        console.log("Using cached subscription data from localStorage");
        return JSON.parse(cachedSubscription);
      }

      // If we get here, we need to fetch fresh data
      console.log("Fetching fresh subscription data");

      // Use the correct API endpoint format
      // Note: This endpoint might need to be adjusted based on the actual API
      const response = await axios.get(
        `${API_URLS.ADS_BASE_URL}/GetSubscription?outletId=${userId}`,
        { timeout: 5000 } // 5 second timeout
      );

      // If we don't have actual subscription data yet, create a mock subscription
      // based on the RestId from the user data
      if (!response.data) {
        // Try to get the user data first to determine the plan
        try {
          // Check if we have cached user data with RestId
          const cachedUserData = localStorage.getItem("s_data");
          let restId = 0;

          if (cachedUserData) {
            const userData = JSON.parse(cachedUserData);
            // Try to extract RestId from cached user data
            if (userData.restId) {
              restId = userData.restId;
              console.log("Using RestId from cached user data:", restId);
            }
          }

          // If we couldn't get RestId from cache, fetch it
          if (restId === 0) {
            const userResponse = await axios.get(
              `${API_URLS.ADS_BASE_URL}/CheckOutletId?outletId=${userId}`,
              { timeout: 5000 }
            );
            restId = userResponse.data?.RestId || 0;
            console.log("Fetched RestId from API:", restId);
          }

          // Use RestId to determine the plan tier
          let plan = "Free";

          if (restId > 10) {
            plan = "Premium";
          } else if (restId > 5) {
            plan = "Standard";
          }

          const subscriptionData = {
            plan,
            status: "active",
            expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          };

          // Cache the subscription data
          localStorage.setItem(
            "subscription_data",
            JSON.stringify(subscriptionData)
          );
          localStorage.setItem("subscription_timestamp", now.toString());

          return subscriptionData;
        } catch (error) {
          console.error("Error fetching user data for subscription:", error);
          // Fallback to default subscription
          const defaultSubscription = {
            plan: "Free",
            status: "active",
            expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          };

          // Cache the default subscription data
          localStorage.setItem(
            "subscription_data",
            JSON.stringify(defaultSubscription)
          );
          localStorage.setItem("subscription_timestamp", now.toString());

          return defaultSubscription;
        }
      }

      // Cache the subscription data from API
      localStorage.setItem("subscription_data", JSON.stringify(response.data));
      localStorage.setItem("subscription_timestamp", now.toString());

      return response.data;
    } catch (error) {
      console.error(
        `Error fetching subscription for user ID ${userId}:`,
        error
      );

      // Try to get the user data first to determine the plan
      try {
        // Check if we have cached user data with RestId
        const cachedUserData = localStorage.getItem("s_data");
        let restId = 0;

        if (cachedUserData) {
          const userData = JSON.parse(cachedUserData);
          // Try to extract RestId from cached user data
          if (userData.restId) {
            restId = userData.restId;
            console.log(
              "Using RestId from cached user data for fallback:",
              restId
            );
          }
        }

        // If we couldn't get RestId from cache, fetch it with shorter timeout
        if (restId === 0) {
          const userResponse = await axios.get(
            `${API_URLS.ADS_BASE_URL}/CheckOutletId?outletId=${userId}`,
            { timeout: 3000 } // Shorter timeout for error case
          );
          restId = userResponse.data?.RestId || 0;
        }

        // Use RestId to determine the plan tier
        let plan = "Free";

        if (restId > 10) {
          plan = "Premium";
        } else if (restId > 5) {
          plan = "Standard";
        }

        const subscriptionData = {
          plan,
          status: "active",
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
        };

        // Cache the subscription data
        localStorage.setItem(
          "subscription_data",
          JSON.stringify(subscriptionData)
        );
        localStorage.setItem("subscription_timestamp", Date.now().toString());

        return subscriptionData;
      } catch (innerError) {
        console.error(
          "Error fetching user data for subscription fallback:",
          innerError
        );

        // Final fallback to default subscription
        const defaultSubscription = {
          plan: "Free",
          status: "active",
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
        };

        // Cache the default subscription data
        localStorage.setItem(
          "subscription_data",
          JSON.stringify(defaultSubscription)
        );
        localStorage.setItem("subscription_timestamp", Date.now().toString());

        return defaultSubscription;
      }
    }
  },
};
