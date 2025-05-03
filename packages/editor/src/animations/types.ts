import { LayerId } from "canva-editor/types";

// Animation types for layers
export enum AnimationType {
  NONE = "none",
  FADE_IN = "fadeIn",
  FADE_OUT = "fadeOut",
  SLIDE_IN_LEFT = "slideInLeft",
  SLIDE_IN_RIGHT = "slideInRight",
  SLIDE_IN_TOP = "slideInTop",
  SLIDE_IN_BOTTOM = "slideInBottom",
  ZOOM_IN = "zoomIn",
  ZOOM_OUT = "zoomOut",
  ROTATE_IN = "rotateIn",
  BOUNCE = "bounce",
  PULSE = "pulse",
}

// Transition types between slides
export enum TransitionType {
  NONE = "none",
  FADE = "fade",
  SLIDE_LEFT = "slideLeft",
  SLIDE_RIGHT = "slideRight",
  SLIDE_UP = "slideUp",
  SLIDE_DOWN = "slideDown",
  ZOOM = "zoom",
  FLIP = "flip",
  CUBE = "cube",
}

// Animation timing
export enum AnimationTiming {
  WITH_PREVIOUS = "withPrevious", // Start with previous animation
  AFTER_PREVIOUS = "afterPrevious", // Start after previous animation
  ON_CLICK = "onClick", // Start on click
}

// Animation duration in milliseconds
export type AnimationDuration = number;

// Animation delay in milliseconds
export type AnimationDelay = number;

// Animation configuration for a layer
export interface LayerAnimation {
  layerId: LayerId;
  pageIndex: number;
  animationType: AnimationType;
  timing: AnimationTiming;
  duration: AnimationDuration;
  delay: AnimationDelay;
  order: number; // Order of animation in the sequence
}

// Transition configuration between slides
export interface SlideTransition {
  fromPageIndex: number;
  toPageIndex: number;
  transitionType: TransitionType;
  duration: AnimationDuration;
}

// Animation state for the editor
export interface AnimationState {
  layerAnimations: Record<string, LayerAnimation>; // Key is `${pageIndex}-${layerId}`
  slideTransitions: Record<string, SlideTransition>; // Key is `${fromPageIndex}-${toPageIndex}`
  isPlaying: boolean;
  currentPageIndex: number;
}
