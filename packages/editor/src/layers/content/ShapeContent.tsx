import { FC } from 'react';
import {
  GradientStyle,
  LayerComponentProps,
  ShapeBorderStyle,
} from '../../types';
import { getGradientBackground } from '..';

export interface ShapeContentProps extends LayerComponentProps {
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
  shapeSize: {
    width: number;
    height: number;
  };
}
export const ShapeContent: FC<ShapeContentProps> = ({
  clipPath,
  color,
  gradientBackground,
  boxSize,
  scale,
  border,
  roundedCorners,
  shapeSize,
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
  const svgWidth = boxSize.width / scale / shapeSize.width;
  const svgHeight = boxSize.height / scale / shapeSize.height;
  return (
    <div
      css={{
        position: 'relative',
        width: boxSize.width / scale,
        height: boxSize.height / scale,
        overflow: 'hidden'
      }}
    >
      <div
        css={{
          clipPath: `path("${clipPath}")`,
          width: shapeSize.width + 'px',
          height: shapeSize.height + 'px',
          background: gradientBackground
            ? getGradientBackground(
                gradientBackground.colors,
                gradientBackground.style
              )
            : color,
          transform: `scale(${svgWidth}, ${svgHeight})`,
          transformOrigin: '0 0',
        }}
      />

      {border && (
        <svg
          viewBox={`0 0 ${boxSize.width / scale} ${boxSize.height / scale}`}
          css={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${svgWidth}, ${svgHeight})`,
            transformOrigin: '0 0',
          }}
        >
          {roundedCorners > 0 && (
            <defs>
              <clipPath id='roundedCorners'>
                <path d={clipPath} />
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
            vectorEffect={'non-scaling-stroke'}
          />
        </svg>
      )}
    </div>
  );
};
