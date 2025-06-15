/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";
import { domToPng } from "modern-screenshot";
import { useEditor } from "canva-editor/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  campaignService,
  CreateCampaignData,
} from "@/services/campaignService";
import { customerService, Customer } from "@/services/customerService";
import { outletService, Outlet } from "@/services/outletService";
import {
  whatsappService,
  WhatsAppSettings,
  WhatsAppConnectionState,
} from "@/services/whatsappService";
import {
  Users,
  MessageSquare,
  Target,
  Send,
  CheckCircle,
  AlertCircle,
  Play,
  Clock,
  Image as ImageIcon,
  Phone,
  MapPin,
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  Loader2,
  Camera,
} from "lucide-react";
import MultipleSelector from "./ui/multiselect";
import { UPLOAD_IMAGE_ENDPOINT } from "@/constants";

interface WhatsAppCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WhatsAppCampaignDialog({
  open,
  onClose,
  onSuccess,
}: WhatsAppCampaignDialogProps) {
  const { user } = useAuth();
  const { query, actions, state } = useEditor();
  const { pages, activePage } = state;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [filterSegment, setFilterSegment] = useState<string>("");
  const [selectedSegments, setSelectedSegments] = useState<
    { value: string; label: string }[]
  >([]);

  // Page image capture state
  const [isCapturingImages, setIsCapturingImages] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WhatsApp connection state
  const [whatsappSettings, setWhatsappSettings] =
    useState<WhatsAppSettings | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<WhatsAppConnectionState>("disconnected");
  const [showQRCode, setShowQRCode] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [qrContentType, setQrContentType] = useState<string>("image/png");
  const [sessionCreationTimer, setSessionCreationTimer] = useState(0);
  const [qrRefreshTimer, setQrRefreshTimer] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [qrRetryTimer, setQrRetryTimer] = useState(0);
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  // Get outlet ID from cookies
  const outletId = user?.userId || Cookies.get("auth_token") || "";

  // Form data
  const [formData, setFormData] = useState<CreateCampaignData>({
    campaignName: "",
    description: "",
    userId: outletId,
    outletId: outletId,
    whatsappUsername: "",
    message: "",
    imageUrl: "",
    campaignType: "immediate",
    customerFilters: {
      segments: [],
    },
  });

  // Load WhatsApp settings when dialog opens, check existing connection first
  useEffect(() => {
    if (open && outletId) {
      resetForm();
      // Check for existing WhatsApp settings first
      checkExistingWhatsAppSettings();
    }
  }, [open, outletId]);

  // Cleanup timers when dialog closes
  useEffect(() => {
    if (!open) {
      // Clear all timers and states when dialog closes
      setSessionCreationTimer(0);
      setQrRefreshTimer(0);
      setQrRetryTimer(0);
      setIsCreatingSession(false);
      setIsWaitingForQR(false);
      setShowQRCode(false);
      setQrCodeData("");
      setIsPollingActive(false);

      // Clear page capture related states
      setPageImages([]);
      setSelectedImageIndex(-1);
      setCaptureProgress(0);
      setIsCapturingImages(false);
      setUploadingImage(false);

      // Clear intervals
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setSelectedCustomers([]);
    setFilterSegment("");
    setSelectedSegments([]);
    setShowQRCode(false);
    setIsCreatingSession(false);
    setQrCodeData("");
    setQrContentType("image/png");
    setSessionCreationTimer(0);
    setQrRefreshTimer(0);
    setQrRetryTimer(0);
    setCurrentSessionId("");
    setIsPollingActive(false);
    setIsWaitingForQR(false);
    setPageImages([]);
    setSelectedImageIndex(-1);
    setCaptureProgress(0);
    setIsCapturingImages(false);
    setUploadingImage(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setFormData({
      campaignName: "",
      description: "",
      userId: outletId,
      outletId: outletId,
      whatsappUsername: "",
      message: "",
      imageUrl: "",
      campaignType: "immediate",
      customerFilters: {
        segments: [],
      },
    });
  };

  // Function to capture page images, similar to PublishKioskDialog
  const capturePageImages = async () => {
    try {
      setIsCapturingImages(true);
      setCaptureProgress(0);
      setPageImages([]);

      // Show loading toast
      toast.loading("Capturing Page Images", {
        description: "Generating images for each page...",
        duration: 30000, // 30 second timeout
      });

      // Simulate progress updates
      progressIntervalRef.current = setInterval(() => {
        setCaptureProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 500);

      // Store original active page to restore later
      const originalActivePage = activePage;

      // Get all pages from the design
      const pageKeys = Object.keys(pages || {});
      const capturedImages: string[] = [];

      // Capture each page as an image
      console.log(`Starting to capture ${pageKeys.length} pages`);
      for (let i = 0; i < pageKeys.length; i++) {
        try {
          console.log(`Processing page ${i + 1} of ${pageKeys.length}`);

          // Set the active page
          console.log(`Setting active page to ${i}`);
          actions.setActivePage(i);

          // Add a small delay to ensure the page is set
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Force a re-render by updating the state
          setCaptureProgress((prev) => {
            console.log(`Updating progress to force re-render: ${prev + 0.1}`);
            return prev + 0.1;
          });

          // Wait for the page to render
          console.log(`Waiting for page ${i + 1} to render...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Get the page content element
          const pageContentEl = document.querySelector(".page-content");
          console.log(
            `Page content element found:`,
            pageContentEl ? "Yes" : "No"
          );

          if (pageContentEl) {
            // Generate image
            const dataUrl = await domToPng(pageContentEl as HTMLElement, {
              width: pageContentEl.clientWidth,
              height: pageContentEl.clientHeight,
              quality: 1.0,
              scale: 1.0,
            });

            capturedImages.push(dataUrl);
            console.log(`Captured image for page ${i + 1}`);
          }
        } catch (error) {
          console.error(`Error processing page ${i}:`, error);
          toast.error(`Failed to capture page ${i + 1}`, {
            description: "Try again or select a different page.",
          });
        }
      }

      // Restore the original active page
      actions.setActivePage(originalActivePage);

      // Clear the interval and set progress to 100%
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setCaptureProgress(100);

      // Update state with captured images
      setPageImages(capturedImages);

      // Dismiss the loading toast and show success toast
      toast.dismiss();
      toast.success("Pages Captured", {
        description: `${capturedImages.length} page images captured successfully!`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error capturing page images:", error);
      toast.dismiss();
      toast.error("Failed to Capture Pages", {
        description:
          "There was an error capturing the page images. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsCapturingImages(false);
    }
  };

  // Function to upload the selected image and get its URL
  const uploadSelectedImage = async () => {
    if (selectedImageIndex === -1 || !pageImages[selectedImageIndex]) {
      toast.error("Please select an image first");
      return;
    }

    try {
      setUploadingImage(true);

      // Show loading toast
      toast.loading("Uploading Image", {
        description: "Uploading the selected image...",
        duration: 20000,
      });

      // Extract the base64 data from the data URL
      const dataUrl = pageImages[selectedImageIndex];
      const base64Data = dataUrl.split(",")[1];

      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `whatsapp_image_${outletId}_${timestamp}.png`;

      // Upload the image
      const response = await axios.post(UPLOAD_IMAGE_ENDPOINT, {
        base64: base64Data,
        filename,
        userId: outletId,
      });
      console.log(response);

      if (response.data && response.data.url) {
        // Update form data with the image URL
        setFormData((prev) => ({
          ...prev,
          imageUrl: response.data.url,
        }));

        toast.dismiss();
        toast.success("Image Uploaded", {
          description: "The selected image has been uploaded successfully!",
          duration: 3000,
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error uploading selected image:", error);
      toast.dismiss();
      toast.error("Upload Failed", {
        description: "Failed to upload the selected image. Please try again.",
        duration: 4000,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Generate unique session ID with timestamp
  const generateUniqueSessionId = () => {
    const timestamp = Date.now();
    return `session_${outletId}_${timestamp}`;
  };

  // Start 30-second QR retry timer (increased from 20 to align with backend improvements)
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
    const possibleSessionIds = [
      `sfd_${outletId}`, // Old format that's causing conflicts
      `session_${outletId}`, // Base format without timestamp
      outletId, // Just the outlet ID
      `s_${outletId}`, // Another possible format
    ];

    for (const sessionId of possibleSessionIds) {
      try {
        console.log(`Attempting to terminate session: ${sessionId}`);
        await terminateSpecificSession(sessionId);
        console.log(`Successfully terminated session: ${sessionId}`);
      } catch (error) {
        console.log(`Session ${sessionId} not found or already terminated`);
      }
    }

    // Also try the WhatsApp service termination
    try {
      await whatsappService.terminateSession(outletId);
      console.log("Terminated sessions via WhatsApp service");
    } catch (error) {
      console.log("No sessions to terminate via service");
    }

    // Wait for all terminations to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));
  };

  // Handle segment selection from MultipleSelector
  const handleSegmentChange = (
    segments: { value: string; label: string }[]
  ) => {
    setSelectedSegments(segments);
    // Update filterSegment with the first selected segment for backward compatibility
    const firstSegment = segments.length > 0 ? segments[0].value : "";
    setFilterSegment(firstSegment);
  };

  // Check for existing WhatsApp settings and connection status
  const checkExistingWhatsAppSettings = async () => {
    try {
      setIsCheckingConnection(true);
      setConnectionStatus("checking");

      // First, try to get existing WhatsApp settings
      const existingSettings = await whatsappService.getSettings(outletId);

      if (existingSettings) {
        console.log("Found existing WhatsApp settings:", existingSettings);
        setWhatsappSettings(existingSettings);
        setCurrentSessionId(existingSettings.username);

        // Update form data with existing username
        setFormData((prev) => ({
          ...prev,
          whatsappUsername: existingSettings.username,
        }));

        // Check current connection status
        const statusResponse = await whatsappService.checkConnectionStatus(
          outletId
        );
        console.log("Connection status check:", statusResponse);

        setConnectionStatus(statusResponse.status || "disconnected");

        if (statusResponse.status === "connected") {
          console.log(
            "WhatsApp already connected, no need to create new session"
          );
          toast.success("WhatsApp is already connected!");
          setShowQRCode(false);
          setIsCreatingSession(false);
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
          "No existing WhatsApp settings found, will create new session"
        );
        // No existing settings, create a new session
        handleCreateNewSession();
      }
    } catch (error) {
      console.error("Error checking existing WhatsApp settings:", error);
      // If there's an error checking settings, fall back to creating new session
      handleCreateNewSession();
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      console.log("Loading customers for outlet:", outletId);
      const response = await customerService.getCustomersByOutlet(
        outletId,
        filterSegment ? { segment: filterSegment } : {}
      );
      if (response.success) {
        setCustomers(response.data);
        console.log(`Loaded ${response.data.length} customers`);
      } else {
        console.error("Failed to load customers:", response);
        toast.error("Failed to load customers");
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!whatsappSettings) return;

    setIsCheckingConnection(true);
    try {
      const response = await whatsappService.checkConnectionStatus(outletId);
      console.log(response);
      setConnectionStatus(response.status || "error");

      if (response.status === "connected") {
        setShowQRCode(false);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnectionStatus("error");
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Create a new WhatsApp session automatically when dialog opens
  const handleCreateNewSession = async () => {
    try {
      setIsCreatingSession(true);
      setConnectionStatus("connecting");
      setSessionCreationTimer(5);

      // Generate unique session ID
      const newSessionId = generateUniqueSessionId();
      setCurrentSessionId(newSessionId);

      // Update form data with new session ID
      setFormData((prev) => ({
        ...prev,
        whatsappUsername: newSessionId,
      }));

      toast.info("Creating new WhatsApp session...");

      // First, clean up any existing sessions
      await cleanupExistingSessions();

      // Now start the new session with the unique session ID
      const startResponse = await startSessionWithCustomId(newSessionId);

      if (!startResponse.success) {
        // Check if it's a 422 "session exists" error
        if (
          startResponse.status === 422 ||
          startResponse.message?.includes("Session already exists")
        ) {
          toast.info("Existing session detected. Terminating and retrying...");

          try {
            // Try to terminate the existing session
            await terminateSpecificSession(newSessionId);
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Retry with the same session ID
            const retryResponse = await startSessionWithCustomId(newSessionId);
            if (!retryResponse.success) {
              throw new Error(
                retryResponse.message ||
                  "Failed to start session after termination"
              );
            }
          } catch (retryError) {
            toast.error("Failed to resolve session conflict");
            setConnectionStatus("error");
            setIsCreatingSession(false);
            return;
          }
        } else {
          toast.error(startResponse.message || "Failed to create session");
          setConnectionStatus("error");
          setIsCreatingSession(false);
          return;
        }
      }

      // Start 60-second countdown timer (increased to align with backend improvements)
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

      // Don't start polling yet - wait until QR code is loaded
    } catch (error) {
      console.error("Error creating WhatsApp session:", error);
      toast.error("Failed to create WhatsApp session");
      setConnectionStatus("error");
      setIsCreatingSession(false);
    }
  };

  // Start session with custom session ID (using backend API)
  const startSessionWithCustomId = async (sessionId: string) => {
    try {
      // Use our new backend API endpoint for custom session IDs
      const response = await axios.post(
        `https://adstudioserver.foodyqueen.com/api/whatsapp-start-custom/${outletId}`,
        { sessionId },
        { timeout: 30000 }
      );

      return {
        success: response.data.success,
        message: response.data.message || "Session started successfully",
        data: response.data,
      };
    } catch (error) {
      console.error("Error starting session with custom ID:", error);

      // Handle axios error response
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message:
            error.response.data.error ||
            error.response.data.message ||
            "Failed to start session",
          error: error.response.data,
          status: error.response.status,
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error,
      };
    }
  };

  // Terminate specific session (using backend API)
  const terminateSpecificSession = async (sessionId: string) => {
    try {
      // Use our backend API instead of calling WhatsApp API directly
      const response = await whatsappService.terminateSession(outletId);
      return {
        success: response.success,
        message: response.message || "Session terminated successfully",
      };
    } catch (error) {
      console.error("Error terminating specific session:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Fetch QR code data from the API
  const fetchQRCode = async (sessionId: string) => {
    try {
      console.log("Fetching QR code for session:", sessionId);
      const response = await axios.get(
        `https://adstudioserver.foodyqueen.com/api/whatsapp-qr/${sessionId}`,
        {
          timeout: 60000, // Increased timeout to 60 seconds to match backend improvements
        }
      );

      console.log(response);

      console.log("QR response:", {
        success: response.data.success,
        hasQR: !!response.data.qr,
        qrLength: response.data.qr ? response.data.qr.length : 0,
        contentType: response.data.contentType,
      });

      if (response.data && response.data.success) {
        if (response.data.qr) {
          // QR code is ready and available
          setQrCodeData(response.data.qr);
          setQrContentType(response.data.contentType || "image/png");
          setShowQRCode(true);
          setIsCreatingSession(false);
          setIsWaitingForQR(false);
          toast.success("QR code ready! Please scan to connect.");

          // Now that QR code is loaded, start status polling
          startConnectionPolling();

          // Start QR refresh cycle every 45 seconds
          startQRRefreshCycle(sessionId);
        } else if (response.data.qrReady === false) {
          // QR is not ready yet - this is normal, not an error
          const message = response.data.message || "QR code not ready yet";
          console.log("QR not ready (normal):", message);

          // Check if it's a timeout (which is normal during QR generation)
          if (response.data.timeout) {
            console.log("QR generation timeout - this is normal, retrying...");
            toast.info("QR code is being generated, please wait...");
          }

          // Start 30-second retry timer
          startQRRetryTimer(sessionId);
        } else {
          // Unexpected response format
          throw new Error("Unexpected response format");
        }
      } else {
        // Check for specific error types
        if (response.data?.serviceDown) {
          toast.error(
            "WhatsApp service is currently unavailable. Please try again later."
          );
          setConnectionStatus("error");
          setIsCreatingSession(false);
          return;
        }

        // API call failed
        throw new Error(response.data?.message || "Failed to fetch QR code");
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);

      // Handle specific timeout errors more gracefully
      if (
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.message.includes("timeout"))
      ) {
        toast.error(
          "QR code generation is taking longer than expected. Retrying..."
        );
        // Retry after a short delay
        setTimeout(() => {
          startQRRetryTimer(sessionId);
        }, 5000);
      } else {
        toast.error("Failed to fetch QR code");
        setConnectionStatus("error");
        setIsCreatingSession(false);
      }
    }
  };

  // Refresh QR code without restarting polling
  const refreshQRCodeOnly = async (sessionId: string) => {
    try {
      console.log("Refreshing QR code for session:", sessionId);
      const response = await axios.get(
        `https://adstudioserver.foodyqueen.com/api/whatsapp-qr/${sessionId}`,
        {
          timeout: 60000, // Increased timeout to 60 seconds to match backend improvements
        }
      );
      if (response.data && response.data.success) {
        if (response.data.qr) {
          // QR code refreshed successfully
          setQrCodeData(response.data.qr);
          setQrContentType(response.data.contentType || "image/png");
          console.log("QR code refreshed successfully");
          // Don't restart polling - it's already running
        } else if (response.data.qrReady === false) {
          // QR is not ready during refresh - this is normal
          console.log(
            "QR not ready during refresh (normal):",
            response.data.message
          );
          // Continue with existing QR code if available
        } else {
          console.log("QR refresh: unexpected response format");
        }
      } else {
        // QR refresh failed
        console.log(
          "QR refresh failed:",
          response.data?.message || "Unknown error"
        );
        // Continue with existing QR code if available
      }
    } catch (error) {
      console.error("Error refreshing QR code:", error);

      // Handle timeout errors more gracefully for refresh
      if (
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.message.includes("timeout"))
      ) {
        console.log("QR refresh timeout - continuing with existing QR code");
        // Don't show error toast for refresh timeouts, just log it
      } else {
        toast.error("Failed to refresh QR code");
      }
    }
  };

  // Start QR code refresh cycle
  const startQRRefreshCycle = (sessionId: string) => {
    const refreshInterval = setInterval(async () => {
      if (connectionStatus === "connected") {
        clearInterval(refreshInterval);
        return;
      }

      setQrRefreshTimer(45);

      // Countdown for next refresh
      const countdownInterval = setInterval(() => {
        setQrRefreshTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Refresh QR code only (don't restart polling)
            refreshQRCodeOnly(sessionId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 45000); // Refresh every 45 seconds
  };

  // Start connection status polling every 5 seconds
  const startConnectionPolling = () => {
    // Prevent multiple polling intervals
    if (isPollingActive) {
      console.log("Polling already active, skipping...");
      return;
    }

    setIsPollingActive(true);
    console.log("Starting connection status polling...");

    const pollInterval = setInterval(async () => {
      if (connectionStatus === "connected") {
        console.log("Connected! Stopping polling.");
        setIsPollingActive(false);
        clearInterval(pollInterval);
        return;
      }

      try {
        const statusResponse = await whatsappService.checkConnectionStatus(
          outletId
        );
        setConnectionStatus(statusResponse.status || "error");

        if (statusResponse.status === "connected") {
          setShowQRCode(false);
          setIsCreatingSession(false);
          setIsPollingActive(false);
          clearInterval(pollInterval);
          toast.success("WhatsApp connected successfully!");
        } else if (statusResponse.status === "error") {
          setIsPollingActive(false);
          clearInterval(pollInterval);
          toast.error("Failed to connect WhatsApp");
        }
      } catch (error) {
        console.error("Error during status polling:", error);
        setIsPollingActive(false);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds
  };

  // Manual option to create a new session
  const handleCreateNewSessionManual = () => {
    handleCreateNewSession();
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.campaignName.trim()) {
        toast.error("Please enter a campaign name");
        return;
      }
      if (connectionStatus !== "connected") {
        toast.error("Please connect WhatsApp first");
        return;
      }

      // Load customers only when moving to step 2
      console.log("Loading customers for step 2...");
      await loadCustomers();
      setStep(2);
    } else if (step === 2) {
      if (selectedCustomers.length === 0) {
        toast.error("Please select at least one customer");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.message.trim()) {
        toast.error("Please enter a message");
        return;
      }

      // Check if an image is selected but not uploaded
      if (
        selectedImageIndex !== -1 &&
        pageImages[selectedImageIndex] &&
        !formData.imageUrl
      ) {
        toast.warning(
          "You have selected an image but haven't uploaded it yet",
          {
            description:
              "Please click 'Use Selected Image' to upload the image before creating the campaign.",
            duration: 5000,
          }
        );
        return;
      }

      handleCreateCampaign();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setIsLoading(true);

      // Prepare target customers
      const targetCustomers = selectedCustomers.map((customerId) => {
        const customer = customers.find((c) => c._id === customerId);
        return {
          customerId,
          phoneNumber: customer!.phoneNumber,
          name: customer!.name,
        };
      });

      const campaignData: CreateCampaignData = {
        ...formData,
        targetCustomers,
      };

      const response = await campaignService.createCampaign(campaignData);

      if (response.success) {
        toast.success("Campaign created successfully!");
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customers.map((c) => c._id));
  };

  const clearSelection = () => {
    setSelectedCustomers([]);
  };

  const selectBySegment = (segment: string) => {
    const segmentCustomers = customers
      .filter((c) => c.customerSegment === segment)
      .map((c) => c._id);
    setSelectedCustomers((prev) => [
      ...new Set([...prev, ...segmentCustomers]),
    ]);
  };

  const filteredCustomers = customers.filter(
    (customer) => !filterSegment || customer.customerSegment === filterSegment
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            {step === 1 && "Campaign Details"}
            {step === 2 && "Select Customers"}
            {step === 3 && "Campaign Message"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Set up your WhatsApp campaign basic information"}
            {step === 2 &&
              "Choose which customers to target with your campaign"}
            {step === 3 && "Compose your message and review campaign details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Campaign Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      campaignName: e.target.value,
                    }))
                  }
                  placeholder="Enter campaign name (e.g., New Year Special Offer)"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Optional campaign description"
                  rows={3}
                />
              </div>

              <div>
                <Label>WhatsApp Connection Status</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {connectionStatus === "connected" ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : isCreatingSession ? (
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium">
                          {isCreatingSession
                            ? `Creating Session... (${sessionCreationTimer}s)`
                            : isWaitingForQR
                            ? `Generating QR Code... (${qrRetryTimer}s)`
                            : whatsappService.getStatusText(connectionStatus)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Session:{" "}
                          {currentSessionId.slice(0, 14) + "..." ||
                            formData.whatsappUsername.slice(0, 14) + "..." ||
                            "Generating..."}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={whatsappService.getStatusColor(
                          connectionStatus
                        )}
                      >
                        {whatsappService.getStatusIcon(connectionStatus)}{" "}
                        {isCreatingSession
                          ? "Creating..."
                          : isWaitingForQR
                          ? "Generating QR..."
                          : whatsappService.getStatusText(connectionStatus)}
                      </Badge>
                      {connectionStatus !== "connected" &&
                        !isCreatingSession &&
                        !isWaitingForQR && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCreateNewSessionManual}
                              disabled={isCheckingConnection}
                            >
                              <QrCode className="h-4 w-4" />
                              New Session
                            </Button>
                            {whatsappSettings && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={checkExistingWhatsAppSettings}
                                disabled={isCheckingConnection}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Reconnect
                              </Button>
                            )}
                          </div>
                        )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={checkConnectionStatus}
                        disabled={
                          isCheckingConnection ||
                          isCreatingSession ||
                          isWaitingForQR
                        }
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            isCheckingConnection ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>

                  {isWaitingForQR && (
                    <div className="border-t pt-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                          <p className="text-sm text-gray-600">
                            QR code is being generated...
                          </p>
                        </div>
                        <div className="w-48 h-48 border rounded-lg bg-gray-50 mx-auto flex items-center justify-center">
                          <div className="text-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                            <div className="text-sm text-gray-500">
                              Retrying in {qrRetryTimer}s
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Please wait while the QR code is being generated
                        </p>
                      </div>
                    </div>
                  )}

                  {showQRCode && qrCodeData && (
                    <div className="border-t pt-3">
                      <div className="text-center">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600">
                            Scan this QR code with your WhatsApp to connect:
                          </p>
                          {qrRefreshTimer > 0 && (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Refresh in {qrRefreshTimer}s
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <div className="w-48 h-48 border rounded-lg bg-white p-2 flex items-center justify-center">
                            {qrCodeData ? (
                              <img
                                src={`data:${qrContentType};base64,${qrCodeData}`}
                                alt="WhatsApp QR Code"
                                className="w-full h-full object-contain"
                                onLoad={() => {
                                  console.log(
                                    "QR code image loaded successfully"
                                  );
                                }}
                                onError={(e) => {
                                  console.error("QR code image failed to load");
                                  e.currentTarget.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGxvYWRpbmcgUVIgY29kZTwvdGV4dD48L3N2Zz4=";
                                }}
                              />
                            ) : (
                              <div className="text-gray-400 text-sm">
                                Loading QR Code...
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          QR code refreshes automatically every 45 seconds
                        </p>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshQRCodeOnly(currentSessionId)}
                            disabled={!currentSessionId}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh QR
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {connectionStatus === "error" && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Failed to connect to WhatsApp. Please check your
                          connection and try again.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Customer Selection */}
          {step === 2 && (
            <div className="space-y-4">
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Loading customers...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">
                        {filteredCustomers.length} customers available
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <MultipleSelector
                        value={selectedSegments}
                        onChange={handleSegmentChange}
                        placeholder="Select or add customer segments..."
                        defaultOptions={[
                          { value: "vip", label: "VIP Customers" },
                          {
                            value: "inactive_6months",
                            label: "Last 6 Months Not Visited",
                          },
                          {
                            value: "recent_visitors",
                            label: "Visited Last Month",
                          },
                          { value: "high_spenders", label: "High Spenders" },
                          { value: "new_customers", label: "New Customers" },
                          { value: "all", label: "All Customers" },
                        ]}
                        emptyIndicator={
                          <p className="text-center text-sm text-gray-500">
                            No segments found. Type to create a custom segment.
                          </p>
                        }
                        creatable={true}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllCustomers}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectBySegment("vip")}
                    >
                      Select VIP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectBySegment("regular")}
                    >
                      Select Regular
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadCustomers}
                      disabled={isLoadingCustomers}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          isLoadingCustomers ? "animate-spin" : ""
                        }`}
                      />
                      Reload
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      <div className="space-y-2">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer._id}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border"
                          >
                            <Checkbox
                              checked={selectedCustomers.includes(customer._id)}
                              onCheckedChange={() =>
                                toggleCustomerSelection(customer._id)
                              }
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {customer.name}
                                </span>
                                <Badge
                                  className={customerService.getSegmentColor(
                                    customer.customerSegment
                                  )}
                                >
                                  {customer.customerSegment}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phoneNumber}
                                </div>
                                <div>
                                  Total:{" "}
                                  {customerService.formatCurrency(
                                    customer.totalPayments
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No customers found for this outlet</p>
                        <p className="text-sm">
                          Try selecting a different outlet or add customers
                          first
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCustomers.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <Target className="h-4 w-4" />
                      <span>
                        {selectedCustomers.length} customers selected for
                        campaign
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Message Composition */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Campaign Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Enter your campaign message..."
                  rows={5}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tip: Keep it personal and include a clear call-to-action
                </p>
              </div>

              <div>
                <Label>Campaign Image (Optional)</Label>
                <div className="space-y-3">
                  {/* Capture images button */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={capturePageImages}
                      disabled={isCapturingImages}
                    >
                      {isCapturingImages ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Capturing Pages ({Math.round(captureProgress)}%)
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Page Images
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress bar during capture */}
                  {isCapturingImages && (
                    <div className="w-full">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${captureProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Display captured images */}
                  {pageImages.length > 0 && (
                    <>
                      <p className="text-sm text-gray-500 mt-2">
                        Select an image to use in your WhatsApp campaign:
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {pageImages.map((image, index) => (
                          <div
                            key={index}
                            className={`relative border rounded-md overflow-hidden cursor-pointer transition-all ${
                              selectedImageIndex === index
                                ? "ring-2 ring-blue-500 border-blue-500"
                                : "hover:border-gray-400"
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <img
                              src={image}
                              alt={`Page ${index + 1}`}
                              className="w-full h-24 object-contain"
                            />
                            {selectedImageIndex === index && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                              Page {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Upload selected image button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={uploadSelectedImage}
                        disabled={selectedImageIndex === -1 || uploadingImage}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-3 w-3 mr-2" />
                            {formData.imageUrl
                              ? "Change Selected Image"
                              : "Use Selected Image"}
                          </>
                        )}
                      </Button>

                      {/* Manual URL input as fallback */}
                      {formData.imageUrl && (
                        <div className="mt-2">
                          <Label htmlFor="imageUrl">Image URL</Label>
                          <Input
                            id="imageUrl"
                            value={formData.imageUrl}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                imageUrl: e.target.value,
                              }))
                            }
                            placeholder="Image URL"
                            className="text-xs"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Campaign Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Campaign Name:</span>
                    <span className="font-medium">{formData.campaignName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Customers:</span>
                    <span className="font-medium">
                      {selectedCustomers.length} customers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp Status:</span>
                    <span className="font-medium flex items-center gap-1">
                      {whatsappService.getStatusIcon(connectionStatus)}
                      {whatsappService.getStatusText(connectionStatus)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp Session:</span>
                    <span className="font-medium">
                      {formData.whatsappUsername}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Message Length:</span>
                    <span className="font-medium">
                      {formData.message.length} characters
                    </span>
                  </div>
                </div>
              </div>

              {formData.imageUrl ? (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">
                    Image Preview (From URL):
                  </p>
                  <img
                    src={formData.imageUrl}
                    alt="Campaign"
                    className="max-w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      toast.error("Failed to load image from URL");
                    }}
                  />
                </div>
              ) : selectedImageIndex !== -1 &&
                pageImages[selectedImageIndex] ? (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">
                    Selected Image Preview (Not Uploaded Yet):
                  </p>
                  <div className="flex items-center">
                    <img
                      src={pageImages[selectedImageIndex]}
                      alt={`Page ${selectedImageIndex + 1}`}
                      className="max-w-full h-32 object-contain rounded"
                    />
                    <div className="ml-3 text-sm text-orange-600">
                      <AlertCircle className="h-4 w-4 inline-block mr-1" />
                      Click "Use Selected Image" to upload and include this
                      image
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
            disabled={isLoading}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLoading || isLoadingCustomers}
            className={step === 3 ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isLoading ? (
              "Creating..."
            ) : isLoadingCustomers ? (
              "Loading Customers..."
            ) : step === 3 ? (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Campaign
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
