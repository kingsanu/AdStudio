import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Smartphone,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
  Clock,
  QrCode,
} from "lucide-react";
import { whatsappService } from "@/services/whatsappService";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";

interface WhatsAppConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  username?: string;
}

export default function WhatsAppConnectionDialog({
  open,
  onClose,
  onSuccess,
  username: initialUsername = "",
}: WhatsAppConnectionDialogProps) {
  // Get user ID from cookies
  const userId = Cookies.get("auth_token") || "";

  // Username and state management
  const [username, setUsername] = useState(initialUsername);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrContentType, setQrContentType] = useState<string>("image/png");
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "failed"
  >("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Timer management
  const [sessionCreationTimer, setSessionCreationTimer] = useState(0);
  const [qrRefreshTimer, setQrRefreshTimer] = useState(0);
  const [qrRetryTimer, setQrRetryTimer] = useState(0);
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  // Connection management
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    if (open) {
      if (initialUsername) {
        setUsername(initialUsername);
        checkExistingWhatsAppSettings();
      } else {
        setStatus("idle");
      }
    }

    return () => {
      // Clean up timers and states when dialog closes
      clearAllIntervals();
      setSessionCreationTimer(0);
      setQrRefreshTimer(0);
      setQrRetryTimer(0);
      setIsCreatingSession(false);
      setIsWaitingForQR(false);
      setQrCode(null);
      setIsPollingActive(false);
    };
  }, [open, initialUsername]);

  // Helper to clear all intervals
  const clearAllIntervals = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Check for existing WhatsApp settings and connection status
  const checkExistingWhatsAppSettings = async () => {
    try {
      setIsCheckingConnection(true);
      setStatus("connecting");

      // First, try to get existing WhatsApp settings
      const existingSettings = await whatsappService.getSettings(userId);

      if (existingSettings) {
        console.log("Found existing WhatsApp settings:", existingSettings);
        setCurrentSessionId(existingSettings.username);

        // Update username with existing username
        setUsername(existingSettings.username);

        // Check current connection status
        const statusResponse = await whatsappService.checkConnectionStatus(
          userId
        );
        console.log("Connection status check:", statusResponse);

        if (statusResponse.status === "connected") {
          setStatus("connected");
          console.log(
            "WhatsApp already connected, no need to create new session"
          );
          toast.success("WhatsApp is already connected!");

          // Trigger success callback after a short delay
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          console.log("WhatsApp not connected, auto-starting new session");
          toast.info(
            "WhatsApp connection found but not active. Starting new session..."
          );
          // Auto-start new session if disconnected
          handleCreateNewSession();
        }
      } else {
        console.log(
          "No existing WhatsApp settings found, ready for new connection"
        );
        setStatus("idle");
      }
    } catch (error) {
      console.error("Error checking existing WhatsApp settings:", error);
      setStatus("idle");
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Check connection status
  const checkStatus = async (sessionId: string) => {
    try {
      const statusResponse = await whatsappService.checkConnectionStatus(
        userId
      );

      if (statusResponse.status === "connected") {
        setStatus("connected");
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        // Trigger success callback
        onSuccess();

        return true;
      } else if (statusResponse.status === "connecting") {
        setStatus("connecting");
        return false;
      } else {
        setStatus("idle");
        return false;
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      setStatus("failed");
      return false;
    }
  };

  // Generate unique session ID with timestamp
  const generateUniqueSessionId = () => {
    const timestamp = Date.now();
    return `session_${userId}_${timestamp}`;
  };

  // Start 30-second QR retry timer
  const startQRRetryTimer = (sessionId: string) => {
    setIsWaitingForQR(true);
    setQrRetryTimer(30);

    console.log("QR not ready, starting 30-second retry timer...");
    toast.info("QR code is being generated, retrying in 30 seconds...");

    const retryInterval = setInterval(() => {
      setQrRetryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(retryInterval);
          setIsWaitingForQR(false);
          console.log("Retrying QR code fetch after 30 seconds...");
          fetchQRCode(sessionId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up any existing sessions that might conflict
  const cleanupExistingSessions = async () => {
    try {
      // Terminate existing session
      await whatsappService.terminateSession(userId);
      console.log("Terminated sessions via WhatsApp service");
    } catch (error) {
      console.log("No sessions to terminate via service");
    }

    // Wait for termination to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));
  };

  // Create a new WhatsApp session
  const handleCreateNewSession = async () => {
    try {
      setIsCreatingSession(true);
      setStatus("connecting");
      setSessionCreationTimer(60);

      // Generate unique session ID
      const newSessionId = generateUniqueSessionId();
      setCurrentSessionId(newSessionId);
      setUsername(newSessionId);

      toast.info("Creating new WhatsApp session...");

      // Clean up any existing sessions
      await cleanupExistingSessions();

      // Start the new session
      const startResponse = await whatsappService.startSession(userId);

      // Start 60-second countdown timer
      const timerInterval = setInterval(() => {
        setSessionCreationTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            // After 60 seconds, fetch QR code
            fetchQRCode(newSessionId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error creating WhatsApp session:", error);
      toast.error("Failed to create WhatsApp session");
      setStatus("failed");
      setIsCreatingSession(false);
    }
  };

  // Start connection process when user clicks Connect button
  const startConnectionProcess = async () => {
    if (!username || username.trim() === "") {
      toast.error("Please enter a valid WhatsApp username");
      return;
    }

    try {
      setIsLoading(true);
      handleCreateNewSession();
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      setStatus("failed");
      toast.error("An error occurred while connecting to WhatsApp");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch QR code data from the API
  const fetchQRCode = async (sessionId: string) => {
    try {
      console.log("Fetching QR code for session:", sessionId);
      const qrUrl = whatsappService.getQRCodeUrl(sessionId);

      const response = await axios.get(qrUrl, {
        timeout: 60000, // 60 second timeout
      });

      console.log("QR response:", {
        success: response.data.success,
        hasQR: !!response.data.qr,
        contentType: response.data.contentType,
      });

      if (response.data && response.data.success) {
        if (response.data.qr) {
          // QR code is ready and available
          setQrCode(response.data.qr);
          setQrContentType(response.data.contentType || "image/png");
          setStatus("connecting");
          setIsCreatingSession(false);
          setIsWaitingForQR(false);
          toast.success("QR code ready! Please scan to connect.");

          // Start connection polling
          startConnectionPolling(sessionId);

          // Start QR refresh cycle every 45 seconds
          startQRRefreshCycle(sessionId);
        } else if (response.data.qrReady === false) {
          // QR is not ready yet - start retry timer
          startQRRetryTimer(sessionId);
        } else {
          throw new Error("Unexpected response format");
        }
      } else {
        throw new Error(response.data?.message || "Failed to fetch QR code");
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      toast.error("Failed to fetch QR code");
      setStatus("failed");
      setIsCreatingSession(false);
    }
  };

  // Start connection status polling
  const startConnectionPolling = (sessionId: string) => {
    // Prevent multiple polling intervals
    if (isPollingActive) {
      console.log("Polling already active, skipping...");
      return;
    }

    setIsPollingActive(true);
    console.log("Starting connection status polling...");

    const pollInterval = setInterval(async () => {
      if (status === "connected") {
        console.log("Connected! Stopping polling.");
        setIsPollingActive(false);
        clearInterval(pollInterval);
        return;
      }

      try {
        const isConnected = await checkStatus(sessionId);

        if (isConnected) {
          setIsPollingActive(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error during status polling:", error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(pollInterval);
  };

  // Start QR code refresh cycle
  const startQRRefreshCycle = (sessionId: string) => {
    const refreshInterval = setInterval(async () => {
      if (status === "connected") {
        clearInterval(refreshInterval);
        return;
      }

      setQrRefreshTimer(45);

      // Countdown for next refresh
      const countdownInterval = setInterval(() => {
        setQrRefreshTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Refresh QR code
            fetchQRCode(sessionId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 45000); // Refresh every 45 seconds
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const response = await whatsappService.terminateSession(userId);

      if (response.success) {
        toast.success("WhatsApp disconnected successfully");
        setStatus("idle");
        setQrCode(null);

        // Clear all intervals
        clearAllIntervals();
      } else {
        toast.error(response.message || "Failed to disconnect WhatsApp");
      }
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      toast.error("An error occurred while disconnecting WhatsApp");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    // If checking connection status
    if (isCheckingConnection) {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h3 className="text-lg font-medium mb-2">Checking Connection</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            Checking existing WhatsApp connection...
          </p>
        </div>
      );
    }

    // If session is being created
    if (isCreatingSession) {
      return (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            {isWaitingForQR ? (
              <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            )}
          </div>
          <h3 className="text-lg font-medium mb-2">Creating Session</h3>
          {isWaitingForQR ? (
            <div className="text-center mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                Waiting for QR code to be ready...
              </p>
              <div className="flex items-center justify-center mt-2">
                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                <span className="text-sm text-amber-600">
                  Retrying in {qrRetryTimer} seconds
                </span>
              </div>
            </div>
          ) : sessionCreationTimer > 0 ? (
            <div className="text-center mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                Setting up WhatsApp session...
              </p>
              <div className="flex items-center justify-center mt-2">
                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                <span className="text-sm text-amber-600">
                  QR code will be ready in approximately {sessionCreationTimer}{" "}
                  seconds
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Getting everything ready...
            </p>
          )}
        </div>
      );
    }

    // Render based on connection status
    switch (status) {
      case "connecting":
        return (
          <div className="flex flex-col items-center justify-center py-6">
            {qrCode ? (
              <>
                <div className="bg-white p-4 rounded-lg mb-4">
                  <img
                    src={`data:${qrContentType};base64,${qrCode}`}
                    alt="WhatsApp QR Code"
                    width="200"
                    height="200"
                  />
                </div>
                {qrRefreshTimer > 0 && (
                  <div className="text-xs text-gray-500 mb-4">
                    QR code refreshes in {qrRefreshTimer} seconds
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            )}
            <h3 className="text-lg font-medium mb-2">Connect WhatsApp</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              1. Open WhatsApp on your phone
              <br />
              2. Tap Menu or Settings and select WhatsApp Web
              <br />
              3. Scan the QR code above
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Waiting for connection...
              </span>
            </div>
          </div>
        );

      case "connected":
        return (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">WhatsApp Connected</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Your WhatsApp account is successfully connected. You can now send
              campaigns.
            </p>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        );

      case "failed":
        return (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connection Failed</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Failed to connect to WhatsApp. Please try again.
            </p>
            <Button
              variant="default"
              onClick={() => {
                setStatus("idle");
                setQrCode(null);
                handleCreateNewSession();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        );

      default: // idle
        return (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">WhatsApp Connection</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect your phone to WhatsApp to send marketing campaigns.
                You'll need to scan a QR code with your phone's WhatsApp app.
              </p>
              <Button
                className="w-full"
                onClick={handleCreateNewSession}
                disabled={isLoading}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Start WhatsApp Connection
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp</DialogTitle>
          <DialogDescription>
            Connect your WhatsApp account to send campaigns
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        {status === "idle" && (
          <DialogFooter>
            <Button
              type="submit"
              onClick={startConnectionProcess}
              disabled={isLoading || !username}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
