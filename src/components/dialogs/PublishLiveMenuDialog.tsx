/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tv,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { liveMenuService } from "@/services/liveMenuService";
import { useEditor } from "canva-editor/hooks";
import { pack } from "canva-editor/utils/minifier";
import { dataMapping } from "canva-editor/utils/minifier";
import {
  UPLOAD_LIVEMENU_TEMPLATE_ENDPOINT,
  UPLOAD_LIVEMENU_IMAGE_ENDPOINT,
} from "canva-editor/utils/constants/api";
import axios from "axios";

interface PublishLiveMenuDialogProps {
  open: boolean;
  onClose: () => void;
}

const PublishLiveMenuDialog: React.FC<PublishLiveMenuDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const { query, actions, state } = useEditor();
  const { pages, activePage } = state;
  
  // State for loading and progress
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-publish when dialog opens
  useEffect(() => {
    if (open && !isPublishing) {
      handlePublish();
    }
  }, [open]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handlePublish = async () => {
    if (!user?.userId) {
      toast.error("Please log in to publish live menu");
      return;
    }

    try {
      setIsPublishing(true);
      setPublishProgress(0);

      // Show loading toast
      toast.loading("Publishing Live Menu", {
        description: "Updating your TV display with latest design...",
        duration: 60000, // 1 minute timeout
      });

      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        setPublishProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 500);

      const userId = user.userId;

      // Get the design data
      const designData = query.serialize();

      // Pack the data
      const [packedResult] = pack(designData, dataMapping);
      const packedData = packedResult;

      // Update progress
      setPublishProgress(20);

      // First, upload the template JSON to cloud storage
      console.log("Uploading live menu template JSON to cloud storage");
      const templateResponse = await axios.post(
        UPLOAD_LIVEMENU_TEMPLATE_ENDPOINT,
        {
          packedData,
          userId,
        }
      );

      // Get the template URL from the response
      const templateUrl = templateResponse.data.templateUrl;
      console.log("Live menu template URL:", templateUrl);

      // Update progress
      setPublishProgress(40);

      // Update the user's live menu with the new template (backend should handle upsert)
      await liveMenuService.updateUserLiveMenu(userId, {
        title: "Live Menu Display",
        description: "Restaurant live menu for TV display",
        templateUrl,
        templateData: packedData,
      });

      // Get the live menu ID
      const liveMenuResponse = await liveMenuService.getUserLiveMenu(userId);
      const liveMenuId = liveMenuResponse.liveMenu.id;

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
        console.log('[PublishLiveMenuDialog] Triggering fireCaptureCmd for all pages');
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
          console.log(`Uploading image for page ${i + 1}`);

          const base64Data = dataUrl.split(",")[1];
          console.log(`Image data preview for page ${i + 1}: ${base64Data.substring(0, 50)}...`);

          const response = await axios.post(UPLOAD_LIVEMENU_IMAGE_ENDPOINT, {
            base64: base64Data,
            pageIndex: i,
            liveMenuId,
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
      toast.success("Live Menu Updated", {
        description: `Your TV display has been updated with ${pageImages.length} page images!`,
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        duration: 4000,
      });

      onClose();
    } catch (error) {
      console.error("Error publishing live menu:", error);

      // Clear the interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Dismiss the loading toast and show error toast
      toast.dismiss();

      // Get a more specific error message if available
      let errorMessage = "There was an error updating your live menu. Please try again.";

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
      setPublishProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-purple-600" />
            Update Live Menu Display
          </DialogTitle>
          <DialogDescription>
            Updating your live menu display with the latest design...
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div className="text-center">
            <p className="font-medium">Publishing Live Menu...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Capturing pages and uploading to TV display
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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

export default PublishLiveMenuDialog;
