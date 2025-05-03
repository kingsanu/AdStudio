import { BoxSize, Delta, LayerId } from "canva-editor/types";
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { getTransformStyle } from "../index";
import {
  useAnimation,
  getAnimationStyles,
} from "../../animations/AnimationController";
import { useLayer } from "../../hooks/useLayer";
import { useEditorStore } from "../../hooks/useEditorStore";
import "../../animations/animations.css";

export interface TransformLayerProps {
  boxSize: BoxSize;
  rotate: number;
  position: Delta;
  transparency?: number;
  layerId?: LayerId;
}

const TransformLayer: ForwardRefRenderFunction<
  HTMLDivElement,
  PropsWithChildren<TransformLayerProps>
> = ({ boxSize, rotate, position, transparency, children, layerId }, ref) => {
  const { getState } = useEditorStore();
  const { animationState } = useAnimation();
  const [animationStyles, setAnimationStyles] = useState<React.CSSProperties>(
    {}
  );

  // Get current page index
  const state = getState();
  const pageIndex = state.activePage;

  // Check if this layer has an animation
  useEffect(() => {
    if (layerId && animationState?.layerAnimations) {
      const animationKey = `${pageIndex}-${layerId}`;
      const layerAnimation = animationState.layerAnimations[animationKey];

      if (layerAnimation) {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.log(`Animation found for layer ${layerId}`);
        }
        setAnimationStyles(getAnimationStyles(layerAnimation));
      } else {
        setAnimationStyles({});
      }
    }
  }, [layerId, pageIndex, animationState?.layerAnimations]);

  return (
    <div
      ref={ref}
      css={{
        touchAction: "pan-x pan-y pinch-zoom",
        pointerEvents: "auto",
        position: "absolute",
      }}
      style={{
        width: boxSize.width,
        height: boxSize.height,
        transform: getTransformStyle({ position, rotate }),
        opacity: transparency,
        ...animationStyles,
      }}
      data-layer-id={layerId}
    >
      {children}
    </div>
  );
};

export default forwardRef<
  HTMLDivElement,
  PropsWithChildren<TransformLayerProps>
>(TransformLayer);
