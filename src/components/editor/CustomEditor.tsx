/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * NOTE: This file is not currently being used in the application.
 * It contains TypeScript errors that need to be fixed before it can be used.
 * The application is using CustomCanvaEditor.tsx or CanvaEditorWithCustomHeader.tsx instead.
 */
import { FC, PropsWithChildren, useEffect, useState, useRef } from "react";
import { EditorConfig, EditorContext } from "canva-editor/components/editor";
import { CanvaEditor } from "canva-editor/components/editor";
import { X, Plus } from "lucide-react";

// Import our custom header components
import {
  Undo,
  Redo,
  Download,
  Share,
  MoreHorizontal,
  Lightbulb,
  Save,
  FileText,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CustomEditorProps = {
  data?: {
    name: string;
    editorConfig: unknown;
  };
  saving?: boolean;
  config: EditorConfig;
  onChanges: (changes: unknown) => void;
  onDesignNameChanges?: (name: string) => void;
  isTextTemplate?: boolean;
  isAdmin?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
  onSaveAsTemplate?: () => void;
};

const CustomEditor: FC<PropsWithChildren<CustomEditorProps>> = ({
  data,
  config,
  onChanges,
  onDesignNameChanges,
  isTextTemplate = false,
  isAdmin = false,
  onDownload,
  onShare,
  onSaveAsTemplate,
}) => {
  const version = "1.0.69";
  const { getState, actions, query } = useEditorStore();
  const [viewPortHeight, setViewPortHeight] = useState<number>();
  const [showPreview, setShowPreview] = useState(false);
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

  // Handle undo
  const handleUndo = () => {
    if (actions && actions.undo) {
      actions.undo();
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (actions && actions.redo) {
      actions.redo();
    }
  };

  // Handle download
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (actions && actions.fireDownloadPNGCmd) {
      actions.fireDownloadPNGCmd(0);
    }
  };

  // Handle share
  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  // Handle save as template
  const handleSaveAsTemplate = () => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate();
    }
  };

  return (
    <EditorContext.Provider value={{ config, getState, actions, query }}>
      <AnimationProvider>
        <TransitionProvider
          animationState={animationState}
          setAnimationState={setAnimationState}
        >
          <div
            className="flex flex-col w-full h-screen overflow-hidden"
            style={{
              maxHeight: viewPortHeight ? `${viewPortHeight}px` : "auto",
              background: "white",
            }}
          >
            {/* Custom Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center space-x-4">
                {/* Logo */}
                <div className="flex items-center">
                  <div className="h-8 w-8 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3] flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                </div>

                {/* Project Title */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Projects
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    /
                  </span>
                  <span className="text-sm font-medium">
                    {data?.name || "Untitled Design"}
                  </span>
                </div>

                {/* Three Dots Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => {}}>
                      <Save className="mr-2 h-4 w-4" />
                      <span>Save</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Duplicate</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={handleSaveAsTemplate}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Save as Template</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600 dark:text-red-400">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Center - Undo/Redo */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRedo}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-2">
                {/* Help Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-50 cursor-not-allowed"
                  title="Coming soon!"
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>

                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>

                {/* Share Button */}
                <Button
                  size="sm"
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                  onClick={handleShare}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
              {/* Left Sidebar - Tools */}
              <div className="border-r border-gray-200 flex flex-col items-center py-2 overflow-visible z-20 bg-white h-full relative">
                <Sidebar version={version} />
              </div>

              {/* Main Canvas Area */}
              <div className="flex-grow relative flex flex-col overflow-auto bg-gray-100 transition-all duration-300 ease-in-out">
                <AppLayerSettings />
                <EditorContent
                  data={data?.editorConfig}
                  onChanges={onChanges}
                />
              </div>

              {/* Right Sidebar - Slide Thumbnails */}
              <div className="w-64 border-l border-gray-200 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium m-0">Pages</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {getState().pages.map((_, index) => (
                    <PageThumbnail
                      key={index}
                      pageIndex={index}
                      isActive={getState().activePage === index}
                      onClick={() => actions.setActivePage(index)}
                    />
                  ))}

                  {/* Add Page Button */}
                  <div className="p-2">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-1 border-dashed"
                      onClick={() => actions.addPage()}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Page</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview/Presentation Mode */}
            {showPreview && (
              <div className="fixed inset-0 z-50 bg-black/95">
                <Preview onClose={() => setShowPreview(false)} />
                <div
                  className="bg-transparent w-15 h-15 flex items-center justify-center fixed right-6 top-6 rounded-full text-white cursor-pointer hover:bg-white/30 transition-colors duration-200"
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

export default CustomEditor;
