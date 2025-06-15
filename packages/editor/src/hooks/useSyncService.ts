import { useState, useEffect, useCallback, useRef } from "react";
import SyncService, {
  SyncMetadata,
  SyncStatus,
  SyncOptions,
  DesignData,
} from "../services/syncService";

export interface UseSyncServiceProps {
  autoSaveInterval?: number; // in milliseconds
  syncDebounceDelay?: number; // in milliseconds
  getDesignData: () => DesignData;
  getDesignName: () => string;
  getPageContentElement: () => HTMLElement | null;
}

export interface UseSyncServiceResult {
  syncStatus: SyncStatus;
  lastSavedAt: Date | null;
  isSyncing: boolean;
  hasError: boolean;
  isOffline: boolean;
  hasPendingChanges: boolean;
  isUserTyping: boolean;
  saveNow: (options?: SyncOptions) => Promise<void>;
  forceSyncBeforeCriticalAction: (actionName?: string) => Promise<boolean>;
  metadata: SyncMetadata | null;
}

export const useSyncService = ({
  autoSaveInterval = 2000, // Local save interval (2 seconds)
  syncDebounceDelay = 3000, // Wait 3 seconds after changes before showing syncing status
  getDesignData,
  getDesignName,
  getPageContentElement,
}: UseSyncServiceProps): UseSyncServiceResult => {
  const [metadata, setMetadata] = useState<SyncMetadata | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
  const lastSaveAttemptRef = useRef<number>(0);
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serverSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sync service
  useEffect(() => {
    SyncService.initSyncService();

    // Recover any unsaved changes
    SyncService.recoverUnsavedChanges().catch(console.error);

    // Subscribe to sync status changes
    const unsubscribe = SyncService.subscribeSyncStatus((newMetadata) => {
      setMetadata(newMetadata);

      if (
        newMetadata.syncStatus === "saved" &&
        newMetadata.lastSuccessfulSync
      ) {
        setLastSavedAt(new Date(newMetadata.lastSuccessfulSync));
      }
    });

    return () => {
      unsubscribe();

      // Clear server sync interval
      if (serverSyncIntervalRef.current) {
        clearInterval(serverSyncIntervalRef.current);
      }
    };
  }, []);

  // Set up auto-save to local storage with proper debouncing
  useEffect(() => {
    let localSaveTimeout: NodeJS.Timeout;
    let lastSavedData: string = "";

    const handleLocalSave = async () => {
      try {
        // Get current design data
        const currentDesignData = getDesignData();
        const currentDesignString = JSON.stringify(currentDesignData);

        // Only save if data has actually changed
        if (currentDesignString === lastSavedData) {
          console.log("No changes detected, skipping save");
          return;
        }

        // Don't save too frequently
        const now = Date.now();
        if (now - lastSaveAttemptRef.current < 2000) {
          return;
        }

        console.log("Saving changes locally...");
        lastSaveAttemptRef.current = now;
        lastSavedData = currentDesignString;

        // Save changes locally
        await SyncService.saveChangesLocally(
          currentDesignData,
          getDesignName(),
          getPageContentElement()
        );
      } catch (error) {
        console.error("Error in auto-save:", error);
      }
    };

    // Set up debounced auto-save with a longer delay
    const debouncedSave = () => {
      // Mark that the user is currently making changes
      setIsUserTyping(true);

      // Clear any existing timeouts
      clearTimeout(localSaveTimeout);
      clearTimeout(userActivityTimeoutRef.current!);

      // Set a timeout to save changes after the specified delay
      localSaveTimeout = setTimeout(handleLocalSave, autoSaveInterval);

      // Set a timeout to mark that the user has stopped typing after the debounce delay
      userActivityTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false);
      }, syncDebounceDelay);
    };

    // Listen for changes that should trigger a save
    window.addEventListener("design-changed", debouncedSave);

    // Initial data capture (don't save immediately)
    setTimeout(() => {
      try {
        lastSavedData = JSON.stringify(getDesignData());
      } catch (error) {
        console.error("Error capturing initial design data:", error);
      }
    }, 1000);
    return () => {
      window.removeEventListener("design-changed", debouncedSave);
      clearTimeout(localSaveTimeout);
      clearTimeout(userActivityTimeoutRef.current!);
    };
  }, [
    autoSaveInterval,
    syncDebounceDelay,
    getDesignData,
    getDesignName,
    getPageContentElement,
  ]);
  // Set up server sync interval (every 15 seconds for better reliability)
  useEffect(() => {
    // Sync to server more frequently and only when there are changes
    serverSyncIntervalRef.current = setInterval(async () => {
      // Only sync if there are pending changes
      const hasPending = await SyncService.hasPendingChanges();
      if (hasPending) {
        console.log("Syncing pending changes to server...");
        SyncService.syncChangesToServer({ showNotification: false }).then(
          (savedAt) => {
            if (savedAt) {
              setLastSavedAt(savedAt);
            }
          }
        );
      } else {
        console.log("No pending changes to sync");
      }
    }, 15000); // Reduced from 60 seconds to 15 seconds for better reliability

    return () => {
      if (serverSyncIntervalRef.current) {
        clearInterval(serverSyncIntervalRef.current);
      }
    };
  }, []);

  // Function to manually trigger a save
  const saveNow = useCallback(
    async (options?: SyncOptions) => {
      try {
        // First save locally
        await SyncService.saveChangesLocally(
          getDesignData(),
          getDesignName(),
          getPageContentElement()
        );

        // Then sync to server
        const savedAt = await SyncService.syncChangesToServer({
          force: true,
          showNotification: true,
          ...options,
        });

        if (savedAt) {
          setLastSavedAt(savedAt);
        }
      } catch (error) {
        console.error("Error in manual save:", error);
      }
    },
    [getDesignData, getDesignName, getPageContentElement]
  );
  // Function to force sync before critical actions
  const forceSyncBeforeCriticalAction = useCallback((actionName?: string) => {
    return SyncService.forceSyncBeforeCriticalAction(actionName);
  }, []);

  // Derived state
  const syncStatus = metadata?.syncStatus || "idle";

  // Only show syncing status if the user has stopped typing and we're actually saving
  const isSyncing = !isUserTyping && syncStatus === "saving";

  // Always show error and offline states immediately
  const hasError = syncStatus === "error";
  const isOffline = syncStatus === "offline";
  const hasPendingChanges = metadata?.pendingChanges || false;

  // For UI purposes, we want to show a different status when the user is typing
  const displayStatus = isUserTyping ? "idle" : syncStatus;
  return {
    syncStatus: displayStatus, // Use the display status for UI
    lastSavedAt,
    isSyncing,
    hasError,
    isOffline,
    hasPendingChanges,
    isUserTyping,
    saveNow,
    forceSyncBeforeCriticalAction,
    metadata,
  };
};

export default useSyncService;
