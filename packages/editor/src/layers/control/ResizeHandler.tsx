import React, { FC, useContext } from 'react';
import { EditorContext } from '../editor/EditorContext';
import { BoxSize } from '@lidojs/core';
import { Direction, EdgeDirection } from '@lidojs/editor';

export const HANDLER_SIZE = 16;

interface ResizeHandlerProps {
    top?: number;
    left?: number;
    right?: number;
    boxSize: BoxSize;
    width?: number | string;
    height?: number | string;
    isActive: boolean;
    bottom?: number;
    rotate: number;
    direction: EdgeDirection;
    onResizeStart: (e: TouchEvent | MouseEvent, direction: Direction) => void;
}
const ResizeHandler: FC<ResizeHandlerProps> = ({
    isActive,
    boxSize,
    width,
    height,
    top,
    left,
    right,
    bottom,
    direction,
    rotate,
    onResizeStart,
}) => {
    const {
        config: { assetPath },
    } = useContext(EditorContext);
    const rd = {
        left: 90,
        top: 180,
        right: 270,
        bottom: 0,
    };
    const file = Math.round(((rotate + rd[direction] + 90) % 180) / 10);
    const handleResizeStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
        onResizeStart(e.nativeEvent, direction);
    };
    return (
        <div
            css={{
                width,
                height,
                top,
                left,
                right,
                bottom,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                clipPath: ['top', 'bottom'].includes(direction)
                    ? `inset(0 ${HANDLER_SIZE / 2}px)`
                    : `inset(${HANDLER_SIZE / 2}px 0)`,
                ':hover': {
                    cursor: `url('${assetPath}/cursors/resize/${file}.png') 12 12, auto`,
                },
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                handleResizeStart(e);
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e);
            }}
        >
            {((boxSize.width > 50 && ['top', 'bottom'].includes(direction)) ||
                (boxSize.height > 50 && ['left', 'right'].includes(direction))) && (
                <div
                    css={{
                        background: isActive ? '#3d8eff' : 'white',
                        width: ['top', 'bottom'].includes(direction) ? 18 : 6,
                        height: ['top', 'bottom'].includes(direction) ? 6 : 18,
                        borderRadius: 3,
                        position: 'absolute',
                        boxShadow: '0 0 4px 1px rgba(57,76,96,.15), 0 0 0 1px rgba(43,59,74,.3)',
                        ':hover': {
                            background: '#3d8eff',
                            boxShadow: '0 0 0 1px rgba(57,76,96,.15)',
                        },
                    }}
                />
            )}
        </div>
    );
};

export default ResizeHandler;
