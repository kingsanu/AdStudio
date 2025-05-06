import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import HorizontalCarousel from "canva-editor/components/carousel/HorizontalCarousel";
import OutlineButton from "canva-editor/components/button/OutlineButton";
import axios from "axios";
// import Fuse from "fuse.js"; // Not needed with React Query
import { Delta } from "canva-editor/types";
import Draggable from "canva-editor/layers/core/Dragable";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { Image as ImageType } from "./types";
import CustomImageSearchBox from "./CustomImageSearchBox";

interface CustomImageContentProps {
  onClose: () => void;
}

const CustomImageContent: FC<CustomImageContentProps> = ({ onClose }) => {
  const { actions, config } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const isMobile = useMobileDetect();
  const PAGE_SIZE = 30;
  const SCROLL_THRESHOLD = 200;

  // Transform API data to match Image interface
  const transformImageData = useCallback(
    (apiData: Array<{ img: string; desc?: string }>): ImageType[] => {
      return apiData.map((item, index) => ({
        _id: `image_${Date.now()}_${index}`, // Add timestamp for better uniqueness
        title: item.desc || "Image",
        description: item.desc,
        url: item.img,
        thumbnailUrl: item.img,
        tags: item.desc ? item.desc.split(" ") : [],
        isPublic: true,
      }));
    },
    []
  );

  // Fetch images using React Query's useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["images", keyword],
    queryFn: async ({ pageParam = 0 }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      console.log(
        `[CustomImageContent] Loading page ${pageParam} with keyword: ${
          keyword || "none"
        }`
      );

      // Build the API URL with query parameters
      let apiUrl = `${config.apis.url}${config.apis.searchImages}`;
      const params = new URLSearchParams();

      // Add pagination parameters
      params.append("ps", PAGE_SIZE.toString());
      params.append("pi", pageParam.toString());

      // Add keyword if provided
      if (keyword) {
        params.append("kw", keyword);
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      console.log(
        `[CustomImageContent] Fetching page ${pageParam} with URL: ${apiUrl}`
      );

      const res = await axios.get(apiUrl);

      // Check if the response has a data property (array of images)
      const imageData = res.data.data || res.data;
      const paginationInfo = res.data.pagination;

      // Transform the data to match our Image interface
      const transformedImages = transformImageData(imageData);

      console.log(
        `[CustomImageContent] Loaded ${transformedImages.length} images for page ${pageParam}`
      );

      // Determine if there are more images to load
      let hasMoreImages = false;

      if (paginationInfo) {
        // Use pagination info from API if available
        hasMoreImages = paginationInfo.hasMore;
      } else {
        // Fallback to checking if we got a full page
        hasMoreImages = transformedImages.length === PAGE_SIZE;
      }

      return {
        images: transformedImages,
        nextPage: hasMoreImages ? pageParam + 1 : undefined,
        hasMore: hasMoreImages,
        totalImages: pageParam * PAGE_SIZE + transformedImages.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of images into a single array
  const displayImages = useCallback(() => {
    return data?.pages.flatMap((page) => page.images) || [];
  }, [data?.pages])();

  // Get total loaded images count
  const totalLoadedImages =
    data?.pages[data.pages.length - 1]?.totalImages || 0;
  const currentPage = data?.pages.length || 0;

  // Check if we need to load more data when the container is too small
  useEffect(() => {
    // Skip if already loading, no more content, or no images yet
    if (isLoading || !hasNextPage || displayImages.length === 0) {
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
          "[CustomImageContent] Content doesn't fill viewport, loading more images"
        );
        fetchNextPage();
      }
    };

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkContentHeight, 300);
    return () => clearTimeout(timer);
  }, [
    displayImages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Debug scroll container dimensions
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      console.log(
        `[CustomImageContent] Scroll container - scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, scrollTop: ${scrollTop}, difference: ${
          scrollHeight - clientHeight
        }`
      );
    }
  }, [displayImages.length]);

  // Check if we need to load more data when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // Log scroll position for debugging
    console.log(
      `[CustomImageContent] Scroll position: ${scrollPosition}, threshold: ${scrollThreshold}, diff: ${
        scrollThreshold - scrollPosition
      }`
    );

    // When user scrolls near the bottom, load more images
    if (scrollPosition >= scrollThreshold) {
      console.log(
        "[CustomImageContent] User scrolled to bottom, loading more images"
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
      console.log("[CustomImageContent] Adding scroll event listener");
      currentScrollRef.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (currentScrollRef) {
        console.log("[CustomImageContent] Removing scroll event listener");
        currentScrollRef.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScroll]);

  // Handle search
  const handleSearch = useCallback((kw: string) => {
    console.log(`[CustomImageContent] Searching for: ${kw || "empty"}`);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    setKeyword(kw);
  }, []);

  // Add image to the editor
  const addImage = async (imageUrl: string, position?: Delta) => {
    try {
      const img = new window.Image();
      img.onerror = (err) => {
        console.error(err);
      };
      img.src = imageUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        actions.addImageLayer(
          { thumb: imageUrl, url: imageUrl, position },
          { width: img.naturalWidth, height: img.naturalHeight }
        );
        if (isMobile) {
          onClose();
        }
      };
    } catch (error) {
      console.error("Error adding image:", error);
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
      }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}
      <div>
        <CustomImageSearchBox
          searchString={keyword}
          onStartSearch={handleSearch}
        />
        <div css={{ paddingTop: 8 }}>
          <HorizontalCarousel>
            {config.imageKeywordSuggestions &&
              config.imageKeywordSuggestions.split(",").map((kw) => (
                <div key={kw} className="carousel-item">
                  <OutlineButton
                    onClick={() => {
                      setKeyword(kw);
                      handleSearch(kw);
                    }}
                  >
                    {kw}
                  </OutlineButton>
                </div>
              ))}
          </HorizontalCarousel>
        </div>
      </div>
      <div
        css={{
          flexDirection: "column",
          display: "flex",
          flexGrow: 1,
          height: "calc(100% - 100px)", // Subtract header height
          marginTop: 16,
        }}
      >
        <div
          ref={scrollRef}
          css={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gridGap: 8,
            height: "100%",
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          }}
        >
          {displayImages.length === 0 ? (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              {isLoading
                ? "Loading images..."
                : "No images found. Try a different search term."}
            </div>
          ) : (
            displayImages.map((item, index) => (
              <Draggable
                key={`${item._id}-${index}`}
                onDrop={(pos) => {
                  if (pos) {
                    addImage(item.url, pos);
                  }
                }}
                onClick={() => {
                  addImage(item.url);
                }}
              >
                <div
                  css={{
                    cursor: "pointer",
                    position: "relative",
                    paddingBottom: "100%",
                    width: "100%",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    loading="lazy"
                    alt={item.title || "Image"}
                    css={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </Draggable>
            ))
          )}

          {/* Loading more indicator */}
          {isFetchingNextPage && displayImages.length > 0 && (
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

          {/* End of images message */}
          {!isLoading && !hasNextPage && displayImages.length > 0 && (
            <div
              css={{
                gridColumn: "span 3",
                textAlign: "center",
                padding: "10px 0",
                fontSize: "12px",
                color: "#888",
              }}
            >
              End of images
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomImageContent;
