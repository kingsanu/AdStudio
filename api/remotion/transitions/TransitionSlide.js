const React = require('react');
const { useCurrentFrame, useVideoConfig, interpolate } = require('@remotion/renderer');
const { Img } = require('@remotion/renderer');

// Transition component that handles different transition types
const TransitionSlide = ({
  from,
  to,
  transitionStart,
  transitionDurationInFrames,
  direction = 'fade',
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate transition progress (0 to 1)
  const transitionProgress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDurationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Different transition effects
  const getTransitionStyles = () => {
    switch (direction) {
      case 'slideLeft':
        return {
          fromStyle: {
            transform: `translateX(${-width * transitionProgress}px)`,
          },
          toStyle: {
            transform: `translateX(${width * (1 - transitionProgress)}px)`,
          },
        };
      case 'slideRight':
        return {
          fromStyle: {
            transform: `translateX(${width * transitionProgress}px)`,
          },
          toStyle: {
            transform: `translateX(${-width * (1 - transitionProgress)}px)`,
          },
        };
      case 'slideUp':
        return {
          fromStyle: {
            transform: `translateY(${-height * transitionProgress}px)`,
          },
          toStyle: {
            transform: `translateY(${height * (1 - transitionProgress)}px)`,
          },
        };
      case 'slideDown':
        return {
          fromStyle: {
            transform: `translateY(${height * transitionProgress}px)`,
          },
          toStyle: {
            transform: `translateY(${-height * (1 - transitionProgress)}px)`,
          },
        };
      case 'zoom':
        return {
          fromStyle: {
            transform: `scale(${1 + transitionProgress})`,
            opacity: 1 - transitionProgress,
          },
          toStyle: {
            transform: `scale(${2 - transitionProgress})`,
            opacity: transitionProgress,
          },
        };
      case 'fade':
      default:
        return {
          fromStyle: {
            opacity: 1 - transitionProgress,
          },
          toStyle: {
            opacity: transitionProgress,
          },
        };
    }
  };

  const { fromStyle, toStyle } = getTransitionStyles();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'black',
      }}
    >
      {/* First image */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...fromStyle,
        }}
      >
        <Img
          src={from}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Second image */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...toStyle,
        }}
      >
        <Img
          src={to}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

module.exports = { TransitionSlide };
