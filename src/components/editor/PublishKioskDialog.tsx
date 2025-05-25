/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState, useRef, useEffect } from "react";
import { useEditor } from "canva-editor/hooks";
import { pack } from "canva-editor/utils/minifier";
import { dataMapping } from "canva-editor/utils/minifier";
import {
  KIOSKS_ENDPOINT,
  UPLOAD_KIOSK_IMAGE_ENDPOINT,
  UPLOAD_KIOSK_TEMPLATE_ENDPOINT,
} from "canva-editor/utils/constants/api";

import { domToPng } from "modern-screenshot";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";

interface PublishKioskDialogProps {
  open: boolean;
  onClose: () => void;
}

const PublishKioskDialog: FC<PublishKioskDialogProps> = ({ open, onClose }) => {
  // State for form fields
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get editor state and actions
  const { query, actions, state } = useEditor();
  const { pages, activePage } = state;

  // Get user from auth context
  const { user } = useAuth();

  // Generate preview image when dialog opens
  useEffect(() => {
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
  }, [open]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Handle tag input
  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  };

  // Handle tag input key press
  const handleTagsKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Add tag to list
  const addTag = () => {
    const tag = tagsInput.trim();
    if (tag && !templateTags.includes(tag)) {
      setTemplateTags([...templateTags, tag]);
      setTagsInput("");
    }
  };

  // Remove tag from list
  const removeTag = (tagToRemove: string) => {
    setTemplateTags(templateTags.filter((tag) => tag !== tagToRemove));
  };

  // Handle publishing template and generating page images
  const handlePublishKiosk = async () => {
    if (!templateName.trim()) {
      toast.error("Validation Error", {
        description: "Please enter a template name to save your template.",
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 4000,
      });
      return;
    }

    if (!previewImage) {
      toast.error("Preview Error", {
        description: "Preview image generation failed. Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 4000,
      });
      return;
    }

    // Start saving process
    setIsSaving(true);
    setSaveProgress(0);

    // Show loading toast
    toast.loading("Publishing Kiosk Template", {
      description: "Saving template and generating page images...",
      duration: 60000, // 1 minute timeout
    });

    // Simulate progress updates
    progressIntervalRef.current = setInterval(() => {
      setSaveProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 90 ? 90 : newProgress; // Cap at 90% until complete
      });
    }, 500);

    try {
      // Get user's ID as unique identifier (outletId from auth)
      // Extract just the ID part if userId contains city and name
      let userId = user?.userId || Cookies.get("auth_token") || "anonymous";
      // If userId contains underscores, extract just the ID part (last segment)
      if (userId.includes("_")) {
        userId = userId.split("_").pop() || userId;
      }

      // Use a timestamp for the template filename
      const timestamp = Date.now();
      const templateFilename = `kiosk_template_${timestamp}.json`;

      // Get the design data
      const designData = query.serialize();

      // Pack the data
      const [packedResult] = pack(designData, dataMapping);
      // Don't extract just the first element if it's an array - we need all pages
      const packedData = packedResult;

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

      // Create a kiosk entry with the template URL
      console.log("Creating kiosk with template URL");
      const kioskPayload = {
        title: templateName,
        description: templateDesc,
        userId,
        templateUrl, // Store the URL to the JSON file
        tags: templateTags,
        isPublic,
      };
      console.log("Kiosk payload:", kioskPayload);

      const kioskResponse = await axios.post(KIOSKS_ENDPOINT, kioskPayload);
      console.log("Kiosk response:", kioskResponse.data);

      // Get the kiosk ID from the response
      const kioskId = kioskResponse.data.kiosk.id;
      console.log("Kiosk ID:", kioskId);

      // Generate and upload images for each page
      const pageImages = [];
      const originalActivePage = activePage;

      // Capture each page as an image
      console.log(`Starting to capture ${pages.length} pages`);
      for (let i = 0; i < pages.length; i++) {
        try {
          console.log(`Processing page ${i + 1} of ${pages.length}`);

          // Set the active page - this is the key fix
          console.log(`Setting active page to ${i}`);
          actions.setActivePage(i);

          // Add a small delay to ensure the page is set
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Force a re-render by updating the state
          setSaveProgress((prev) => {
            console.log(`Updating progress to force re-render: ${prev + 0.1}`);
            return prev + 0.1;
          });

          // Wait for the page to render - need a longer delay to ensure the page is fully rendered
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

            // Upload the image to cloud storage
            const pageImageFilename = `page_${i + 1}.png`;
            console.log(
              `Uploading image for page ${
                i + 1
              } with filename: ${pageImageFilename}`
            );

            // Log a small part of the image data to verify it's different for each page
            const base64Data = dataUrl.split(",")[1];
            console.log(
              `Image data preview for page ${i + 1}: ${base64Data.substring(
                0,
                50
              )}...`
            );

            const response = await axios.post(UPLOAD_KIOSK_IMAGE_ENDPOINT, {
              base64: base64Data, // Remove the data:image/png;base64, part
              filename: pageImageFilename,
              kioskId,
              pageIndex: i,
            });

            console.log(`Upload response for page ${i + 1}:`, response.data);
            pageImages.push(dataUrl);
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

      // Dismiss the loading toast and show success toast
      toast.dismiss();
      toast.success("Kiosk Published", {
        description: `Kiosk "${templateName}" has been published successfully with ${pageImages.length} page images!`,
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
        "There was an error publishing your kiosk. Please try again.";

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

      toast.error("Publishing Failed", {
        description: errorMessage,
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publish to Kiosk</DialogTitle>
          <DialogDescription>
            Save your design and generate images for kiosk display.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Template Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="col-span-3"
              placeholder="My Kiosk Template"
              disabled={isSaving}
            />
          </div>

          {/* Template Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              className="col-span-3"
              placeholder="A brief description of your template"
              disabled={isSaving}
            />
          </div>

          {/* Template Tags */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <div className="col-span-3">
              <Input
                id="tags"
                value={tagsInput}
                onChange={handleTagsInputChange}
                onKeyDown={handleTagsKeyPress}
                onBlur={addTag}
                className="mb-2"
                placeholder="Add tags (press Enter or comma to add)"
                disabled={isSaving}
              />
              <div className="flex flex-wrap gap-2">
                {templateTags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      onClick={() => removeTag(tag)}
                      disabled={isSaving}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="public" className="text-right">
              Public
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isSaving}
              />
              <Label htmlFor="public">
                {isPublic ? "Public template" : "Private template"}
              </Label>
            </div>
          </div>

          {/* Preview Image */}
          {previewImage && (
            <div className="mt-4">
              <Label className="block mb-2">Preview</Label>
              <div className="border rounded-md overflow-hidden">
                <img
                  src={previewImage}
                  alt="Template Preview"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Progress Bar (when saving) */}
          {isSaving && (
            <div className="mt-4">
              <Label className="block mb-2">
                Publishing Progress: {Math.round(saveProgress)}%
              </Label>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${saveProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handlePublishKiosk} disabled={isSaving}>
            {isSaving ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishKioskDialog;
