import { FunctionComponent, ReactElement } from "react";
import { BoxSize, DeepPartial, Delta } from "./common";
import { EditorActions, EditorState } from "./editor";
import { TextEditor } from "canva-editor/components/text-editor/interfaces";
import { ImageContentProps } from "canva-editor/layers";

export type LayerId = string;

export type LayerComponentProps = {
  boxSize: BoxSize;
  rotate: number;
  position: Delta;
  scale?: number;
  transparency?: number;
  blur?: number;
  backdropBlur?: number;
  text?: string;
  image?: ImageContentProps["image"] | null;
  name?: string;
};

export type GradientStyle =
  | "leftToRight"
  | "topToBottom"
  | "topLeftToBottomRight"
  | "circleCenter"
  | "circleTopLeft";
export type LayerType =
  | "Image"
  | "Text"
  | "Shape"
  | "Root"
  | "Group"
  | "Frame"
  | "Svg"
  | "Video";

export type SerializedLayerTree = {
  rootId: LayerId;
  layers: SerializedLayers;
};

export type SerializedCompType = {
  resolvedName: string;
};

export type SerializedLayers = Record<LayerId, SerializedLayer>;

export type SerializedLayer = {
  type: SerializedCompType;
  props: Record<string, unknown>;
  locked: boolean;
  lockHidden?: boolean; // Include lockHidden property for admin-only locks
  parent: LayerId | null;
  child: LayerId[];
};

export type BoxData = {
  boxSize: BoxSize;
  position: Delta;
  rotate: number;
  scale?: number;
};

export type EffectSettings = {
  position?: number;
  offset?: number;
  direction?: number;
  blur?: number;
  transparency?: number;
  color?: string;
  intensity?: number;
  thickness?: number;
};

export type ImageEffectSettings = {
  brightness?: number; // 0-200, default 100
  contrast?: number; // 0-200, default 100
  saturation?: number; // 0-200, default 100
  hue?: number; // -180 to 180, default 0
  borderRadius?: number; // 0-50, default 0 (percentage)
  sepia?: number; // 0-100, default 0
  grayscale?: number; // 0-100, default 0
  invert?: number; // 0-100, default 0
  removeBackground?: boolean; // default false
  // Border properties
  borderWidth?: number; // 0-20, default 0 (pixels)
  borderColor?: string; // default '#000000'
  borderStyle?: 'solid' | 'dotted' | 'dashed' | 'curved'; // default 'solid'
  // Original image tracking
  originalImageUrl?: string; // Track original image URL before background removal
};

export type ShapeType =
  | "circle"
  | "rectangle"
  | "triangle"
  | "triangleUpsideDown"
  | "parallelogram"
  | "parallelogramUpsideDown"
  | "trapezoid"
  | "trapezoidUpsideDown"
  | "cross"
  | "arrowRight"
  | "arrowLeft"
  | "arrowTop"
  | "arrowBottom"
  | "rhombus"
  | "chevron"
  | "arrowPentagon"
  | "pentagon"
  | "hexagonVertical"
  | "hexagonHorizontal"
  | "octagon"
  | "chatBubbleSquare"
  | "chatBubbleRound";

export type ShapeBorderStyle =
  | "solid"
  | "longDashes"
  | "shortDashes"
  | "dots"
  | "none";

export type ContextMenuItem = {
  value: string;
  label: string | ReactElement;
  execute: (data: {
    pageIndex: number;
    layerId: LayerId;
    state: EditorState;
    actions: EditorActions;
  }) => void;
};

export type LayerInfo = {
  name: string;
  type: LayerType;
  contextMenu?: ContextMenuItem[];
};
export interface LayerComponent<P extends LayerComponentProps>
  extends FunctionComponent<P> {
  info: LayerInfo;
}

export type LayerActions = {
  setProp: <P extends LayerComponentProps>(props: DeepPartial<P>) => void;
  select: () => void;
  hover: (v?: null) => void;
  setTextEditor: (editor: TextEditor) => void;
  openTextEditor: () => void;
  openImageEditor: (data: {
    position: Delta;
    rotate: number;
    boxSize: BoxSize;
    image?: ImageContentProps["image"] | null;
  }) => void;
};

export type LayerData<P extends LayerComponentProps> = LayerInfo & {
  comp: LayerComponent<P>;
  props: P;
  locked: boolean;
  lockHidden?: boolean; // Add lockHidden property for admin-only locking
  parent: LayerId | null;
  child: LayerId[];
  editor?: TextEditor;
};
export type Layer<P extends LayerComponentProps> = {
  id: LayerId;
  data: LayerData<P>;
};

export type LayerDataRef = Record<
  LayerId,
  LayerComponentProps & { centerX?: number; centerY?: number }
>;

export type Layers = Record<LayerId, Layer<LayerComponentProps>>;
