// This file registers the Remotion compositions
const { registerRoot, Composition } = require('@remotion/renderer');
const { Slideshow } = require('./Slideshow');

// Register the root component
const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="Slideshow"
        component={Slideshow}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          images: [],
          transitions: [],
          fps: 30,
        }}
      />
    </>
  );
};

registerRoot(RemotionVideo);
