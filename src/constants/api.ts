export const API_URLS = {
  BASE_URL: "https://business.foodyqueen.com/Admin",
  ADS_BASE_URL: "https://business.foodyqueen.com/adstudio",
  LOCAL_URL: "http://localhost:5268/Admin",
  VERIFY_MOBILE: "/Step1_VerifyMobileNumber",
  VERIFY_OTP: "/Step2_VerifyOTP",
  CHECK_OUTLET_ID: "/CheckOutletId",
  GET_OUTLET_DETAILS: "/GetOutletDetails",
};

export const AUTH_RESPONSES = {
  OTP_SENT: "OTP_SENT",
  INVALID_OTP: "INVALID_OTP",
  GO_TO_CREATE_ACCOUNT_PAGE: "GO_TO_CREATE_ACCOUNT_PAGE",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
};

export const AUTH_STATES = {
  PHONE_INPUT: "PHONE_INPUT",
  OTP_VERIFICATION: "OTP_VERIFICATION",
  ACCOUNT_CREATION: "ACCOUNT_CREATION",
  LOADING: "LOADING",
};
