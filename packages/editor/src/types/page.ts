import { Layers, SerializedLayers } from './layer';

export type PageSize = {
    width: number;
    height: number;
};

export type SerializedPage = {
    layers: SerializedLayers;
    name: string;
    locked?: boolean;
};

export type Page = {
    layers: Layers;
    name: string;
    locked?: boolean;
};
