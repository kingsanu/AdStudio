// WhatsApp API endpoints and constants
export const WHATSAPP_API = {
  BASE_URL: "http://whatsapp.foodyqueen.com",
  // Start session endpoint - GET
  START_SESSION: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/start/${username}`,
  // QR code endpoint - GET
  GET_QR_CODE: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/qr/${username}/image`,
  // Session status endpoint - GET
  CHECK_STATUS: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/status/${username}`,
  // Restart session endpoint - GET
  RESTART_SESSION: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/session/restart/${username}`,
  // Send message endpoint - POST
  SEND_MESSAGE: (username: string) =>
    `${WHATSAPP_API.BASE_URL}/client/sendMessage/${username}`,
};

// WhatsApp connection states
export enum WhatsAppConnectionState {
  CHECKING = "checking",
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

// QR code refresh interval in milliseconds (45 seconds)
export const QR_REFRESH_INTERVAL = 45000;
