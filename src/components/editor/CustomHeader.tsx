/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useContext, useState, useEffect, useRef } from "react";
import {
  EditorContext,
  EditorContext as EditorContextType,
} from "canva-editor/components/editor/EditorContext";
import { Undo, Redo, Download, Share, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeaderFileMenu from "canva-editor/layout/sidebar/components/HeaderFileMenu";
import CampaignDialog from "canva-editor/components/editor/CampaignDialog";
import SyncStatusIndicator from "canva-editor/components/sync/SyncStatusIndicator";
import { useSyncService } from "canva-editor/hooks/useSyncService";

// Define a type for our custom context that includes the extended properties
type CustomEditorContext = EditorContextType & {
  actions: {
    fireDownloadPNGCmd?: (pageIndex: number) => void;
    openCampaignDialog?: () => void;
    openSaveTemplateDialog?: () => void;
    forceSave?: () => void;
    duplicateDesign?: () => void;
    deleteDesign?: () => void;
    undo?: () => void;
    redo?: () => void;
    history?: {
      undo: () => void;
      redo: () => void;
    };
  };
  getState: () => {
    isSyncing?: boolean;
    syncError?: boolean;
    lastSavedAt?: string | number | Date;
    name?: string;
  };
};

interface CustomHeaderProps {
  onShare?: () => void;
  onDownload?: () => void;
  isAdmin?: boolean;
  editorContext?: CustomEditorContext; // Use our custom context type
}

const CustomHeader: FC<CustomHeaderProps> = ({
  // isAdmin,
  // onShare,
  onDownload,
  editorContext,
}) => {
  // State for campaign dialog
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  // Reference to the page content element for generating previews
  const pageContentRef = useRef<HTMLElement | null>(null);

  // First try to use the provided context, then fall back to useEditor hook
  const contextValue = useContext(EditorContext);
  const editorValue = editorContext || contextValue;

  // Cast to any to bypass TypeScript checks since we know these properties exist at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = (editorValue?.actions || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = (editorValue?.getState ? editorValue.getState() : {}) as any;

  // Set up sync service
  const { syncStatus, lastSavedAt, isUserTyping, saveNow } = useSyncService({
    autoSaveInterval: 2000, // 2 seconds
    getDesignData: () =>
      editorValue?.query?.serialize ? editorValue.query.serialize() : {},
    getDesignName: () => titleValue || "Untitled Design",
    getPageContentElement: () => pageContentRef.current,
  });

  // State for title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(
    state?.name || "Untitled Design"
  );

  // Update title value when state.name changes
  useEffect(() => {
    if (state?.name) {
      setTitleValue(state.name);
    }
  }, [state?.name]);

  // Initialize page content reference
  useEffect(() => {
    pageContentRef.current = document.querySelector(".page-content");
  }, []);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  // Handle title save
  const handleTitleSave = () => {
    if (actions.setName) {
      actions.setName(titleValue);
    }
    setIsEditingTitle(false);
  };

  // Handle key press in title input
  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleValue(state?.name || "Untitled Design");
      setIsEditingTitle(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (actions.fireDownloadPNGCmd) {
      actions.fireDownloadPNGCmd(0); // 0 = all pages, 1 = current page
    }
  };

  // Handle share
  const handleShare = () => {
    setShowCampaignDialog(true);
  };

  // Handle undo
  const handleUndo = () => {
    if (actions.undo) {
      actions.undo();
    } else if (actions.history && actions.history.undo) {
      actions.history.undo();
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (actions.redo) {
      actions.redo();
    } else if (actions.history && actions.history.redo) {
      actions.history.redo();
    }
  };

  return (
    <>
      {/* Campaign Dialog */}
      <CampaignDialog
        open={showCampaignDialog}
        onClose={() => setShowCampaignDialog(false)}
      />

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center">
            <div className="h-8 w-8 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3] flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="ml-2 font-bold text-black dark:text-white">
              Ads Studio
            </span>
          </div>

          {/* Project Title */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Projects
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/</span>
            {isEditingTitle ? (
              <Input
                className="h-6 text-sm font-medium w-40 px-1 py-0"
                value={titleValue}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyPress}
                onBlur={handleTitleSave}
                autoFocus
              />
            ) : (
              <span
                className="text-sm font-medium cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditingTitle(true)}
              >
                {titleValue || "Untitled Design"}
              </span>
            )}
          </div>

          {/* File Menu (uses three dots icon internally) */}
          <div className="ml-2">
            <HeaderFileMenu designName={titleValue || "Untitled Design"} />
          </div>

          {/* Sync Status Indicator */}
          <div className="ml-2 flex items-center">
            <SyncStatusIndicator
              status={syncStatus}
              lastSavedAt={lastSavedAt}
              isUserTyping={isUserTyping}
              onClick={() => saveNow({ force: true })}
            />
          </div>
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
    </>
  );
};

export default CustomHeader;
