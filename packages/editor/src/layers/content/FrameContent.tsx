import { FC } from 'react';
import {
  BoxSize,
  Delta,
  GradientStyle,
  LayerComponentProps,
} from '../../types';
import { getGradientBackground, getTransformStyle } from '..';

export interface FrameContentProps extends LayerComponentProps {
  clipPath: string;
  scale: number;
  gradientBackground: {
    colors: string[];
    style: GradientStyle;
  } | null;
  color: string;
  image: {
    boxSize: BoxSize;
    position: Delta;
    rotate: number;
    thumb: string;
    url: string;
  };
}
export const FrameContent: FC<FrameContentProps> = ({
  clipPath,
  image,
  color,
  gradientBackground,
}) => {
  const frameBg = 'http://localhost:4000/images/frame-bg.jpg'; // TODO
  return (
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
          : color,
      }}
    >
      {image && (
        <div
          css={{
            width: image.boxSize.width + 'px',
            height: image.boxSize.height + 'px',
            transform: getTransformStyle({
              position: image.position,
              rotate: image.rotate,
            }),
            position: 'relative',
            userSelect: 'none',
          }}
        >
          <img
            src={image.url || frameBg}
            css={{
              objectFit: 'fill',
              width: '100%',
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};
