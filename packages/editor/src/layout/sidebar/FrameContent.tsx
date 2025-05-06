import { FC, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useEditor } from "canva-editor/hooks";
import Draggable from "canva-editor/layers/core/Dragable";
import { Delta } from "canva-editor/types";
import CloseSidebarButton from "./CloseButton";
import FrameSearchBox from "./components/FrameSearchBox";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import { useInfiniteQuery } from "@tanstack/react-query";

interface Frame {
  img: string;
  desc: string;
  clipPath: string;
  width: number;
  height: number;
}
const FrameContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { actions, query, config } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const isMobile = useMobileDetect();
  const PAGE_SIZE = 18;
  const SCROLL_THRESHOLD = 200;

  // Transform API data to match Frame interface
  const transformFrameData = useCallback((apiData: any[]): Frame[] => {
    return apiData.map((item) => ({
      img: item.img,
      desc: item.desc || "",
      clipPath: item.clipPath,
      width: parseInt(item.width),
      height: parseInt(item.height),
    }));
  }, []);

  // Fetch frames using React Query's useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["frames", keyword],
    queryFn: async ({ pageParam = 0 }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      console.log(
        `[FrameContent] Loading page ${pageParam} with keyword: ${
          keyword || "none"
        }`
      );

      // Build the API URL with query parameters
      const apiUrl = `${config.apis.url}${config.apis.searchFrames}?ps=${PAGE_SIZE}&pi=${pageParam}&kw=${keyword}`;

      const res = await axios.get(apiUrl);

      // Check if the response has a data property (array of frames)
      const frameData = res.data.data || res.data;
      const paginationInfo = res.data.pagination;

      // Transform the data to match our Frame interface
      const transformedFrames = transformFrameData(frameData);

      // Determine if there are more frames to load
      let hasMore = false;

      if (paginationInfo) {
        // If we have pagination info, use hasMore flag
        hasMore = paginationInfo.hasMore;
      } else {
        // Otherwise, check if we got a full page of results
        hasMore = transformedFrames.length === PAGE_SIZE;
      }

      console.log(
        `[FrameContent] Loaded ${transformedFrames.length} items, hasMore: ${hasMore}`
      );

      return {
        frames: transformedFrames,
        nextPage: hasMore ? pageParam + 1 : undefined,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of frames into a single array
  const frames = useCallback(() => {
    return data?.pages.flatMap((page) => page.frames) || [];
  }, [data?.pages])();

  // Add an effect to check if we need to load more data when the container is too small
  useEffect(() => {
    // Skip if already loading, no more content, or no frames yet
    if (isLoading || !hasNextPage || frames.length === 0) {
      return;
    }

    // Check if content fills the viewport
    const checkContentHeight = () => {
      if (!scrollRef.current) return;

      const scrollContainer = scrollRef.current;
      const isContentShorterThanContainer =
        scrollContainer.scrollHeight <= scrollContainer.clientHeight;

      // If content doesn't fill viewport and we have more to load, load next page
      if (isContentShorterThanContainer && hasNextPage && !isFetchingNextPage) {
        console.log(
          "[FrameContent] Content doesn't fill viewport, loading more frames"
        );
        fetchNextPage();
      }
    };

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkContentHeight, 300);
    return () => clearTimeout(timer);
  }, [frames, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Check if we need to load more data when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // Log scroll position for debugging
    console.log(
      `[FrameContent] Scroll position: ${scrollPosition}, threshold: ${scrollThreshold}, diff: ${
        scrollThreshold - scrollPosition
      }`
    );

    // When user scrolls near the bottom, load more frames
    if (scrollPosition >= scrollThreshold) {
      console.log(
        "[FrameContent] User scrolled to bottom, loading more frames"
      );
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Add scroll event listener
  useEffect(() => {
    const handleScrollThrottled = () => {
      // Use requestAnimationFrame to throttle scroll events
      window.requestAnimationFrame(handleScroll);
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      console.log("[FrameContent] Adding scroll event listener");
      currentScrollRef.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (currentScrollRef) {
        console.log("[FrameContent] Removing scroll event listener");
        currentScrollRef.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScroll]);

  const handleSearch = (kw: string) => {
    console.log(`[FrameContent] Searching for: ${kw || "empty"}`);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    setKeyword(kw);
  };
  const addFrame = async (frame: Frame, position?: Delta) => {
    const pageSize = query.getPageSize();
    const pageRatio = pageSize.width / pageSize.height;
    const frameRatio = frame.width / frame.height;
    const scale =
      pageRatio > frameRatio
        ? (pageSize.height * 0.5) / frame.height
        : (pageSize.width * 0.5) / frame.width;

    actions.addFrameLayer({
      type: {
        resolvedName: "FrameLayer",
      },
      props: {
        position,
        boxSize: {
          width: frame.width * scale,
          height: frame.height * scale,
        },
        rotate: 0,
        clipPath: `path("${frame.clipPath}")`,
        scale,
        image: {
          boxSize: {
            width: frame.width,
            height: frame.height,
          },
          position: {
            x: 0,
            y: 0,
          },
          rotate: 0,
          thumb: frame.img,
          url: frame.img,
        },
      },
    });
    if (isMobile) {
      onClose();
    }
  };
  // Debug info
  console.log(
    `[FrameContent] Rendering with ${frames.length} frames, hasNextPage: ${hasNextPage}, isLoading: ${isLoading}`
  );

  // Debug scroll container dimensions
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      console.log(
        `[FrameContent] Scroll container - scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, scrollTop: ${scrollTop}, difference: ${
          scrollHeight - clientHeight
        }`
      );
    }
  }, [frames.length]);

  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        display: "flex",
        padding: 16,
        overflow: "hidden", // Prevent double scrollbars
      }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}
      <div
        css={{
          marginBottom: 16,
        }}
      >
        <FrameSearchBox onStartSearch={handleSearch} />
      </div>
      <div
        ref={scrollRef}
        css={{
          flexDirection: "column",
          display: "flex",
          flexGrow: 1,
          height: "calc(100% - 80px)", // Subtract header height
          overflowY: "auto", // Enable scrolling on this container
          overflowX: "hidden", // Hide horizontal scrollbar
          padding: "4px 0", // Add padding to ensure scrolling works properly
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
        }}
      >
        <div
          css={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gridGap: 8,
            width: "100%",
            minHeight: "100px", // Set a minimum height to ensure content is scrollable
          }}
        >
          {frames.length === 0 ? (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              {isLoading
                ? "Loading frames..."
                : isError
                ? "Failed to load frames. Please try again."
                : "No frames found. Try a different search term."}
            </div>
          ) : (
            frames.map((frame, index) => (
              <Draggable
                key={index}
                onDrop={(pos) => {
                  if (pos) {
                    addFrame(frame, pos);
                  }
                }}
                onClick={() => {
                  addFrame(frame);
                }}
              >
                <div css={{ cursor: "pointer", position: "relative" }}>
                  <div css={{ paddingBottom: "100%" }} />
                  <div
                    css={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={frame.img}
                      loading="lazy"
                      alt={frame.desc || "Frame"}
                      css={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                </div>
              </Draggable>
            ))
          )}

          {isFetchingNextPage && frames.length > 0 && (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "10px 0",
              }}
            >
              <div
                css={{
                  display: "inline-block",
                  width: "30px",
                  height: "30px",
                  border: "3px solid rgba(0, 0, 0, 0.1)",
                  borderTopColor: "#3498db",
                  borderRadius: "50%",
                  animation: "spin 1s ease-in-out infinite",
                  "@keyframes spin": {
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
            </div>
          )}

          {!isLoading && !hasNextPage && frames.length > 0 && (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "10px 0",
                fontSize: "12px",
                color: "#888",
              }}
            >
              End of frames
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrameContent;
