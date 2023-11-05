import { FC, PropsWithChildren, ReactElement } from 'react';
import { isMobile } from 'react-device-detect';
import RectangleIcon from '@duyank/icons/shape/Rectangle';
import CircleIcon from '@duyank/icons/shape/Circle';
import TriangleIcon from '@duyank/icons/shape/Triangle';
import RhombusIcon from '@duyank/icons/shape/Rhombus';
import ArrowRightIcon from '@duyank/icons/shape/ArrowRight';
import ArrowLeftIcon from '@duyank/icons/shape/ArrowLeft';
import ArrowTopIcon from '@duyank/icons/shape/ArrowTop';
import ArrowBottomIcon from '@duyank/icons/shape/ArrowBottom';
import ArrowPentagonIcon from '@duyank/icons/shape/ArrowPentagon';
import ChevronIcon from '@duyank/icons/shape/Chevron';
import CrossIcon from '@duyank/icons/shape/Cross';
import ParallelogramIcon from '@duyank/icons/shape/Parallelogram';
import TrapezoidIcon from '@duyank/icons/shape/Trapezoid';
import { CSSObject } from '@emotion/react';
import OctagonIcon from '@duyank/icons/shape/Octagon';
import HexagonIcon from '@duyank/icons/shape/Hexagon';
import PentagonIcon from '@duyank/icons/shape/Pentagon';
import { Delta, ShapeType } from '@canva/types';
import { useEditor } from '@canva/hooks';
import Draggable from '@canva/layers/core/Dragable';
import CloseSidebarButton from './CloseButton';

type Shape = {
  type: ShapeType;
  width: number;
  height: number;
  icon: ReactElement;
};

const IconBox: FC<PropsWithChildren<{ extraCss?: CSSObject }>> = ({
  children,
  extraCss = {},
}) => {
  return (
    <div
      css={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        ...extraCss,
      }}
    >
      {children}
    </div>
  );
};
const shapes: Shape[] = [
  {
    type: 'rectangle',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <RectangleIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'circle',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <CircleIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'triangle',
    width: 64,
    height: 56,
    icon: (
      <IconBox>
        <TriangleIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'triangleUpsideDown',
    width: 64,
    height: 56,
    icon: (
      <IconBox extraCss={{ transform: 'rotate(180deg)' }}>
        <TriangleIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'rhombus',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <RhombusIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'arrowRight',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <ArrowRightIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'arrowLeft',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <ArrowLeftIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'arrowTop',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <ArrowTopIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'arrowBottom',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <ArrowBottomIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'arrowPentagon',
    width: 64,
    height: 32,
    icon: (
      <IconBox>
        <ArrowPentagonIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'chevron',
    width: 64,
    height: 32,
    icon: (
      <IconBox>
        <ChevronIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'cross',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <CrossIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'parallelogram',
    width: 64,
    height: 48,
    icon: (
      <IconBox>
        <ParallelogramIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'parallelogramUpsideDown',
    width: 64,
    height: 48,
    icon: (
      <IconBox extraCss={{ transform: 'scaleY(-1)' }}>
        <ParallelogramIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'trapezoid',
    width: 64,
    height: 48,
    icon: (
      <IconBox>
        <TrapezoidIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'trapezoidUpsideDown',
    width: 64,
    height: 48,
    icon: (
      <IconBox extraCss={{ transform: 'rotate(180deg)' }}>
        <TrapezoidIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'pentagon',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <PentagonIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'hexagonVertical',
    width: 55,
    height: 64,
    icon: (
      <IconBox extraCss={{ transform: 'rotate(90deg)' }}>
        <HexagonIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'hexagonHorizontal',
    width: 64,
    height: 55,
    icon: (
      <IconBox>
        <HexagonIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
  {
    type: 'octagon',
    width: 64,
    height: 64,
    icon: (
      <IconBox>
        <OctagonIcon width={'100%'} height={'100%'} />
      </IconBox>
    ),
  },
];
const ShapeContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { actions } = useEditor();
  const addShape = (shape: Shape, position?: Delta) => {
    actions.addShapeLayer({
      type: {
        resolvedName: 'ShapeLayer',
      },
      props: {
        shape: shape.type,
        position,
        boxSize: {
          width: shape.width,
          height: shape.height,
        },
        rotate: 0,
        color: '#5E6278',
      },
    });
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div
      css={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        overflowY: 'auto',
        display: 'flex',
      }}
    >
      <CloseSidebarButton onClose={onClose} />
      <div css={{ padding: '16px' }}>
        <div
          css={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
            gridGap: 8,
          }}
        >
          {shapes.map((shape) => (
            <Draggable
              key={shape.type}
              onDrop={(pos) => {
                if (pos) {
                  addShape(shape, pos);
                }
              }}
              onClick={() => {
                addShape(shape);
              }}
            >
              <div
                key={shape.type}
                css={{
                  width: '100%',
                  paddingBottom: '100%',
                  position: 'relative',
                }}
              >
                {shape.icon}
              </div>
            </Draggable>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShapeContent;
