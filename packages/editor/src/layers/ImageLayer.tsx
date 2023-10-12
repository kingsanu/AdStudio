import { BoxSize, Delta, LayerComponent } from '@canva/types';
import { ImageContent, ImageContentProps } from '.';

export interface ImageLayerProps extends ImageContentProps {
    image: {
        url: string;
        thumb: string;
        position: Delta;
        rotate: number;
        boxSize: BoxSize;
        transparency?: number;
    };
}

const ImageLayer: LayerComponent<ImageLayerProps> = ({ image, boxSize, position, rotate }) => {
    return <ImageContent image={image} boxSize={boxSize} rotate={rotate} position={position} />;
};

ImageLayer.info = {
    name: 'Image',
    type: 'Image',
};
export default ImageLayer;
