import React from "react";

// Create our own versions of these components and functions since they're not exported from the packages
const AbsoluteFill: React.FC<
  React.PropsWithChildren<{ style?: React.CSSProperties }>
> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...style,
    }}
  >
    {children}
  </div>
);

// Mock the useCurrentFrame hook
const useCurrentFrame = () => 0;

// Mock the useVideoConfig hook
const useVideoConfig = () => ({
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 300,
});

// Simple interpolate function
const interpolate = (
  frame: number,
  [inputMin, inputMax]: [number, number],
  [outputMin, outputMax]: [number, number],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: { extrapolateLeft?: string; extrapolateRight?: string }
): number => {
  if (frame <= inputMin) return outputMin;
  if (frame >= inputMax) return outputMax;

  const progress = (frame - inputMin) / (inputMax - inputMin);
  return outputMin + progress * (outputMax - outputMin);
};

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
