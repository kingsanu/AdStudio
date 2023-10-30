import { Fragment, PropsWithChildren } from 'react';
import { useLayer } from '../hooks';
import { LayerComponent } from '@canva/types';
import { RootContentProps, RootContent, ImageContentProps } from '.';

export interface RootLayerProps extends Omit<RootContentProps, 'image'> {
    image?: ImageContentProps['image'];
}
const RootLayer: LayerComponent<PropsWithChildren<RootLayerProps>> = ({
    boxSize,
    children,
    color,
    gradientBackground,
    image,
    video,
    position,
    rotate,
    scale,
}) => {
    const { actions } = useLayer();
    return (
        <Fragment>
            <RootContent
                boxSize={boxSize}
                position={position}
                rotate={rotate}
                gradientBackground={gradientBackground}
                color={color}
                image={image}
                video={video}
                scale={scale}
                onDoubleClick={() =>
                    (image || video) && actions.openImageEditor({ boxSize, position, rotate, image, video })
                }
            />
            {children}
        </Fragment>
    );
};

RootLayer.info = {
    name: 'Main',
    type: 'Root',
};
export default RootLayer;
