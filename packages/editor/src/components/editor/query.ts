import { EditorState, Layer, LayerId, LayerComponentProps } from "@canva/types";
import { serialize } from "@canva/utils/layer/page";

export const QueryMethods = (state: EditorState) => {
    return {
        serialize() {
            return serialize(state.pages);
        },
        getLayers(pageIndex: number) {
            return state.pages[pageIndex] && state.pages[pageIndex].layers;
        },
        getLayer<P extends LayerComponentProps>(pageIndex: number, layerId: LayerId) {
            const layers = state.pages[pageIndex] && state.pages[pageIndex].layers;
            if (layers) {
                return layers[layerId] as unknown as Layer<P>;
            }
        },
    };
};
