/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "canva-editor/hooks";
import { pack } from "canva-editor/utils/minifier";
import { dataMapping } from "canva-editor/utils/minifier";
import {
  KIOSKS_ENDPOINT,
  UPLOAD_KIOSK_IMAGE_ENDPOINT,
  UPLOAD_KIOSK_TEMPLATE_ENDPOINT,
} from "canva-editor/utils/constants/api";

import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle,
  Monitor,
  Loader2,
} from "lucide-react";

interface PublishKioskDialogProps {
  open: boolean;
  onClose: () => void;
}

const PublishKioskDialog: React.FC<PublishKioskDialogProps> = ({
  open,
  onClose,
}) => {
  // State for loading and progress
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get editor state and actions
  const { query, actions, state } = useEditor();
  const { pages, activePage } = state;

  // Get user from auth context
  const { user } = useAuth();

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Auto-publish when dialog opens
  useEffect(() => {
    if (open && !isPublishing) {
      handlePublishKiosk();
    }
  }, [open]);

  // Handle publishing - capture images and update existing kiosk document
  const handlePublishKiosk = async () => {
    // Start publishing process
    setIsPublishing(true);
    setPublishProgress(0);

    // Show loading toast
    toast.loading("Publishing Kiosk", {
      description: "Capturing pages and updating kiosk display...",
      duration: 60000, // 1 minute timeout
    });

    // Simulate progress updates
    progressIntervalRef.current = setInterval(() => {
      setPublishProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 90 ? 90 : newProgress; // Cap at 90% until complete
      });
    }, 500);

    try {
      // Get user's ID as unique identifier
      let userId = user?.userId || Cookies.get("auth_token") || "anonymous";
      // If userId contains underscores, extract just the ID part (last segment)
      if (userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      // Get the design data
      const designData = query.serialize();

      // Pack the data
      const [packedResult] = pack(designData, dataMapping);
      const packedData = packedResult;

      // Update progress
      setPublishProgress(20);

      // First, upload the template JSON to cloud storage
      console.log("Uploading template JSON to cloud storage");
      const templateResponse = await axios.post(
        UPLOAD_KIOSK_TEMPLATE_ENDPOINT,
        {
          packedData,
          userId,
        }
      );

      // Get the template URL from the response
      const templateUrl = templateResponse.data.templateUrl;
      console.log("Template URL:", templateUrl);

      // Update progress
      setPublishProgress(40);

      // Create or update kiosk entry (the backend should handle upsert logic)
      console.log("Creating/updating kiosk with template URL");
      const kioskPayload = {
        userId,
        templateUrl, // Store the URL to the JSON file
      };
      console.log("Kiosk payload:", kioskPayload);

      const kioskResponse = await axios.post(KIOSKS_ENDPOINT, kioskPayload);
      console.log("Kiosk response:", kioskResponse.data);

      // Get the kiosk ID from the response
      const kioskId = kioskResponse.data.kiosk.id;
      console.log("Kiosk ID:", kioskId);

      // Update progress
      setPublishProgress(60);

      // Generate all page images using command-based capture
      console.log("Capturing all pages using fireCaptureCmd...");
      
      // Use the new capture command to get all page images
      const pageImages = await new Promise<string[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('pagesCapture', handleCaptureComplete);
          reject(new Error('Page capture timeout after 30 seconds'));
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
        console.log('[PublishKioskDialog] Triggering fireCaptureCmd for all pages');
        actions.fireCaptureCmd(0); // 0 = capture all pages
      });

      if (pageImages.length === 0) {
        throw new Error('Failed to capture any page images');
      }

      console.log(`Successfully captured ${pageImages.length} page images`);

      // Update progress
      setPublishProgress(80);

      // Upload each captured image to cloud storage
      for (let i = 0; i < pageImages.length; i++) {
        try {
          const dataUrl = pageImages[i];
          const pageImageFilename = `page_${i + 1}.png`;
          
          console.log(`Uploading image for page ${i + 1} with filename: ${pageImageFilename}`);

          // Log a small part of the image data to verify it's different for each page
          const base64Data = dataUrl.split(",")[1];
          console.log(`Image data preview for page ${i + 1}: ${base64Data.substring(0, 50)}...`);

          const response = await axios.post(UPLOAD_KIOSK_IMAGE_ENDPOINT, {
            base64: base64Data, // Remove the data:image/png;base64, part
            filename: pageImageFilename,
            kioskId,
            pageIndex: i,
          });

          console.log(`Upload response for page ${i + 1}:`, response.data);
        } catch (error) {
          console.error(`Error uploading page ${i + 1}:`, error);
        }
      }

      // Clear the interval and set progress to 100%
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setPublishProgress(100);

      // Dismiss the loading toast and show success toast
      toast.dismiss();
      toast.success("Kiosk Updated", {
        description: `Your kiosk display has been updated with ${pageImages.length} page images!`,
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        duration: 4000,
      });

      // Close the dialog
      onClose();
    } catch (error: unknown) {
      console.error("Error publishing kiosk:", error);

      // Clear the interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Dismiss the loading toast and show error toast
      toast.dismiss();

      // Get a more specific error message if available
      let errorMessage =
        "There was an error updating your kiosk. Please try again.";

      // Check if it's an Axios error
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }

      toast.error("Update Failed", {
        description: errorMessage,
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            Update Kiosk Display
          </DialogTitle>
          <DialogDescription>
            Updating your kiosk display with the latest design...
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <p className="font-medium">Publishing Kiosk...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Capturing pages and uploading to display
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${publishProgress}%` }}
              />
            </div>
            <p className="text-xs text-center mt-1 text-gray-500">
              {Math.round(publishProgress)}% complete
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishKioskDialog;