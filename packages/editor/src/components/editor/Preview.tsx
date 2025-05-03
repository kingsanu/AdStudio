import { FC, useCallback, useEffect, useState } from "react";
import Page from "./Page";
import { useEditor } from "../../hooks";
import { useUsedFont } from "../../hooks/useUsedFont";
import { GlobalStyle } from "canva-editor/layers";
import ArrowBackIcon from "canva-editor/icons/ArrowBackIcon";
import ArrowForwardIcon from "canva-editor/icons/ArrowForwardIcon";
import { AnimatePresence, motion } from "framer-motion";
import { TransitionType } from "../../animations/types";
import { useAnimation } from "../../animations/AnimationController";
import { useTransition } from "../../animations/TransitionController";

// Helper functions for framer-motion animations
const getInitialAnimationProps = (transitionType: TransitionType) => {
  switch (transitionType) {
    case TransitionType.FADE:
      return { opacity: 0 };
    case TransitionType.SLIDE_LEFT:
      return { x: "100%", opacity: 0 };
    case TransitionType.SLIDE_RIGHT:
      return { x: "-100%", opacity: 0 };
    case TransitionType.SLIDE_UP:
      return { y: "100%", opacity: 0 };
    case TransitionType.SLIDE_DOWN:
      return { y: "-100%", opacity: 0 };
    case TransitionType.ZOOM:
      return { scale: 0.5, opacity: 0 };
    case TransitionType.FLIP:
      return { rotateY: 90, opacity: 0 };
    case TransitionType.CUBE:
      return { rotateX: 90, opacity: 0 };
    default:
      return { opacity: 0 };
  }
};

const getAnimateProps = (transitionType: TransitionType) => {
  switch (transitionType) {
    case TransitionType.FADE:
      return { opacity: 1 };
    case TransitionType.SLIDE_LEFT:
    case TransitionType.SLIDE_RIGHT:
      return { x: 0, opacity: 1 };
    case TransitionType.SLIDE_UP:
    case TransitionType.SLIDE_DOWN:
      return { y: 0, opacity: 1 };
    case TransitionType.ZOOM:
      return { scale: 1, opacity: 1 };
    case TransitionType.FLIP:
      return { rotateY: 0, opacity: 1 };
    case TransitionType.CUBE:
      return { rotateX: 0, opacity: 1 };
    default:
      return { opacity: 1 };
  }
};

const getExitProps = (transitionType: TransitionType) => {
  switch (transitionType) {
    case TransitionType.FADE:
      return { opacity: 0 };
    case TransitionType.SLIDE_LEFT:
      return { x: "-100%", opacity: 0 };
    case TransitionType.SLIDE_RIGHT:
      return { x: "100%", opacity: 0 };
    case TransitionType.SLIDE_UP:
      return { y: "-100%", opacity: 0 };
    case TransitionType.SLIDE_DOWN:
      return { y: "100%", opacity: 0 };
    case TransitionType.ZOOM:
      return { scale: 0.5, opacity: 0 };
    case TransitionType.FLIP:
      return { rotateY: -90, opacity: 0 };
    case TransitionType.CUBE:
      return { rotateX: -90, opacity: 0 };
    default:
      return { opacity: 0 };
  }
};

type Interval = ReturnType<typeof setTimeout>;
let timeout: Interval;

interface Props {
  onClose: () => void;
}
const Preview: FC<Props> = ({ onClose }) => {
  const { pages, pageSize } = useEditor((state) => ({
    pages: state.pages,
    pageSize: state.pageSize,
  }));
  const [activeSlide, setActiveSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0, scale: 1 });
  const { usedFonts } = useUsedFont();
  const { animationState } = useAnimation();
  const { getSlideTransition } = useTransition();
  const [transitionType, setTransitionType] = useState<TransitionType>(
    TransitionType.FADE
  );
  const [transitionDuration, setTransitionDuration] = useState<number>(500);
  const moveSlide = useCallback(
    (number: number) => {
      // Calculate the next slide index
      const nextSlide =
        (((activeSlide + number) % pages.length) + pages.length) % pages.length;

      console.log(`Moving from slide ${activeSlide} to slide ${nextSlide}`);

      // Store the current slide as previous before changing
      setPreviousSlide(activeSlide);

      // Check if there's a transition defined between these slides
      const transitionKey = `${activeSlide}-${nextSlide}`;
      console.log("Looking for transition with key:", transitionKey);
      console.log("Available transitions:", animationState.slideTransitions);

      const transition = getSlideTransition(activeSlide, nextSlide);

      if (transition) {
        console.log("Found transition:", transition);
        setTransitionType(transition.transitionType);
        setTransitionDuration(transition.duration);
      } else {
        console.log("No transition found, using default");
        // Default transition
        setTransitionType(TransitionType.FADE);
        setTransitionDuration(500);
      }

      // Update the active slide
      setActiveSlide(nextSlide);
    },
    [
      activeSlide,
      pages.length,
      getSlideTransition,
      animationState.slideTransitions,
    ]
  );
  useEffect(() => {
    timeout = setTimeout(() => {
      moveSlide(1);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, [moveSlide, activeSlide]);

  useEffect(() => {
    const updateSize = () => {
      const { clientWidth, clientHeight } = window.document.body;
      const ratio = clientWidth / clientHeight;
      const pageRatio = pageSize.width / pageSize.height;
      if (ratio > pageRatio) {
        const w = clientHeight * pageRatio;
        setSize({
          width: w,
          height: clientHeight,
          scale: w / pageSize.width,
        });
      } else {
        const w = clientWidth;
        const h = w / pageRatio;
        setSize({
          width: w,
          height: h,
          scale: w / pageSize.width,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [pageSize]);

  useEffect(() => {
    const callback = (event: KeyboardEvent) => {
      if (event.code === "ArrowRight") {
        if (pages.length > 1) moveSlide(1);
      } else if (event.code === "ArrowLeft") {
        if (pages.length > 1) moveSlide(-1);
      } else if (event.code === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", callback);
    return () => {
      document.removeEventListener("keydown", callback);
    };
  }, []);

  if (size.width === 0) {
    return null;
  }

  return (
    <div
      css={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GlobalStyle fonts={usedFonts} />
      {pages.length > 1 && (
        <>
          <div
            css={{
              position: "absolute",
              top: "50%",
              transform: "translate(0, -50%)",
              left: "16px",
              zIndex: 1050,
            }}
          >
            <div
              css={{
                border: "1px solid #fff",
                background: "transparent",
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color: "#fff",
                borderRadius: "50%",
                cursor: "pointer",
                ":hover": {
                  background: "rgba(255,255,255,0.3)",
                  transition: "background-color 200ms linear",
                },
              }}
              onClick={() => moveSlide(-1)}
            >
              <ArrowBackIcon />
            </div>
          </div>
          <div
            css={{
              position: "absolute",
              top: "50%",
              transform: "translate(0, -50%)",
              right: "16px",
              zIndex: 1050,
            }}
          >
            <div
              css={{
                border: "1px solid #fff",
                background: "transparent",
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color: "#fff",
                borderRadius: "50%",
                cursor: "pointer",
                ":hover": {
                  background: "rgba(255,255,255,0.3)",
                  transition: "background-color 200ms linear",
                },
              }}
              onClick={() => moveSlide(1)}
            >
              <ArrowForwardIcon />
            </div>
          </div>
        </>
      )}
      <div
        css={{ width: size.width, height: size.height, perspective: "1000px" }}
      >
        <div css={{ position: "relative" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={getInitialAnimationProps(transitionType)}
              animate={getAnimateProps(transitionType)}
              exit={getExitProps(transitionType)}
              transition={{
                duration: transitionDuration / 1000,
                ease: "easeInOut",
              }}
              css={{
                position: "absolute",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d", // For 3D transitions
              }}
            >
              <Page
                pageIndex={activeSlide}
                width={pageSize.width}
                height={pageSize.height}
                scale={size.scale}
                isActive={true}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Preview;
