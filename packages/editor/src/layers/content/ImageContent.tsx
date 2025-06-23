import { FC } from 'react';
import { BoxSize, Delta, LayerComponentProps, ImageEffectSettings } from '../../types';
import { getTransformStyle } from '..';

export interface ImageContentProps extends LayerComponentProps {
    image: {
        url: string;
        thumb?: string;
        position: Delta;
        rotate: number;
        boxSize: BoxSize;
        transparency?: number;
    };
    imageEffects?: ImageEffectSettings;
}
export const ImageContent: FC<ImageContentProps> = ({ image, boxSize, imageEffects }) => {    // Build CSS filter string from imageEffects
    const getFilterString = () => {
        if (!imageEffects) return 'none';
        
        const filters: string[] = [];
        
        if (imageEffects.brightness && imageEffects.brightness !== 100) {
            filters.push(`brightness(${imageEffects.brightness}%)`);
        }
        if (imageEffects.contrast && imageEffects.contrast !== 100) {
            filters.push(`contrast(${imageEffects.contrast}%)`);
        }
        if (imageEffects.saturation && imageEffects.saturation !== 100) {
            filters.push(`saturate(${imageEffects.saturation}%)`);
        }
        if (imageEffects.hue && imageEffects.hue !== 0) {
            filters.push(`hue-rotate(${imageEffects.hue}deg)`);
        }
        if (imageEffects.sepia && imageEffects.sepia > 0) {
            filters.push(`sepia(${imageEffects.sepia}%)`);
        }
        if (imageEffects.grayscale && imageEffects.grayscale > 0) {
            filters.push(`grayscale(${imageEffects.grayscale}%)`);
        }
        if (imageEffects.invert && imageEffects.invert > 0) {
            filters.push(`invert(${imageEffects.invert}%)`);
        }
        
        return filters.length > 0 ? filters.join(' ') : 'none';
    };    return (
        <div
            css={{
                overflow: 'hidden',
                pointerEvents: 'auto',
                width: boxSize.width,
                height: boxSize.height,
                borderRadius: imageEffects?.borderRadius ? `${imageEffects.borderRadius}%` : undefined,
            }}
        >
            <div
                css={{
                    width: image.boxSize.width,
                    height: image.boxSize.height,
                    transform: getTransformStyle({ position: image.position, rotate: image.rotate }),
                    position: 'relative',
                    userSelect: 'none',
                    opacity: image.transparency,
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
                        filter: getFilterString(),
                    }}
                />
            </div>
        </div>
    );
};
