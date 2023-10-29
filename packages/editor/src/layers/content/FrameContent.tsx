import { FC } from 'react';
import {
  BoxSize,
  Delta,
  LayerComponentProps,
} from '../../types';

export interface FrameContentProps extends LayerComponentProps {
  clipPath: string;
  scale: number;
  image: {
    boxSize: BoxSize;
    position: Delta;
    rotate: number;
    thumb: string;
    url: string;
  };
}
export const FrameContent: FC<FrameContentProps> = ({ clipPath, image }) => {
  return (
    <div
      css={{
        clipPath,
        width: '100%',
        height: '100%',
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
  );
};
