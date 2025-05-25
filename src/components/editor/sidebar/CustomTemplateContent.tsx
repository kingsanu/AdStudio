/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import HorizontalCarousel from "canva-editor/components/carousel/HorizontalCarousel";
import OutlineButton from "canva-editor/components/button/OutlineButton";
import { unpack } from "canva-editor/utils/minifier";
import axios from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import CustomTemplateSearchBox from "./CustomTemplateSearchBox";

interface CustomTemplateContentProps {
  onClose: () => void;
}

const CustomTemplateContent: FC<CustomTemplateContentProps> = ({ onClose }) => {
  const { actions, activePage, config } = useEditor((state, config) => ({
    config,
    activePage: state.activePage,
  }));

  const scrollRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const isMobile = useMobileDetect();
  const ITEMS_PER_PAGE = 10;
  const SCROLL_THRESHOLD = 100;
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // Fetch templates using React Query's useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["templates", keyword],
    queryFn: async ({ pageParam = 0 }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      console.log(
        `[CustomTemplateContent] Loading page ${pageParam} with keyword: ${
          keyword || "none"
        }`
      );

      // Build the API URL with query parameters
      let apiUrl = `${config.apis.url}${config.apis.searchTemplates}`;
      const params = new URLSearchParams();

      // Add pagination parameters
      params.append("ps", ITEMS_PER_PAGE.toString());
      params.append("pi", pageParam.toString());

      // Only fetch public templates
      params.append("isPublic", "true");

      // Add search keyword if provided
      if (keyword) {
        params.append("kw", keyword);
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const res = await axios.get(apiUrl);

      // Handle new response format with pagination info
      const templates = res.data.data || res.data;
      const paginationInfo = res.data.pagination;

      console.log(
        `[CustomTemplateContent] Loaded ${templates.length} templates for page ${pageParam}`
      );

      // Determine if there are more templates to load
      let hasMoreTemplates = false;

      if (paginationInfo) {
        hasMoreTemplates = paginationInfo.hasMore;
      } else {
        // Fallback if pagination info is not available
        hasMoreTemplates = templates.length === ITEMS_PER_PAGE;
      }

      console.log(
        `[CustomTemplateContent] Has more templates: ${hasMoreTemplates}`
      );

      return {
        templates,
        nextPage: hasMoreTemplates ? pageParam + 1 : undefined,
        hasMore: hasMoreTemplates,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of templates into a single array
  const displayTemplates = useCallback(() => {
    return data?.pages.flatMap((page) => page.templates) || [];
  }, [data?.pages])();

  // Check if we need to load more data when the container is too small
  useEffect(() => {
    // Skip if already loading, no more content, or no templates yet
    if (isLoading || !hasNextPage || displayTemplates.length === 0) {
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
          "[CustomTemplateContent] Content doesn't fill viewport, loading more templates"
        );
        fetchNextPage();
      }
    };

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkContentHeight, 300);
    return () => clearTimeout(timer);
  }, [
    displayTemplates,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Check if we need to load more data when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // Log scroll position for debugging
    console.log(
      `[CustomTemplateContent] Scroll position: ${scrollPosition}, threshold: ${scrollThreshold}, diff: ${
        scrollThreshold - scrollPosition
      }`
    );

    // When user scrolls near the bottom, load more templates
    if (scrollPosition >= scrollThreshold) {
      console.log(
        "[CustomTemplateContent] User scrolled to bottom, loading more templates"
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
      console.log("[CustomTemplateContent] Adding scroll event listener");
      currentScrollRef.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (currentScrollRef) {
        console.log("[CustomTemplateContent] Removing scroll event listener");
        currentScrollRef.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScroll]);

  // Handle search
  const handleSearch = useCallback((kw: string) => {
    console.log(`[CustomTemplateContent] Searching for: ${kw || "empty"}`);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    setKeyword(kw);
  }, []);

  // Debug scroll container dimensions
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      console.log(
        `[CustomTemplateContent] Scroll container - scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, scrollTop: ${scrollTop}, difference: ${
          scrollHeight - clientHeight
        }`
      );
    }
  }, [displayTemplates.length]);

  // Add template pages to the editor
  const addPages = async (data: unknown) => {
    try {
      if (Array.isArray(data)) {
        data.forEach((page, idx) => {
          const serializedData = unpack(page);
          actions.changePageSize(serializedData.layers.ROOT.props.boxSize);
          actions.setPage(activePage + idx, serializedData);
        });
      } else {
        const serializedData = unpack(data);
        actions.changePageSize(serializedData.layers.ROOT.props.boxSize);
        actions.setPage(activePage, serializedData);
      }
    } catch (err) {
      console.warn("Something went wrong!");
      console.log(err);
    }
    if (isMobile) {
      onClose();
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
        {/* No tabs here - directly show search and templates */}
        <CustomTemplateSearchBox
          searchString={keyword}
          onStartSearch={handleSearch}
        />
        <div css={{ paddingTop: 8 }}>
          <HorizontalCarousel>
            {config.templateKeywordSuggestions &&
              config.templateKeywordSuggestions.split(",").map((kw) => (
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
        }}
      >
        <div
          ref={scrollRef}
          css={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gridGap: 8,
            height: "100%",
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          }}
        >
          {displayTemplates.length === 0 ? (
            <div
              css={{
                gridColumn: "span 2",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              {isLoading
                ? "Loading templates..."
                : isError
                ? "Failed to load templates. Please try again."
                : "No templates found. Try a different search term."}
            </div>
          ) : (
            displayTemplates.map((item, index) => (
              <div
                key={`${item._id}-${index}`}
                css={{ cursor: "pointer", position: "relative" }}
                onClick={async () => {
                  setIsTemplateLoading(true);
                  try {
                    // Use the complete URL with the proxy endpoint
                    const encodedUrl = encodeURIComponent(item.templateUrl);

                    const templateData = await axios.get(
                      `${config.apis.url}/proxy-template-path/${encodedUrl}`
                    );
                    addPages(templateData.data);
                  } catch (error) {
                    console.error("Error loading template:", error);
                  } finally {
                    setIsTemplateLoading(false);
                  }
                }}
              >
                <img
                  src={`${item.thumbnailUrl}`}
                  loading="lazy"
                  alt={item.title}
                  css={{ width: "100%", height: "auto", borderRadius: "4px" }}
                />
                {item.description && (
                  <span
                    css={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      backgroundColor: "rgba(17,23,29,.6)",
                      padding: "1px 6px",
                      borderRadius: 6,
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    {item.pages ? item.pages : 1}
                  </span>
                )}
              </div>
            ))
          )}

          {isFetchingNextPage && displayTemplates.length > 0 && (
            <div
              css={{
                gridColumn: "span 2",
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

          {!isLoading && !hasNextPage && displayTemplates.length > 0 && (
            <div
              css={{
                gridColumn: "span 2",
                textAlign: "center",
                padding: "10px 0",
                fontSize: "12px",
                color: "#888",
              }}
            >
              End of templates
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomTemplateContent;
