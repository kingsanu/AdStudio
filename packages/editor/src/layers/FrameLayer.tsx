import { LayerComponent } from '@canva/types';
import { FrameContent, FrameContentProps } from './content/FrameContent';
import { useEditor, useLayer, useSelectedLayers } from '@canva/hooks';
import { useContext, useEffect, useState } from 'react';
import { EditorContext } from '@canva/components/editor/EditorContext';

export type FrameLayerProps = FrameContentProps;
const FrameLayer: LayerComponent<FrameLayerProps> = ({
  boxSize,
  clipPath,
  scale = 1,
  rotate,
  position,
  image,
  color,
  gradientBackground,
}) => {
  const { actions, pageIndex, id } = useLayer();
  const { config } = useContext(EditorContext);
  const { selectedLayerIds } = useSelectedLayers();
  const [newImg, setNewImg] = useState<any>(null);
  const { imageEditor } = useEditor((state) => ({
    imageEditor: state.imageEditor,
  }));
  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        setNewImg(
          (i: any) =>
            i && {
              ...i,
              url: img.src,
            }
        );
      };
      img.src = image.url;
    }
  }, [image]);
  useEffect(() => {
    setNewImg(
      !image && !color && !gradientBackground
        ? (() => {
            const defaultRatio =
                config.frame.defaultImage.width /
                config.frame.defaultImage.height,
              imageRatio = boxSize.width / boxSize.height,
              width =
                defaultRatio > imageRatio
                  ? (boxSize.height / scale) * defaultRatio
                  : boxSize.width / scale,
              height =
                defaultRatio > imageRatio
                  ? boxSize.height / scale
                  : (boxSize.width / scale) * defaultRatio;
            return {
              boxSize: {
                width,
                height,
              },
              position: {
                x: -(width - boxSize.width / scale) / 2,
                y: -(height - boxSize.height / scale) / 2,
              },
              rotate: 0,
              url: config.frame.defaultImage.url,
              thumb: config.frame.defaultImage.url,
            };
          })()
        : image
    );
  }, [image, color, gradientBackground]);

  const handleDoubleClick = () => {
    image &&
      selectedLayerIds.includes(id) &&
      actions.openImageEditor({
        boxSize,
        position,
        rotate,
        image: {
          boxSize: {
            width: image.boxSize.width * scale,
            height: image.boxSize.height * scale,
          },
          position: {
            x: image.position.x * scale,
            y: image.position.y * scale,
          },
          rotate: image.rotate || 0,
          url: image.url,
        },
      });
  };
  return (
    <div
      css={{
        transformOrigin: '0 0',
      }}
      style={{
        width: boxSize.width / (scale || 1),
        height: boxSize.height / (scale || 1),
        transform: `scale(${scale || 1})`,
        visibility:
          imageEditor &&
          imageEditor.pageIndex === pageIndex &&
          imageEditor.layerId === id
            ? 'hidden'
            : void 0,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <FrameContent
        boxSize={boxSize}
        clipPath={clipPath}
        scale={scale}
        rotate={rotate}
        position={position}
        image={newImg}
        color={color}
        gradientBackground={gradientBackground}
      />
    </div>
  );
};

FrameLayer.info = {
  name: 'Frame',
  type: 'Frame',
};
export default FrameLayer;
