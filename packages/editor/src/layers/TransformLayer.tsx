import { LayerComponentProps } from '@canva/types';
import { forwardRef, ForwardRefRenderFunction, PropsWithChildren } from 'react';
import { getTransformStyle } from '.';

const TransformLayer: ForwardRefRenderFunction<HTMLDivElement, PropsWithChildren<LayerComponentProps>> = (
    { boxSize, rotate, position, transparency, children },
    ref,
) => {
    return (
        <div
            ref={ref}
            css={{
                touchAction: 'pan-x pan-y pinch-zoom',
                pointerEvents: 'auto',
                position: 'absolute',
            }}
            style={{
                width: boxSize.width,
                height: boxSize.height,
                transform: getTransformStyle({ position, rotate }),
                opacity: transparency,
            }}
        >
            {children}
        </div>
    );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<LayerComponentProps>>(TransformLayer);
