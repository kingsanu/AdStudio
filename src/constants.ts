// API endpoints
export const GET_TEMPLATE_ENDPOINT =
  "https://foodyqueen.blob.core.windows.net/blob";
export const API_BASE_URL = "https://adstudioserver.foodyqueen.com";
export const UPLOAD_TEMPLATE_ENDPOINT = `${API_BASE_URL}/api/upload-template`;
export const UPLOAD_IMAGE_ENDPOINT = `${API_BASE_URL}/api/upload-image`;
export const REMOVE_BACKGROUND_ENDPOINT = `${API_BASE_URL}/api/remove-background`;

// WhatsApp API endpoints
export const WHATSAPP_API = {
  BASE_URL: "http://whatsapp.foodyqueen.com",
  START_SESSION: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/start/${username}`,
  GET_QR_CODE: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/qr/${username}/image`,
  CHECK_STATUS: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/status/${username}`,
  RESTART_SESSION: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/restart/${username}`,
  SEND_MESSAGE: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/client/sendMessage/${username}`,
};
