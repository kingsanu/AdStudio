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
import TransparencyIcon from "canva-editor/icons/TransparencyIcon";
import RemoveBackgroundIcon from "canva-editor/icons/RemoveBackgroundIcon";
import SettingDivider from "./components/SettingDivider";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import axios from "axios";
import { REMOVE_BACKGROUND_ENDPOINT } from "canva-editor/utils/constants/api";
import { toast } from "sonner";
// import { Tooltip } from "canva-editor/tooltip";

const CommonSettings = () => {
  const isMobile = useMobileDetect();
  const transparencyButtonRef = useRef<HTMLDivElement>(null);
  const [openTransparencySetting, setOpenTransparencySetting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { selectedLayers, selectedLayerIds } = useSelectedLayers();
  const { actions, activePage, sidebar, isPageLocked } = useEditor((state) => ({
    activePage: state.activePage,
    sidebar: state.sidebar,
    // pageSize: state.pageSize,
    isPageLocked:
      state.pages[state.activePage] &&
      state.pages[state.activePage].layers.ROOT.data.locked,
  }));
  // const [size, setSize] = useState(pageSize);
  // useEffect(() => {
  //   setSize(pageSize);
  // }, [pageSize]);
  const { transparency } = useMemo(() => {
    return Object.entries(selectedLayers).reduce(
      (acc, [, layer]) => {
        if (isRootLayer(layer)) {
          acc.transparency = Math.max(
            acc.transparency,
            typeof layer.data.props.image?.transparency !== "undefined"
              ? layer.data.props.image.transparency
              : 1
          );
        } else {
          acc.transparency = Math.max(
            acc.transparency,
            typeof layer.data.props.transparency !== "undefined"
              ? layer.data.props.transparency
              : 1
          );
        }
        return acc;
      },
      { transparency: 0 }
    );
  }, [selectedLayers]);
  const isLocked = !!selectedLayers.find((l) => l.data.locked);
  const toggleLock = () => {
    if (isLocked) {
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
  // Close transparency settings when selection changes
  useEffect(() => {
    setOpenTransparencySetting(false);
  }, [selectedLayerIds]); // Use the actual array reference instead of JSON.stringify

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
  console.log(selectedLayerIds.length);
  console.log(selectedLayerIds.length);

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
                  onClick={() => setOpenTransparencySetting(true)}
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
                      defaultValue={transparency * 100}
                      onChange={updateTransparency}
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
        )}
        {selectedLayerIds.length > 0 && (
          <>
            <SettingDivider />
            <SettingButton
              css={{ fontSize: 20 }}
              isActive={isLocked}
              onClick={toggleLock}
            >
              {isLocked && <LockIcon />}
              {!isLocked && <LockOpenIcon />}
            </SettingButton>
          </>
        )}
      </div>
      {sidebar === "LAYER_MANAGEMENT" && <LayerSidebar open={true} />}
    </Fragment>
  );
};

export default CommonSettings;
