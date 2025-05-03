import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  AnimationState,
  AnimationType,
  LayerAnimation,
  AnimationTiming,
} from "./types";
import { LayerId } from "canva-editor/types";
import { useEditorStore } from "../hooks/useEditorStore";

// Initial animation state
const initialAnimationState: AnimationState = {
  layerAnimations: {},
  slideTransitions: {},
  isPlaying: false,
  currentPageIndex: 0,
};

// Create context for animation controller
interface AnimationContextType {
  animationState: AnimationState;
  addLayerAnimation: (animation: LayerAnimation) => void;
  removeLayerAnimation: (pageIndex: number, layerId: LayerId) => void;
  updateLayerAnimation: (animation: LayerAnimation) => void;
  playAnimations: (pageIndex: number) => void;
  stopAnimations: () => void;
  previewLayerAnimation: (pageIndex: number, layerId: LayerId) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);

// Animation provider component
export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>(
    initialAnimationState
  );
  const { getState } = useEditorStore();

  // Add a new layer animation
  const addLayerAnimation = useCallback((animation: LayerAnimation) => {
    console.log("Adding animation:", animation);
    setAnimationState((prevState) => {
      const newState = {
        ...prevState,
        layerAnimations: {
          ...prevState.layerAnimations,
          [`${animation.pageIndex}-${animation.layerId}`]: animation,
        },
      };
      console.log("New animation state:", newState);
      return newState;
    });
  }, []);

  // Remove a layer animation
  const removeLayerAnimation = useCallback(
    (pageIndex: number, layerId: LayerId) => {
      setAnimationState((prevState) => {
        const newLayerAnimations = { ...prevState.layerAnimations };
        delete newLayerAnimations[`${pageIndex}-${layerId}`];
        return {
          ...prevState,
          layerAnimations: newLayerAnimations,
        };
      });
    },
    []
  );

  // Update an existing layer animation
  const updateLayerAnimation = useCallback((animation: LayerAnimation) => {
    setAnimationState((prevState) => ({
      ...prevState,
      layerAnimations: {
        ...prevState.layerAnimations,
        [`${animation.pageIndex}-${animation.layerId}`]: animation,
      },
    }));
  }, []);

  // Play all animations for a specific page
  const playAnimations = useCallback((pageIndex: number) => {
    setAnimationState((prevState) => ({
      ...prevState,
      isPlaying: true,
      currentPageIndex: pageIndex,
    }));

    // Logic to play animations in sequence based on timing and order
    // This would be implemented with actual animation triggers
  }, []);

  // Stop all animations
  const stopAnimations = useCallback(() => {
    setAnimationState((prevState) => ({
      ...prevState,
      isPlaying: false,
    }));
  }, []);

  // Preview a specific layer animation
  const previewLayerAnimation = useCallback(
    (pageIndex: number, layerId: LayerId) => {
      const animationKey = `${pageIndex}-${layerId}`;
      const animation = animationState.layerAnimations[animationKey];

      if (animation) {
        // Logic to preview just this specific animation
        console.log(
          `Previewing animation for layer ${layerId} on page ${pageIndex}`,
          animation
        );

        // Temporarily apply animation class to the layer
        const layerElement = document.querySelector(
          `[data-layer-id="${layerId}"]`
        );
        if (layerElement) {
          // Apply animation class based on type
          const animClass = animation.animationType.toLowerCase();
          layerElement.classList.add(animClass);

          // Remove class after animation completes
          setTimeout(() => {
            layerElement.classList.remove(animClass);
          }, animation.duration + animation.delay + 100);
        } else {
          console.warn(
            `Layer element with ID ${layerId} not found for animation preview`
          );
        }
      } else {
        console.warn(
          `No animation found for layer ${layerId} on page ${pageIndex}`
        );
      }
    },
    [animationState.layerAnimations]
  );

  // Get animation for a specific layer
  const getLayerAnimation = useCallback(
    (pageIndex: number, layerId: LayerId) => {
      return animationState.layerAnimations[`${pageIndex}-${layerId}`];
    },
    [animationState.layerAnimations]
  );

  // Context value
  const value = {
    animationState,
    addLayerAnimation,
    removeLayerAnimation,
    updateLayerAnimation,
    playAnimations,
    stopAnimations,
    previewLayerAnimation,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Create a mock animation context for when the provider is not available
const createMockAnimationContext = (): AnimationContextType => {
  const emptyAnimationState: AnimationState = {
    layerAnimations: {},
    slideTransitions: {},
    isPlaying: false,
    currentPageIndex: 0,
  };

  return {
    animationState: emptyAnimationState,
    addLayerAnimation: () => console.warn("Animation provider not available"),
    removeLayerAnimation: () =>
      console.warn("Animation provider not available"),
    updateLayerAnimation: () =>
      console.warn("Animation provider not available"),
    playAnimations: () => console.warn("Animation provider not available"),
    stopAnimations: () => console.warn("Animation provider not available"),
    previewLayerAnimation: () =>
      console.warn("Animation provider not available"),
  };
};

// Mock context singleton
let mockContext: AnimationContextType | null = null;

// Hook to use animation context
export const useAnimation = () => {
  const context = useContext(AnimationContext);

  // If context is undefined, return a mock implementation instead of throwing an error
  if (context === undefined) {
    console.warn(
      "useAnimation used outside of AnimationProvider - using mock implementation"
    );
    if (!mockContext) {
      mockContext = createMockAnimationContext();
    }
    return mockContext;
  }

  return context;
};

// Helper function to get animation CSS properties
export const getAnimationStyles = (animation: LayerAnimation | undefined) => {
  if (!animation || animation.animationType === AnimationType.NONE) {
    return {};
  }

  const { animationType, duration, delay } = animation;

  // Base animation properties
  const baseStyles = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };

  // Animation specific properties
  switch (animationType) {
    case AnimationType.FADE_IN:
      return {
        ...baseStyles,
        animationName: "fadeIn",
      };
    case AnimationType.FADE_OUT:
      return {
        ...baseStyles,
        animationName: "fadeOut",
      };
    case AnimationType.SLIDE_IN_LEFT:
      return {
        ...baseStyles,
        animationName: "slideInLeft",
      };
    case AnimationType.SLIDE_IN_RIGHT:
      return {
        ...baseStyles,
        animationName: "slideInRight",
      };
    case AnimationType.SLIDE_IN_TOP:
      return {
        ...baseStyles,
        animationName: "slideInTop",
      };
    case AnimationType.SLIDE_IN_BOTTOM:
      return {
        ...baseStyles,
        animationName: "slideInBottom",
      };
    case AnimationType.ZOOM_IN:
      return {
        ...baseStyles,
        animationName: "zoomIn",
      };
    case AnimationType.ZOOM_OUT:
      return {
        ...baseStyles,
        animationName: "zoomOut",
      };
    case AnimationType.ROTATE_IN:
      return {
        ...baseStyles,
        animationName: "rotateIn",
      };
    case AnimationType.BOUNCE:
      return {
        ...baseStyles,
        animationName: "bounce",
      };
    case AnimationType.PULSE:
      return {
        ...baseStyles,
        animationName: "pulse",
      };
    default:
      return {};
  }
};
