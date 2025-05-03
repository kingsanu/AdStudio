import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageRender from "./PageRender";
import { throttle } from "lodash";
import { GlobalStyle, getUsedFonts } from "../layers";
import { SerializedPage } from "canva-editor/types";
import { renderPages } from "canva-editor/utils/deserialize";
import { AnimatePresence, motion } from "framer-motion";
import { TransitionType } from "../animations/types";
import { getTransitionTransform } from "../animations/TransitionController";
import "../animations/animations.css";

type Timeout = ReturnType<typeof setTimeout>;
let timeout: Timeout;
export interface FrameProps {
  width: number;
  height: number;
  data: SerializedPage[];
  transitionType?: TransitionType;
  transitionDuration?: number;
}
export const Frame: FC<FrameProps> = ({
  width,
  height,
  data,
  transitionType = TransitionType.FADE,
  transitionDuration = 500,
}) => {
  const pageRef = useRef<HTMLDivElement[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [size, setSize] = useState({ width, height, scale: 1 });
  const fonts = getUsedFonts(data);
  const moveSlide = useCallback(
    (number: number) => {
      setActiveSlide((prevState) => {
        const value = (prevState + number) % data.length;
        if (value >= 0) {
          return value;
        } else {
          return data.length + value;
        }
      });
    },
    [setActiveSlide, data.length]
  );

  const runSlide = useCallback(() => {
    timeout = setTimeout(() => {
      moveSlide(1);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, [moveSlide, activeSlide]);
  useEffect(() => {
    const updateSize = throttle(() => {
      timeout && clearTimeout(timeout);
      const { innerWidth, innerHeight } = window;
      const ratio = innerWidth / innerHeight;
      const pageRatio = width / height;
      const w = ratio > pageRatio ? innerHeight * pageRatio : innerWidth;
      const h = ratio > pageRatio ? innerHeight : innerWidth / pageRatio;
      const scale = w / width;
      setSize({
        width: w,
        height: h,
        scale,
      });
      if (pageRef.current) {
        pageRef.current.forEach((page) => {
          page.style.cssText = `transform: scale(${scale})`;
        });
      }
      runSlide();
    }, 16);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [width, height, runSlide]);
  const pages = useMemo(() => renderPages(data), [width, height]);

  // Get transition variants based on transition type
  const getTransitionVariants = () => {
    switch (transitionType) {
      case TransitionType.FADE:
        return {
          enter: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case TransitionType.SLIDE_LEFT:
        return {
          enter: { x: 0, opacity: 1 },
          exit: { x: "-100%", opacity: 0 },
        };
      case TransitionType.SLIDE_RIGHT:
        return {
          enter: { x: 0, opacity: 1 },
          exit: { x: "100%", opacity: 0 },
        };
      case TransitionType.SLIDE_UP:
        return {
          enter: { y: 0, opacity: 1 },
          exit: { y: "-100%", opacity: 0 },
        };
      case TransitionType.SLIDE_DOWN:
        return {
          enter: { y: 0, opacity: 1 },
          exit: { y: "100%", opacity: 0 },
        };
      case TransitionType.ZOOM:
        return {
          enter: { scale: 1, opacity: 1 },
          exit: { scale: 0.5, opacity: 0 },
        };
      case TransitionType.FLIP:
        return {
          enter: { rotateY: 0, opacity: 1 },
          exit: { rotateY: 90, opacity: 0 },
        };
      case TransitionType.CUBE:
        return {
          enter: { rotateX: 0, opacity: 1 },
          exit: { rotateX: 90, opacity: 0 },
        };
      default:
        return {
          enter: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getTransitionVariants();

  return (
    <div
      css={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1000px", // For 3D transitions
      }}
    >
      <GlobalStyle fonts={fonts} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial="exit"
          animate="enter"
          exit="exit"
          variants={variants}
          transition={{ duration: transitionDuration / 1000 }}
          css={{
            width: size.width,
            height: size.height,
            position: "absolute",
          }}
        >
          <PageRender
            ref={(el) => (el ? (pageRef.current[activeSlide] = el) : null)}
            boxSize={{ width, height }}
            scale={size.scale}
          >
            {pages[activeSlide]}
          </PageRender>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
