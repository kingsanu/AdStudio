import { pack } from "canva-editor/utils/minifier";
import { dataMapping } from "canva-editor/utils/minifier";
import axios, { AxiosError } from "axios";
import {
  UPLOAD_TEMPLATE_ENDPOINT,
  UPLOAD_KIOSK_TEMPLATE_ENDPOINT,
  USER_KIOSK_ENDPOINT,
  USER_LIVEMENU_ENDPOINT,
  UPLOAD_LIVEMENU_TEMPLATE_ENDPOINT,
} from "canva-editor/utils/constants/api";
import { domToPng } from "modern-screenshot";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { openDB, IDBPDatabase } from "idb";

// Constants
const SYNC_DB_NAME = "canva-editor-sync";
const SYNC_STORE_NAME = "pending-changes";
const SYNC_META_STORE_NAME = "sync-metadata";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
export const LOCAL_SAVE_INTERVAL = 2000; // 2 seconds for local saves
export const SERVER_SYNC_INTERVAL = 15000; // 15 seconds for server sync (reduced from 60s)
const FORCED_SYNC_TIMEOUT = 3000; // 3 seconds timeout for forced syncs
const LOCAL_STORAGE_KEYS = {
  TEMPLATE_DATA: "canva_editor_template_data",
  TEMPLATE_NAME: "canva_editor_template_name",
  LAST_SAVED: "canva_editor_last_saved",
  TEMPLATE_ID: "canva_editor_template_id",
  SYNC_STATUS: "canva_editor_sync_status",
};

// Types
export type SyncStatus = "idle" | "saving" | "saved" | "error" | "offline";
export type SyncMetadata = {
  lastSyncAttempt: number;
  lastSuccessfulSync: number;
  retryCount: number;
  syncStatus: SyncStatus;
  lastError?: string;
  pendingChanges: boolean;
};

export type SyncOptions = {
  force?: boolean;
  showNotification?: boolean;
  templateId?: string | null;
  userId?: string | null;
};

// Initialize IndexedDB
let db: IDBPDatabase | null = null;

const initDB = async (): Promise<IDBPDatabase> => {
  if (db) return db;

  db = await openDB(SYNC_DB_NAME, 1, {
    upgrade(database) {
      // Store for pending changes
      if (!database.objectStoreNames.contains(SYNC_STORE_NAME)) {
        database.createObjectStore(SYNC_STORE_NAME);
      }

      // Store for sync metadata
      if (!database.objectStoreNames.contains(SYNC_META_STORE_NAME)) {
        database.createObjectStore(SYNC_META_STORE_NAME);
      }
    },
  });

  return db;
};

// Get sync metadata
const getSyncMetadata = async (): Promise<SyncMetadata> => {
  try {
    const db = await initDB();
    const metadata = await db.get(SYNC_META_STORE_NAME, "metadata");

    return (
      metadata || {
        lastSyncAttempt: 0,
        lastSuccessfulSync: 0,
        retryCount: 0,
        syncStatus: "idle",
        pendingChanges: false,
      }
    );
  } catch (error) {
    console.error("Error getting sync metadata:", error);
    return {
      lastSyncAttempt: 0,
      lastSuccessfulSync: 0,
      retryCount: 0,
      syncStatus: "idle",
      pendingChanges: false,
    };
  }
};

// Update sync metadata
const updateSyncMetadata = async (
  updates: Partial<SyncMetadata>
): Promise<void> => {
  try {
    const db = await initDB();
    const currentMetadata = await getSyncMetadata();
    const newMetadata = { ...currentMetadata, ...updates };

    await db.put(SYNC_META_STORE_NAME, newMetadata, "metadata");

    // Also update localStorage for quick access
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.SYNC_STATUS,
      newMetadata.syncStatus
    );

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent("sync-status-changed", { detail: newMetadata })
    );
  } catch (error) {
    console.error("Error updating sync metadata:", error);
  }
};

// Types for design data
export interface DesignData {
  pages?: Record<string, unknown> | unknown[];
  [key: string]: unknown;
}

// Save changes to local storage and IndexedDB
export const saveChangesLocally = async (
  designData: DesignData,
  designName: string,
  pageContentElement: HTMLElement | null
): Promise<void> => {
  try {
    // Pack the design data
    const packedData = pack(designData, dataMapping)[0];

    // Generate preview image if possible
    let previewImage = "";
    if (pageContentElement) {
      console.log("🖼️ Attempting to generate preview image...");
      console.log("🖼️ Page element dimensions:", {
        width: pageContentElement.clientWidth,
        height: pageContentElement.clientHeight
      });
      try {
        previewImage = await domToPng(pageContentElement, {
          width: pageContentElement.clientWidth,
          height: pageContentElement.clientHeight,
        });
        console.log("✅ Preview image generated successfully, size:", previewImage.length);
      } catch (error) {
        console.warn("⚠️ Could not generate preview image:", error);
      }
    } else {
      console.warn("⚠️ No page content element provided, skipping preview image generation");
    }
    
    console.log("🖼️ Final preview image:", previewImage ? "present" : "empty");

    // Save to localStorage for quick access
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.TEMPLATE_DATA,
      JSON.stringify(packedData)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.TEMPLATE_NAME,
      designName || "Untitled design"
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.LAST_SAVED,
      new Date().toISOString()
    );

    // Save to IndexedDB for persistence
    const db = await initDB();
    await db.put(
      SYNC_STORE_NAME,
      {
        packedData,
        designName,
        previewImage,
        timestamp: Date.now(),
      },
      "current"
    );

    // Update metadata
    await updateSyncMetadata({
      pendingChanges: true,
      lastSyncAttempt: Date.now(),
    });

    return;
  } catch (error) {
    console.error("Error saving changes locally:", error);
    throw error;
  }
};

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Sync changes to server
export const syncChangesToServer = async (
  options: SyncOptions = {}
): Promise<Date | null> => {
  const { force = false, showNotification = true } = options;

  // Check if a manual save is in progress with a different user ID
  const manualSaveInProgress = localStorage.getItem("manual_save_in_progress");
  const manualSaveUserId = localStorage.getItem("manual_save_user_id");
  const currentUserId = options.userId || Cookies.get("auth_token") || "anonymous";
  
  if (manualSaveInProgress === "true" && manualSaveUserId !== currentUserId && !force) {
    console.log("🔄 Skipping auto-save because manual save is in progress with different user ID");
    return null;
  }

  // Get current metadata
  const metadata = await getSyncMetadata();

  // If already saving and not forced, skip
  if (metadata.syncStatus === "saving" && !force) {
    return null;
  }

  // Check if we're online
  if (!isOnline()) {
    await updateSyncMetadata({
      syncStatus: "offline",
      lastError: "Device is offline",
    });

    if (showNotification) {
      toast.error("Sync Failed", {
        description:
          "You are currently offline. Changes will be saved when you reconnect.",
        duration: 4000,
      });
    }

    return null;
  }

  try {
    // Update status to saving
    await updateSyncMetadata({
      syncStatus: "saving",
      lastSyncAttempt: Date.now(),
    });

    if (showNotification) {
      toast.loading("Syncing changes...", {
        description: "Your design is being saved to the cloud",
        duration: 60000, // Long duration as we'll dismiss it manually
      });
    }

    // Get data from IndexedDB
    const db = await initDB();
    const pendingChanges = await db.get(SYNC_STORE_NAME, "current");

    if (!pendingChanges) {
      // No changes to sync
      await updateSyncMetadata({
        syncStatus: "saved",
        pendingChanges: false,
      });

      if (showNotification) {
        toast.dismiss();
        toast.success("All changes saved", {
          description: "Your design is up to date",
          duration: 2000,
        });
      }

      return new Date();
    }

    // Get user ID from options first, then fallback to cookies or use default
    const userId = options.userId || Cookies.get("auth_token") || "anonymous";
    console.log("👤 Sync service using user ID:", userId);
    console.log("👤 User ID source:", options.userId ? "options" : (Cookies.get("auth_token") ? "cookie" : "anonymous"));

    // Check if we're working with a kiosk or live menu
    const kioskId = localStorage.getItem("kiosk_id");
    const liveMenuId = localStorage.getItem("livemenu_id");
    const isKiosk = !!kioskId;
    const isLiveMenu = !!liveMenuId;

    if (isKiosk) {
      // Handle kiosk saving
      console.log(`Syncing kiosk: ${kioskId} for user: ${userId}`);

      // First, upload the template JSON to cloud storage
      const templateResponse = await axios.post(
        UPLOAD_KIOSK_TEMPLATE_ENDPOINT,
        {
          packedData: pendingChanges.packedData,
          userId,
        }
      );

      // Get the template URL from the response
      const templateUrl = templateResponse.data.templateUrl;
      console.log("Kiosk template URL:", templateUrl);

      // Update the user's kiosk with the new template
      const kioskUpdateData = {
        userId,
        templateUrl,
        templateData: pendingChanges.packedData,
        title: pendingChanges.designName || "My Kiosk",
      };

      await axios.put(USER_KIOSK_ENDPOINT, kioskUpdateData);
      console.log(`Updated kiosk with ID: ${kioskId}`);
    } else if (isLiveMenu) {
      // Handle live menu saving
      console.log(`Syncing live menu: ${liveMenuId} for user: ${userId}`);

      // First, upload the template JSON to cloud storage
      const templateResponse = await axios.post(
        UPLOAD_LIVEMENU_TEMPLATE_ENDPOINT,
        {
          packedData: pendingChanges.packedData,
          userId,
        }
      );

      // Get the template URL from the response
      const templateUrl = templateResponse.data.templateUrl;
      console.log("Live menu template URL:", templateUrl);

      // Update the user's live menu with the new template
      const liveMenuUpdateData = {
        userId,
        templateUrl,
        templateData: pendingChanges.packedData,
        title: pendingChanges.designName || "My Live Menu",
      };

      await axios.put(USER_LIVEMENU_ENDPOINT, liveMenuUpdateData);
      console.log(`Updated live menu with ID: ${liveMenuId}`);
    } else {
      // Handle regular template saving
      // CRITICAL: Only use templateId from editor context, NEVER fall back to localStorage
      let templateId = null;
      
      if (options.hasOwnProperty('templateId')) {
        // templateId was explicitly provided from editor context
        templateId = options.templateId;
        console.log("📋 Using templateId from editor context:", templateId);
        
        if (templateId === null || templateId === undefined) {
          // This is a NEW design - ensure localStorage is completely cleared
          localStorage.removeItem(LOCAL_STORAGE_KEYS.TEMPLATE_ID);
          console.log("🆕 NEW DESIGN: Cleared localStorage template_id, will create new template");
          templateId = null; // Ensure it's explicitly null
        } else {
          console.log("🔄 EXISTING DESIGN: Will update template", templateId);
        }
      } else {
        // This should NEVER happen in the new implementation
        console.error("❌ CRITICAL: No templateId provided in options - this indicates a bug!");
        // Don't fall back to localStorage, force new template creation
        templateId = null;
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TEMPLATE_ID);
      }

      // Prepare data for API
      // Ensure the template name is consistent to help with filename consistency
      const templateName = pendingChanges.designName || "Untitled design";

      // Initialize with default values
      let isPublic = false;
      let templateDesc = "";

      // If we're updating an existing template, try to fetch its current public status
      if (templateId) {
        try {
          const templateResponse = await axios.get(
            `${UPLOAD_TEMPLATE_ENDPOINT.replace(
              "/upload-template",
              "/templates"
            )}/${templateId}`
          );
          if (templateResponse.data) {
            // Preserve the existing public status and description
            isPublic = templateResponse.data.isPublic;
            templateDesc = templateResponse.data.description || "";
            console.log(`Preserving template status: isPublic=${isPublic}`);
          }
        } catch (error) {
          console.warn(
            "Could not fetch template details, using defaults",
            error
          );
        }
      }

      const apiData = {
        packedData: pendingChanges.packedData,
        previewImage: pendingChanges.previewImage,
        templateName: templateName,
        templateDesc: templateDesc,
        isPublic: isPublic,
        userId,
      };

      console.log(`Syncing template: ${templateName} for user: ${userId}`);

      // Save to database - use PUT for update if we have a template ID
      let response;

      if (templateId) {
        // Update existing template
        try {
          response = await axios.put(
            `${UPLOAD_TEMPLATE_ENDPOINT}/${templateId}`,
            apiData
          );
          console.log(`Updated existing template with ID: ${templateId}`);
        } catch (error) {
          // If the template doesn't exist anymore (404), create a new one
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log(
              `Template with ID ${templateId} not found, creating new template`
            );
            templateId = null; // Reset template ID to create a new one
            localStorage.removeItem(LOCAL_STORAGE_KEYS.TEMPLATE_ID);
          } else {
            // For other errors, rethrow
            throw error;
          }
        }
      }

      // If no template ID or template not found, create a new one
      if (!templateId) {
        response = await axios.post(UPLOAD_TEMPLATE_ENDPOINT, apiData);
        console.log("Created new template");
        console.log("🔍 New template response:", response.data);
        console.log("🔍 Response structure:", {
          data: !!response.data,
          template: !!response.data?.template,
          id: response.data?.template?.id,
          _id: response.data?.template?._id,
          responseId: response.data?.id,
          responseTempId: response.data?._id
        });

        // Store the template ID for future updates
        // Try different possible response structures
        const newTemplateId = response.data?.template?.id || 
                              response.data?.template?._id || 
                              response.data?.id || 
                              response.data?._id;
                              
        if (newTemplateId) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.TEMPLATE_ID, newTemplateId);
          console.log(`Stored new template ID: ${newTemplateId}`);
        } else {
          console.error("❌ Could not find template ID in response:", response.data);
        }
      }
    }

    // Update metadata on success
    const now = new Date();
    await updateSyncMetadata({
      syncStatus: "saved",
      lastSuccessfulSync: now.getTime(),
      retryCount: 0,
      pendingChanges: false,
      lastError: undefined,
    });

    // Clear IndexedDB pending changes
    await db.delete(SYNC_STORE_NAME, "current");

    // Clear local storage after successful save to database
    // but keep the template ID for future updates
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TEMPLATE_DATA);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TEMPLATE_NAME);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_SAVED);

    if (showNotification) {
      toast.dismiss();
      if (isKiosk) {
        toast.success("Kiosk Saved", {
          description: `Last saved at ${now.toLocaleTimeString()}`,
          duration: 2000,
        });
      } else if (isLiveMenu) {
        toast.success("Live Menu Saved", {
          description: `Last saved at ${now.toLocaleTimeString()}`,
          duration: 2000,
        });
      } else {
        toast.success("Design Saved", {
          description: `Last saved at ${now.toLocaleTimeString()}`,
          duration: 2000,
        });
      }
    }

    return now;
  } catch (error) {
    console.error("Error syncing changes to server:", error);

    // Handle error and update metadata
    const errorMessage =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "Unknown error";

    const metadata = await getSyncMetadata();
    const newRetryCount = metadata.retryCount + 1;

    await updateSyncMetadata({
      syncStatus: "error",
      lastError: errorMessage,
      retryCount: newRetryCount,
    });

    if (showNotification) {
      toast.dismiss();
      toast.error("Sync Failed", {
        description: `${errorMessage}. ${
          newRetryCount < MAX_RETRY_ATTEMPTS
            ? "Will retry automatically."
            : "Please try again later."
        }`,
        duration: 4000,
      });
    }

    // Schedule retry if under max attempts
    if (newRetryCount < MAX_RETRY_ATTEMPTS) {
      setTimeout(() => {
        syncChangesToServer({ force: true, showNotification: false });
      }, RETRY_DELAY_MS * newRetryCount); // Exponential backoff
    }

    return null;
  }
};

// Enhanced sync with forced save for critical actions
export const forceSyncBeforeCriticalAction = async (
  actionName: string = "critical action"
): Promise<boolean> => {
  console.log(`Forcing sync before ${actionName}...`);

  try {
    // Try to sync with a timeout
    const syncPromise = syncChangesToServer({
      force: true,
      showNotification: false,
    });

    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("Sync timeout")), FORCED_SYNC_TIMEOUT);
    });

    const result = await Promise.race([syncPromise, timeoutPromise]);

    if (result) {
      console.log(`Successfully synced before ${actionName}`);
      return true;
    }

    // If sync returns null (offline/error), check if we have pending changes
    const hasPending = await hasPendingChanges();
    if (hasPending) {
      console.warn(
        `Could not sync before ${actionName}, but changes are saved locally`
      );
      toast.warning("Sync Warning", {
        description: `Your changes are saved locally but couldn't be synced to the cloud before ${actionName}. They will sync when you're back online.`,
        duration: 5000,
      });
    }

    return !hasPending; // Return true if no pending changes
  } catch (error) {
    console.error(`Error syncing before ${actionName}:`, error);

    // Still check for pending changes
    const hasPending = await hasPendingChanges();
    if (hasPending) {
      toast.error("Sync Failed", {
        description: `Could not sync your changes before ${actionName}. Your work is saved locally and will sync when possible.`,
        duration: 5000,
      });
    }

    return !hasPending;
  }
};

// Initialize sync service
export const initSyncService = (): void => {
  // Listen for online/offline events
  window.addEventListener("online", () => {
    console.log("Device came back online, attempting to sync...");
    // When we come back online, try to sync
    syncChangesToServer({ showNotification: false });
  });

  window.addEventListener("offline", async () => {
    console.log("Device went offline");
    await updateSyncMetadata({ syncStatus: "offline" });
  });

  // Enhanced visibility change handler (critical for mobile and tab switching)
  const handleVisibilityChange = async () => {
    if (document.visibilityState === "hidden") {
      console.log("Page becoming hidden, saving changes...");
      // Force save when page becomes hidden (tab switch, minimize, etc.)
      try {
        const hasPending = await hasPendingChanges();
        if (hasPending) {
          await syncChangesToServer({ force: true, showNotification: false });
        }
      } catch (error) {
        console.error("Error saving on visibility change:", error);
      }
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  // Page hide event (better mobile support than beforeunload)
  const handlePageHide = async () => {
    console.log("Page hide event, saving changes...");
    try {
      const hasPending = await hasPendingChanges();
      if (hasPending) {
        // For pagehide, we need to use sendBeacon or synchronous request
        // as the page might be unloaded immediately
        const designData = localStorage.getItem(
          LOCAL_STORAGE_KEYS.TEMPLATE_DATA
        );
        if (designData) {
          // Use sendBeacon for reliable delivery even if page is closing
          const beaconData = new FormData();
          beaconData.append("data", designData);
          beaconData.append("action", "emergency_save");

          try {
            navigator.sendBeacon("/api/emergency-save", beaconData);
          } catch (e) {
            console.warn("Could not send beacon, trying sync:", e);
            // Fallback to regular sync
            await syncChangesToServer({ force: true, showNotification: false });
          }
        }
      }
    } catch (error) {
      console.error("Error saving on page hide:", error);
    }
  };

  window.addEventListener("pagehide", handlePageHide);

  // Enhanced beforeunload handler with better messaging
  const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
    const syncStatus = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_STATUS);

    // Check for pending changes
    const hasPending = await hasPendingChanges();

    // If we have pending changes or are currently saving, warn the user
    if (hasPending || syncStatus === "saving" || syncStatus === "error") {
      const message =
        "You have unsaved changes that haven't been synced to the cloud. Are you sure you want to leave?";

      // Standard way to show confirmation dialog
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  // Mobile-specific event handlers
  const handleMobileEvents = async () => {
    console.log("Mobile event triggered, saving changes...");
    try {
      const hasPending = await hasPendingChanges();
      if (hasPending) {
        await syncChangesToServer({ force: true, showNotification: false });
      }
    } catch (error) {
      console.error("Error saving on mobile event:", error);
    }
  };

  // Mobile app lifecycle events
  document.addEventListener("resume", handleMobileEvents);
  document.addEventListener("pause", handleMobileEvents);

  // iOS Safari specific events
  window.addEventListener("orientationchange", () => {
    setTimeout(handleMobileEvents, 100); // Small delay for orientation change
  });

  // Focus/blur events for additional coverage
  window.addEventListener("blur", handleMobileEvents);

  // Initialize database
  initDB().catch(console.error);

  // Check initial online status
  updateSyncMetadata({
    syncStatus: isOnline() ? "idle" : "offline",
  }).catch(console.error);

  console.log(
    "Enhanced sync service initialized with comprehensive event handling"
  );
};

// Get current sync status
export const getCurrentSyncStatus = (): SyncStatus => {
  return (
    (localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC_STATUS) as SyncStatus) ||
    "idle"
  );
};

// Check if there are pending changes
export const hasPendingChanges = async (): Promise<boolean> => {
  const metadata = await getSyncMetadata();
  return metadata.pendingChanges;
};

// Subscribe to sync status changes
export const subscribeSyncStatus = (
  callback: (status: SyncMetadata) => void
): (() => void) => {
  const handler = async (event: Event) => {
    const customEvent = event as CustomEvent<SyncMetadata>;
    callback(customEvent.detail);
  };

  window.addEventListener("sync-status-changed", handler);

  // Return unsubscribe function
  return () => {
    window.removeEventListener("sync-status-changed", handler);
  };
};

// Recovery function to check for unsaved changes on startup
export const recoverUnsavedChanges = async (): Promise<void> => {
  try {
    const db = await initDB();
    const pendingChanges = await db.get(SYNC_STORE_NAME, "current");

    if (pendingChanges) {
      // We have unsaved changes, update metadata
      await updateSyncMetadata({
        pendingChanges: true,
        syncStatus: "idle",
      });

      // Try to sync if we're online
      if (isOnline()) {
        await syncChangesToServer({ showNotification: false });
      }
    }
  } catch (error) {
    console.error("Error recovering unsaved changes:", error);
  }
};

// Export a singleton instance
export const SyncService = {
  saveChangesLocally,
  syncChangesToServer,
  forceSyncBeforeCriticalAction,
  initSyncService,
  getCurrentSyncStatus,
  hasPendingChanges,
  subscribeSyncStatus,
  recoverUnsavedChanges,
};

export default SyncService;
