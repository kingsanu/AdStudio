/* eslint-disable @typescript-eslint/no-unused-vars */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import LayerSidebar from "./sidebar/LayerSidebar";
import SettingButton from "./SettingButton";
import Popover from "canva-editor/components/popover/Popover";
import Slider from "canva-editor/components/slider/Slider";
import { useSelectedLayers, useEditor } from "canva-editor/hooks";
import { RootLayerProps } from "canva-editor/layers/RootLayer";
import { isRootLayer, isImageLayer } from "../layer/layers";
import LockIcon from "canva-editor/icons/LockIcon";
import LockOpenIcon from "canva-editor/icons/LockOpenIcon";
import AdminLockIcon from "canva-editor/icons/AdminLockIcon";
import AdminUnlockIcon from "canva-editor/icons/AdminUnlockIcon";
import TransparencyIcon from "canva-editor/icons/TransparencyIcon";
import RemoveBackgroundIcon from "canva-editor/icons/RemoveBackgroundIcon";
import BlurIcon from "canva-editor/icons/BlurIcon";
import BackdropBlurIcon from "canva-editor/icons/BackdropBlurIcon";
import SettingDivider from "./components/SettingDivider";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import axios from "axios";
import { REMOVE_BACKGROUND_ENDPOINT } from "canva-editor/utils/constants/api";
import { toast } from "sonner";
// import { Tooltip } from "canva-editor/tooltip";

const CommonSettings = () => {
  const isMobile = useMobileDetect();
  const transparencyButtonRef = useRef<HTMLDivElement>(null);
  const blurButtonRef = useRef<HTMLDivElement>(null);
  const backdropBlurButtonRef = useRef<HTMLDivElement>(null);
  const [openTransparencySetting, setOpenTransparencySetting] = useState(false);
  const [openBlurSetting, setOpenBlurSetting] = useState(false);
  const [openBackdropBlurSetting, setOpenBackdropBlurSetting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { selectedLayers, selectedLayerIds } = useSelectedLayers();
  const { actions, activePage, sidebar, isPageLocked, isAdmin } = useEditor(
    (state) => ({
      activePage: state.activePage,
      sidebar: state.sidebar,
      // pageSize: state.pageSize,
      isPageLocked:
        state.pages[state.activePage] &&
        state.pages[state.activePage].layers.ROOT.data.locked,
      isAdmin: state.isAdmin,
    })
  );
  // const [size, setSize] = useState(pageSize);
  // useEffect(() => {
  //   setSize(pageSize);
  // }, [pageSize]);
  const { transparency, blur, backdropBlur } = useMemo(() => {
    if (selectedLayers.length === 0) {
      return { transparency: 1, blur: 0, backdropBlur: 0 };
    }

    // For single layer selection, get the actual values
    if (selectedLayers.length === 1) {
      const layer = selectedLayers[0];
      if (isRootLayer(layer)) {
        return {
          transparency:
            typeof layer.data.props.image?.transparency !== "undefined"
              ? layer.data.props.image.transparency
              : 1,
          blur: layer.data.props.blur || 0,
          backdropBlur: layer.data.props.backdropBlur || 0,
        };
      } else {
        return {
          transparency:
            typeof layer.data.props.transparency !== "undefined"
              ? layer.data.props.transparency
              : 1,
          blur: layer.data.props.blur || 0,
          backdropBlur: layer.data.props.backdropBlur || 0,
        };
      }
    }

    // For multiple layers, find the minimum values
    return selectedLayers.reduce(
      (acc, layer) => {
        let layerTransparency, layerBlur, layerBackdropBlur;
        if (isRootLayer(layer)) {
          layerTransparency =
            typeof layer.data.props.image?.transparency !== "undefined"
              ? layer.data.props.image.transparency
              : 1;
          layerBlur = layer.data.props.blur || 0;
          layerBackdropBlur = layer.data.props.backdropBlur || 0;
        } else {
          layerTransparency =
            typeof layer.data.props.transparency !== "undefined"
              ? layer.data.props.transparency
              : 1;
          layerBlur = layer.data.props.blur || 0;
          layerBackdropBlur = layer.data.props.backdropBlur || 0;
        }

        acc.transparency = Math.min(acc.transparency, layerTransparency);
        acc.blur = Math.min(acc.blur, layerBlur);
        acc.backdropBlur = Math.min(acc.backdropBlur, layerBackdropBlur);
        return acc;
      },
      { transparency: 1, blur: 0, backdropBlur: 0 }
    );
  }, [selectedLayers]);
  const isLocked = !!selectedLayers.find((l) => l.data.locked);
  const hasLockHidden = !!selectedLayers.find((l) => l.data.lockHidden);
  const toggleLock = () => {
    if (isLocked) {
      // Check if trying to unlock admin-only layers
      if (hasLockHidden && !isAdmin) {
        toast.error("Access denied", {
          description: "This layer can only be unlocked by an admin user.",
        });
        return;
      }
      actions.unlock(activePage, selectedLayerIds);
    } else {
      actions.lock(activePage, selectedLayerIds);
    }
  };
  const updateTransparency = (transparency: number) => {
    selectedLayerIds.forEach((layerId) => {
      if (layerId === "ROOT") {
        actions.history
          .throttle(2000)
          .setProp<RootLayerProps>(activePage, layerId, {
            image: {
              transparency: transparency / 100,
            },
          });
      } else {
        actions.history.throttle(2000).setProp(activePage, layerId, {
          transparency: transparency / 100,
        });
      }
    });
  };

  const updateBlur = (blurValue: number) => {
    selectedLayerIds.forEach((layerId) => {
      actions.history.throttle(2000).setProp(activePage, layerId, {
        blur: blurValue,
      });
    });
  };

  const updateBackdropBlur = (backdropBlurValue: number) => {
    selectedLayerIds.forEach((layerId) => {
      actions.history.throttle(2000).setProp(activePage, layerId, {
        backdropBlur: backdropBlurValue,
      });
    });
  };

  // Close transparency settings when selection changes
  // useEffect(() => {
  //   setOpenTransparencySetting(false);
  // }, [selectedLayerIds]); // Use the actual array reference instead of JSON.stringify

  const handleRemoveBackground = async () => {
    if (selectedLayerIds.length !== 1) return;

    const selectedLayer = selectedLayers[0];
    if (!isImageLayer(selectedLayer)) return;

    try {
      setIsProcessing(true);
      toast.loading("Removing background...", {
        description: "Please wait while we process your image.",
      });

      const imageUrl = selectedLayer.data.props.image.url;
      const layerId = selectedLayerIds[0];

      // Show a more detailed loading toast
      toast.dismiss();
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
          // Replace the existing image with the processed one
          // We keep the same position, size and rotation, just update the image URL
          actions.history.merge().setProp(activePage, layerId, {
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

  return (
    <Fragment>
      <div
        css={{
          display: "grid",
          alignItems: "center",
          gridAutoFlow: "column",
          gridGap: 8,
        }}
      >
        <SettingButton
          css={{ minWidth: 75 }}
          onClick={() => {
            actions.setSidebar("LAYER_MANAGEMENT");
          }}
        >
          <span css={{ padding: "0 4px" }}>Position</span>
        </SettingButton>
        {selectedLayerIds.length > 0 && !isLocked && !isPageLocked && (
          <Fragment>
            {(!isRootLayer(selectedLayers[0]) ||
              (isRootLayer(selectedLayers[0]) &&
                selectedLayers[0].data.props.image)) && (
              <Fragment>
                <SettingDivider />
                <SettingButton
                  ref={transparencyButtonRef}
                  css={{ fontSize: 20, minWidth: 30 }}
                  onClick={() => {
                    console.log("tra");
                    setOpenTransparencySetting(true);
                  }}
                >
                  <TransparencyIcon />
                </SettingButton>
                <Popover
                  open={openTransparencySetting}
                  anchorEl={transparencyButtonRef.current}
                  placement={isMobile ? "top-end" : "bottom-end"}
                  onClose={() => setOpenTransparencySetting(false)}
                  offsets={{
                    "bottom-end": { x: 0, y: 8 },
                  }}
                >
                  <div css={{ padding: 16 }}>
                    <Slider
                      label={"Transparency"}
                      value={transparency * 100}
                      onChange={updateTransparency}
                    />
                  </div>
                </Popover>
              </Fragment>
            )}

            {/* Blur Controls */}
            {(!isRootLayer(selectedLayers[0]) ||
              (isRootLayer(selectedLayers[0]) &&
                selectedLayers[0].data.props.image)) && (
              <Fragment>
                <SettingDivider />
                <SettingButton
                  ref={blurButtonRef}
                  css={{ fontSize: 20, minWidth: 30 }}
                  onClick={() => {
                    setOpenBlurSetting(true);
                  }}
                >
                  <BlurIcon />
                </SettingButton>
                <Popover
                  open={openBlurSetting}
                  anchorEl={blurButtonRef.current}
                  placement={isMobile ? "top-end" : "bottom-end"}
                  onClose={() => setOpenBlurSetting(false)}
                  offsets={{
                    "bottom-end": { x: 0, y: 8 },
                  }}
                >
                  <div css={{ padding: 16 }}>
                    <Slider
                      label={"Blur"}
                      value={blur}
                      max={20}
                      min={0}
                      onChange={updateBlur}
                    />
                  </div>
                </Popover>

                <SettingDivider />
                <SettingButton
                  ref={backdropBlurButtonRef}
                  css={{ fontSize: 20, minWidth: 30 }}
                  onClick={() => {
                    setOpenBackdropBlurSetting(true);
                  }}
                >
                  <BackdropBlurIcon />
                </SettingButton>
                <Popover
                  open={openBackdropBlurSetting}
                  anchorEl={backdropBlurButtonRef.current}
                  placement={isMobile ? "top-end" : "bottom-end"}
                  onClose={() => setOpenBackdropBlurSetting(false)}
                  offsets={{
                    "bottom-end": { x: 0, y: 8 },
                  }}
                >
                  <div css={{ padding: 16 }}>
                    <Slider
                      label={"Backdrop Blur"}
                      value={backdropBlur}
                      max={20}
                      min={0}
                      onChange={updateBackdropBlur}
                    />
                  </div>
                </Popover>
              </Fragment>
            )}

            {selectedLayerIds.length === 1 &&
              isImageLayer(selectedLayers[0]) && (
                <Fragment>
                  <SettingDivider />

                  <SettingButton
                    css={{ fontSize: 20, minWidth: 30 }}
                    onClick={isProcessing ? undefined : handleRemoveBackground}
                    disabled={isProcessing}
                  >
                    <div
                      css={{
                        opacity: isProcessing ? 0.5 : 1,
                      }}
                    >
                      <RemoveBackgroundIcon />
                    </div>
                  </SettingButton>
                </Fragment>
              )}
          </Fragment>
        )}{" "}
        {selectedLayerIds.length > 0 && (
          <>
            <SettingDivider />

            {/* Regular lock controls - hidden if layer has lockHidden */}
            {!hasLockHidden && (
              <SettingButton
                css={{ fontSize: 20 }}
                isActive={isLocked}
                onClick={toggleLock}
              >
                {isLocked && <LockIcon />}
                {!isLocked && <LockOpenIcon />}
              </SettingButton>
            )}

            {/* Admin lock controls - only visible to admins */}
            {isAdmin && (
              <>
                {/* Admin Lock Button */}
                {!hasLockHidden && (
                  <SettingButton
                    css={{
                      fontSize: 20,
                      color: "#FF6B35",
                      ":hover": {
                        backgroundColor: "rgba(255, 107, 53, 0.1)",
                      },
                    }}
                    onClick={() => {
                      actions.adminLock(activePage, selectedLayerIds);
                      toast.success("Admin Lock Applied", {
                        description:
                          "Layer is now protected for coupon editing.",
                      });
                    }}
                    title="Admin Lock (Coupon Protected)"
                  >
                    <AdminLockIcon />
                  </SettingButton>
                )}

                {/* Admin Unlock Button */}
                {hasLockHidden && (
                  <SettingButton
                    css={{
                      fontSize: 20,
                      color: "#10B981",
                      ":hover": {
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                      },
                    }}
                    onClick={() => {
                      actions.adminUnlock(activePage, selectedLayerIds);
                      toast.success("Admin Lock Removed", {
                        description: "Layer is no longer protected.",
                      });
                    }}
                    title="Remove Admin Lock"
                  >
                    <AdminUnlockIcon />
                  </SettingButton>
                )}
              </>
            )}

            {/* Show info for non-admin users when lockHidden layer is selected */}
            {hasLockHidden && !isAdmin && (
              <SettingButton
                css={{
                  fontSize: 20,
                  color: "rgba(36,49,61,.4)",
                  cursor: "not-allowed",
                }}
                onClick={() => {
                  toast.error("Access denied", {
                    description:
                      "This layer can only be unlocked by an admin user.",
                  });
                }}
                title="This layer can only be unlocked by an admin"
              >
                <LockIcon />
              </SettingButton>
            )}
          </>
        )}
      </div>
      {sidebar === "LAYER_MANAGEMENT" && <LayerSidebar open={true} />}
    </Fragment>
  );
};

export default CommonSettings;
