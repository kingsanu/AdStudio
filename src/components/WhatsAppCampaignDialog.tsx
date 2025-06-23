/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";
import { useEditor } from "canva-editor/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import { SliderWithTicks } from "@/components/ui/slider";
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
import { videoService } from "@/services/videoService";
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
import { formatTimeAgo } from "@/lib/utils";

interface WhatsAppCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (campaignId?: string) => void;
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
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSliderValue, setCustomerSliderValue] = useState<number[]>([0]);
  const [filterSegment, setFilterSegment] = useState<string>("");
  const [selectedSegments, setSelectedSegments] = useState<
    { value: string; label: string }[]
  >([]);

  // Page image capture state
  const [isCapturingImages, setIsCapturingImages] = useState(false);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [mediaGenerationProgress, setMediaGenerationProgress] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaGenerated, setMediaGenerated] = useState(false);
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
    setCustomerSliderValue([0]);
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
    setCaptureProgress(0);
    setIsCapturingImages(false);
    setUploadingImage(false);
    setIsGeneratingMedia(false);
    setMediaGenerationProgress(0);
    setMediaGenerated(false);
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

  // Function to capture page images using the new fireCaptureCmd action
  const capturePageImages = useCallback(async () => {
    try {
      // Safety check - ensure we have pages to capture
      if (!pages || pages.length === 0) {
        throw new Error('No pages available to capture');
      }

      setIsCapturingImages(true);
      setCaptureProgress(0);
      setPageImages([]);

      console.log('[WhatsAppCampaignDialog] Starting page capture using fireCaptureCmd');
      console.log(`[WhatsAppCampaignDialog] Pages to capture: ${pages.length}`);

      // Set up event listener to receive captured images
      const handleCaptureComplete = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { images, pageCount } = customEvent.detail;
        console.log(`[WhatsAppCampaignDialog] Received ${images.length} captured images from fireCaptureCmd`);
        
        if (images.length > 0) {
          setCaptureProgress(100);
          setPageImages(images);
          
          // Log image previews for debugging
          images.forEach((dataUrl: string, index: number) => {
            const base64Data = dataUrl.split(',')[1];
            const preview = base64Data.substring(0, 50);
          });

        
        } else {
          throw new Error('Failed to capture any pages');
        }
        
        // Remove event listener after use
        window.removeEventListener('pagesCapture', handleCaptureComplete);
        setIsCapturingImages(false);
      };

      // Add event listener for capture completion
      window.addEventListener('pagesCapture', handleCaptureComplete);

      // Update progress to show capture is starting
      setCaptureProgress(20);

      // Trigger capture of all pages using the new command
      actions.fireCaptureCmd(0); // 0 = capture all pages

    } catch (error) {
   
      setIsCapturingImages(false);
    }
  }, [pages, actions]);

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

  // Define types for the infinite query data
  interface CustomerPageData {
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    } | undefined;
    nextPage: number | undefined;
  }

  // Infinite query for customers with pagination
  const {
    data: customersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers,
  } = useInfiniteQuery<CustomerPageData, Error>({
    queryKey: ['customers', outletId, filterSegment],
    queryFn: async ({ pageParam = 1 }): Promise<CustomerPageData> => {
      const response = await customerService.getCustomersByOutlet(outletId, {
        segment: filterSegment || undefined,
        page: pageParam as number,
        limit: 20, // Load 20 customers per page
      });
      
      if (!response.success) {
        throw new Error('Failed to fetch customers');
      }
      
      return {
        customers: response.data,
        pagination: response.pagination,
        nextPage: response.pagination?.hasNextPage ? (pageParam as number) + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage: CustomerPageData) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: open && !!outletId && step === 2, // Only fetch when needed
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Flatten customers from all pages
  const customers = customersData?.pages.flatMap(page => page.customers) ?? [];
  const totalCustomersCount = customersData?.pages[0]?.pagination?.total ?? 0;

  // Filter customers based on selected segments
  const filteredCustomers = customers.filter(
    (customer) => !filterSegment || customer.customerSegment === filterSegment
  );

  // Use total count from server for slider max, but consider current filter
  // For filtered customers, we need to be more conservative since we don't know the total filtered count
  const maxSelectableCustomers = filterSegment 
    ? Math.max(filteredCustomers.length, customerSliderValue[0]) // Allow current selection or loaded amount
    : totalCustomersCount > 0 ? totalCustomersCount : filteredCustomers.length;

  // Reset slider when filtered customers change, but don't reduce selection if user has more selected
  useEffect(() => {
    // Only reset if the current selection is impossible with current filter
    if (customerSliderValue[0] > maxSelectableCustomers) {
      setCustomerSliderValue([Math.min(customerSliderValue[0], maxSelectableCustomers)]);
      // Update selected customers to match the available filtered customers
      const availableSelections = selectedCustomers.filter(id => 
        filteredCustomers.some(customer => customer._id === id)
      );
      setSelectedCustomers(availableSelections);
    }
  }, [filteredCustomers.length, customerSliderValue, filteredCustomers, maxSelectableCustomers, selectedCustomers]);

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

      // Customers are loaded automatically by React Query when step === 2
      // The infinite query is triggered by the enabled condition
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
        onSuccess(response.data?._id);
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
    setSelectedCustomers((prev) => {
      const newSelection = prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId];

      // Update slider to match manual selection
      setCustomerSliderValue([newSelection.length]);
      return newSelection;
    });
  };

  const selectAllCustomers = () => {
    const allCustomers = filteredCustomers.map((c) => c._id);
    setSelectedCustomers(allCustomers);
    setCustomerSliderValue([allCustomers.length]);
  };

  const clearSelection = () => {
    setSelectedCustomers([]);
    setCustomerSliderValue([0]);
  };

  const selectBySegment = (segment: string) => {
    const segmentCustomers = customers
      .filter((c) => c.customerSegment === segment)
      .map((c) => c._id);
    setSelectedCustomers((prev) => {
      const newSelection = [...new Set([...prev, ...segmentCustomers])];
      setCustomerSliderValue([newSelection.length]);
      return newSelection;
    });
  };

  const handleSliderChange = (value: number[]) => {
    setCustomerSliderValue(value);
    const numberOfCustomersToSelect = value[0];
    
    // Filter customers based on current segment filter
    const availableCustomers = customers.filter(
      (customer) => !filterSegment || customer.customerSegment === filterSegment
    );
    
    // If user wants to select more customers than currently loaded, 
    // we need to load more data first
    if (numberOfCustomersToSelect > availableCustomers.length && hasNextPage && !isFetchingNextPage) {
      // Show info message to user
      toast.info(`Loading more customers to reach ${numberOfCustomersToSelect} selections...`);
      
      // Try to fetch more pages until we have enough customers
      const loadMoreCustomers = async () => {
        let attempts = 0;
        const maxAttempts = 5; // Prevent infinite loops
        
        while (
          customers.filter(c => !filterSegment || c.customerSegment === filterSegment).length < numberOfCustomersToSelect && 
          hasNextPage && 
          attempts < maxAttempts
        ) {
          await fetchNextPage();
          attempts++;
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // After loading more, select the customers
        const updatedAvailableCustomers = customers.filter(
          (customer) => !filterSegment || customer.customerSegment === filterSegment
        );
        const customersToSelect = updatedAvailableCustomers
          .slice(0, Math.min(numberOfCustomersToSelect, updatedAvailableCustomers.length))
          .map((c) => c._id);
        setSelectedCustomers(customersToSelect);
        
        // Show completion message
        if (customersToSelect.length < numberOfCustomersToSelect) {
          toast.warning(`Only ${customersToSelect.length} customers available (requested ${numberOfCustomersToSelect})`);
        } else {
          toast.success(`Successfully selected ${customersToSelect.length} customers`);
        }
      };
      
      loadMoreCustomers();
    } else {
      // Select from currently available customers
      const customersToSelect = availableCustomers
        .slice(0, Math.min(numberOfCustomersToSelect, availableCustomers.length))
        .map((c) => c._id);
      setSelectedCustomers(customersToSelect);
      
      // Show warning if user requested more than available
      if (numberOfCustomersToSelect > availableCustomers.length && !hasNextPage) {
        toast.warning(`Only ${availableCustomers.length} customers available (requested ${numberOfCustomersToSelect})`);
      }
    }
  };

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more when user scrolls to bottom
    if (
      scrollHeight - scrollTop <= clientHeight * 1.5 && // Trigger before reaching exact bottom
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoadingCustomers
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoadingCustomers, fetchNextPage]);

  // Generate media immediately when dialog opens to minimize user wait time
  const generateMediaImmediately = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isGeneratingMedia || mediaGenerated || formData.imageUrl) {
      console.log('[WhatsAppCampaignDialog] Media generation already in progress or completed, skipping');
      return;
    }

    console.log('[WhatsAppCampaignDialog] Starting immediate media generation on dialog open');
    
    try {
      // Safety check - ensure we have pages to capture
      if (!pages || pages.length === 0) {
        console.log('[WhatsAppCampaignDialog] No pages available, skipping immediate media generation');
        return;
      }

      setIsGeneratingMedia(true);
      setMediaGenerationProgress(0);

      // Use the new capture command to get images
      const capturedImages = await new Promise<string[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('pagesCapture', handleCaptureComplete);
          reject(new Error('Capture timeout after 30 seconds'));
        }, 30000);

        const handleCaptureComplete = (event: Event) => {
          clearTimeout(timeout);
          const customEvent = event as CustomEvent;
          const { images } = customEvent.detail;
          window.removeEventListener('pagesCapture', handleCaptureComplete);
          resolve(images || []);
        };

        window.addEventListener('pagesCapture', handleCaptureComplete);
        
        // Trigger capture of all pages
        console.log('[WhatsAppCampaignDialog] Triggering fireCaptureCmd for immediate generation');
        actions.fireCaptureCmd(0); // 0 = capture all pages
      });

      if (capturedImages.length === 0) {
        throw new Error('No images were captured');
      }

      // Store captured images
      setPageImages(capturedImages);
      
      console.log(`[WhatsAppCampaignDialog] Successfully captured ${capturedImages.length} pages immediately`);

      // Update progress
      setMediaGenerationProgress(60);
      
      // Log detailed image information before sending to backend
      console.log('[WhatsAppCampaignDialog] 📤 Images being sent to backend immediately:');
      capturedImages.forEach((dataUrl, index) => {
        const base64Data = dataUrl.split(',')[1];
        const preview = base64Data.substring(0, 50);
        console.log(`  Page ${index + 1}: ${preview}... (${dataUrl.length} chars)`);
      });
      
      // Generate media from captured images
      const result = await videoService.generateCampaignMedia(capturedImages);

      // Update progress
      setMediaGenerationProgress(100);

      // Update form data with the generated media URL
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.mediaUrl,
      }));

      setMediaGenerated(true);

      if (result.mediaType === "video") {
        toast.success("Campaign Video Generated", {
          description: `Video created successfully from ${capturedImages.length} pages!`,
          duration: 4000,
        });
      } else {
        toast.success("Campaign Image Generated", {
          description: `Image slideshow created successfully from ${capturedImages.length} pages!`,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("[WhatsAppCampaignDialog] Error in immediate media generation:", error);
      // Don't show error toast as this is background process
      // User can still try again when they reach step 3
      console.log("[WhatsAppCampaignDialog] Will retry media generation when user reaches step 3");
    } finally {
      setIsGeneratingMedia(false);
    }
  }, [pages, actions, isGeneratingMedia, mediaGenerated, formData.imageUrl]);

  // Auto-generate media when step 3 is reached (fallback if immediate generation failed)
  const generateMediaWhenReady = useCallback(async () => {
    // If media was already generated immediately, skip this
    if (mediaGenerated || formData.imageUrl) {
      console.log('[WhatsAppCampaignDialog] Media already generated, skipping step 3 generation');
      return;
    }

    let imagesToUse = pageImages;

    // If no images are captured yet, capture them first using the new command system
    if (imagesToUse.length === 0) {
      try {
        // Safety check - ensure we have pages to capture
        if (!pages || pages.length === 0) {
          throw new Error('No pages available to capture for media generation');
        }

        console.log('[WhatsAppCampaignDialog] No images captured yet, using fireCaptureCmd for media generation...');
        
        // Use the new capture command to get images
        const capturedImages = await new Promise<string[]>((resolve, reject) => {
          const timeout = setTimeout(() => {
            window.removeEventListener('pagesCapture', handleCaptureComplete);
            reject(new Error('Capture timeout after 30 seconds'));
          }, 30000);

          const handleCaptureComplete = (event: Event) => {
            clearTimeout(timeout);
            const customEvent = event as CustomEvent;
            const { images } = customEvent.detail;
            window.removeEventListener('pagesCapture', handleCaptureComplete);
            resolve(images || []);
          };

          window.addEventListener('pagesCapture', handleCaptureComplete);
          
          // Trigger capture of all pages
          console.log('[WhatsAppCampaignDialog] Triggering fireCaptureCmd for step 3 media generation');
          actions.fireCaptureCmd(0); // 0 = capture all pages
        });

        if (capturedImages.length > 0) {
          setPageImages(capturedImages);
          imagesToUse = capturedImages;
          console.log(`[WhatsAppCampaignDialog] Successfully captured ${capturedImages.length} pages for media generation`);
        } else {
          throw new Error('Failed to capture pages for media generation');
        }
      } catch (error) {
        console.error("[WhatsAppCampaignDialog] Error capturing page images for media:", error);
        // toast.error("Failed to capture page images", {
        //   description: error instanceof Error ? error.message : "Could not capture pages for media generation.",
        // });
        return;
      }
    }

    if (imagesToUse.length === 0) {
      toast.error("No pages available to generate media");
      return;
    }

    setIsGeneratingMedia(true);
    setMediaGenerationProgress(0);

    try {
      // Update progress
      setMediaGenerationProgress(20);
      console.log('[WhatsAppCampaignDialog] Starting media generation with images:', imagesToUse.length);
      
      // Log detailed image information before sending to backend
      console.log('[WhatsAppCampaignDialog] 📤 Images being sent to backend:');
      imagesToUse.forEach((dataUrl, index) => {
        const base64Data = dataUrl.split(',')[1];
        const imageSize = Math.round((base64Data.length * 3) / 4 / 1024);
        const preview = base64Data.substring(0, 30);
        const mimeType = dataUrl.split(';')[0].split(':')[1];
        console.log(`  Image ${index + 1}: ${mimeType}, ~${imageSize}KB, preview: ${preview}...`);
      });
      
      const result = await videoService.generateCampaignMedia(imagesToUse);

      // Update progress
      setMediaGenerationProgress(80);

      // Update form data with the generated media URL
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.mediaUrl,
      }));

      setMediaGenerationProgress(100);
      setMediaGenerated(true);

    
    } catch (error) {
      console.error("Error generating media:", error);
    
    } finally {
      setIsGeneratingMedia(false);
    }
  }, [pages, pageImages, actions]);

  // Capture images and generate media immediately when dialog opens
  useEffect(() => {
    if (open && pages && pages.length > 0 && !mediaGenerated && !isGeneratingMedia && !formData.imageUrl) {
      console.log('[WhatsAppCampaignDialog] Dialog opened - starting immediate media generation');
      // Small delay to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        generateMediaImmediately();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, pages, mediaGenerated, isGeneratingMedia, formData.imageUrl, generateMediaImmediately]);

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
              {/* Customer Header with inline Segment Filter */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">
                      {customers.length > 0 
                        ? `${totalCustomersCount > 0 ? totalCustomersCount : customers.length} customers available`
                        : isLoadingCustomers 
                          ? 'Loading customers...'
                          : 'No customers found'
                      }
                    </span>
                    {selectedCustomers.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedCustomers.length} selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ">
                    <Label className="text-sm font-medium whitespace-nowrap pt-2">Customer<br/> Segments:</Label>
                    <div className="w-64">
                      <MultipleSelector
                        value={selectedSegments}
                        onChange={handleSegmentChange}
                        placeholder="Select segments..."
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
                          { value: "regular", label: "Regular Customers" },
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
                </div>
              </div>

              {/* Customer Selection Tools */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Select Customers ({customerSliderValue[0]} of {maxSelectableCustomers})
                  </Label>
                  <span className="text-xs text-gray-500">
                    {filteredCustomers.length} loaded, {hasNextPage ? 'more available' : 'all loaded'}
                  </span>
                </div>

                {/* Customer Selection Slider */}
                <div className="px-3">
                  {maxSelectableCustomers > 0 ? (
                    <SliderWithTicks
                      value={customerSliderValue}
                      onValueChange={handleSliderChange}
                      max={maxSelectableCustomers}
                      min={0}
                      step={1}
                      className="w-full"
                      showTicks={true}
                    />
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <span className="text-sm">
                        No customers available to select
                      </span>
                    </div>
                  )}
                  
                  {/* Loading indicator for when fetching more customers for slider */}
                  {isFetchingNextPage && customerSliderValue[0] > filteredCustomers.length && (
                    <div className="flex items-center justify-center mt-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading more customers...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Selected Customers ({selectedCustomers.length} total)
                  </Label>
                </div>
              </div>

              {/* Infinite Scroll Customer List */}
              <div 
                className="border rounded-lg p-4 max-h-80 overflow-y-auto"
                onScroll={handleScroll}
              >
                {isLoadingCustomers && customers.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Loading customers...</span>
                    </div>
                  </div>
                ) : customers.length > 0 ? (
                  <div className="space-y-2">
                    {customers.map((customer) => (
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
                        <div className="flex-1 flex items-center justify-between">
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
                            <div className="text-sm text-gray-500 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phoneNumber}
                              </span>
                              {customer.email && (
                                <span>{customer.email}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 flex-shrink-0">
                            Last visit: {formatTimeAgo(customer.lastVisit)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading more indicator */}
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center py-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Loading more customers...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* End of list indicator */}
                    {!hasNextPage && customers.length > 0 && (
                      <div className="text-center py-4">
                        <span className="text-sm text-gray-500">
                          All customers loaded ({customers.length} total)
                        </span>
                      </div>
                    )}
                  </div>
                ) : customersError ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <span className="text-sm text-red-600">Failed to load customers</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchCustomers()}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-sm text-gray-500">
                      No customers found. Try adjusting your search or filters.
                    </span>
                  </div>
                )}
              </div>

              {selectedCustomers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Target className="h-4 w-4" />
                  <span>
                    {selectedCustomers.length} customers selected for campaign
                  </span>
                </div>
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

              {/* Automatic Media Generation */}
              <div className="max-w-[100%]">
                <Label>Campaign Media</Label>
                <div className="space-y-3">
                  {isGeneratingMedia ? (
                    <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-3 mb-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-100">
                            {pageImages.length === 0
                              ? "Capturing pages..."
                              : pageImages.length === 1
                              ? "Uploading image..."
                              : "Creating video..."}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {pageImages.length === 0
                              ? "Preparing page content for capture"
                              : pageImages.length === 1
                              ? "Single page detected - uploading as image"
                              : `Multiple pages detected (${pageImages.length}) - creating video slideshow`}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${mediaGenerationProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-right">
                        {mediaGenerationProgress.toFixed(0)}%
                      </div>
                    </div>
                  ) : formData.imageUrl ? (
                    <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900 dark:text-green-100">
                            {pageImages.length === 1
                              ? "Campaign image ready"
                              : "Campaign video ready"}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            {pageImages.length === 1
                              ? "Single page uploaded as image to cloud storage"
                              : `Video slideshow created from ${pageImages.length} pages and uploaded to cloud storage`}
                          </div>
                        </div>
                      </div>
                      {formData.imageUrl && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <Label className="text-xs">Media Preview:</Label>
                            <div className="mt-2 border rounded-lg p-2 bg-white dark:bg-gray-800">
                              {pageImages.length === 1 ? (
                                <img
                                  src={formData.imageUrl}
                                  alt="Campaign image preview"
                                  className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                                  style={{
                                    maxHeight: "200px",

                                    objectFit: "contain",
                                  }}
                                />
                              ) : (
                                <video
                                  src={formData.imageUrl}
                                  controls
                                  className="w-full max-w-sm mx-auto rounded-lg shadow-sm"
                                  style={{ maxHeight: "200px" }}
                                  preload="metadata"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Media URL:</Label>
                            <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded border truncate">
                              {formData.imageUrl.slice(0, 90)}...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/20">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Preparing media generation...
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            Campaign media will be automatically generated from
                            your design pages
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <div className="flex justify-between">
                    <span>Media Type:</span>
                    <span className="font-medium">
                      {formData.imageUrl
                        ? pageImages.length === 1
                          ? "Image"
                          : "Video"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
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
            disabled={isLoading || (isLoadingCustomers && customers.length === 0)}
            className={step === 3 ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isLoading ? (
              "Creating..."
            ) : (isLoadingCustomers && customers.length === 0) ? (
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
