import { useSelectedLayers, useEditor } from "canva-editor/hooks";
import { boundingRect } from "canva-editor/utils/2d/boundingRect";
import { isGroupLayer } from "canva-editor/utils/layer/layers";
import React, { Fragment, useContext, useMemo, useRef } from "react";
import { duplicate } from "canva-editor/utils/menu/actions/duplicate";
import { PageContext } from "../core/PageContext";
import DuplicateIcon from "canva-editor/icons/DuplicateIcon";
import TrashIcon from "canva-editor/icons/TrashIcon";
import MoreHorizIcon from "canva-editor/icons/MoreHorizIcon";
import LockIcon from "canva-editor/icons/LockIcon";
import AdminLockIcon from "canva-editor/icons/AdminLockIcon";
import AdminUnlockIcon from "canva-editor/icons/AdminUnlockIcon";
import { toast } from "sonner";
// Import Shadcn tooltip component
import { Tooltip } from "@/components/ui/tooltip";

const Toolbar: React.FC = () => {
  const { pageIndex } = useContext(PageContext);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { selectedLayerIds, selectedLayers } = useSelectedLayers();
  const {
    actions,
    state,
    isDragging,
    isResizing,
    isRotating,
    controlBox,
    pageSize,
    isOpenMenu,
    scale,
    isPageLocked,
    isAdmin,
  } = useEditor((state) => ({
    isGroup: state.selectedLayers[state.activePage].length > 1,
    isDragging: state.dragData.status,
    isResizing: state.resizeData.status,
    isRotating: state.rotateData.status,
    controlBox: state.controlBox,
    pageSize: state.pageSize,
    isPageLocked: state.pages[state.activePage].layers.ROOT.data.locked,
    isOpenMenu: !!state.openMenu,
    scale: state.scale,
    isAdmin: state.isAdmin,
  }));
  const isLocked = selectedLayers.find((i) => i.data.locked);
  const hasLockHidden = selectedLayers.some((i) => i.data.lockHidden === true);

  const boundingBoxRect = useMemo(() => {
    if (!controlBox) {
      return {
        x: 0,
        y: 80,
        width: pageSize.width,
        height: pageSize.height,
      };
    }
    // Calculate the bounding rectangle for the control box
    const rect = boundingRect(
      controlBox.boxSize,
      controlBox.position,
      controlBox.rotate
    );

    return rect;
  }, [controlBox, pageSize.width, pageSize.height]);
  const handleDuplicate = () => {
    duplicate(state, { pageIndex, layerIds: selectedLayerIds, actions });
  };
  const showContextMenu = () => {
    if (isOpenMenu) {
      actions.hideContextMenu();
    } else {
      const rect = toolbarRef.current?.getBoundingClientRect() as DOMRect;
      actions.showContextMenu({
        clientX: rect.right - 42,
        clientY: rect.bottom + 4,
      });
    }
  };

  const handleUngroup = () => {
    if (selectedLayerIds.length === 1) {
      actions.ungroup(selectedLayerIds[0]);
    }
  };
  const handleGroup = () => {
    actions.group(selectedLayerIds);
  };

  // Don't render toolbar during drag/resize/rotate operations
  if (
    isDragging ||
    isResizing ||
    isRotating ||
    !controlBox ||
    selectedLayerIds.length === 0
  ) {
    return null;
  }
  const containerGroupLayer = !!selectedLayers.find((l) => isGroupLayer(l));
  // Calculate toolbar position
  // Use boundingBoxRect if available, otherwise use fallback position
  const toolbarLeft =
    boundingBoxRect.x !== undefined
      ? (boundingBoxRect.x + boundingBoxRect.width / 2) * scale
      : (pageSize.width * scale) / 2; // Center of page as fallback

  const toolbarTop =
    boundingBoxRect.y !== undefined ? boundingBoxRect.y * scale - 60 : 20; // Top of page as fallback

  return (
    <div
      ref={toolbarRef}
      css={{
        position: "absolute",
        left: toolbarLeft,
        top: toolbarTop,
        transform: "translateX(-50%)",
        zIndex: 1000, // Very high z-index to ensure it's above everything
        pointerEvents: "auto", // Make sure toolbar can receive mouse events
      }}
    >
      <div
        css={{
          height: 40,
          borderRadius: 4,
          padding: "0 4px",
          display: "inline-flex",
          alignItems: "center",
          background: "#fff",
          overflow: "hidden",
          pointerEvents: "auto",
          color: "#0d1216",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          css={{
            alignItems: "center",
            display: "flex",
            whiteSpace: "nowrap",
          }}
        >
          {/* Always show toolbar buttons when layers are selected */}
          {!isPageLocked && !isLocked && !hasLockHidden && (
            <Fragment>
              {selectedLayerIds.length > 1 && (
                <div
                  css={{
                    lineHeight: "32px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "0 8px",
                    fontWeight: 700,
                    ":hover": {
                      backgroundColor: "rgba(64,87,109,.07)",
                    },
                  }}
                  onClick={handleGroup}
                >
                  Group
                </div>
              )}
              {containerGroupLayer && (
                <div
                  css={{
                    lineHeight: "32px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "0 8px",
                    fontWeight: 700,
                    ":hover": {
                      backgroundColor: "rgba(64,87,109,.07)",
                    },
                  }}
                  onClick={handleUngroup}
                >
                  Ungroup
                </div>
              )}
              <Tooltip content="Duplicate" delayDuration={300}>
                <div
                  css={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 24,
                    ":hover": {
                      backgroundColor: "rgba(64,87,109,.07)",
                    },
                  }}
                  onClick={handleDuplicate}
                >
                  <DuplicateIcon />
                </div>
              </Tooltip>

              <Tooltip content="Delete" delayDuration={300}>
                <div
                  css={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: hasLockHidden ? "not-allowed" : "pointer",
                    fontSize: 24,
                    opacity: hasLockHidden ? 0.5 : 1,
                    ":hover": {
                      backgroundColor: hasLockHidden
                        ? undefined
                        : "rgba(64,87,109,.07)",
                    },
                  }}
                  onClick={() =>
                    !hasLockHidden &&
                    actions.deleteLayer(pageIndex, selectedLayerIds)
                  }
                >
                  <TrashIcon />
                </div>
              </Tooltip>

              <Tooltip content="More Options" delayDuration={300}>
                <div
                  css={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 24,
                    ":hover": {
                      backgroundColor: "rgba(64,87,109,.07)",
                    },
                  }}
                  onClick={showContextMenu}
                >
                  <MoreHorizIcon />
                </div>
              </Tooltip>
            </Fragment>
          )}{" "}
          {/* Regular unlock button - only for normal locked layers */}
          {isLocked && !hasLockHidden && (
            <Tooltip content="Unlock" delayDuration={300}>
              <div
                css={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: isPageLocked ? "not-allowed" : "pointer",
                  fontSize: 24,
                  color: isPageLocked ? "rgba(36,49,61,.4)" : undefined,
                  ":hover": {
                    backgroundColor: isPageLocked
                      ? undefined
                      : "rgba(64,87,109,.07)",
                  },
                }}
                onClick={() => {
                  if (!isPageLocked) {
                    actions.unlock(pageIndex, selectedLayerIds);
                  }
                }}
              >
                <LockIcon />
              </div>
            </Tooltip>
          )}
          {/* Admin-locked indicator for non-admins - shows they can't unlock */}
          {hasLockHidden && !isAdmin && (
            <Tooltip
              content="This layer can only be unlocked by an admin"
              delayDuration={300}
            >
              <div
                css={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "not-allowed",
                  fontSize: 20,
                  color: "#FF6B35",
                  opacity: 0.7,
                }}
                onClick={() => {
                  toast.error("Access denied", {
                    description:
                      "This layer can only be unlocked by an admin user.",
                  });
                }}
              >
                <AdminLockIcon />
              </div>
            </Tooltip>
          )}
          {/* Admin-only lock controls - only visible to admins */}
          {isAdmin && (
            <>
              {/* Admin Lock Button - for setting lockHidden */}
              {!hasLockHidden && !isPageLocked && (
                <Tooltip
                  content="Admin Lock (Coupon Protected)"
                  delayDuration={300}
                >
                  <div
                    css={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      fontSize: 20,
                      color: "#FF6B35",
                      ":hover": {
                        backgroundColor: "rgba(255, 107, 53, 0.1)",
                      },
                    }}
                    onClick={() => {
                      actions.adminLock(pageIndex, selectedLayerIds);
                      toast.success("Admin Lock Applied", {
                        description:
                          "Layer is now protected for coupon editing.",
                      });
                    }}
                  >
                    <AdminLockIcon />
                  </div>
                </Tooltip>
              )}

              {/* Admin Unlock Button - for removing lockHidden */}
              {hasLockHidden && (
                <Tooltip content="Remove Admin Lock" delayDuration={300}>
                  <div
                    css={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      fontSize: 20,
                      color: "#10B981",
                      ":hover": {
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                      },
                    }}
                    onClick={() => {
                      actions.adminUnlock(pageIndex, selectedLayerIds);
                      toast.success("Admin Lock Removed", {
                        description: "Layer is no longer protected.",
                      });
                    }}
                  >
                    <AdminUnlockIcon />
                  </div>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MemoizedToolbar = React.memo(Toolbar);
MemoizedToolbar.displayName = "Toolbar";

export default MemoizedToolbar;
