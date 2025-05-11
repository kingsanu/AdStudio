/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanvaEditor } from "canva-editor/components/editor";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { textTemplateService } from "./services/textTemplateService";
import { toast } from "sonner";
import axios from "axios";
import { GET_TEMPLATE_ENDPOINT } from "./utils/constants/api";
import { unpack } from "canva-editor/utils/minifier";
import { empty } from "./sampleData";
import { Save } from "lucide-react";
import SaveTextTemplateDialog from "../packages/editor/src/components/editor/SaveTextTemplateDialog";

const TextTemplateEditor = () => {
  const [templateData, setTemplateData] = useState<any>(empty);
  const [name, setName] = useState("New Text Template");
  const [editorError, setEditorError] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [textData, setTextData] = useState<any>(empty);

  const handleOnChanges = (changes: any) => {
    console.log("On changes: ", changes);
    // Store the changes for saving later
    if (changes) {
      // Make sure we're storing the data in the correct format
      // The editor returns an array of pages, but we need to save it as a single page
      // that will be inserted as a layer tree
      setTextData(changes);

      // Also update the templateData state to ensure consistency
      // This is important for when we save and then reload the template
      setTemplateData(changes);
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const handleOnDesignNameChanges = (newName: string) => {
    console.log("On name changes: " + newName);
    setName(newName);
  };

  // Add keyboard shortcut for saving (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setShowSaveDialog(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Check for template ID in URL parameters
  useEffect(() => {
    // Function to load a template by ID
    const loadTemplateFromUrl = async (templateId: string) => {
      try {
        setLoading(true);
        const template = await textTemplateService.getTextTemplateById(
          templateId
        );

        if (template) {
          // Check if this is another user's template
          const currentUserId = localStorage.getItem("auth_token") || "";
          const isOtherUsersTemplate = template.userId !== currentUserId;

          if (isOtherUsersTemplate) {
            // Clear template ID from localStorage to ensure we create a new copy
            localStorage.removeItem("text_template_id");
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

              // Make sure the template data is in the correct format
              let processedData;

              try {
                console.log("Raw template data:", templateResponse.data);

                // Try to unpack the data if it's in minified format
                if (
                  templateResponse.data &&
                  typeof templateResponse.data === "object"
                ) {
                  // Check if it's likely to be in minified format
                  const hasMinifiedKeys = Object.keys(
                    templateResponse.data
                  ).some((key) => key.length <= 3 && /^[a-z]{1,3}$/.test(key));

                  if (hasMinifiedKeys) {
                    console.log(
                      "Detected minified format, using unpack function..."
                    );
                    try {
                      processedData = unpack(templateResponse.data);
                      console.log("Unpacked data:", processedData);
                    } catch (unpackError) {
                      console.error("Error unpacking data:", unpackError);
                      processedData = templateResponse.data;
                    }
                  } else if (templateResponse.data.packedData) {
                    // Handle case where the API returns {packedData: ...}
                    console.log("Found packedData property, unpacking...");
                    try {
                      processedData = unpack(templateResponse.data.packedData);
                      console.log("Unpacked from packedData:", processedData);
                    } catch (unpackError) {
                      console.error("Error unpacking packedData:", unpackError);
                      processedData = templateResponse.data.packedData;
                    }
                  } else {
                    processedData = templateResponse.data;
                  }
                } else {
                  processedData = templateResponse.data;
                }

                // Now handle the structure
                console.log(
                  "Processed data before structure handling:",
                  processedData
                );

                if (Array.isArray(processedData)) {
                  // If it's already an array, use it directly
                  console.log("Using array data directly");
                  setTemplateData(processedData);
                  setTextData(processedData); // Keep textData in sync
                } else if (processedData.editorConfig) {
                  // If it has an editorConfig property, use that
                  console.log("Using editorConfig property");
                  setTemplateData(processedData.editorConfig);
                  setTextData(processedData.editorConfig); // Keep textData in sync
                } else {
                  // Otherwise, wrap it in an array
                  console.log("Wrapping data in array");
                  setTemplateData([processedData]);
                  setTextData([processedData]); // Keep textData in sync
                }

                console.log("Final template data set:", templateData);
              } catch (error) {
                console.error("Error processing template data:", error);
                // Fallback to the original data
                const fallbackData = Array.isArray(templateResponse.data)
                  ? templateResponse.data
                  : [templateResponse.data];
                console.log("Using fallback data:", fallbackData);
                setTemplateData(fallbackData);
                setTextData(fallbackData); // Keep textData in sync
              }

              // If it's another user's template, add "Copy of" to the name
              if (isOtherUsersTemplate) {
                setName(`Copy of ${template.title}` || "Untitled Text Design");

                // Update URL to remove template ID (since we're creating a copy)
                const url = new URL(window.location.href);
                url.searchParams.delete("template");
                url.searchParams.delete("templateId");
                window.history.replaceState({}, "", url.toString());
              } else {
                setName(template.title || "Untitled Text Design");
              }
            } catch (error) {
              console.error("Error loading template JSON:", error);
              toast.error("Failed to load text template data");
              // Fallback to empty text template data
              setTemplateData(empty);
            }
          } else {
            // If no templateUrl, use the template as is
            if (isOtherUsersTemplate) {
              setName(`Copy of ${template.title}` || "Untitled Text Design");

              // Update URL to remove template ID (since we're creating a copy)
              const url = new URL(window.location.href);
              url.searchParams.delete("template");
              url.searchParams.delete("templateId");
              window.history.replaceState({}, "", url.toString());
            } else {
              setName(template.title || "Untitled Text Design");
            }
            toast.success(`Text template "${template.title}" loaded`);
          }
        } else {
          toast.error("Text template not found");
        }
      } catch (error) {
        console.error("Error loading text template:", error);
        toast.error("Failed to load text template");
      } finally {
        setLoading(false);
      }
    };

    const urlParams = new URLSearchParams(location.search);
    const templateId = urlParams.get("templateId");

    if (templateId) {
      // Delay loading to ensure the editor is ready
      setTimeout(() => {
        loadTemplateFromUrl(templateId);
        toast.info("Loading text template...", {
          description: "Please wait while we load your text template.",
          duration: 5000,
        });
      }, 1500); // Delay to ensure it appears after the editor loads
    }
  }, [location.search]);

  // Add a global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      // Only set editor error if it's not already set
      if (!editorError) {
        setEditorError(true);
      }
    };

    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [editorError]);

  // Handle back button
  const handleBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0070f3] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading text template...</p>
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
          <h2 className="text-2xl font-bold mb-4">
            Error Loading Text Template
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
            We encountered an error while trying to load this text template. The
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

  // Note: Custom header buttons are not supported in the current CanvaEditor component

  return (
    <>
      <div className="relative">
        {/* Floating save button for better visibility */}
        <button
          onClick={() => setShowSaveDialog(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          title="Save Text Template (Ctrl+S)"
        >
          <Save className="h-5 w-5" />
          <span className="font-medium">Save Template</span>
        </button>

        {/* Add debugging to see the exact structure */}
        <pre className="hidden">{JSON.stringify(templateData, null, 2)}</pre>

        <CanvaEditor
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
          key={location.search} // Force re-render when template changes
          // headerButtons prop is not supported in the current CanvaEditor component
        />
      </div>

      {/* Save Text Template Dialog */}
      {showSaveDialog && (
        <SaveTextTemplateDialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          initialName={name}
          onNameChange={(newName) => setName(newName)}
          editorData={textData}
        />
      )}
    </>
  );
};

export default TextTemplateEditor;
