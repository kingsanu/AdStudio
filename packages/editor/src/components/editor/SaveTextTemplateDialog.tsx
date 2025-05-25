/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState, useRef, useEffect } from "react";
import { pack } from "canva-editor/utils/minifier";
import { dataMapping } from "canva-editor/utils/minifier";
import { domToPng } from "modern-screenshot";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
import { textTemplateService } from "@/services/textTemplateService";

// Import shadcn components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoaderCircle, Save, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEditor } from "canva-editor/hooks";
// Don't use useEditor hook here as it's not available in the context

interface Props {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onNameChange?: (name: string) => void;
}

const SaveTextTemplateDialog: FC<Props> = ({
  open,
  onClose,
  initialName = "",
  onNameChange,
}) => {
  const [templateName, setTemplateName] = useState(initialName);
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const { query } = useEditor();

  const { user } = useAuth();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTemplateName(initialName);
      setTemplateDesc("");
      setTemplateTags([]);
      setTagInput("");
      setSaveProgress(0);
      setIsPublic(false);
    }
  }, [open, initialName]);

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

  const handleSaveTemplate = async () => {
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

    try {
      setIsSaving(true);
      setSaveProgress(0);

      // Show a loading toast
      toast.loading("Saving text template...", {
        description: "Please wait while we save your text template.",
        duration: 60000, // Long duration as we'll dismiss it manually
      });

      // Start progress animation from 0 to 80%
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += 1;
        if (progress <= 80) {
          setSaveProgress(progress);
        } else {
          // If we reach 80% and response isn't back yet, slow down
          setSaveProgress(progress + 0.2);
          if (progress >= 95) {
            // Cap at 95% until we get the response
            clearInterval(progressIntervalRef.current!);
          }
        }
      }, 50);

      // console.log("FULL EDITOR DATA:", editorData);
      const templateData = query.serialize();
      console.log("SERIALIZED TEMPLATE DATA:", templateData);

      // Pack the data for sending to the server - keep all pages
      const [packedResult] = pack(templateData, dataMapping);
      const packedData = packedResult;

      // Get user's ID as unique identifier (outletId from auth)
      const userId = user?.userId || Cookies.get("auth_token") || "anonymous";

      // Check if we're editing an existing template
      // First check URL parameters for template ID
      const urlParams = new URLSearchParams(window.location.search);
      const urlTemplateId = urlParams.get("templateId");

      // Then check localStorage as fallback
      const storedTemplateId = localStorage.getItem("text_template_id");

      // Use URL parameter if available, otherwise use stored ID
      const existingTemplateId = urlTemplateId || storedTemplateId;

      console.log(
        `Template ID: ${existingTemplateId} (from ${
          urlTemplateId ? "URL" : "localStorage"
        })`
      );

      let result;
      if (existingTemplateId) {
        // Update existing template
        result = await textTemplateService.updateTextTemplate(
          existingTemplateId,
          {
            packedData,
            previewImage,
            templateName,
            templateDesc,
            tags: templateTags,
            isPublic,
            userId,
          }
        );
      } else {
        // Create a new template
        result = await textTemplateService.saveTextTemplate({
          packedData,
          previewImage,
          templateName,
          templateDesc,
          tags: templateTags,
          isPublic,
          userId,
        });

        // Store the template ID for future updates
        if (result.success && result.templateId) {
          localStorage.setItem("text_template_id", result.templateId);

          // Update URL with template ID without refreshing the page
          const url = new URL(window.location.href);
          url.searchParams.set("templateId", result.templateId);
          window.history.replaceState({}, "", url.toString());

          console.log(`Saved template ID: ${result.templateId}`);
        }
      }

      // Clear the interval and set progress to 100%
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setSaveProgress(100);

      // Dismiss the loading toast and show success toast
      toast.dismiss();

      if (result.success) {
        toast.success("Text Template Saved", {
          description: `Text template "${templateName}" has been saved successfully!`,
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          duration: 4000,
        });

        // Update the design name in the editor if it's different
        if (initialName !== templateName && templateName.trim()) {
          try {
            // Call the onNameChange callback to update the name in the parent component
            if (onNameChange) {
              onNameChange(templateName.trim());
              console.log(`Updated design name to: ${templateName.trim()}`);
            }

            // Dispatch a design change event to trigger a save
            window.dispatchEvent(new CustomEvent("design-changed"));
          } catch (error) {
            console.error("Error updating design name:", error);
          }
        }

        // Close the dialog after a short delay to show 100% progress
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        toast.error("Save Failed", {
          description: result.error || "Failed to save text template",
          icon: <AlertCircle className="h-5 w-5 text-white" />,
          duration: 5000,
        });
      }
    } catch (error) {
      // Clear the interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      console.error("Error saving text template:", error);
      let errorMessage = "An error occurred while saving the text template.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Dismiss the loading toast and show error toast
      toast.dismiss();
      toast.error("Save Failed", {
        description: errorMessage,
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
    >
      <DialogContent className="sm:max-w-md md:max-w-xl bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-slate-800">
            <div className="flex items-center justify-center gap-2">
              <Save className="h-6 w-6 text-blue-600" />
              <span>Save as Text Template</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Card className="overflow-hidden mb-6 rounded-xl border-slate-200 shadow-md transition-all hover:shadow-lg">
            <div className="h-48 bg-slate-50 flex items-center justify-center relative">
              {previewImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={previewImage}
                  alt="Template Preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-slate-400"
                >
                  <LoaderCircle className="h-8 w-8 animate-spin mb-2" />
                  <span>Generating preview...</span>
                </motion.div>
              )}

              {/* Text layer indicator */}
              <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                Text Template
              </div>
            </div>
          </Card>

          <div className="space-y-5">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label
                htmlFor="template-name"
                className="text-sm font-medium text-slate-700"
              >
                Template Name
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="focus:ring-2 focus:ring-blue-200 border-slate-300"
                autoFocus
              />
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label
                htmlFor="template-desc"
                className="text-sm font-medium text-slate-700"
              >
                Description
              </Label>
              <Textarea
                id="template-desc"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Enter a description for your text template"
                className="focus:ring-2 focus:ring-blue-200 resize-none min-h-24 border-slate-300"
              />
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label
                htmlFor="template-visibility"
                className="text-sm font-medium text-slate-700"
              >
                Visibility
              </Label>
              <RadioGroup
                value={isPublic ? "public" : "private"}
                onValueChange={(value) => setIsPublic(value === "public")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label
                    htmlFor="public"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Private
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label
                    htmlFor="public"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Public
                  </Label>
                </div>
              </RadioGroup>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label
                htmlFor="template-tags"
                className="text-sm font-medium text-slate-700"
              >
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  id="template-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      if (!templateTags.includes(tagInput.trim())) {
                        setTemplateTags((prev) => [...prev, tagInput.trim()]);
                      }
                      setTagInput("");
                    }
                  }}
                  placeholder="Add tags (e.g., heading, quote, title)"
                  className="focus:ring-2 focus:ring-blue-200 border-slate-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (
                      tagInput.trim() &&
                      !templateTags.includes(tagInput.trim())
                    ) {
                      setTemplateTags((prev) => [...prev, tagInput.trim()]);
                      setTagInput("");
                    }
                  }}
                  disabled={
                    !tagInput.trim() || templateTags.includes(tagInput.trim())
                  }
                >
                  Add
                </Button>
              </div>

              {templateTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2 mt-2"
                >
                  {templateTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setTemplateTags((prev) =>
                          prev.filter((t) => t !== tag)
                        );
                      }}
                    >
                      {tag}
                      <span className="text-xs">&times;</span>
                    </Badge>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {isSaving && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2 mt-4"
              >
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-blue-600">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span>Saving text template...</span>
                  </div>
                  <span className="font-medium">
                    {Math.round(saveProgress)}%
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Text Template
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTextTemplateDialog;
