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
import { useEditorStore } from "../../hooks/useEditorStore";
import "../../animations/animations.css";

export interface TransformLayerProps {
  boxSize: BoxSize;
  rotate: number;
  position: Delta;
  transparency?: number;
  blur?: number;
  backdropBlur?: number;
  layerId?: LayerId;
}

const TransformLayer: ForwardRefRenderFunction<
  HTMLDivElement,
  PropsWithChildren<TransformLayerProps>
> = (
  {
    boxSize,
    rotate,
    position,
    transparency,
    blur,
    backdropBlur,
    children,
    layerId,
  },
  ref
) => {
  const { getState } = useEditorStore();
  const { animationState } = useAnimation();
  const [animationStyles, setAnimationStyles] = useState<React.CSSProperties>(
    {}
  );

  // Get current page index
  const state = getState();
  const pageIndex = state.activePage;

  // Build filter styles
  const filterStyles: string[] = [];
  if (blur && blur > 0) {
    filterStyles.push(`blur(${blur}px)`);
  }

  const backdropFilterStyles: string[] = [];
  if (backdropBlur && backdropBlur > 0) {
    backdropFilterStyles.push(`blur(${backdropBlur}px)`);
  }

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
        filter: filterStyles.length > 0 ? filterStyles.join(" ") : undefined,
        backdropFilter:
          backdropFilterStyles.length > 0
            ? backdropFilterStyles.join(" ")
            : undefined,
        WebkitBackdropFilter:
          backdropFilterStyles.length > 0
            ? backdropFilterStyles.join(" ")
            : undefined, // Safari support
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
