import { BoxSize } from '@canva/types';

export const getPositionWhenLayerCenter = (editorSize: BoxSize, layerSize: BoxSize) => {
    return {
        x: (editorSize.width - layerSize.width) / 2,
        y: (editorSize.height - layerSize.height) / 2,
    };
};
