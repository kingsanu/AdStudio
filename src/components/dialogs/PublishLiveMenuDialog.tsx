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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Monitor,
  Tv,
  Eye,
  Save,
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
import { domToPng } from "modern-screenshot";
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
  const [liveMenuData, setLiveMenuData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>("");
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load live menu data when dialog opens
  useEffect(() => {
    if (open && user?.userId) {
      loadLiveMenuData();
    }
  }, [open, user?.userId]);

  // Generate preview image when dialog opens
  useEffect(() => {
    if (open) {
      const generatePreview = async () => {
        const pageContentEl = document.querySelector(".page-content");
        if (pageContentEl) {
          try {
            const thumbnailData = await domToPng(pageContentEl as HTMLElement, {
              width: pageContentEl.clientWidth,
              height: pageContentEl.clientHeight,
            });
            setPreviewImage(thumbnailData);
          } catch (error) {
            console.error("Error generating preview:", error);
            toast.error("Preview Generation Failed", {
              description:
                "Could not generate template preview. Please try again.",
              icon: <AlertCircle className="h-5 w-5 text-white" />,
              duration: 5000,
            });
          }
        }
      };
      generatePreview();
    }
  }, [open]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const loadLiveMenuData = async () => {
    try {
      setIsLoading(true);
      const response = await liveMenuService.getUserLiveMenu(user!.userId);
      const liveMenu = response.liveMenu;
      setLiveMenuData(liveMenu);
      setTitle(liveMenu.title || "");
      setDescription(liveMenu.description || "");
    } catch (error) {
      console.error("Error loading live menu data:", error);
      toast.error("Failed to load live menu data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) {
      toast.error("Please log in to save live menu");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your live menu");
      return;
    }

    try {
      setIsSaving(true);
      setSaveProgress(0);

      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        setSaveProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const userId = user.userId;

      // Get the design data
      const designData = query.serialize();

      // Pack the data
      const [packedResult] = pack(designData, dataMapping);
      const packedData = packedResult;

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

      // Update the user's live menu with the new template
      await liveMenuService.updateUserLiveMenu(userId, {
        title,
        description,
        templateUrl,
        templateData: packedData,
      });

      // Get the live menu ID
      const liveMenuResponse = await liveMenuService.getUserLiveMenu(userId);
      const liveMenuId = liveMenuResponse.liveMenu.id;

      // Get all pages from the design - use the same logic as kiosk
      const pageKeys = Object.keys(pages || {});
      const originalActivePage = activePage;

      // Capture each page as an image
      console.log(`Starting to capture ${pageKeys.length} pages`);
      console.log(`Editor state pages:`, pageKeys);
      for (let i = 0; i < pageKeys.length; i++) {
        try {
          console.log(`Processing page ${i + 1} of ${pageKeys.length}`);

          // Set the active page
          console.log(`Setting active page to ${i}`);
          actions.setActivePage(i);

          // Add a small delay to ensure the page is set
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Force a re-render by updating the state
          setSaveProgress((prev) => {
            console.log(`Updating progress to force re-render: ${prev + 0.1}`);
            return prev + 0.1;
          });

          // Add another delay to ensure the DOM is updated
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Find the page content element
          const pageContentEl = document.querySelector(".page-content");
          console.log(`Page content element found:`, !!pageContentEl);

          if (pageContentEl) {
            // Generate image
            const dataUrl = await domToPng(pageContentEl as HTMLElement, {
              width: pageContentEl.clientWidth,
              height: pageContentEl.clientHeight,
              quality: 1.0,
              scale: 1.0,
            });

            // Upload the image to cloud storage
            const pageImageFilename = `page_${i + 1}.png`;
            console.log(
              `Uploading image for page ${
                i + 1
              } with filename: ${pageImageFilename}`
            );

            const base64Data = dataUrl.split(",")[1];
            console.log(
              `Image data preview for page ${i + 1}: ${base64Data.substring(
                0,
                50
              )}...`
            );

            const response = await axios.post(UPLOAD_LIVEMENU_IMAGE_ENDPOINT, {
              base64: base64Data,
              pageIndex: i,
              liveMenuId,
            });

            console.log(`Upload response for page ${i + 1}:`, response.data);
          }
        } catch (error) {
          console.error(`Error processing page ${i}:`, error);
        }
      }

      // Restore the original active page
      actions.setActivePage(originalActivePage);

      // Clear the interval and set progress to 100%
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setSaveProgress(100);

      toast.success("Live Menu Published", {
        description: `Live menu "${title}" has been published successfully!`,
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        duration: 4000,
      });

      onClose();
    } catch (error) {
      console.error("Error saving live menu:", error);

      // Clear the interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      toast.error("Failed to publish live menu", {
        description:
          "Please try again or contact support if the issue persists.",
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const handlePreview = () => {
    if (liveMenuData?.pageImages && liveMenuData.pageImages.length > 0) {
      // Open preview in a new window/tab
      const previewUrl = `/live-menu-preview/${liveMenuData.id}`;
      window.open(previewUrl, "_blank", "width=1920,height=1080");
    } else {
      toast.error(
        "No preview available. Please publish your live menu first to generate page images."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-purple-600" />
            Publish Live Menu to TV
          </DialogTitle>
          <DialogDescription>
            Configure your live menu for TV display. This will be shown on your
            restaurant's TV screens.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2">Loading live menu data...</span>
          </div>
        ) : isSaving ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <div className="text-center">
              <p className="font-medium">Publishing Live Menu...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Capturing pages and uploading to cloud storage
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${saveProgress}%` }}
                />
              </div>
              <p className="text-xs text-center mt-1 text-gray-500">
                {Math.round(saveProgress)}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Menu Info */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  TV Display Settings
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Optimized for 1920x1080 TV resolution. Your live menu will be
                displayed in landscape mode.
              </p>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title">Live Menu Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter live menu title"
                className="w-full"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter live menu description"
                className="w-full min-h-[80px]"
              />
            </div>

            {/* Live Menu Stats */}
            {liveMenuData && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Pages:
                    </span>
                    <span className="ml-1 font-medium">
                      {liveMenuData.pageImages?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Updated:
                    </span>
                    <span className="ml-1 font-medium">
                      {liveMenuData.updatedAt
                        ? new Date(liveMenuData.updatedAt).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!liveMenuData?.pageImages?.length}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save & Publish"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PublishLiveMenuDialog;
