/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "@/styles/editor.css";
import { Button } from "@/components/ui/button";

import { templateService } from "@/services/templateService";
import { data } from "@/sampleData";
import { GET_TEMPLATE_ENDPOINT } from "canva-editor/utils/constants/api";
import CustomCanvaEditor from "@/components/editor/CustomCanvaEditor";

const NewEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("Untitled Design");
  const [templateData, setTemplateData] = useState<unknown[]>(data);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isAdminParam = searchParams.get("adm");
    setIsAdmin(
      isAdminParam === "true" || window.location.hostname === "localhost"
    );
  }, [location.search]);

  // Handle design name changes
  const handleOnDesignNameChanges = (name: string) => {
    setName(name);
  };

  // Handle editor changes
  const handleOnChanges = () => {
    setSaving(true);
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  // Add a global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Uncaught error:", event.error);
      // Only set editor error if it's related to the editor
      if (
        event.error &&
        (event.error.message.includes("editor") ||
          event.error.message.includes("canvas") ||
          event.error.message.includes("layer"))
      ) {
        setEditorError(true);
      }
    };

    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // Function to create an empty template with custom dimensions
  const createEmptyTemplate = (
    width: number,
    height: number,
    backgroundColor: string = "rgb(255, 255, 255)"
  ) => {
    try {
      setLoading(true);

      // Create an empty template with the specified dimensions using the minified format
      const emptyTemplate = [
        {
          a: "", // name
          b: "", // notes
          c: {
            // layers
            d: {
              // ROOT layer
              e: {
                f: "RootLayer", // type.resolvedName
              },
              g: {
                h: {
                  i: width, // boxSize.width
                  j: height, // boxSize.height
                },
                k: {
                  l: 0, // position.x
                  m: 0, // position.y
                },
                n: 0, // rotate
                o: backgroundColor, // color
                p: null, // image
                q: null, // additional props
              },
              r: false, // locked
              t: null, // parent
              s: [], // child
            },
          },
        },
      ];

      setTemplateData(emptyTemplate);
      setName("Untitled Design");
      toast.success("Custom size design created");
    } catch (error) {
      console.error("Error creating empty template:", error);
      toast.error("Failed to create custom size design");
      // Fallback to sample data
      setTemplateData(data);
    } finally {
      setLoading(false);
    }
  };

  // Function to load a template by ID
  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const template = await templateService.getTemplateById(templateId);

      if (template) {
        // Check if this is another user's template
        const currentUserId = localStorage.getItem("auth_token") || "";
        const isOtherUsersTemplate = template.userId !== currentUserId;

        if (isOtherUsersTemplate) {
          // Clear template ID from localStorage to ensure we create a new copy
          localStorage.removeItem("template_id");
        }

        // If the template has a templateUrl, fetch the template data
        if (template.templateUrl) {
          try {
            // Extract the filename from the templateUrl
            const file = template.templateUrl.split("/");
            const filename = file[file.length - 1];

            console.log("Template URL:", template.templateUrl);
            console.log("Extracted filename:", filename);

            // Use the GET_TEMPLATE_ENDPOINT to fetch the template data
            const templateResponse = await axios.get(
              `${GET_TEMPLATE_ENDPOINT}/${filename}`
            );
            console.log(templateResponse.data);
            // Simply use the template data directly as is
            // This is the same format as the sample data
            setTemplateData(templateResponse.data);

            // If it's another user's template, add "Copy of" to the name
            if (isOtherUsersTemplate) {
              setName(`Copy of ${template.title}` || "Untitled Design");
            } else {
              setName(template.title || "Untitled Design");
            }
          } catch (error) {
            console.error("Error loading template JSON:", error);
            toast.error("Failed to load template data");
            // Fallback to sample data
            setTemplateData(data);
          }
        } else {
          // If no templateUrl, use the template as is
          if (isOtherUsersTemplate) {
            setName(`Copy of ${template.title}` || "Untitled Design");
          } else {
            setName(template.title || "Untitled Design");
          }
          toast.success(`Template "${template.title}" loaded`);
        }
      } else {
        toast.error("Template not found");
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  // Parse URL parameters to get template ID or custom dimensions
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const templateId = searchParams.get("template");
    const width = searchParams.get("width");
    const height = searchParams.get("height");
    const bgColor = searchParams.get("bgColor");

    if (templateId) {
      loadTemplate(templateId);
    } else if (width && height) {
      createEmptyTemplate(
        parseInt(width),
        parseInt(height),
        bgColor || "rgb(255, 255, 255)"
      );
    }
  }, [location.search]);

  // Handle back button
  const handleBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0070f3] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading template...</p>
        </div>
      </div>
    );
  }

  // If there's an error rendering the editor, show an error message
  if (editorError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-neutral-900 p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600 dark:text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Template</h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
            We encountered an error while trying to load this template. The
            template format may not be compatible with the editor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-[#0070f3] hover:bg-[#0060d3] text-white rounded-md transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <CustomCanvaEditor
        data={{
          name,
          editorConfig: templateData,
        }}
        config={{
          apis: {
            url: "https://adstudioserver.foodyqueen.com/api",
            searchFonts: "/fonts",
            searchTemplates: "/templates",
            searchTexts: "/texts",
            searchImages: "/images",
            searchShapes: "/shapes",
            searchFrames: "/frames",
            templateKeywordSuggestion: "/template-suggestion",
            textKeywordSuggestion: "/text-suggestion",
            imageKeywordSuggestion: "/image-suggestion",
            shapeKeywordSuggestion: "/shape-suggestion",
            frameKeywordSuggestion: "/frame-suggestion",
            getUserImages: "/user-images",
            uploadImage: "/upload-image",
          },
          placeholders: {
            searchTemplate: "Search templates",
            searchText: "Search texts",
            searchImage: "Search images",
            searchShape: "Search shapes",
            searchFrame: "Search frames",
          },
          editorAssetsUrl: "https://adstudioserver.foodyqueen.com/editor",
          imageKeywordSuggestions: "animal,sport,love,scene,dog,cat,whale",
          templateKeywordSuggestions:
            "mother,sale,discount,fashion,model,deal,motivation,quote",
        }}
        saving={saving}
        onChanges={handleOnChanges}
        onDesignNameChanges={handleOnDesignNameChanges}
        isAdmin={isAdmin}
        key={location.search} // Force re-render when template changes
      />

      {/* Campaign Dialog would go here */}
      {showCampaignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Start Campaign</h2>
            <p className="mb-4">
              This is a placeholder for the campaign dialog.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowCampaignDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Note: CSS for horizontal scrollbars is in styles/editor.css */}
    </div>
  );
};

export default NewEditor;
