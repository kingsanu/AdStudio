import { LayerComponent } from '@canva/types';
import { FrameContent, FrameContentProps } from './content/FrameContent';

export type FrameLayerProps = FrameContentProps;
const FrameLayer: LayerComponent<FrameLayerProps> = ({
  boxSize,
  clipPath,
  scale = 1,
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
        scale={scale}
        rotate={rotate}
        position={position}
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
