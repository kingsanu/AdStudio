import axios from "axios";

// Define the base URL for API requests
const API_URL = "https://business.foodyqueen.com/Admin";

// Define API endpoints
const ENDPOINTS = {
  VERIFY_MOBILE: "/Step1_VerifyMobileNumber",
  VERIFY_OTP: "/Step2_VerifyOTP",
  CHECK_OUTLET_ID: "/CheckOutletId",
  GET_OUTLET_DETAILS: "/GetOutletDetails",
};

// Define response types
type SendOtpResponse = {
  success: boolean;
  message: string;
};

type VerifyOtpResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    phoneNumber: string;
    // Add other user properties as needed
  };
};

type OutletDetailsResponse = {
  success: boolean;
  message?: string;
  outletId?: string;
  phone?: string;
  restaurantName?: string;
  name?: string;
  address?: string;
  description?: string;
  email?: string;
  logo?: string;
};

/**
 * Fetch outlet details by outletId
 * @param outletId - The outlet ID to fetch details for
 */
export const getOutletDetailsByOutletId = async (
  outletId: string
): Promise<OutletDetailsResponse> => {
  try {
    const response = await fetch(
      `${API_URL}${ENDPOINTS.CHECK_OUTLET_ID}?outletId=${outletId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch outlet details: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      ...data,
    };
  } catch (error) {
    console.error("Error fetching outlet details:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Send OTP to the provided phone number
 * @param phoneNumber - User's phone number
 */
export const sendOtp = async (
  phoneNumber: string
): Promise<SendOtpResponse> => {
  try {
    // Add +91 prefix if not already present
    const formattedNumber = phoneNumber.startsWith("+91")
      ? phoneNumber
      : `+91${phoneNumber}`;

    // Call the actual API endpoint
    const response = await axios.post(`${API_URL}${ENDPOINTS.VERIFY_MOBILE}`, {
      phoneNumber: formattedNumber,
    });
    return response.data;

    // Fallback to mock implementation if needed
    /* 
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      success: true,
      message: "OTP sent successfully",
    };
    */
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return {
      success: false,
      message: "Failed to send OTP. Please try again.",
    };
  }
};

/**
 * Verify OTP entered by the user
 * @param phoneNumber - User's phone number
 * @param otp - OTP entered by the user
 */
export const verifyOtp = async (
  phoneNumber: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  try {
    // Add +91 prefix if not already present
    const formattedNumber = phoneNumber.startsWith("+91")
      ? phoneNumber
      : `+91${phoneNumber}`;

    // Call the actual API endpoint
    const response = await axios.post(`${API_URL}${ENDPOINTS.VERIFY_OTP}`, {
      phoneNumber: formattedNumber,
      otp,
    });
    return response.data;

    // Fallback to mock implementation if needed
    /*
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo, we'll accept any 4-digit OTP
    if (otp.length === 4 && /^\d{4}$/.test(otp)) {
      return {
        success: true,
        message: "OTP verified successfully",
        token: "mock-jwt-token-" + Date.now(),
        user: {
          phoneNumber: formattedNumber,
        },
      };
    }

    return {
      success: false,
      message: "Invalid OTP. Please try again.",
    };
    */
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return {
      success: false,
      message: "Failed to verify OTP. Please try again.",
    };
  }
};

/**
 * Resend OTP to the provided phone number
 * @param phoneNumber - User's phone number
 */
export const resendOtp = async (
  phoneNumber: string
): Promise<SendOtpResponse> => {
  try {
    // Add +91 prefix if not already present
    const formattedNumber = phoneNumber.startsWith("+91")
      ? phoneNumber
      : `+91${phoneNumber}`;

    // Reuse the same endpoint as sendOtp for resending
    const response = await axios.post(`${API_URL}${ENDPOINTS.VERIFY_MOBILE}`, {
      phoneNumber: formattedNumber,
      resend: true, // Optional flag to indicate resend
    });
    return response.data;

    // Fallback to mock implementation if needed
    /*
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      success: true,
      message: "OTP resent successfully",
    };
    */
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return {
      success: false,
      message: "Failed to resend OTP. Please try again.",
    };
  }
};
