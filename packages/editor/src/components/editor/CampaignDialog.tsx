/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Slider from "../../components/slider/Slider";
import {
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Phone,
  Clock,
} from "lucide-react";
import { whatsappService } from "@/services/whatsappService";
import {
  WhatsAppConnectionState,
  QR_REFRESH_INTERVAL,
} from "@/constants/whatsapp";

interface CampaignDialogProps {
  open: boolean;
  onClose: () => void;
}

const CampaignDialog: React.FC<CampaignDialogProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const qrRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevConnectionStatusRef = useRef<WhatsAppConnectionState | null>(null);

  // Campaign data state
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    numUsers: 100,
    message: "",
    whatsappUsername: "",
    customSegments: [] as Option[],
  });

  // WhatsApp connection state
  const [hasWhatsappUsername, setHasWhatsappUsername] = useState(false);
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<WhatsAppConnectionState>(WhatsAppConnectionState.CHECKING);
  const [qrRefreshTimestamp, setQrRefreshTimestamp] = useState<number>(
    Date.now()
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [initialConnectionCheck, setInitialConnectionCheck] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Function to start a WhatsApp session
  const startWhatsAppSession = useCallback(async () => {
    if (!user?.userId) return;

    try {
      console.log(
        `Attempting to start WhatsApp session for user ${user.userId}`
      );
      setIsCheckingStatus(true);

      // Start the session using the backend API
      const result = await whatsappService.startSession(user.userId);

      // Check for success in both old and new response formats
      if (result.success) {
        console.log(
          `WhatsApp session ready: ${
            result.message || "Session started successfully"
          }`
        );

        // Check if we have the new format with state property
        if (result.state === "CONNECTED") {
          // New response format indicates already connected
          setConnectionStatus(WhatsAppConnectionState.CONNECTED);
        }

        setSessionStarted(true);
        // Refresh the QR code immediately after starting the session
        setQrRefreshTimestamp(Date.now());
      } else {
        // Check if the message indicates the session already exists
        if (result.message && result.message.includes("already exists")) {
          console.log(`WhatsApp session already exists: ${result.message}`);
          setSessionStarted(true);
          // Refresh the QR code immediately
          setQrRefreshTimestamp(Date.now());
        } else {
          // This is a real error
          console.error(`Failed to start WhatsApp session: ${result.message}`);
          toast.error("Failed to start WhatsApp session", {
            description: result.message,
            icon: <AlertCircle className="h-5 w-5 text-white" />,
            duration: 3000,
          });
          setConnectionStatus(WhatsAppConnectionState.ERROR);
        }
      }
    } catch (error) {
      console.error("Error starting WhatsApp session:", error);
      setConnectionStatus(WhatsAppConnectionState.ERROR);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [
    user,
    setIsCheckingStatus,
    setSessionStarted,
    setQrRefreshTimestamp,
    setConnectionStatus,
  ]);

  // Function to check WhatsApp connection status
  const checkConnectionStatus = useCallback(
    async (userId: string, _username: string) => {
      try {
        setIsCheckingStatus(true);

        // Check connection status
        const { status } = await whatsappService.checkConnectionStatus(userId);

        // Update the connection status
        setConnectionStatus(status);
        prevConnectionStatusRef.current = status;

        // If connected, we're done
        if (status === WhatsAppConnectionState.CONNECTED) {
          return;
        }

        // If not connected, refresh QR code
        console.log(
          `QR code refreshed at ${new Date().toISOString()} (after status check)`
        );
        setQrRefreshTimestamp(Date.now());
      } catch (error) {
        console.error("Error checking WhatsApp connection status:", error);
        setConnectionStatus(WhatsAppConnectionState.ERROR);
        prevConnectionStatusRef.current = WhatsAppConnectionState.ERROR;
      } finally {
        setIsCheckingStatus(false);
      }
    },
    []
  );

  // Setup periodic status check - only used in step 2
  const setupStatusCheck = useCallback(() => {
    if (statusCheckTimerRef.current) {
      clearInterval(statusCheckTimerRef.current);
    }

    // Only setup status check if we're on step 2
    if (
      step === 2 &&
      user?.userId &&
      hasWhatsappUsername &&
      campaignData.whatsappUsername
    ) {
      statusCheckTimerRef.current = setInterval(() => {
        const currentStatus = prevConnectionStatusRef.current;
        if (
          currentStatus !== WhatsAppConnectionState.CONNECTED &&
          user.userId
        ) {
          checkConnectionStatus(user.userId, campaignData.whatsappUsername);
        }
      }, 10000); // Check every 10 seconds
    }
  }, [
    step,
    user,
    hasWhatsappUsername,
    campaignData.whatsappUsername,
    checkConnectionStatus,
  ]);

  // Setup QR code refresh
  const setupQrRefresh = useCallback(() => {
    if (qrRefreshTimerRef.current) {
      clearInterval(qrRefreshTimerRef.current);
    }

    // Only start QR refresh if we're on step 2 (WhatsApp connection)
    if (
      step === 2 &&
      user?.userId &&
      hasWhatsappUsername &&
      campaignData.whatsappUsername &&
      prevConnectionStatusRef.current !== WhatsAppConnectionState.CONNECTED
    ) {
      console.log(
        `Starting QR refresh interval at ${new Date().toISOString()}`
      );
      qrRefreshTimerRef.current = setInterval(() => {
        console.log(
          `QR code refreshed at ${new Date().toISOString()} (30-second interval)`
        );
        setQrRefreshTimestamp(Date.now());
      }, QR_REFRESH_INTERVAL);
    }
  }, [
    user,
    hasWhatsappUsername,
    campaignData.whatsappUsername,
    step,
    prevConnectionStatusRef,
  ]);

  // Load WhatsApp settings when the dialog opens (without checking connection status)
  useEffect(() => {
    const loadWhatsAppSettings = async () => {
      if (user?.userId) {
        try {
          // Generate a unique WhatsApp username based on user ID
          // This ensures we have a consistent identifier for the WhatsApp session
          const whatsappUsername = `s_${user.userId}`;
          setHasWhatsappUsername(true);
          setCampaignData((prev) => ({
            ...prev,
            whatsappUsername: whatsappUsername,
          }));

          // Try to get WhatsApp settings from the API
          const settings = await whatsappService.getSettings(user.userId);

          if (!settings || !settings.username) {
            // Create new settings with the generated username if they don't exist
            await whatsappService.saveSettings(user.userId, whatsappUsername);
          }

          // Set initial status to disconnected - we'll check actual status only in step 2
          setConnectionStatus(WhatsAppConnectionState.DISCONNECTED);
        } catch (error) {
          console.error("Error loading WhatsApp settings:", error);

          // Generate a username even if there's an error
          const whatsappUsername = `s_${user.userId}`;
          setHasWhatsappUsername(true);
          setCampaignData((prev) => ({
            ...prev,
            whatsappUsername: whatsappUsername,
          }));

          setConnectionStatus(WhatsAppConnectionState.DISCONNECTED);
        }
      }
    };

    if (open) {
      console.log(`CampaignDialog opened at ${new Date().toISOString()}`);
      loadWhatsAppSettings();
      // We'll setup status check and QR refresh only when step changes to 2
    }

    // Cleanup timers when dialog closes
    return () => {
      if (statusCheckTimerRef.current) {
        clearInterval(statusCheckTimerRef.current);
      }

      if (qrRefreshTimerRef.current) {
        clearInterval(qrRefreshTimerRef.current);
      }
    };
  }, [user, open, hasWhatsappUsername, campaignData.whatsappUsername]);

  // Effect to handle step changes
  useEffect(() => {
    // When step changes to 2 (WhatsApp connection), setup QR refresh and start session
    if (step === 2) {
      console.log(
        `Step changed to WhatsApp connection at ${new Date().toISOString()}`
      );
      setupQrRefresh();
      setupStatusCheck();

      // Perform initial connection check when entering step 2
      if (
        user?.userId &&
        hasWhatsappUsername &&
        campaignData.whatsappUsername
      ) {
        setInitialConnectionCheck(true);
        setConnectionStatus(WhatsAppConnectionState.CHECKING);

        // Check connection status first
        (async () => {
          try {
            setIsCheckingStatus(true);
            const { status } = await whatsappService.checkConnectionStatus(
              user.userId
            );
            setConnectionStatus(status);
            prevConnectionStatusRef.current = status;

            // If not connected, start a new session
            if (
              status !== WhatsAppConnectionState.CONNECTED &&
              !sessionStarted
            ) {
              console.log(
                `Starting WhatsApp session at ${new Date().toISOString()} (step change)`
              );
              await startWhatsAppSession();
            }
          } catch (error) {
            console.error("Error checking connection on step change:", error);
            setConnectionStatus(WhatsAppConnectionState.ERROR);
            prevConnectionStatusRef.current = WhatsAppConnectionState.ERROR;
          } finally {
            setIsCheckingStatus(false);
            setInitialConnectionCheck(false);
          }
        })();
      }
    } else {
      // When leaving step 2, clear the QR refresh interval
      if (qrRefreshTimerRef.current) {
        console.log(
          `Clearing QR refresh interval at ${new Date().toISOString()} (step change)`
        );
        clearInterval(qrRefreshTimerRef.current);
        qrRefreshTimerRef.current = null;
      }

      // Reset session started flag when leaving step 2
      setSessionStarted(false);
    }
  }, [
    step,
    user,
    hasWhatsappUsername,
    campaignData.whatsappUsername,
    setupQrRefresh,
    setupStatusCheck,
    prevConnectionStatusRef,
    sessionStarted,
    startWhatsAppSession,
    setSessionStarted,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCampaignData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (value: number) => {
    setCampaignData((prev) => ({
      ...prev,
      numUsers: value,
    }));
  };

  const handleCustomSegmentsChange = (options: Option[]) => {
    setCampaignData((prev) => ({
      ...prev,
      customSegments: options,
    }));
  };

  // Handle manual connection status check
  const handleCheckStatus = async () => {
    if (!user?.userId || !campaignData.whatsappUsername) return;

    try {
      setIsCheckingStatus(true);
      setConnectionStatus(WhatsAppConnectionState.CHECKING);
      prevConnectionStatusRef.current = WhatsAppConnectionState.CHECKING;

      const { status } = await whatsappService.checkConnectionStatus(
        user.userId
      );
      setConnectionStatus(status);
      prevConnectionStatusRef.current = status;

      if (status === WhatsAppConnectionState.CONNECTED) {
        toast.success("WhatsApp connected", {
          description:
            "Your WhatsApp account is connected and ready to send messages",
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          duration: 3000,
        });
      } else if (status === WhatsAppConnectionState.DISCONNECTED) {
        toast.error("WhatsApp disconnected", {
          description:
            "Please scan the QR code to connect your WhatsApp account",
          icon: <AlertCircle className="h-5 w-5 text-white" />,
          duration: 3000,
        });

        // Refresh QR code
        console.log(
          `QR code refreshed at ${new Date().toISOString()} (manual check status)`
        );
        setQrRefreshTimestamp(Date.now());
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      setConnectionStatus(WhatsAppConnectionState.ERROR);
      prevConnectionStatusRef.current = WhatsAppConnectionState.ERROR;

      toast.error("Connection check failed", {
        description: "Failed to check WhatsApp connection status",
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 3000,
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle WhatsApp session restart
  const handleRestartSession = async () => {
    if (!user?.userId || !campaignData.whatsappUsername) return;

    try {
      setIsCheckingStatus(true);
      setConnectionStatus(WhatsAppConnectionState.CHECKING);
      prevConnectionStatusRef.current = WhatsAppConnectionState.CHECKING;

      const { status } = await whatsappService.restartSession(user.userId);
      setConnectionStatus(status);
      prevConnectionStatusRef.current = status;

      toast.info("WhatsApp session restarting", {
        description: "Please wait while we restart your WhatsApp session",
        icon: <RefreshCw className="h-5 w-5 text-white" />,
        duration: 3000,
      });

      // Refresh QR code
      console.log(
        `QR code refreshed at ${new Date().toISOString()} (restart session)`
      );
      setQrRefreshTimestamp(Date.now());
    } catch (error) {
      console.error("Error restarting WhatsApp session:", error);
      setConnectionStatus(WhatsAppConnectionState.ERROR);
      prevConnectionStatusRef.current = WhatsAppConnectionState.ERROR;

      toast.error("Restart failed", {
        description: "Failed to restart WhatsApp session",
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 3000,
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!campaignData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (!campaignData.message.trim()) {
      toast.error("Campaign message is required");
      return;
    }

    if (campaignData.customSegments.length === 0) {
      toast.error("Please select at least one customer segment");
      return;
    }

    // No need to validate WhatsApp username as it's generated automatically

    try {
      // Save WhatsApp username to the separate model
      if (user?.userId && campaignData.whatsappUsername) {
        setIsSavingWhatsapp(true);

        // Save WhatsApp settings using the service
        const settings = await whatsappService.saveSettings(
          user.userId,
          campaignData.whatsappUsername
        );

        if (settings) {
          toast.success("WhatsApp number saved", {
            description:
              "Your WhatsApp number has been saved for future campaigns",
            icon: <CheckCircle className="h-5 w-5 text-white" />,
            duration: 3000,
          });
        }

        // Check WhatsApp connection status before starting campaign
        const { status } = await whatsappService.checkConnectionStatus(
          user.userId
        );
        setConnectionStatus(status);
        prevConnectionStatusRef.current = status;

        // If not connected, show error and don't start campaign
        if (status !== WhatsAppConnectionState.CONNECTED) {
          toast.error("WhatsApp not connected", {
            description:
              "Please connect your WhatsApp account before starting the campaign",
            icon: <AlertCircle className="h-5 w-5 text-white" />,
            duration: 5000,
          });

          // Switch to WhatsApp setup step
          setStep(2);
          return;
        }
      }

      // Here you would handle the campaign submission
      console.log("Campaign data:", campaignData);

      // Log the selected customer segments for debugging
      console.log(
        "Selected customer segments:",
        campaignData.customSegments.map((segment) => segment.label)
      );

      // Send campaign messages using WhatsApp API
      if (user?.userId && campaignData.whatsappUsername) {
        // In a real implementation, you would loop through your recipients
        // For now, we'll just simulate a successful campaign
        toast.success("Campaign started", {
          description: `Sending messages to ${campaignData.numUsers} recipients`,
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          duration: 5000,
        });
      }

      // Show success toast
      toast.success("Campaign started successfully!");

      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Error in campaign submission:", error);
      toast.error("Failed to start campaign");
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleNext = () => {
    // Validate required fields for step 1
    if (!campaignData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (!campaignData.message.trim()) {
      toast.error("Campaign message is required");
      return;
    }

    if (campaignData.customSegments.length === 0) {
      toast.error("Please select at least one customer segment");
      return;
    }

    // Set initial connection check flag to true when moving to step 2
    setInitialConnectionCheck(true);
    setStep(2);
  };

  // Memoize the QR code URL to prevent unnecessary fetches on re-renders
  const qrCodeElement = useMemo(() => {
    if (
      step !== 2 ||
      connectionStatus !== WhatsAppConnectionState.DISCONNECTED ||
      !sessionStarted
    ) {
      return null;
    }

    // Only create a new URL when the timestamp changes
    const qrCodeUrl = `${whatsappService.getQRCodeUrl(
      campaignData.whatsappUsername
    )}?t=${qrRefreshTimestamp}`;

    console.log(`QR code URL created: ${qrCodeUrl}`);

    return (
      <div
        className="border rounded-md overflow-hidden bg-white p-3 mx-auto shadow-md"
        style={{ width: "240px", height: "240px" }}
      >
        <img
          src={qrCodeUrl}
          alt="WhatsApp QR Code"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }, [
    step,
    connectionStatus,
    campaignData.whatsappUsername,
    qrRefreshTimestamp,
    sessionStarted,
  ]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Start Campaign" : "Connect WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Create a new campaign to share your design"
              : "Scan the QR code with your phone to connect WhatsApp"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Campaign Name
              </Label>
              <Input
                id="name"
                name="name"
                value={campaignData.name}
                onChange={handleInputChange}
                placeholder="Enter campaign name"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerSegments" className="text-right">
                Customer Segments
              </Label>
              <div className="col-span-3">
                <MultipleSelector
                  value={campaignData.customSegments}
                  onChange={handleCustomSegmentsChange}
                  placeholder="Select or add customer segments..."
                  defaultOptions={[
                    { value: "vip", label: "VIP Customers" },
                    {
                      value: "inactive_6months",
                      label: "Last 6 Months Not Visited",
                    },
                    { value: "recent_visitors", label: "Visited Last Month" },
                    { value: "high_spenders", label: "High Spenders" },
                    { value: "new_customers", label: "New Customers" },
                    { value: "all", label: "All Customers" },
                  ]}
                  emptyIndicator={
                    <p className="text-center text-sm text-gray-500">
                      No segments found. Type to create a custom segment.
                    </p>
                  }
                />
                <div className="text-xs text-gray-500 mt-1">
                  Select predefined segments or create custom ones
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numUsers" className="text-right">
                Number of Users
              </Label>
              <div className="col-span-3">
                <Slider
                  min={10}
                  max={1000}
                  step={10}
                  value={campaignData.numUsers}
                  onChange={handleSliderChange}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {campaignData.numUsers} users
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                value={campaignData.message}
                onChange={handleInputChange}
                placeholder="Enter campaign message"
                className="col-span-3"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Preview</Label>
              <div className="col-span-3 border rounded-md p-4 bg-gray-50">
                <div className="text-sm font-medium mb-2">
                  {campaignData.name || "Campaign Preview"}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {campaignData.message ||
                    "Your campaign message will appear here"}
                </div>
                <div className="text-xs text-gray-500">
                  Will be sent to {campaignData.numUsers} users
                  {campaignData.customSegments.length > 0 && (
                    <>
                      {" "}
                      in the segments:{" "}
                      <span className="font-medium">
                        {campaignData.customSegments.map((segment, index) => (
                          <React.Fragment key={segment.value}>
                            {index > 0 && ", "}
                            {segment.label}
                          </React.Fragment>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="col-span-4 text-center mb-2">
              <h3 className="text-lg font-medium mb-2">WhatsApp Connection</h3>
              <p className="text-sm text-gray-500">
                Connect your WhatsApp account to send campaign messages
              </p>
            </div>

            {/* WhatsApp Connection Status */}
            <div className="col-span-4 mt-4">
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="text-md font-medium mb-2">
                  WhatsApp Connection Status
                </h3>

                {connectionStatus === WhatsAppConnectionState.CHECKING && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative">
                      <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-3" />
                      {initialConnectionCheck && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full border-4 border-blue-300 border-t-transparent animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-md text-gray-700 font-medium">
                      {initialConnectionCheck
                        ? "Establishing WhatsApp Connection"
                        : "Checking WhatsApp Connection"}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {initialConnectionCheck
                        ? "Please wait while we connect to WhatsApp"
                        : "Verifying your WhatsApp connection status"}
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-1">
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                )}

                {connectionStatus === WhatsAppConnectionState.CONNECTED && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                    <p className="text-md text-gray-700 font-medium">
                      WhatsApp Connected Successfully
                    </p>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Your WhatsApp account is now connected and ready to send
                      campaign messages
                    </p>
                    <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md text-sm text-gray-600">
                      <p className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Messages will be sent from your WhatsApp account
                      </p>
                      <p className="flex items-center mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Connection will remain active until you log out
                      </p>
                    </div>
                  </div>
                )}

                {connectionStatus === WhatsAppConnectionState.CONNECTING && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative">
                      <Phone className="h-10 w-10 text-blue-500 mb-3" />
                      <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-md text-gray-700 font-medium">
                      Connecting to WhatsApp
                    </p>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Please wait while we establish the connection
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-blue-500 inline mr-2" />
                        This may take a few moments...
                      </p>
                    </div>
                  </div>
                )}

                {connectionStatus === WhatsAppConnectionState.DISCONNECTED && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        Scan QR Code to Connect
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        1. Open WhatsApp on your phone
                        <br />
                        2. Tap Menu or Settings and select WhatsApp Web
                        <br />
                        3. Point your phone camera at this QR code
                      </p>

                      {/* QR Code Image */}
                      {qrCodeElement}

                      <p className="text-xs text-gray-500 mt-3 text-center">
                        QR code refreshes automatically every 45 seconds
                        <br />
                        Keep this window open while scanning
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus}
                      >
                        {isCheckingStatus ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Check Status
                          </span>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestartSession}
                        disabled={isCheckingStatus}
                      >
                        {isCheckingStatus ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Restarting...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Restart Session
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {connectionStatus === WhatsAppConnectionState.ERROR && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                    <p className="text-md text-gray-700 font-medium">
                      WhatsApp Connection Error
                    </p>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      We encountered a problem connecting to WhatsApp
                    </p>

                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md w-full">
                      <p className="text-sm text-gray-600 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500 inline mr-2" />
                        This could be due to:
                      </p>
                      <ul className="text-sm text-gray-600 list-disc pl-8 space-y-1">
                        <li>Network connectivity issues</li>
                        <li>WhatsApp server unavailability</li>
                        <li>Session timeout</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus}
                      >
                        {isCheckingStatus ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Try Again
                          </span>
                        )}
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRestartSession}
                        disabled={isCheckingStatus}
                      >
                        {isCheckingStatus ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Restarting...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Restart Session
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {hasWhatsappUsername ? (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSavingWhatsapp}
                >
                  {isSavingWhatsapp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Start Campaign"
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={initialConnectionCheck}
              >
                Back
              </Button>

              {connectionStatus === WhatsAppConnectionState.CONNECTED ? (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSavingWhatsapp || initialConnectionCheck}
                >
                  {isSavingWhatsapp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Start Campaign"
                  )}
                </Button>
              ) : connectionStatus === WhatsAppConnectionState.CHECKING ||
                connectionStatus === WhatsAppConnectionState.CONNECTING ? (
                <Button disabled>
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {initialConnectionCheck
                      ? "Establishing Connection..."
                      : "Connecting..."}
                  </span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={isCheckingStatus || initialConnectionCheck}
                >
                  {isCheckingStatus || initialConnectionCheck ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {initialConnectionCheck
                        ? "Establishing Connection..."
                        : "Checking..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Connect WhatsApp
                    </span>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
