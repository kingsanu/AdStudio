/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState, useEffect } from "react";
import { EditorConfig } from "canva-editor/components/editor";
import { CanvaEditor } from "canva-editor/components/editor";
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
  Check,
  AlertCircle,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EditorWithCustomHeaderProps = {
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

// Sync status type
type SyncStatus = {
  isSyncing: boolean;
  hasError: boolean;
  isOffline: boolean;
  isUserTyping: boolean;
  lastSavedAt: Date | null;
};

const EditorWithCustomHeader: FC<EditorWithCustomHeaderProps> = ({
  data,
  config,
  onChanges,
  onDesignNameChanges,
  isTextTemplate = false,
  isAdmin = false,
  onDownload,
  onShare,
  onSaveAsTemplate,
  ...rest
}) => {
  // Create a ref to the original editor's DOM element
  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(
    null
  );

  // We can't use useEditor here because we're outside the EditorContext
  // We'll use DOM methods and props instead

  // Helper function to find and click buttons in the original editor
  const findAndClickButton = (selector: string) => {
    if (editorContainer) {
      // First try with data-action attribute
      let button = editorContainer.querySelector(`[data-action="${selector}"]`);

      // If not found, try with other selectors
      if (!button) {
        // Try with aria-label
        button = editorContainer.querySelector(`[aria-label*="${selector}" i]`);
      }

      if (!button) {
        // Try with text content
        const allButtons = editorContainer.querySelectorAll("button");
        for (const btn of Array.from(allButtons)) {
          if (btn.textContent?.toLowerCase().includes(selector.toLowerCase())) {
            button = btn;
            break;
          }
        }
      }

      if (button) {
        (button as HTMLElement).click();
        return true;
      }
    }
    return false;
  };

  // Sync status state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    hasError: false,
    isOffline: false,
    isUserTyping: false,
    lastSavedAt: null,
  });

  // Poll for sync status from the editor
  useEffect(() => {
    const checkSyncStatus = () => {
      // Try to find sync status elements in the original editor
      if (editorContainer) {
        const syncingElement = editorContainer.querySelector(
          '[data-sync-status="syncing"]'
        );
        const errorElement = editorContainer.querySelector(
          '[data-sync-status="error"]'
        );
        const offlineElement = editorContainer.querySelector(
          '[data-sync-status="offline"]'
        );
        const typingElement = editorContainer.querySelector(
          '[data-sync-status="typing"]'
        );
        const lastSavedElement = editorContainer.querySelector(
          '[data-sync-status="last-saved"]'
        );

        setSyncStatus({
          isSyncing:
            !!syncingElement &&
            window.getComputedStyle(syncingElement).display !== "none",
          hasError:
            !!errorElement &&
            window.getComputedStyle(errorElement).display !== "none",
          isOffline:
            !!offlineElement &&
            window.getComputedStyle(offlineElement).display !== "none",
          isUserTyping:
            !!typingElement &&
            window.getComputedStyle(typingElement).display !== "none",
          lastSavedAt: lastSavedElement ? new Date() : null,
        });
      }
    };

    // Check immediately and then every second
    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 1000);

    return () => clearInterval(interval);
  }, [editorContainer]);

  // Handle download
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      findAndClickButton("download");
    }
  };

  // Handle share
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      findAndClickButton("campaign") || findAndClickButton("share");
    }
  };

  // Handle save as template (admin only)
  const handleSaveAsTemplate = () => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate();
    } else {
      findAndClickButton("save-template") || findAndClickButton("template");
    }
  };

  // Handle undo
  const handleUndo = () => {
    findAndClickButton("undo");
  };

  // Handle redo
  const handleRedo = () => {
    findAndClickButton("redo");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Custom Top Bar */}
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
            <span className="text-sm font-medium">
              {data?.name || "Untitled Design"}
            </span>
          </div>

          {/* Three Dots Menu with Sync Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <MoreHorizontal className="h-4 w-4" />
                {syncStatus.isSyncing && (
                  <div className="absolute -top-1 -right-1 h-3 w-3">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  </div>
                )}
                {syncStatus.hasError && (
                  <div className="absolute -top-1 -right-1 h-3 w-3">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  </div>
                )}
                {syncStatus.isOffline && (
                  <div className="absolute -top-1 -right-1 h-3 w-3">
                    <WifiOff className="h-3 w-3 text-yellow-500" />
                  </div>
                )}
                {!syncStatus.isSyncing &&
                  !syncStatus.hasError &&
                  !syncStatus.isOffline && (
                    <div className="absolute -top-1 -right-1 h-3 w-3">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                  )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <div className="px-2 py-1.5 text-sm font-semibold">
                {data?.name || "Untitled Design"}
                <div className="text-xs font-normal text-gray-500">
                  {syncStatus.isUserTyping
                    ? "Changes being made..."
                    : syncStatus.isSyncing
                    ? "Saving..."
                    : syncStatus.hasError
                    ? "Failed to save"
                    : syncStatus.isOffline
                    ? "Offline"
                    : syncStatus.lastSavedAt
                    ? `Last saved ${syncStatus.lastSavedAt.toLocaleTimeString()}`
                    : "All changes saved"}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => findAndClickButton("save")}>
                <Save className="mr-2 h-4 w-4" />
                <span>Save</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => findAndClickButton("duplicate")}>
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
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => findAndClickButton("delete")}
              >
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

      {/* Editor Content - Hide the original header */}
      <div
        className="flex-1 relative"
        ref={setEditorContainer}
        style={{ overflow: "hidden" }}
      >
        <div className="absolute inset-0">
          <CanvaEditor
            data={data}
            config={config}
            onChanges={onChanges}
            onDesignNameChanges={onDesignNameChanges}
            isTextTemplate={isTextTemplate}
            {...rest}
          />
        </div>

        {/* CSS to hide the original header */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Hide the original header */
            .absolute > div > div:first-child {
              display: none !important;
            }
          `,
          }}
        />
      </div>
    </div>
  );
};

export default EditorWithCustomHeader;
