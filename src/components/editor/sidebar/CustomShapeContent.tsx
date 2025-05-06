/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import axios from "axios";
import { Delta } from "canva-editor/types";
import { getPositionWhenLayerCenter } from "canva-editor/utils/layer/getPositionWhenLayerCenter";
import Draggable from "canva-editor/layers/core/Dragable";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { Shape as ShapeType } from "./types";
import CustomShapeSearchBox from "./CustomShapeSearchBox";
import { FC, useCallback, useEffect, useRef, useState } from "react";

interface CustomShapeContentProps {
  onClose: () => void;
}

const CustomShapeContent: FC<CustomShapeContentProps> = ({ onClose }) => {
  const [keyword, setKeyword] = useState("");
  const { actions, state, config } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetect();

  // Constants for better control
  const PAGE_SIZE = 30;
  const SCROLL_THRESHOLD = 200; // px from bottom to trigger loading

  // Transform API data to match Shape interface
  const transformShapeData = useCallback(
    (
      apiData: Array<{
        img: string;
        desc?: string;
        clipPath?: string;
        width?: string | number;
        height?: string | number;
        background?: string;
      }>
    ): ShapeType[] => {
      return apiData.map((item, index) => {
        // Parse width and height, defaulting to 200 if not provided
        const width = item.width ? parseInt(String(item.width)) : 200;
        const height = item.height ? parseInt(String(item.height)) : 200;

        return {
          _id: `shape_${Date.now()}_${index}`, // Add timestamp for better uniqueness
          title: item.desc || "Shape",
          description: item.desc,
          url: item.img,
          thumbnailUrl: item.img,
          tags: item.desc ? item.desc.split(" ") : [],
          svg: item.clipPath,
          width: width,
          height: height,
          background: item.background || "rgb(123, 68, 68)",
          isPublic: true,
        };
      });
    },
    []
  );

  // Fetch shapes using React Query's useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["shapes", keyword],
    queryFn: async ({ pageParam = 0 }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      // Build the API URL with query parameters
      let apiUrl = `${config.apis.url}${config.apis.searchShapes}?ps=${PAGE_SIZE}&pi=${pageParam}`;

      // Add search keyword if provided
      if (keyword) {
        apiUrl += `&kw=${encodeURIComponent(keyword)}`;
      }

      console.log(`Fetching shapes: ${apiUrl}`);

      const res = await axios.get(apiUrl);

      // Check if the response has a data property (array of shapes)
      const shapeData = res.data.data || res.data;
      const paginationInfo = res.data.pagination;

      // Transform the data to match our Shape interface
      const transformedShapes = transformShapeData(shapeData);

      // Determine if there are more shapes to load
      const hasMore =
        paginationInfo?.hasMore || transformedShapes.length === PAGE_SIZE;

      return {
        shapes: transformedShapes,
        nextPage: hasMore ? pageParam + 1 : undefined,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of shapes into a single array using useMemo to avoid unnecessary re-renders
  const displayShapes = useCallback(() => {
    return data?.pages.flatMap((page) => page.shapes) || [];
  }, [data?.pages])();

  // Check if we need to load more data when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const scrollContainer = scrollRef.current;
    const scrollBottom =
      scrollContainer.scrollTop + scrollContainer.clientHeight;
    const scrollThreshold = scrollContainer.scrollHeight - SCROLL_THRESHOLD;

    // When user scrolls near the bottom, load more shapes
    if (scrollBottom >= scrollThreshold) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  // Check if content doesn't fill the viewport and load more if needed
  useEffect(() => {
    // Skip if already loading, no more content, or no shapes yet
    if (isLoading || !hasNextPage || displayShapes.length === 0) {
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
        fetchNextPage();
      }
    };

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkContentHeight, 300);
    return () => clearTimeout(timer);
  }, [
    displayShapes,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Handle search
  const handleSearch = useCallback((kw: string) => {
    // Reset scroll position
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    setKeyword(kw);
  }, []);

  // Add shape to the editor
  const addShape = (shape: ShapeType, position?: Delta) => {
    try {
      // Get page size and calculate appropriate scaling
      const pageSize = state.pageSize;
      const shapeWidth = shape.width || 200; // Use shape width or default to 200
      const shapeHeight = shape.height || 200; // Use shape height or default to 200
      const pageRatio = pageSize.width / pageSize.height;
      const shapeRatio = shapeWidth / shapeHeight;

      // Calculate scale to fit shape properly on the page (50% of page size)
      const scale =
        pageRatio > shapeRatio
          ? (pageSize.height * 0.5) / shapeHeight
          : (pageSize.width * 0.5) / shapeWidth;

      // Calculate position if not provided
      const calculatedPosition =
        position ||
        getPositionWhenLayerCenter(state.pageSize, {
          width: shapeWidth * scale,
          height: shapeHeight * scale,
        });

      // If shape has SVG content, add it as SVG layer
      if (shape.svg) {
        // Use the addShapeLayer method for SVG shapes
        actions.addShapeLayer({
          type: {
            resolvedName: "ShapeLayer",
          },
          props: {
            position: calculatedPosition,
            boxSize: {
              width: shapeWidth * scale,
              height: shapeHeight * scale,
            },
            rotate: 0,
            clipPath: shape.svg,
            scale,
            color: shape.background || "rgb(123, 68, 68)",
            shapeSize: {
              width: shapeWidth,
              height: shapeHeight,
            },
          },
        });
      }
      // Otherwise add it as an image layer
      else {
        // For image layers, load the image first to get its natural dimensions
        const img = new window.Image();
        img.onerror = (err) => {
          console.error(err);
        };
        img.src = shape.url;
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Calculate scale based on actual image dimensions
          const imgWidth = img.naturalWidth || shapeWidth;
          const imgHeight = img.naturalHeight || shapeHeight;

          actions.addImageLayer(
            { thumb: shape.url, url: shape.url, position: calculatedPosition },
            { width: imgWidth, height: imgHeight }
          );
        };
      }

      if (isMobile) {
        onClose();
      }
    } catch (error) {
      console.error("Error adding shape:", error);
    }
  };

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
        <CustomShapeSearchBox
          searchString={keyword}
          onStartSearch={handleSearch}
        />
      </div>
      <div
        ref={scrollRef}
        css={{
          flexDirection: "column",
          display: "flex",
          flexGrow: 1,
          height: "calc(100% - 80px)", // Subtract header height
          overflowY: "auto", // Enable scrolling on this container
          marginTop: 16,
          padding: "4px 0", // Add padding to ensure scrolling works properly
        }}
      >
        <div
          css={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gridGap: 8,
            width: "100%",
            minHeight: "100%",
          }}
        >
          {displayShapes.length === 0 ? (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              {isLoading
                ? "Loading shapes..."
                : isError
                ? "Failed to load shapes. Please try again."
                : "No shapes found. Try a different search term."}
            </div>
          ) : (
            displayShapes.map((item) => (
              <Draggable
                key={item._id}
                onDrop={(pos) => {
                  if (pos) {
                    addShape(item, pos);
                  }
                }}
                onClick={() => {
                  addShape(item);
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
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      padding: "8px",
                    }}
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      loading="lazy"
                      alt={item.title || "Shape"}
                      css={{
                        maxHeight: "80%",
                        maxWidth: "80%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                </div>
              </Draggable>
            ))
          )}

          {/* Loading spinner for fetching next page */}
          {isFetchingNextPage && displayShapes.length > 0 && (
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

          {/* End of shapes message */}
          {!isLoading && !hasNextPage && displayShapes.length > 0 && (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "10px 0",
                fontSize: "12px",
                color: "#888",
              }}
            >
              End of shapes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomShapeContent;
