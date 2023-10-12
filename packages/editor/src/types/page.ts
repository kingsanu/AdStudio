import { Layers, SerializedLayers } from './layer';

export type PageSize = {
    width: number;
    height: number;
};

export type SerializedPage = {
    layers: SerializedLayers;
};

export type Page = {
    layers: Layers;
    locked?: boolean;
};
