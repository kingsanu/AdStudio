import { FC } from 'react';
import {
  GradientStyle,
  LayerComponentProps,
  ShapeBorderStyle,
  ShapeType,
} from '../../types';
import { getGradientBackground } from '..';

export interface ShapeContentProps extends LayerComponentProps {
  shape: ShapeType;
  clipPath: string;
  scale: number;
  roundedCorners: number;
  gradientBackground: {
    colors: string[];
    style: GradientStyle;
  } | null;
  color: string;
  border: {
    style: ShapeBorderStyle;
    weight: number;
    color: string;
  } | null;
}
export const ShapeContent: FC<ShapeContentProps> = ({
  clipPath,
  color,
  gradientBackground,
  boxSize,
  scale,
  border,
  roundedCorners,
}) => {
  const getDashArray = () => {
    switch (border?.style) {
      case 'longDashes':
        return `${border.weight * 6}, ${border.weight}`;
      case 'shortDashes':
        return `${border.weight * 3}, ${border.weight}`;
      case `dots`:
        return `${border.weight}, ${border.weight}`;
      default:
        return undefined;
    }
  };
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
          clipPath: `path("${clipPath}")`,
          width: '100%',
          height: '100%',
          background: gradientBackground
            ? getGradientBackground(
                gradientBackground.colors,
                gradientBackground.style
              )
            : color,
        }}
      />
      {border && (
        <svg
          viewBox={`0 0 ${boxSize.width / scale} ${boxSize.height / scale}`}
          css={{ position: 'absolute', inset: 0 }}
        >
          {roundedCorners && (
            <defs>
              <clipPath id='roundedCorners'>
                <path
                  d={clipPath}
                />
              </clipPath>
            </defs>
          )}
          <path
            d={clipPath}
            strokeLinecap={'butt'}
            fill={'none'}
            stroke={border.color}
            strokeWidth={border.weight}
            strokeDasharray={getDashArray()}
            clipPath={clipPath}
          />
        </svg>
      )}
    </div>
  );
};
