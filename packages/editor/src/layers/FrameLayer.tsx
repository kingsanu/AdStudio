import { LayerComponent } from '@canva/types';
import { FrameContent, FrameContentProps } from './content/FrameContent';

export type FrameLayerProps = FrameContentProps;
const FrameLayer: LayerComponent<FrameLayerProps> = ({
  boxSize,
  clipPath,
  width,
  height,
  color,
  gradientBackground,
  scale = 1,
  border,
  rotate,
  position,
  image,
}) => {
  return (
    <div
      css={{
        transformOrigin: '0 0',
      }}
      style={{
        width: boxSize.width / (scale || 1),
        height: boxSize.height / (scale || 1),
        transform: `scale(${scale || 1})`,
      }}
    >
      <FrameContent
        boxSize={boxSize}
        clipPath={clipPath}
        width={width}
        height={height}
        color={color}
        gradientBackground={gradientBackground}
        scale={scale}
        rotate={rotate}
        position={position}
        border={border}
        image={image}
      />
    </div>
  );
};

FrameLayer.info = {
  name: 'Frame',
  type: 'Frame',
};
export default FrameLayer;
