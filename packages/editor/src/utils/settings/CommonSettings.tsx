/* eslint-disable @typescript-eslint/no-unused-vars */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import LayerSidebar from "./sidebar/LayerSidebar";
import ImageEffectSidebar from "./sidebar/ImageEffectSidebar";
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
import SettingDivider from "./components/SettingDivider";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import { toast } from "sonner";
// import { Tooltip } from "canva-editor/tooltip";

const CommonSettings = () => {
  const isMobile = useMobileDetect();
  const transparencyButtonRef = useRef<HTMLDivElement>(null);
  const [openTransparencySetting, setOpenTransparencySetting] = useState(false);
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
  );  // const [size, setSize] = useState(pageSize);
  // useEffect(() => {
  //   setSize(pageSize);
  // }, [pageSize]);

  const { transparency } = useMemo(() => {
    if (selectedLayers.length === 0) {
      return { transparency: 1 };
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
        };
      } else {
        return {
          transparency:
            typeof layer.data.props.transparency !== "undefined"
              ? layer.data.props.transparency
              : 1,
        };
      }
    }

    // For multiple layers, find the minimum values
    return selectedLayers.reduce(
      (acc, layer) => {
        let layerTransparency;
        if (isRootLayer(layer)) {
          layerTransparency =
            typeof layer.data.props.image?.transparency !== "undefined"
              ? layer.data.props.image.transparency
              : 1;
        } else {
          layerTransparency =
            typeof layer.data.props.transparency !== "undefined"
              ? layer.data.props.transparency
              : 1;
        }

        acc.transparency = Math.min(acc.transparency, layerTransparency);
        return acc;
      },
      { transparency: 1 }
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
    });  };

  // Close transparency settings when selection changes
  // useEffect(() => {
  //   setOpenTransparencySetting(false);
  // }, [selectedLayerIds]); // Use the actual array reference instead of JSON.stringify

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
            )}            {/* Image Effects - all image controls moved to sidebar */}
            {selectedLayerIds.length === 1 &&
              isImageLayer(selectedLayers[0]) && (
                <Fragment>
                  <SettingDivider />

                  <SettingButton
                    css={{ minWidth: 70 }}
                    onClick={() => {
                      actions.setSidebar("IMAGE_EFFECT");
                    }}
                  >
                    Effects
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
        )}      </div>
      {sidebar === "LAYER_MANAGEMENT" && <LayerSidebar open={true} />}
      {sidebar === "IMAGE_EFFECT" && <ImageEffectSidebar open={true} />}
    </Fragment>
  );
};

export default CommonSettings;
