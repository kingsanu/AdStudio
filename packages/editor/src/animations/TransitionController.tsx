import React, { createContext, useContext, useCallback } from "react";
import { AnimationState, TransitionType, SlideTransition } from "./types";
import { useEditorStore } from "../hooks/useEditorStore";

// Create context for transition controller
interface TransitionContextType {
  addSlideTransition: (transition: SlideTransition) => void;
  removeSlideTransition: (fromPageIndex: number, toPageIndex: number) => void;
  updateSlideTransition: (transition: SlideTransition) => void;
  getSlideTransition: (
    fromPageIndex: number,
    toPageIndex: number
  ) => SlideTransition | undefined;
  previewTransition: (fromPageIndex: number, toPageIndex: number) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(
  undefined
);

// Transition provider component
export const TransitionProvider: React.FC<{
  children: React.ReactNode;
  animationState: AnimationState;
  setAnimationState: React.Dispatch<React.SetStateAction<AnimationState>>;
}> = ({ children, animationState, setAnimationState }) => {
  const { getState, actions } = useEditorStore();

  // Add a new slide transition
  const addSlideTransition = useCallback(
    (transition: SlideTransition) => {
      setAnimationState((prevState) => ({
        ...prevState,
        slideTransitions: {
          ...prevState.slideTransitions,
          [`${transition.fromPageIndex}-${transition.toPageIndex}`]: transition,
        },
      }));
    },
    [setAnimationState]
  );

  // Remove a slide transition
  const removeSlideTransition = useCallback(
    (fromPageIndex: number, toPageIndex: number) => {
      setAnimationState((prevState) => {
        const newSlideTransitions = { ...prevState.slideTransitions };
        delete newSlideTransitions[`${fromPageIndex}-${toPageIndex}`];
        return {
          ...prevState,
          slideTransitions: newSlideTransitions,
        };
      });
    },
    [setAnimationState]
  );

  // Update an existing slide transition
  const updateSlideTransition = useCallback(
    (transition: SlideTransition) => {
      setAnimationState((prevState) => ({
        ...prevState,
        slideTransitions: {
          ...prevState.slideTransitions,
          [`${transition.fromPageIndex}-${transition.toPageIndex}`]: transition,
        },
      }));
    },
    [setAnimationState]
  );

  // Get transition for specific pages
  const getSlideTransition = useCallback(
    (fromPageIndex: number, toPageIndex: number) => {
      return animationState.slideTransitions[`${fromPageIndex}-${toPageIndex}`];
    },
    [animationState.slideTransitions]
  );

  // Preview a specific transition
  const previewTransition = useCallback(
    (fromPageIndex: number, toPageIndex: number) => {
      const transitionKey = `${fromPageIndex}-${toPageIndex}`;
      const transition = animationState.slideTransitions[transitionKey];

      console.log(
        `Attempting to preview transition from page ${fromPageIndex} to page ${toPageIndex}`
      );
      console.log("Current transitions:", animationState.slideTransitions);
      console.log("Looking for transition key:", transitionKey);

      // Force the preview even if no transition is defined
      const currentPage = getState().activePage;

      // If we're already on the fromPageIndex, just go to toPageIndex
      if (currentPage === fromPageIndex) {
        console.log(
          `Already on page ${fromPageIndex}, transitioning to ${toPageIndex}`
        );
        actions.setActivePage(toPageIndex);
      } else {
        // Otherwise, first go to fromPageIndex, then to toPageIndex
        console.log(`Setting active page to ${fromPageIndex}`);
        actions.setActivePage(fromPageIndex);

        // Wait a moment before transitioning to the target page
        setTimeout(() => {
          console.log(`Now transitioning to page ${toPageIndex}`);
          actions.setActivePage(toPageIndex);
        }, 500);
      }
    },
    [animationState.slideTransitions, actions, getState]
  );

  // Context value
  const value = {
    addSlideTransition,
    removeSlideTransition,
    updateSlideTransition,
    getSlideTransition,
    previewTransition,
  };

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
};

// Create a mock transition context for when the provider is not available
const createMockTransitionContext = (): TransitionContextType => {
  return {
    addSlideTransition: () => console.warn("Transition provider not available"),
    removeSlideTransition: () =>
      console.warn("Transition provider not available"),
    updateSlideTransition: () =>
      console.warn("Transition provider not available"),
    getSlideTransition: () => undefined,
    previewTransition: () => console.warn("Transition provider not available"),
  };
};

// Mock context singleton
let mockTransitionContext: TransitionContextType | null = null;

// Hook to use transition context
export const useTransition = () => {
  const context = useContext(TransitionContext);

  // If context is undefined, return a mock implementation instead of throwing an error
  if (context === undefined) {
    console.warn(
      "useTransition used outside of TransitionProvider - using mock implementation"
    );
    if (!mockTransitionContext) {
      mockTransitionContext = createMockTransitionContext();
    }
    return mockTransitionContext;
  }

  return context;
};

// Helper function to get transition CSS properties
export const getTransitionStyles = (
  transition: SlideTransition | undefined
) => {
  if (!transition || transition.transitionType === TransitionType.NONE) {
    return {};
  }

  const { transitionType, duration } = transition;

  // Base transition properties
  const baseStyles = {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "ease",
  };

  // Transition specific properties
  switch (transitionType) {
    case TransitionType.FADE:
      return {
        ...baseStyles,
        transitionProperty: "opacity",
      };
    case TransitionType.SLIDE_LEFT:
    case TransitionType.SLIDE_RIGHT:
    case TransitionType.SLIDE_UP:
    case TransitionType.SLIDE_DOWN:
      return {
        ...baseStyles,
        transitionProperty: "transform",
      };
    case TransitionType.ZOOM:
      return {
        ...baseStyles,
        transitionProperty: "transform",
      };
    case TransitionType.FLIP:
      return {
        ...baseStyles,
        transitionProperty: "transform",
        transformStyle: "preserve-3d",
      };
    case TransitionType.CUBE:
      return {
        ...baseStyles,
        transitionProperty: "transform",
        transformStyle: "preserve-3d",
      };
    default:
      return {};
  }
};

// Helper function to get transition transform values
export const getTransitionTransform = (
  transitionType: TransitionType,
  isEntering: boolean,
  progress: number = 1
) => {
  switch (transitionType) {
    case TransitionType.SLIDE_LEFT:
      return `translateX(${
        isEntering ? (1 - progress) * 100 : -progress * 100
      }%)`;
    case TransitionType.SLIDE_RIGHT:
      return `translateX(${
        isEntering ? -(1 - progress) * 100 : progress * 100
      }%)`;
    case TransitionType.SLIDE_UP:
      return `translateY(${
        isEntering ? (1 - progress) * 100 : -progress * 100
      }%)`;
    case TransitionType.SLIDE_DOWN:
      return `translateY(${
        isEntering ? -(1 - progress) * 100 : progress * 100
      }%)`;
    case TransitionType.ZOOM:
      const scale = isEntering ? 0.5 + 0.5 * progress : 1 - 0.5 * progress;
      return `scale(${scale})`;
    case TransitionType.FLIP:
      const rotateY = isEntering ? (1 - progress) * 90 : progress * 90;
      return `rotateY(${rotateY}deg)`;
    case TransitionType.CUBE:
      const rotateX = isEntering ? (1 - progress) * 90 : progress * 90;
      return `rotateX(${rotateX}deg)`;
    default:
      return "";
  }
};
