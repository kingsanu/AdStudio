import React from "react";
// Import from @remotion/player instead of @remotion/core
import { Player } from "@remotion/player";

// Create our own versions of these components since they're not exported from the packages
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

const Sequence: React.FC<
  React.PropsWithChildren<{ from: number; durationInFrames: number }>
> = ({ children }) => <>{children}</>;

// Mock the useVideoConfig hook
const useVideoConfig = () => ({
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 300,
});
import { SlideTransition } from "./SlideTransition";

interface SlideshowCompositionProps {
  slides: string[]; // Array of image data URLs
  transitions: {
    type: string;
    duration: number;
  }[];
  durationPerSlide?: number; // Duration per slide in seconds
}

export const SlideshowComposition: React.FC<SlideshowCompositionProps> = ({
  slides,
  transitions,
  durationPerSlide = 5,
}) => {
  const { fps } = useVideoConfig();

  // Debug the slides
  React.useEffect(() => {
    console.log(`SlideshowComposition: Received ${slides.length} slides`);
    if (slides.length > 0) {
      console.log(`First slide format check: ${slides[0].substring(0, 30)}...`);
    }
  }, [slides]);

  // Calculate frames per slide
  const framesPerSlide = Math.round(durationPerSlide * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {slides.map((slide, index) => {
        // Calculate start frame for this slide
        const startFrame = index * framesPerSlide;

        // Get transition for this slide pair if available
        const transition =
          index < transitions.length
            ? transitions[index]
            : {
                type: "fade",
                duration: 1000, // Default 1 second
              };

        // Convert transition duration from ms to frames
        const transitionDurationInFrames = Math.round(
          (transition.duration / 1000) * fps
        );

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={framesPerSlide}
          >
            {index < slides.length - 1 ? (
              <SlideTransition
                fromSrc={slide}
                toSrc={slides[index + 1]}
                transitionStart={framesPerSlide - transitionDurationInFrames}
                transitionDurationInFrames={transitionDurationInFrames}
                transitionType={transition.type}
              />
            ) : (
              <AbsoluteFill style={{ backgroundColor: "black" }}>
                <img
                  src={slide}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  alt={`Slide ${index + 1}`}
                />
              </AbsoluteFill>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
