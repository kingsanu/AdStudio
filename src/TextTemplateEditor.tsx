/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanvaEditor } from "canva-editor/components/editor";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { textTemplateService } from "./services/textTemplateService";
import { toast } from "sonner";
import axios from "axios";
import { GET_TEMPLATE_PATH_ENDPOINT } from "canva-editor/utils/constants/api";
import { emptyTextTemplate } from "./emptyTextTemplate";
import { emptyData } from "./sampleData";

// Main component that provides the EditorContext
const TextTemplateEditor = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateData, setTemplateData] = useState<any>(emptyData);
  const [name, setName] = useState("New Text Template");
  const [editorError, setEditorError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleOnChanges = (_changes: any) => {
    // console.log("On changes: ", changes);

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const handleOnDesignNameChanges = (newName: string) => {
    console.log("On name changes: " + newName);
    setName(newName);
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  // Parse URL parameters to get template ID
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Check for both 'template' and 'templateId' parameters
    const templateId =
      searchParams.get("template") || searchParams.get("templateId");

    if (templateId) {
      loadTemplate(templateId);

      // Store the template ID in localStorage for future updates
      localStorage.setItem("text_template_id", templateId);
    } else {
      localStorage.removeItem("text_template_id");
    }
  }, [location.search]);

  // Add a global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      if (
        event.error &&
        event.error.message &&
        (event.error.message.includes("serializedPages") ||
          event.error.message.includes("CanvaEditor") ||
          event.error.message.includes("editorConfig"))
      ) {
        setEditorError(true);
      }
    };

    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // Function to load a template by ID
  const loadTemplate = async (templateId: string) => {
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
            console.log("Template URL:", template.templateUrl);

            // Use the complete URL with the proxy endpoint
            const encodedUrl = encodeURIComponent(template.templateUrl);

            // Use the GET_TEMPLATE_PATH_ENDPOINT to fetch the template data
            const templateResponse = await axios.get(
              `${GET_TEMPLATE_PATH_ENDPOINT}/${encodedUrl}`
            );

            // Simply use the template data directly as is
            setTemplateData(templateResponse.data);

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
            setTemplateData(emptyTextTemplate);
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

  // Define the editor configuration
  const editorConfig = {
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
  };

  return (
    <div className="relative">
      <CanvaEditor
        data={{
          name,
          editorConfig: templateData,
        }}
        config={editorConfig}
        saving={saving}
        onChanges={handleOnChanges}
        isTextTemplate={true} // This tells CanvaEditor to use SaveTextTemplateDialog
        onDesignNameChanges={handleOnDesignNameChanges}
        key={location.search} // Force re-render when template changes
      />
    </div>
  );
};

export default TextTemplateEditor;
