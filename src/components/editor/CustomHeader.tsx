/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EditorContext,
  EditorContext as EditorContextType,
} from "canva-editor/components/editor/EditorContext";
import {
  Undo,
  Redo,
  Download,
  Share,
  Lightbulb,
  Monitor,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HorizontalLoader } from "@/components/ui/horizontal-loader";
import { Input } from "@/components/ui/input";
import HeaderFileMenu from "canva-editor/layout/sidebar/components/HeaderFileMenu";
import WhatsAppCampaignDialog from "@/components/WhatsAppCampaignDialog";
import PublishKioskDialog from "@/components/editor/PublishKioskDialog";
import PublishLiveMenuDialog from "@/components/dialogs/PublishLiveMenuDialog";
import BulkCouponDialog from "@/components/editor/BulkCouponDialog";
import SyncStatusIndicator from "canva-editor/components/sync/SyncStatusIndicator";
import { useSyncService } from "canva-editor/hooks/useSyncService";
import { ensureDesignSaved, getCurrentDesignData, saveDesignBeforeAction, updateDownloadStats } from "@/utils/designSaveHelper";
import { toast } from "sonner";
import { pack } from "canva-editor/utils/minifier";
import { dataMapping } from "canva-editor/utils/minifier";
import { UPLOAD_TEMPLATE_ENDPOINT } from "canva-editor/utils/constants/api";
import { domToPng } from "modern-screenshot";
import Cookies from "js-cookie";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

// Define a type for our custom context that includes the extended properties
type CustomEditorContext = EditorContextType & {
  actions?: any; // Use any for now to avoid type conflicts
  getState?: () => any; // Use any for now to avoid type conflicts
  query?: any; // Use any for now to avoid type conflicts
};

interface CustomHeaderProps {
  onShare?: (editorContext?: { query: any; actions: any; getState: any }) => void;
  onDownload?: (editorContext?: { query: any; actions: any; getState: any }) => void;
  isAdmin?: boolean;
  isKiosk?: boolean;
  isLiveMenu?: boolean;
  isCoupon?: boolean;
  isInCouponTemplateMode?: boolean;
  onBulkGenerate?: (editorContext?: { query: any; actions: any; getState: any }) => void;
  editorContext?: CustomEditorContext; // Use our custom context type
}

const CustomHeader: FC<CustomHeaderProps> = ({
  // isAdmin,
  // onShare,
  onDownload,
  isKiosk = false,
  isLiveMenu = false,
  isCoupon = false,
  isInCouponTemplateMode = false,
  onBulkGenerate,
  editorContext,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for dialogs
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<{
    isCreated: boolean;
    campaignId?: string;
    status?: string;
  }>({ isCreated: false });
  const [showPublishKioskDialog, setShowPublishKioskDialog] = useState(false);
  const [showPublishLiveMenuDialog, setShowPublishLiveMenuDialog] =
    useState(false);
  const [showBulkCouponDialog, setShowBulkCouponDialog] = useState(false);
  
  // State for action progress
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

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

  // Set up sync service with longer interval (we'll implement our own debounced logic)
  const { syncStatus, lastSavedAt, isUserTyping, saveNow } = useSyncService({
    autoSaveInterval: 30000, // 30 seconds - much longer since we'll handle our own debouncing
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
    if (state?.name && state.name !== titleValue) {
      console.log("📝 Syncing title from editor state:", state.name, "current:", titleValue);
      setTitleValue(state.name);
    }
  }, [state?.name, titleValue]);

  // Initialize title from editor state on mount
  useEffect(() => {
    if (state?.name) {
      setTitleValue(state.name);
      console.log("📝 Initial title from editor state:", state.name);
    }
  }, [state?.name]);

  // Enhanced auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastLocalSave, setLastLocalSave] = useState<Date | null>(null);
  const [lastCloudSave, setLastCloudSave] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>("");

  // Save to localStorage (fast backup)
  const saveToLocalStorage = useCallback((designData: any, designName: string) => {
    try {
      const saveData = {
        designData,
        designName,
        timestamp: new Date().toISOString(),
        templateId: localStorage.getItem("template_id")
      };
      
      localStorage.setItem("current_design_backup", JSON.stringify(saveData));
      setLastLocalSave(new Date());
      console.log("💾 Design saved to localStorage");
      
    } catch (error) {
      console.error("❌ Failed to save to localStorage:", error);
    }
  }, []);

  // Debounced auto-save logic
  const debouncedAutoSave = useCallback(async () => {
    if (!editorValue?.query) return;

    try {
      const designData = editorValue.query.serialize();
      const dataString = JSON.stringify(designData);
      
      // Check if data has actually changed
      if (dataString === lastDataRef.current) {
        console.log("🔄 No changes detected, skipping auto-save");
        return;
      }
      
      lastDataRef.current = dataString;
      
      // Save to localStorage immediately (fast backup)
      saveToLocalStorage(designData, titleValue || "Untitled Design");
      setHasUnsavedChanges(true);
      
      console.log("📝 Changes detected - saved to localStorage, cloud save pending...");
      toast.info("Design saved locally - will sync to cloud soon", { duration: 2000 });
      
    } catch (error) {
      console.error("❌ Error in debounced auto-save:", error);
    }
  }, [editorValue, titleValue, saveToLocalStorage]);

  // Monitor editor changes and trigger debounced save
  useEffect(() => {
    if (!editorValue?.query) return;

    let changeTimeout: NodeJS.Timeout;

    const handleChange = () => {
      // Clear previous timeout
      if (changeTimeout) {
        clearTimeout(changeTimeout);
      }
      
      // Set new timeout for 25 seconds after user stops editing
      changeTimeout = setTimeout(() => {
        debouncedAutoSave();
      }, 25000); // 25 seconds delay
    };

    // Trigger initial check
    handleChange();

    // Set up periodic check for changes (every 5 seconds while user is active)
    const interval = setInterval(() => {
      if (!isUserTyping) { // Only check if user is not actively typing
        debouncedAutoSave();
      }
    }, 5000);

    // Cleanup
    return () => {
      if (changeTimeout) {
        clearTimeout(changeTimeout);
      }
      clearInterval(interval);
    };
  }, [editorValue, debouncedAutoSave, isUserTyping]);

  // Helper function to start a new design (clears editor designId)
  const startNewDesign = useCallback(() => {
    console.log("🆕 Starting new design - clearing designId from editor context");
    console.log("🆕 Before - designId:", editorValue?.designId);
    
    // Clear the designId from editor context to force new template creation
    if (editorValue?.setDesignId) {
      editorValue.setDesignId(null);
      console.log("🆕 Cleared designId in editor context");
    }
    
    // Also clear localStorage to be safe
    localStorage.removeItem("canva_editor_template_id");
    localStorage.removeItem("current_design_backup");
    console.log("🆕 Cleared localStorage template data");
    
    // Reset component state
    setTitleValue("Untitled Design");
    setHasUnsavedChanges(false);
    setLastCloudSave(null);
    setLastLocalSave(null);
    
    // Also update editor state if possible
    if (actions.setName) {
      actions.setName("Untitled Design");
    }
    
    console.log("✅ New design state initialized - next save will create new template");
    console.log("✅ After - designId:", editorValue?.designId);
  }, [actions, editorValue]);

  // Expose this function globally for other components to use
  useEffect(() => {
    (window as any).startNewDesign = startNewDesign;
    
    return () => {
      delete (window as any).startNewDesign;
    };
  }, [startNewDesign]);

  // Background save function (using saveDesignBeforeAction helper)
  const saveDesignInBackground = async (actionName: string = "action"): Promise<boolean> => {
    try {
      console.log(`🔄 Background saving for ${actionName}...`);

      if (!editorValue?.query) {
        console.error("❌ No editor query available");
        toast.error(`Cannot perform ${actionName} - editor not ready`);
        return false;
      }

      // Get design data from editor using helper
      const designData = getCurrentDesignData(editorValue.query);
      if (!designData || Object.keys(designData).length === 0) {
        console.error("❌ No design data found");
        toast.error(`Cannot perform ${actionName} - no design data found`);
        return false;
      }

      // Use title from state or default
      const templateName = titleValue || "Untitled Design";

      console.log(`💾 Background save for template: "${templateName}"`);
      console.log(`🆔 Current editor designId: ${editorValue.designId || 'null (new design)'}`);

      // Use the updated save helper function with editor context
      const result = await saveDesignBeforeAction(designData, templateName, editorValue, {
        force: true,
        showNotification: false, // Background save should be silent
        waitForCompletion: true,
      });

      if (result.success) {
        // If we got a new template ID, we should update the editor context
        if (result.templateId && !editorValue.designId) {
          console.log(`🆔 New template created with ID: ${result.templateId}`);
          // Update the editor context with the new design ID
          if (editorValue && typeof editorValue === 'object') {
            (editorValue as any).designId = result.templateId;
          }
        }
      }

      return result.success;
    } catch (error) {
      console.error(`❌ Error saving design for ${actionName}:`, error);
      return false;
    }
  };

  // Enhanced cloud save function that also clears unsaved changes flag
  const saveToCloud = useCallback(async (actionName: string = "background save"): Promise<boolean> => {
    try {
      const success = await saveDesignInBackground(actionName);
      if (success) {
        setHasUnsavedChanges(false);
        setLastCloudSave(new Date());
        console.log("☁️ Design saved to cloud successfully");
        
        // Clear localStorage backup since it's now saved to cloud
        localStorage.removeItem("current_design_backup");
      }
      return success;
    } catch (error) {
      console.error("❌ Failed to save to cloud:", error);
      return false;
    }
  }, []);

  // Save to cloud when user leaves page or closes tab
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Try to save to cloud before leaving
        saveToCloud("page unload");
        
        // Show warning to user
        const message = "You have unsaved changes. Are you sure you want to leave?";
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        // Page is being hidden, try to save
        saveToCloud("page hidden");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasUnsavedChanges, saveToCloud]);

  // Restore from localStorage backup on component mount
  useEffect(() => {
    const restoreFromBackup = async () => {
      try {
        const backupData = localStorage.getItem("current_design_backup");
        if (backupData && editorValue?.actions) {
          const backup = JSON.parse(backupData);
          
          // Check if backup is recent (within last 24 hours)
          const backupTime = new Date(backup.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - backupTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            // Silently restore backup data without user prompt
            if (backup.designData) {
              // Just mark as having changes
              setHasUnsavedChanges(true);
              
              // Set the design name if available
              if (backup.designName) {
                setTitleValue(backup.designName);
              }
              
              // Restore design ID to editor context if available
              if (backup.templateId && editorValue && typeof editorValue === 'object') {
                (editorValue as any).designId = backup.templateId;
              }
              
              console.log("📋 Backup data restored silently");
            }
          } else {
            // Backup is too old, remove it
            localStorage.removeItem("current_design_backup");
          }
        }
      } catch (error) {
        console.error("❌ Error restoring from backup:", error);
        localStorage.removeItem("current_design_backup"); // Remove corrupted backup
      }
    };

    // Only run on mount, not on every render
    restoreFromBackup();
  }, []); // Empty dependency array - only run once on mount

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  // Handle title save
  const handleTitleSave = async () => {
    const newTitle = titleValue.trim() || "Untitled Design";
    
    // Update the editor state
    if (actions.setName) {
      actions.setName(newTitle);
      console.log("📝 Title updated in editor:", newTitle);
    }
    
    // Update our local state to match
    setTitleValue(newTitle);
    
    // For title changes on existing designs, we'll let the save logic handle whether to create new
    // The editor's designId will determine if it's a new design (null) or existing (has ID)
    console.log(`📝 Title set to "${newTitle}" on ${editorValue?.designId ? 'existing' : 'new'} design`);
    
    // Trigger auto-save to reflect the title change
    if (editorValue?.query) {
      const designData = editorValue.query.serialize();
      saveToLocalStorage(designData, newTitle);
      setHasUnsavedChanges(true);
      console.log("💾 Title change triggered auto-save");
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
  const handleDownload = async () => {
    // Prevent multiple simultaneous actions
    if (isPerformingAction) {
      return;
    }

    try {
      setIsPerformingAction(true);
      setCurrentAction("Preparing download...");

      console.log("🚀 Starting download process with save...");

      // First ensure the design is saved so download includes latest changes
      const designData = getCurrentDesignData(editorValue?.query);
      const saved = await ensureDesignSaved(
        editorValue?.query,
        titleValue || "Untitled Design", 
        editorValue, // This contains designId and setDesignId
        user, // Pass user object for correct user ID
        "download"
      );

      if (!saved) {
        console.error("❌ Failed to save before download");
        return;
      }

      console.log("✅ Design saved, proceeding with download...");

      // Update download stats if we have a template ID
      const templateId = editorValue?.designId;
      if (templateId) {
        await updateDownloadStats(templateId);
      }

      // Proceed with download
      if (onDownload) {
        onDownload(editorValue ? { query: editorValue.query, actions: editorValue.actions, getState: editorValue.getState } : undefined);
      } else if (actions.fireDownloadPNGCmd) {
        actions.fireDownloadPNGCmd(0); // 0 = all pages, 1 = current page
      }

      setCurrentAction("Download completed");
      
      // Keep the status for a bit longer to ensure user sees completion
      setTimeout(() => {
        setCurrentAction("");
      }, 2000);

    } catch (error) {
      console.error("❌ Error during download:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      // Clear the performing action state after a delay to ensure download has started
      setTimeout(() => {
        setIsPerformingAction(false);
      }, 1000);
    }
  };

  // Handle share
  const handleShare = async () => {
    // Prevent multiple simultaneous actions
    if (isPerformingAction) {
      return;
    }

    try {
      setIsPerformingAction(true);
      setCurrentAction("Saving design...");

      console.log("🚀 Starting WhatsApp campaign process with save...");

      // First ensure the design is saved so campaign includes latest changes
      const saved = await ensureDesignSaved(
        editorValue?.query,
        titleValue || "Untitled Design",
        editorValue, // This contains designId and setDesignId
        user, // Pass user object for correct user ID
        "WhatsApp campaign"
      );

      if (!saved) {
        console.error("❌ Failed to save before WhatsApp campaign");
        return;
      }

      console.log("✅ Design saved, proceeding with WhatsApp campaign...");

      setCurrentAction("Opening WhatsApp campaign...");
      setCampaignProgress({ isCreated: false }); // Reset campaign progress
      setShowCampaignDialog(true);

    } catch (error) {
      console.error("Error during WhatsApp campaign:", error);
      toast.error("Failed to open WhatsApp campaign. Please try again.");
    } finally {
      // Clear after a brief delay to show completion
      setTimeout(() => {
        setIsPerformingAction(false);
        setCurrentAction("");
      }, 1000);
    }
  };

  // Handle publish kiosk
  const handlePublishKiosk = async () => {
    // Ensure design is saved before publishing to kiosk
    const saved = await ensureDesignSaved(
      editorValue?.query,
      titleValue || "Untitled Design",
      editorValue,
      user, // Pass user object for correct user ID
      "kiosk publish"
    );

    if (!saved) {
      return; // Don't proceed if save failed
    }

    setShowPublishKioskDialog(true);
  };

  // Handle publish live menu
  const handlePublishLiveMenu = async () => {
    // Ensure design is saved before publishing to live menu
    const saved = await ensureDesignSaved(
      editorValue?.query,
      titleValue || "Untitled Design",
      editorValue,
      user, // Pass user object for correct user ID
      "live menu publish"
    );

    if (!saved) {
      return; // Don't proceed if save failed
    }

    setShowPublishLiveMenuDialog(true);
  };

  // Handle bulk generate
  const handleBulkGenerate = async () => {
    // Ensure design is saved before bulk generate
    const saved = await ensureDesignSaved(
      editorValue?.query,
      titleValue || "Untitled Design",
      editorValue,
      user, // Pass user object for correct user ID
      "bulk generate"
    );

    if (!saved) {
      return; // Don't proceed if save failed
    }

    if (onBulkGenerate) {
      onBulkGenerate(editorValue ? { query: editorValue.query, actions: editorValue.actions, getState: editorValue.getState } : undefined);
    }
  };

  // Handle bulk coupon dialog
  const handleBulkCouponDialog = async () => {
    // Prevent multiple simultaneous actions
    if (isPerformingAction) {
      return;
    }

    try {
      setIsPerformingAction(true);
      setCurrentAction("Saving design...");

      console.log("🚀 Starting bulk coupon process with save...");

      // First ensure the design is saved so bulk coupon includes latest changes
      const saved = await ensureDesignSaved(
        editorValue?.query,
        titleValue || "Untitled Design",
        editorValue, // This contains designId and setDesignId
        user, // Pass user object for correct user ID
        "bulk coupon generation"
      );

      if (!saved) {
        console.error("❌ Failed to save before bulk coupon generation");
        return;
      }

      console.log("✅ Design saved, proceeding with bulk coupon dialog...");

      setCurrentAction("Opening bulk coupon dialog...");
      setShowBulkCouponDialog(true);

    } catch (error) {
      console.error("Error during bulk coupon:", error);
      toast.error("Failed to open bulk coupon dialog. Please try again.");
    } finally {
      // Clear after a brief delay to show completion
      setTimeout(() => {
        setIsPerformingAction(false);
        setCurrentAction("");
      }, 1000);
    }
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

  // Prevent navigation while an action is in progress
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPerformingAction) {
        const message = `Please wait - ${currentAction || 'action in progress'}. Leaving now may result in data loss.`;
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    if (isPerformingAction) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isPerformingAction]);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center space-x-4">
          {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="h-8 w-8 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3] flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="ml-2 font-bold text-black dark:text-white">
              Ads Studio
            </span>
          </div>
        </Link>

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
                placeholder="Enter design name"
                autoFocus
              />
            ) : (
              <span
                className="text-sm font-medium cursor-pointer hover:text-blue-600 min-w-[100px]"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit design name"
              >
                {titleValue || "Untitled Design"}
              </span>
            )}
          </div>

          {/* File Menu (uses three dots icon internally) */}
          <div className="ml-2">
            <HeaderFileMenu designName={titleValue || "Untitled Design"} />
          </div>

          {/* Enhanced Save Status Indicator */}
          <div className="ml-2 flex items-center gap-2">
            {/* Original Sync Status */}
            <SyncStatusIndicator
              status={syncStatus}
              lastSavedAt={lastSavedAt}
              isUserTyping={isUserTyping}
              onClick={() => saveNow({ force: true })}
            />
            
            {/* Enhanced Save Status */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Saved locally</span>
                <button
                  onClick={() => saveToCloud("manual save")}
                  className="ml-1 text-amber-600 hover:text-amber-800 underline"
                  title="Save to cloud now"
                >
                  (Save to cloud)
                </button>
              </div>
            )}
            
            {lastCloudSave && !hasUnsavedChanges && (
              <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Cloud saved</span>
              </div>
            )}
          </div>

          {/* Action Status Indicator */}
          {isPerformingAction && currentAction && (
            <div className="ml-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{currentAction}</span>
            </div>
          )}
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
            disabled={isPerformingAction}
          >
            <Download className="mr-2 h-4 w-4" />
            {isPerformingAction && currentAction.includes("download") ? "Saving..." : "Download"}
          </Button>

          {/* Share Button */}
          {isKiosk ? (
            <Button
              size="sm"
              className="h-9 bg-green-600 hover:bg-green-700"
              onClick={handlePublishKiosk}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Publish to Kiosk
            </Button>
          ) : isLiveMenu ? (
            <Button
              size="sm"
              className="h-9 bg-purple-600 hover:bg-purple-700"
              onClick={handlePublishLiveMenu}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Publish to Live Menu
            </Button>
          ) : isCoupon ? (
            isInCouponTemplateMode ? (
              <Button
                size="sm"
                className="h-9 bg-orange-600 hover:bg-orange-700"
                onClick={handleBulkGenerate}
              >
                <FileText className="mr-2 h-4 w-4" />
                Bulk Generate
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-9 bg-orange-600 hover:bg-orange-700"
                onClick={handleBulkCouponDialog}
                disabled={isPerformingAction}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isPerformingAction && currentAction.includes("bulk coupon") ? "Saving..." : "Bulk Generate"}
              </Button>
            )
          ) : campaignProgress.isCreated ? (
            <div className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md h-9 min-w-[160px]">
              <div className="flex-1">
                <div className="text-xs mb-1">Campaign Created</div>
                <HorizontalLoader className="h-1" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-white hover:bg-green-800 px-2"
                onClick={() => {
                  if (campaignProgress.campaignId) {
                    navigate(
                      `/whatsapp-campaigns/${campaignProgress.campaignId}`
                    );
                  }
                }}
              >
                View Details
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-9 bg-green-600 hover:bg-green-700"
              onClick={handleShare}
              disabled={isPerformingAction}
            >
              <Share className="mr-2 h-4 w-4" />
              {isPerformingAction && currentAction.includes("WhatsApp") ? "Saving..." : "WhatsApp Campaign"}
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <WhatsAppCampaignDialog
        open={showCampaignDialog}
        onClose={() => setShowCampaignDialog(false)}
        onSuccess={(campaignId?: string) => {
          setShowCampaignDialog(false);
          setCampaignProgress({
            isCreated: true,
            campaignId,
            status: "created",
          });
        }}
      />

      <PublishKioskDialog
        open={showPublishKioskDialog}
        onClose={() => setShowPublishKioskDialog(false)}
      />

      <PublishLiveMenuDialog
        open={showPublishLiveMenuDialog}
        onClose={() => setShowPublishLiveMenuDialog(false)}
      />

      <BulkCouponDialog
        open={showBulkCouponDialog}
        onClose={() => setShowBulkCouponDialog(false)}
        isCoupon={isCoupon}
      />
    </>
  );
};

export default CustomHeader;
