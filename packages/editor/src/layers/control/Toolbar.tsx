import { useSelectedLayers, useEditor } from "canva-editor/hooks";
import { boundingRect } from "canva-editor/utils/2d/boundingRect";
import { isGroupLayer, isImageLayer } from "canva-editor/utils/layer/layers";
import React, { Fragment, useContext, useMemo, useRef, useState } from "react";
import { duplicate } from "canva-editor/utils/menu/actions/duplicate";
import { PageContext } from "../core/PageContext";
import DuplicateIcon from "canva-editor/icons/DuplicateIcon";
import TrashIcon from "canva-editor/icons/TrashIcon";
import MoreHorizIcon from "canva-editor/icons/MoreHorizIcon";
import LockIcon from "canva-editor/icons/LockIcon";
import RemoveBackgroundIcon from "canva-editor/icons/RemoveBackgroundIcon";
import axios from "axios";
import { REMOVE_BACKGROUND_ENDPOINT } from "canva-editor/utils/constants/api";
import { toast } from "sonner";
// Import Shadcn tooltip component
import { Tooltip } from "@/components/ui/tooltip";

const Toolbar: React.FC = () => {
  const { pageIndex } = useContext(PageContext);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { selectedLayerIds, selectedLayers } = useSelectedLayers();
  const [isProcessing, setIsProcessing] = useState(false);
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
  }));
  const isLocked = selectedLayers.find((i) => i.data.locked);
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

  const handleRemoveBackground = async () => {
    if (selectedLayerIds.length !== 1) return;

    const selectedLayer = selectedLayers[0];
    if (!isImageLayer(selectedLayer)) return;

    try {
      setIsProcessing(true);

      const imageUrl = selectedLayer.data.props.image.url;
      const layerId = selectedLayerIds[0];

      // Show a more detailed loading toast
      toast.loading("Processing image...", {
        description:
          "Removing background using AI. This may take a few seconds.",
        duration: 60000, // Long duration as we'll dismiss it manually
      });

      const response = await axios.post(REMOVE_BACKGROUND_ENDPOINT, {
        imageUrl,
      });

      if (response.data && response.data.processedImage) {
        // Get the processed image URL
        const processedImageUrl = response.data.processedImage;

        // Create a new image element to get dimensions
        const img = new Image();
        img.onload = () => {
          actions.history.merge().setProp(pageIndex, layerId, {
            image: {
              ...selectedLayer.data.props.image,
              url: processedImageUrl,
              thumb: processedImageUrl,
            },
          });

          toast.dismiss();
          toast.success("Background removed", {
            description: "The image has been processed successfully.",
          });
        };

        img.onerror = () => {
          toast.dismiss();
          toast.error("Error loading processed image", {
            description: "The image was processed but could not be loaded.",
          });
        };

        img.src = processedImageUrl;
      }
    } catch (error) {
      console.error("Error removing background:", error);
      toast.dismiss();
      toast.error("Error removing background", {
        description:
          "There was an error processing your image. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
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
          {!isPageLocked && !isLocked && (
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
                    cursor: "pointer",
                    fontSize: 24,
                    ":hover": {
                      backgroundColor: "rgba(64,87,109,.07)",
                    },
                  }}
                  onClick={() =>
                    actions.deleteLayer(pageIndex, selectedLayerIds)
                  }
                >
                  <TrashIcon />
                </div>
              </Tooltip>

              {selectedLayerIds.length === 1 &&
                isImageLayer(selectedLayers[0]) && (
                  <Tooltip content="Remove Background" delayDuration={300}>
                    <div
                      css={{
                        width: 32,
                        height: 32,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        fontSize: 24,
                        opacity: isProcessing ? 0.5 : 1,
                        ":hover": {
                          backgroundColor: isProcessing
                            ? undefined
                            : "rgba(64,87,109,.07)",
                        },
                      }}
                      onClick={
                        isProcessing ? undefined : handleRemoveBackground
                      }
                    >
                      <RemoveBackgroundIcon />
                    </div>
                  </Tooltip>
                )}

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
          )}
          {(isLocked || isPageLocked) && (
            <Tooltip content="Unlock" delayDuration={300}>
              <div
                css={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: 24,
                  color: isPageLocked ? "rgba(36,49,61,.4)" : undefined,
                  ":hover": {
                    backgroundColor: isPageLocked
                      ? undefined
                      : "rgba(64,87,109,.07)",
                  },
                }}
                onClick={() => {
                  actions.unlock(pageIndex, selectedLayerIds);
                }}
              >
                <LockIcon />
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

const MemoizedToolbar = React.memo(Toolbar);
MemoizedToolbar.displayName = "Toolbar";

export default MemoizedToolbar;
