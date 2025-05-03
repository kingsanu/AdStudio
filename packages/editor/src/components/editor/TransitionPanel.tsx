/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useTransition } from "../../animations/TransitionController";
import { TransitionType, SlideTransition } from "../../animations/types";
import { useEditorStore } from "../../hooks/useEditorStore";
import { useAnimation } from "../../animations/AnimationController";
import { toast } from "sonner";

interface TransitionPanelProps {
  onClose?: () => void;
  pages: any[];
}

const TransitionPanel: React.FC<TransitionPanelProps> = ({
  onClose,
  pages,
}) => {
  console.log(pages);
  const { getState, actions } = useEditorStore();
  const { animationState } = useAnimation();
  const {
    addSlideTransition,
    updateSlideTransition,
    removeSlideTransition,
    getSlideTransition,
    previewTransition,
  } = useTransition();

  const [selectedType, setSelectedType] = useState<TransitionType>(
    TransitionType.NONE
  );
  const [duration, setDuration] = useState<number>(1000);
  const [toPageIndex, setToPageIndex] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(0);
  // const [pages, setPages] = useState<any[]>([]);

  // Update state when editor state changes
  // useEffect(() => {
  //   const state = getState();
  //   setActivePage(state.activePage);
  //   setPages(state.pages);
  //   console.log(state);
  //   // Subscribe to editor store changes
  //   const unsubscribe = actions.subscribe(() => {
  //     const newState = getState();
  //     setActivePage(newState.activePage);
  //     setPages(newState.pages);
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [getState, actions]);

  // Update toPageIndex when active page changes
  useEffect(() => {
    // Default to next page
    const nextPageIndex = activePage + 1 < pages.length ? activePage + 1 : 0;
    setToPageIndex(nextPageIndex);

    // Check if there's an existing transition
    const existingTransition = getSlideTransition(activePage, nextPageIndex);
    if (existingTransition) {
      setSelectedType(existingTransition.transitionType);
      setDuration(existingTransition.duration);
    } else {
      // Reset to defaults
      setSelectedType(TransitionType.NONE);
      setDuration(1000);
    }
  }, [activePage, pages, getSlideTransition]);

  // Apply transition between pages
  const applyTransition = () => {
    // Check if we have at least 2 slides and a valid destination slide
    if (pages.length <= 1) {
      toast?.error?.("Add more slides to create transitions");
      return;
    }

    if (activePage !== toPageIndex) {
      const transition: SlideTransition = {
        fromPageIndex: activePage,
        toPageIndex,
        transitionType: selectedType,
        duration,
      };

      if (selectedType === TransitionType.NONE) {
        removeSlideTransition(activePage, toPageIndex);
      } else {
        const existingTransition = getSlideTransition(activePage, toPageIndex);

        if (existingTransition) {
          updateSlideTransition(transition);
        } else {
          addSlideTransition(transition);
        }
      }

      // Show confirmation
      toast?.success?.("Transition applied successfully");
    }
  };

  // Preview the transition
  const handlePreview = () => {
    if (activePage !== toPageIndex) {
      previewTransition(activePage, toPageIndex);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Slide Transition</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          From Slide: {activePage + 1}
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">To Slide</label>
        {pages.length <= 1 ? (
          <div className="text-center py-2 text-gray-500">
            Add more slides to create transitions
          </div>
        ) : (
          <select
            value={toPageIndex}
            onChange={(e) => setToPageIndex(Number(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {pages.map(
              (_, index) =>
                index !== activePage && (
                  <option key={index} value={index}>
                    Slide {index + 1}
                  </option>
                )
            )}
          </select>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Transition Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as TransitionType)}
          className="w-full p-2 border rounded"
        >
          <option value={TransitionType.NONE}>None</option>
          <option value={TransitionType.FADE}>Fade</option>
          <option value={TransitionType.SLIDE_LEFT}>Slide Left</option>
          <option value={TransitionType.SLIDE_RIGHT}>Slide Right</option>
          <option value={TransitionType.SLIDE_UP}>Slide Up</option>
          <option value={TransitionType.SLIDE_DOWN}>Slide Down</option>
          <option value={TransitionType.ZOOM}>Zoom</option>
          <option value={TransitionType.FLIP}>Flip</option>
          <option value={TransitionType.CUBE}>Cube</option>
        </select>
      </div>

      {selectedType !== TransitionType.NONE && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Duration (ms): {duration}
          </label>
          <input
            type="range"
            min="100"
            max="3000"
            step="100"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={applyTransition}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Apply
        </button>
        {selectedType !== TransitionType.NONE && (
          <button
            onClick={handlePreview}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Preview
          </button>
        )}
      </div>
    </div>
  );
};

export default TransitionPanel;
