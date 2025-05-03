import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@remotion/core";

interface SlideTransitionProps {
  fromSrc: string;
  toSrc: string;
  transitionStart: number;
  transitionDurationInFrames: number;
  transitionType: string;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  fromSrc,
  toSrc,
  transitionStart,
  transitionDurationInFrames,
  transitionType,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Calculate transition progress (0 to 1)
  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDurationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Different transition effects
  const getTransitionStyles = () => {
    switch (transitionType) {
      case "slideLeft":
        return {
          fromStyle: {
            transform: `translateX(${-width * progress}px)`,
          },
          toStyle: {
            transform: `translateX(${width * (1 - progress)}px)`,
          },
        };
      case "slideRight":
        return {
          fromStyle: {
            transform: `translateX(${width * progress}px)`,
          },
          toStyle: {
            transform: `translateX(${-width * (1 - progress)}px)`,
          },
        };
      case "slideUp":
        return {
          fromStyle: {
            transform: `translateY(${-height * progress}px)`,
          },
          toStyle: {
            transform: `translateY(${height * (1 - progress)}px)`,
          },
        };
      case "slideDown":
        return {
          fromStyle: {
            transform: `translateY(${height * progress}px)`,
          },
          toStyle: {
            transform: `translateY(${-height * (1 - progress)}px)`,
          },
        };
      case "zoom":
        return {
          fromStyle: {
            transform: `scale(${1 + progress})`,
            opacity: 1 - progress,
          },
          toStyle: {
            transform: `scale(${2 - progress})`,
            opacity: progress,
          },
        };
      case "fade":
      default:
        return {
          fromStyle: {
            opacity: 1 - progress,
          },
          toStyle: {
            opacity: progress,
          },
        };
    }
  };

  const { fromStyle, toStyle } = getTransitionStyles();

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {/* First slide */}
      <AbsoluteFill style={{ ...fromStyle }}>
        {fromSrc ? (
          <img
            src={fromSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            alt="From slide"
            onError={(e) => {
              console.error("Error loading from slide image:", e);
              // Set a fallback background color on error
              (e.target as HTMLImageElement).style.backgroundColor = "#f0f0f0";
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              color: "#666",
            }}
          >
            Image not available
          </div>
        )}
      </AbsoluteFill>

      {/* Second slide */}
      <AbsoluteFill style={{ ...toStyle }}>
        {toSrc ? (
          <img
            src={toSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            alt="To slide"
            onError={(e) => {
              console.error("Error loading to slide image:", e);
              // Set a fallback background color on error
              (e.target as HTMLImageElement).style.backgroundColor = "#f0f0f0";
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              color: "#666",
            }}
          >
            Image not available
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
