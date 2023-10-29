import { FC } from 'react';
import {
  BoxSize,
  Delta,
  GradientStyle,
  LayerComponentProps,
  ShapeBorderStyle,
} from '../../types';
import { getGradientBackground, getTransformStyle } from '..';

export interface FrameContentProps extends LayerComponentProps {
  clipPath: string;
  width: number;
  height: number;
  scale: number;
  color: string | null;
  gradientBackground: {
    colors: string[];
    style: GradientStyle;
  } | null;
  border: {
    style: ShapeBorderStyle;
    weight: number;
    color: string;
  } | null;
  image: {
    boxSize: BoxSize;
    position: Delta;
    rotate: number;
    thumb: string;
    url: string;
  };
}
export const FrameContent: FC<FrameContentProps> = ({
  boxSize,
  clipPath,
  width,
  height,
  color,
  gradientBackground,
  scale = 1,
  border,
  image,
}) => {
  return (
    <div
      css={{
        position: 'relative',
        width: boxSize.width / scale,
        height: boxSize.height / scale,
      }}
    >
      <div
        css={{
          clipPath,
          width: '100%',
          height: '100%',
          background: gradientBackground
            ? getGradientBackground(
                gradientBackground.colors,
                gradientBackground.style
              )
            : color || '#fff',
        }}
      >
        <div
          css={{
            width: image.boxSize.width,
            height: image.boxSize.height,
            transform: getTransformStyle({
              position: image.position,
              rotate: image.rotate,
            }),
            position: 'relative',
            userSelect: 'none',
          }}
        >
          <img
            src={image.url}
            css={{
              objectFit: 'fill',
              width: '100%',
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
