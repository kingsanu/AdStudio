/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { EditorConfig, EditorContext } from "./EditorContext";
import { useEditorStore } from "../../hooks/useEditorStore";
import Sidebar from "canva-editor/layout/Sidebar";
import EditorContent from "canva-editor/layout/pages/EditorContent";
import AppLayerSettings from "canva-editor/layout/AppLayerSettings";
import Preview from "./Preview";
import PageThumbnail from "./PageThumbnail";
import CloseIcon from "canva-editor/icons/CloseIcon";
import { dataMapping, pack } from "canva-editor/utils/minifier";
import { initSyncService } from "../../services/syncService";
// import { downloadObjectAsJson } from "canva-editor/utils/download";
import WorkspaceIcon from "../../icons/WorkspaceIcon";
import HeaderFileMenu from "canva-editor/layout/sidebar/components/HeaderFileMenu";
import PlayArrowIcon from "canva-editor/icons/PlayArrowIcon";
import VideoIcon from "canva-editor/icons/VideoIcon";
import {
  setupDesignChangeListeners,
  cleanupDesignChangeListeners,
} from "../../utils/designChangeEvent";
import SaveTextTemplateDialog from "canva-editor/components/editor/SaveTextTemplateDialog";
// import CampaignDialog from "./CampaignDialog";
import SimpleVideoPreview from "./SimpleVideoPreview";
import { Save, AlertCircle, CheckCircle, Wand2, Plus } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "canva-editor/utils/constants/api";
import { AnimationProvider } from "../../animations/AnimationController";
import { TransitionProvider } from "../../animations/TransitionController";
import AnimationPanel from "./AnimationPanel";
import TransitionPanel from "./TransitionPanel";
import { AnimationState } from "../../animations/types";
import "../../animations/animations.css";

export type EditorProps = {
  data?: {
    name: string;
    editorConfig: unknown;
  };
  saving?: boolean;
  config: EditorConfig;
  designId?: string | null; // ID of the design being edited (null for new designs)
  onChanges: (changes: unknown) => void;
  onDesignNameChanges?: (name: string) => void;
  isTextTemplate?: boolean;
};

const CanvaEditor: FC<PropsWithChildren<EditorProps>> = ({
  data,
  config,
  designId: initialDesignId = null, // Accept designId as prop with default null
  onChanges,
  isTextTemplate = false,
}) => {
  const version = "1.0.69";
  const { getState, actions, query } = useEditorStore({
    isAdmin: config.isAdmin,
  });
  
  // Use the provided designId or default to null for new designs
  const [designId, setDesignId] = useState<string | null>(initialDesignId);
  
  // Update designId if the prop changes (e.g., after first save)
  useEffect(() => {
    if (initialDesignId !== designId) {
      console.log("🔄 Updating designId from prop:", initialDesignId);
      setDesignId(initialDesignId);
    }
  }, [initialDesignId, designId]);
  
  const [viewPortHeight, setViewPortHeight] = useState<number>();
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [showTransitionPanel, setShowTransitionPanel] = useState(false);
  const [showRemotionPreview, setShowRemotionPreview] = useState(false);
  const [capturedSlides, setCapturedSlides] = useState<string[]>([]);
  const [slideTransitions, setSlideTransitions] = useState<
    { type: string; duration: number }[]
  >([]);
  const [animationState, setAnimationState] = useState<AnimationState>({
    layerAnimations: {},
    slideTransitions: {},
    isPlaying: false,
    currentPageIndex: 0,
  });
  // Initialize sync service and design change listeners
  useEffect(() => {
    // Initialize the sync service
    initSyncService();

    // Set up design change listeners
    setupDesignChangeListeners();

    // Set up a callback to handle changes
    const handleChanges = () => {
      if (onChanges) {
        // Pack the data for the parent component
        onChanges(pack(query.serialize(), dataMapping)[0]);
      }
    };

    // Listen for sync status changes
    window.addEventListener("sync-status-changed", handleChanges);

    return () => {
      // Clean up design change listeners
      cleanupDesignChangeListeners();
      window.removeEventListener("sync-status-changed", handleChanges);
    };
  }, [onChanges, query]);

  useEffect(() => {
    const windowHeight = () => {
      setViewPortHeight(window.innerHeight);
    };
    window.addEventListener("resize", windowHeight);
    windowHeight();
    return () => {
      window.removeEventListener("resize", windowHeight);
    };
  }, []);

  // Function to convert pages to video slideshow
  const handleCreateVideoSlideshow = async () => {
    try {
      setIsGeneratingVideo(true);

      // Show toast notification for starting the process
      toast.info("Creating video preview", {
        description: "Capturing pages for preview...",
        duration: 3000,
      });

      // Get all pages from the editor
      const pages = getState().pages;
      const pageImages = [];
      const transitions = [];

      // Capture each page as an image
      for (let i = 0; i < pages.length; i++) {
        try {
          // Use the correct method to set the active page
          actions.setActivePage(i);

          // Wait longer for the page to fully render (300ms instead of 100ms)
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Find the page content element
          const pageContentEl = document.querySelectorAll(".page-content")[0];
          if (pageContentEl) {
            // Log dimensions for debugging
            console.log(
              `Capturing page ${i}, dimensions: ${pageContentEl.clientWidth}x${pageContentEl.clientHeight}`
            );

            try {
              // Use domToPng with explicit settings for better compatibility
              const dataUrl = await import("modern-screenshot").then(
                ({ domToPng }) =>
                  domToPng(pageContentEl as HTMLElement, {
                    width: pageContentEl.clientWidth,
                    height: pageContentEl.clientHeight,
                    quality: 1.0,
                    scale: 1.0,
                    // Use only supported properties
                  })
              );

              // Verify the data URL format
              if (dataUrl && dataUrl.startsWith("data:image/")) {
                console.log(`Successfully captured page ${i}`);
                pageImages.push(dataUrl);
              } else {
                console.error(`Invalid data URL format for page ${i}`);
                throw new Error("Invalid data URL format");
              }
            } catch (captureError) {
              console.error(`Error in domToPng for page ${i}:`, captureError);

              // Fallback to canvas-based capture if domToPng fails
              try {
                const canvas = document.createElement("canvas");
                canvas.width = pageContentEl.clientWidth;
                canvas.height = pageContentEl.clientHeight;
                const ctx = canvas.getContext("2d");

                if (ctx) {
                  // Fill with white background
                  ctx.fillStyle = "#FFFFFF";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);

                  // Create an image from the HTML
                  const data = new XMLSerializer().serializeToString(
                    pageContentEl
                  );
                  const img = new Image();
                  const svgBlob = new Blob([data], { type: "image/svg+xml" });
                  const url = URL.createObjectURL(svgBlob);

                  // Wait for image to load
                  await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = url;
                  });

                  // Draw the image
                  ctx.drawImage(img, 0, 0);
                  URL.revokeObjectURL(url);

                  // Get data URL
                  const fallbackDataUrl = canvas.toDataURL("image/png");
                  console.log(`Used fallback capture for page ${i}`);
                  pageImages.push(fallbackDataUrl);
                }
              } catch (fallbackError) {
                console.error(
                  `Fallback capture also failed for page ${i}:`,
                  fallbackError
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error capturing page ${i}:`, error);
        }
      }

      if (pageImages.length === 0) {
        throw new Error("No pages could be captured");
      }

      // Process transition data
      if (animationState && animationState.slideTransitions) {
        // Convert slide transitions to the format expected by Remotion
        for (let i = 0; i < pageImages.length - 1; i++) {
          const transitionKey = `${i}-${i + 1}`;
          const transition = animationState.slideTransitions[transitionKey];

          if (transition) {
            transitions.push({
              type: transition.transitionType,
              duration: transition.duration,
            });
          } else {
            // Default transition
            transitions.push({
              type: "fade",
              duration: 500,
            });
          }
        }
      }

      // Store the captured slides and transitions for the Remotion preview
      setCapturedSlides(pageImages);
      setSlideTransitions(transitions);

      // Show the Remotion preview dialog
      setShowRemotionPreview(true);

      // Show success toast notification
      toast.success("Video preview ready", {
        description:
          "Your slideshow preview is ready. You can export it to a video file.",
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error creating video preview:", error);

      // Show error toast notification
      toast.error("Preview creation failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-white" />,
        duration: 5000,
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Monitor sidebar state
  useEffect(() => {
    // This effect is kept for future sidebar state monitoring if needed
    const checkSidebarState = () => {
      // No longer tracking sidebar expanded state
    };

    // Check initially
    checkSidebarState();
  }, []);

  return (
    <EditorContext.Provider value={{ config, getState, actions, query, designId, setDesignId }}>
      <AnimationProvider>
        <TransitionProvider
          animationState={animationState}
          setAnimationState={setAnimationState}
        >
          <div
            css={{
              display: "flex",
              flexDirection: "column",
              width: "100vw",
              height: "100vh",
              maxHeight: viewPortHeight ? `${viewPortHeight}px` : "auto",
              background: "white",
            }}
          >
            {isTextTemplate && showSaveDialog && (
              <SaveTextTemplateDialog
                open={showSaveDialog}
                onClose={() => setShowSaveDialog(false)}
                initialName={data?.name}
              />
            )}

            {/* Campaign Dialog
            <CampaignDialog
              open={showCampaignDialog}
              onClose={() => setShowCampaignDialog(false)}
            /> */}

            {/* Simple Video Preview Dialog */}
            <SimpleVideoPreview
              open={showRemotionPreview}
              onClose={() => setShowRemotionPreview(false)}
              slides={capturedSlides}
              transitions={slideTransitions}
            />
            {isTextTemplate && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                title="Save Text Template (Ctrl+S)"
              >
                <Save className="h-5 w-5" />
                <span className="font-medium">Save Template</span>
              </button>
            )}

            {/* Top Header Bar */}
            <div
              css={{
                height: "56px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
              }}
            >
              <div css={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3]" />
                <span className="font-bold whitespace-pre text-black dark:text-white">
                  Ads Studio
                </span>
                <div
                  css={{
                    marginLeft: "16px",
                    background: "#0070f3",
                    borderRadius: "4px",
                  }}
                >
                  <HeaderFileMenu
                    designName={data?.name || "New Pitch Deck for Sales"}
                  />
                </div>
              </div>

              <div
                css={{
                  display: "flex",
                  alignItems: "center",
                  marginBlock: "auto",
                }}
                className="mx-auto flex-row"
              >
                <div
                  css={{
                    marginRight: "8px",
                    fontSize: "18px",
                    color: "#6b7280",
                  }}
                >
                  <WorkspaceIcon />
                </div>
                <div css={{ display: "flex", flexDirection: "column" }}>
                  <span css={{ fontWeight: 500 }}>
                    {data?.name || "New Pitch Deck for Sales"}
                  </span>
                  <span css={{ fontSize: "12px", color: "#6b7280" }}>
                    Workspace
                  </span>
                </div>
              </div>

              <div css={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  css={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#0070f3",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 500,
                    fontSize: "14px",
                  }}
                >
                  {data?.name ? data.name.substring(0, 1).toUpperCase() : "U"}
                </div>

                <div
                  css={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <button
                    css={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      "&:hover": { background: "#16a34a" },
                    }}
                    onClick={() => {
                      // Show the campaign dialog
                      setShowCampaignDialog(true);
                    }}
                  >
                    <span>Start Campaign</span>
                  </button>
                  <button
                    css={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: showAnimationPanel
                        ? "rgba(0,0,0,0.05)"
                        : "white",
                      border: "1px solid #e5e7eb",
                      "&:hover": { background: "rgba(0,0,0,0.02)" },
                    }}
                    onClick={() => setShowAnimationPanel(!showAnimationPanel)}
                  >
                    <Wand2 size={16} />
                    <span>Animations</span>
                  </button>
                  <button
                    css={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: showTransitionPanel
                        ? "rgba(0,0,0,0.05)"
                        : "white",
                      border: "1px solid #e5e7eb",
                      "&:hover": { background: "rgba(0,0,0,0.02)" },
                    }}
                    onClick={() => setShowTransitionPanel(!showTransitionPanel)}
                  >
                    <PlayArrowIcon />
                    <span>Transitions</span>
                  </button>
                  <button
                    css={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      "&:hover": { background: "rgba(0,0,0,0.02)" },
                    }}
                    onClick={() => setShowPreview(true)}
                  >
                    <PlayArrowIcon />
                    <span>Preview</span>
                  </button>
                  <button
                    css={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: isGeneratingVideo ? "not-allowed" : "pointer",
                      background: "#6366f1",
                      color: "white",
                      border: "none",
                      opacity: isGeneratingVideo ? 0.7 : 1,
                      "&:hover": {
                        background: isGeneratingVideo ? "#6366f1" : "#4f46e5",
                      },
                    }}
                    onClick={handleCreateVideoSlideshow}
                    disabled={isGeneratingVideo}
                  >
                    <VideoIcon />
                    <span>
                      {isGeneratingVideo ? "Creating..." : "Create Video"}
                    </span>
                  </button>{" "}
                  <button
                    css={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: "#0070f3",
                      color: "white",
                      border: "none",
                      "&:hover": { background: "#4f46e5" },
                    }}
                    onClick={async () => {
                      // Import sync service and force sync before download
                      try {
                        const SyncService = await import(
                          "../../services/syncService"
                        );
                        const canProceed =
                          await SyncService.default.forceSyncBeforeCriticalAction(
                            "PNG download"
                          );
                        if (canProceed) {
                          actions.fireDownloadPNGCmd(0);
                        }
                      } catch (error) {
                        console.error("Error during forced sync:", error);
                        // Proceed with download anyway
                        actions.fireDownloadPNGCmd(0);
                      }
                    }}
                  >
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div
              css={{
                display: "flex",
                flex: "1",
                overflow: "hidden",
                position: "relative", // Added for absolute positioning of expanded sidebar
              }}
            >
              {/* Left Sidebar - Tools */}
              <div
                css={{
                  borderRight: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "8px 0",
                  overflow: "visible",
                  zIndex: 20, // Ensure the sidebar tabs are above the expanded content
                  background: "white",
                  height: "100vh",
                  position: "relative", // Needed for z-index to work
                }}
              >
                <Sidebar version={version} />
              </div>

              {/* Main Canvas Area */}
              <div
                css={{
                  flexGrow: 1,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  overflowX: "hidden", // Explicitly hide horizontal overflow
                  background: "#f3f4f6",
                  transition: "margin-left 0.3s ease",
                  marginLeft: "0",
                }}
              >
                <AppLayerSettings />
                <EditorContent
                  data={data?.editorConfig}
                  onChanges={onChanges}
                />

                {/* Animation Panel */}
                {showAnimationPanel && (
                  <div
                    css={{
                      position: "absolute",
                      top: "60px",
                      right: "20px",
                      width: "300px",
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 100,
                    }}
                  >
                    <AnimationPanel
                      onClose={() => setShowAnimationPanel(false)}
                    />
                  </div>
                )}

                {/* Transition Panel */}
                {showTransitionPanel && (
                  <div
                    css={{
                      position: "absolute",
                      top: "60px",
                      right: "20px",
                      width: "300px",
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 100,
                    }}
                  >
                    <TransitionPanel
                      onClose={() => setShowTransitionPanel(false)}
                      pages={getState().pages}
                    />
                  </div>
                )}
              </div>

              {/* Right Sidebar - Slide Thumbnails */}
              <div
                css={{
                  width: "256px",
                  borderLeft: "1px solid #e5e7eb",
                  background: "white",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  css={{
                    padding: "16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h3 css={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>
                    Pages
                  </h3>
                </div>

                <div
                  css={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "8px",
                  }}
                >
                  {getState().pages.map((_, index) => (
                    <PageThumbnail
                      key={index}
                      pageIndex={index}
                      isActive={getState().activePage === index}
                      onClick={() => actions.setActivePage(index)}
                    />
                  ))}

                  {/* Add Page Button */}
                  <div css={{ padding: "8px" }}>
                    <button
                      css={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 0",
                        borderRadius: "4px",
                        border: "1px dashed #d1d5db",
                        background: "white",
                        cursor: "pointer",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: 500,
                        "&:hover": {
                          background: "#f9fafb",
                          borderColor: "#9ca3af",
                        },
                      }}
                      onClick={() => actions.addPage()}
                    >
                      <Plus size={16} />
                      <span>Add Page</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview/Presentation Mode */}
            {showPreview && (
              <div
                css={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 1040,
                  background: "rgba(13,18,22,.95)",
                }}
              >
                <Preview onClose={() => setShowPreview(false)} />
                <div
                  css={{
                    background: "transparent",
                    width: 60,
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "fixed",
                    right: 24,
                    top: 24,
                    borderRadius: "50%",
                    fontSize: 36,
                    color: "#fff",
                    cursor: "pointer",
                    ":hover": {
                      background: "rgba(255,255,255,0.3)",
                      transition: "background-color 200ms linear",
                    },
                  }}
                  onClick={() => setShowPreview(false)}
                >
                  <CloseIcon />
                </div>
              </div>
            )}
          </div>
        </TransitionProvider>
      </AnimationProvider>
    </EditorContext.Provider>
  );
};

export default CanvaEditor;
