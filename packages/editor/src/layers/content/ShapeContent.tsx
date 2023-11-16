import { FC } from 'react';
import { GradientStyle, LayerComponentProps } from '../../types';
import { getGradientBackground } from '..';

export interface ShapeContentProps extends LayerComponentProps {
  clipPath: string;
  scale: number;
  gradientBackground: {
    colors: string[];
    style: GradientStyle;
  } | null;
  color: string;
}
export const ShapeContent: FC<ShapeContentProps> = ({
  clipPath,
  color,
  gradientBackground,
}) => {
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
    ></div>
  );
};
