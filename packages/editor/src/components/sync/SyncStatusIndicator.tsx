import React, { useState, useEffect, useRef } from "react";
import SyncedIcon from "canva-editor/icons/SyncedIcon";
import SyncingIcon from "canva-editor/icons/SyncingIcon";
import { AlertCircle, WifiOff } from "lucide-react";
import { SyncStatus } from "../../services/syncService";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSavedAt: Date | null;
  isUserTyping?: boolean;
  onClick?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  lastSavedAt,
  isUserTyping = false,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<SyncStatus>(status);

  // Use a ref to track the last time we updated the status
  const lastStatusUpdateRef = useRef<number>(Date.now());

  // Only update the displayed status if it's been stable for a while
  // This prevents flickering between states
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastStatusUpdateRef.current;

    // If status is 'saving', update immediately to show activity
    if (status === "saving") {
      setDisplayStatus(status);
      lastStatusUpdateRef.current = now;
      return;
    }

    // For other status changes, only update if the status has been stable
    // for at least 2 seconds or if it's an important status (error/offline)
    if (
      timeSinceLastUpdate > 2000 ||
      status === "error" ||
      status === "offline"
    ) {
      setDisplayStatus(status);
      lastStatusUpdateRef.current = now;
    }
  }, [status]);

  // Auto-hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  // Get status text
  const getStatusText = () => {
    // If user is typing, show a special message
    if (isUserTyping) {
      return "Changes being made...";
    }

    switch (displayStatus) {
      case "saving":
        return "Saving changes...";
      case "saved":
        return lastSavedAt
          ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
          : "All changes saved";
      case "error":
        return "Failed to save changes";
      case "offline":
        return "You are offline. Changes will be saved when you reconnect.";
      default:
        return "All changes saved";
    }
  };

  // Get icon based on status
  const getIcon = () => {
    // If user is typing, show the synced icon (no animation)
    if (isUserTyping) {
      return <SyncedIcon />;
    }

    switch (displayStatus) {
      case "saving":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <SyncingIcon />
          </motion.div>
        );
      case "saved":
        return <SyncedIcon />;
      case "error":
        return <AlertCircle size={18} className="text-red-500" />;
      case "offline":
        return <WifiOff size={18} className="text-yellow-500" />;
      default:
        return <SyncedIcon />;
    }
  };

  return (
    <Tooltip content={getStatusText()} open={showTooltip}>
      <div
        css={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: onClick ? "pointer" : "default",
          padding: "4px",
          borderRadius: "4px",
          transition: "background-color 0.2s",
          ":hover": {
            backgroundColor: onClick ? "rgba(255, 255, 255, 0.1)" : undefined,
          },
        }}
        onClick={() => {
          setShowTooltip(true);
          if (onClick) onClick();
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isUserTyping ? "typing" : displayStatus}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Tooltip>
  );
};

export default SyncStatusIndicator;
