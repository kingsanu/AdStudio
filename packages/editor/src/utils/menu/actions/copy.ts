import { EditorState } from '@canva/types/editor';
import { serializeLayers } from '../../layer/layers';
import { LayerId, SerializedLayerTree } from '@canva/types';

export const copy = async (state: EditorState, { pageIndex, layerIds }: { pageIndex: number; layerIds: LayerId[] }) => {
    const data: SerializedLayerTree[] = [];
    layerIds.map((layerId) => {
        data.push({
            rootId: layerId,
            layers: serializeLayers(state.pages[pageIndex].layers, layerId),
        });
    });
    await navigator.clipboard.writeText(JSON.stringify(data));
};
