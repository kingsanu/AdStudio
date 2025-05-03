const React = require('react');
const { useCurrentFrame, useVideoConfig, interpolate, Sequence } = require('@remotion/renderer');
const { Img } = require('@remotion/renderer');
const { TransitionSlide } = require('./transitions/TransitionSlide');

// Main Slideshow component
const Slideshow = ({ images = [], transitions = [], fps = 30 }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Default transition duration in frames (2 seconds)
  const defaultTransitionDuration = fps * 2;
  
  // Calculate total frames per image (including transition)
  const framesPerImage = Math.floor(durationInFrames / Math.max(images.length, 1));
  
  // Render each image with transitions
  return (
    <div style={{ flex: 1, backgroundColor: 'black' }}>
      {images.map((image, index) => {
        // Calculate start and end frames for this image
        const startFrame = index * framesPerImage;
        const endFrame = (index + 1) * framesPerImage;
        
        // Get transition for this image pair
        const transition = transitions[index] || { 
          type: 'fade', 
          duration: defaultTransitionDuration 
        };
        
        // Convert duration from ms to frames if needed
        const transitionDurationInFrames = typeof transition.duration === 'number' 
          ? Math.floor((transition.duration / 1000) * fps)
          : defaultTransitionDuration;
        
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={framesPerImage}
          >
            {index < images.length - 1 ? (
              <TransitionSlide
                from={image}
                to={images[index + 1]}
                transitionStart={framesPerImage - transitionDurationInFrames}
                transitionDurationInFrames={transitionDurationInFrames}
                direction={transition.type || 'fade'}
                width={width}
                height={height}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: 'black'
              }}>
                <Img
                  src={image}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
          </Sequence>
        );
      })}
    </div>
  );
};

module.exports = { Slideshow };
