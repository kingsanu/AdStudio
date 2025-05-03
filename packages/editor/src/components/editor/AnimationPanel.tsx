import React, { useState, useEffect } from "react";
import { useAnimation } from "../../animations/AnimationController";
import {
  AnimationType,
  AnimationTiming,
  LayerAnimation,
} from "../../animations/types";
import { useEditorStore } from "../../hooks/useEditorStore";
import { LayerId } from "canva-editor/types";
import { toast } from "sonner";

interface AnimationPanelProps {
  onClose?: () => void;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({ onClose }) => {
  const { getState, actions, query } = useEditorStore();
  const {
    animationState,
    addLayerAnimation,
    updateLayerAnimation,
    removeLayerAnimation,
    previewLayerAnimation,
  } = useAnimation();

  const [selectedType, setSelectedType] = useState<AnimationType>(
    AnimationType.NONE
  );
  const [selectedTiming, setSelectedTiming] = useState<AnimationTiming>(
    AnimationTiming.AFTER_PREVIOUS
  );
  const [duration, setDuration] = useState<number>(1000);
  const [delay, setDelay] = useState<number>(0);
  const [selectedLayers, setSelectedLayers] = useState<LayerId[]>([]);
  const [activePage, setActivePage] = useState<number>(0);

  // Update selected layers and active page when state changes
  useEffect(() => {
    const state = getState();
    setActivePage(state.activePage);
    setSelectedLayers(state.selectedLayers[state.activePage] || []);

    // Debug selected layers
    console.log("Active Page:", state.activePage);
    console.log(
      "Selected Layers:",
      state.selectedLayers[state.activePage] || []
    );
    console.log("All Selected Layers:", state.selectedLayers);

    // Subscribe to editor store changes
    const unsubscribe = actions.subscribe(() => {
      const newState = getState();
      setActivePage(newState.activePage);
      setSelectedLayers(newState.selectedLayers[newState.activePage] || []);

      console.log(
        "State updated - Selected Layers:",
        newState.selectedLayers[newState.activePage] || []
      );
    });

    return () => {
      unsubscribe();
    };
  }, [getState, actions]);

  // Check if the selected layer has an animation
  useEffect(() => {
    console.log("Selected layers changed:", selectedLayers);

    if (selectedLayers.length === 1) {
      const layerId = selectedLayers[0];
      const animationKey = `${activePage}-${layerId}`;
      const existingAnimation = animationState.layerAnimations[animationKey];

      if (existingAnimation) {
        setSelectedType(existingAnimation.animationType);
        setSelectedTiming(existingAnimation.timing);
        setDuration(existingAnimation.duration);
        setDelay(existingAnimation.delay);
      } else {
        // Reset to defaults if no animation exists
        setSelectedType(AnimationType.NONE);
        setSelectedTiming(AnimationTiming.AFTER_PREVIOUS);
        setDuration(1000);
        setDelay(0);
      }
    }
  }, [selectedLayers, activePage, animationState.layerAnimations]);

  // Debug function to select a layer manually if needed
  const selectLayerManually = () => {
    const state = getState();
    const layers = state.pages[activePage]?.layers || {};
    const layerIds = Object.keys(layers).filter((id) => id !== "ROOT");

    if (layerIds.length > 0) {
      // Select the first non-ROOT layer
      actions.selectLayers(activePage, [layerIds[0]]);
      console.log("Manually selected layer:", layerIds[0]);
    }
  };

  // Apply animation to selected layer
  const applyAnimation = () => {
    if (selectedLayers.length === 0) {
      toast.error("Please select a layer first");
      return;
    } else if (selectedLayers.length === 1) {
      const layerId = selectedLayers[0];

      // Get the highest order number for this page
      const pageAnimations = Object.values(
        animationState.layerAnimations
      ).filter((anim) => anim.pageIndex === activePage);
      const maxOrder =
        pageAnimations.length > 0
          ? Math.max(...pageAnimations.map((anim) => anim.order))
          : -1;

      const animation: LayerAnimation = {
        layerId,
        pageIndex: activePage,
        animationType: selectedType,
        timing: selectedTiming,
        duration,
        delay,
        order: maxOrder + 1,
      };

      if (selectedType === AnimationType.NONE) {
        removeLayerAnimation(activePage, layerId);
        toast.success("Animation removed");
      } else {
        const animationKey = `${activePage}-${layerId}`;
        const existingAnimation = animationState.layerAnimations[animationKey];

        if (existingAnimation) {
          updateLayerAnimation(animation);
          toast.success("Animation updated");
        } else {
          addLayerAnimation(animation);
          toast.success("Animation added");
        }
      }
    }
  };

  // Preview the animation
  const handlePreview = () => {
    if (selectedLayers.length === 0) {
      toast.error("Please select a layer first");
      return;
    } else if (selectedLayers.length === 1) {
      const layerId = selectedLayers[0];
      previewLayerAnimation(activePage, layerId);
      toast.info("Previewing animation");
    } else {
      toast.error("Select only one layer to preview animation");
    }
  };

  // Get layer name for display
  const getLayerName = (layerId: LayerId) => {
    const layer = query.getLayer(activePage, layerId);
    return layer?.data?.props?.name || `Layer ${layerId}`;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Animation</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      {selectedLayers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-4">Select a layer to add animation</p>
          <button
            onClick={selectLayerManually}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select First Available Layer
          </button>
        </div>
      ) : selectedLayers.length > 1 ? (
        <div className="text-center py-4 text-gray-500">
          Select only one layer to add animation
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Layer: {getLayerName(selectedLayers[0])}
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Animation Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AnimationType)}
              className="w-full p-2 border rounded"
            >
              <option value={AnimationType.NONE}>None</option>
              <option value={AnimationType.FADE_IN}>Fade In</option>
              <option value={AnimationType.FADE_OUT}>Fade Out</option>
              <option value={AnimationType.SLIDE_IN_LEFT}>
                Slide In (Left)
              </option>
              <option value={AnimationType.SLIDE_IN_RIGHT}>
                Slide In (Right)
              </option>
              <option value={AnimationType.SLIDE_IN_TOP}>Slide In (Top)</option>
              <option value={AnimationType.SLIDE_IN_BOTTOM}>
                Slide In (Bottom)
              </option>
              <option value={AnimationType.ZOOM_IN}>Zoom In</option>
              <option value={AnimationType.ZOOM_OUT}>Zoom Out</option>
              <option value={AnimationType.ROTATE_IN}>Rotate In</option>
              <option value={AnimationType.BOUNCE}>Bounce</option>
              <option value={AnimationType.PULSE}>Pulse</option>
            </select>
          </div>

          {selectedType !== AnimationType.NONE && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Start</label>
                <select
                  value={selectedTiming}
                  onChange={(e) =>
                    setSelectedTiming(e.target.value as AnimationTiming)
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value={AnimationTiming.WITH_PREVIOUS}>
                    With Previous
                  </option>
                  <option value={AnimationTiming.AFTER_PREVIOUS}>
                    After Previous
                  </option>
                  <option value={AnimationTiming.ON_CLICK}>On Click</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Duration (ms): {duration}
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Delay (ms): {delay}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div className="flex space-x-2">
            <button
              onClick={applyAnimation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply
            </button>
            {selectedType !== AnimationType.NONE && (
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Preview
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationPanel;
