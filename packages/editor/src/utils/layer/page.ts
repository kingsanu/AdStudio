import { serializeLayers } from './layers';
import { Page, SerializedPage } from '../../types';

export const serialize = (pages: Page[]): SerializedPage[] => {
    return pages.map((page) => {
        return {
            locked: page.locked,
            layers: serializeLayers(page.layers, 'ROOT'),
        };
    });
};
