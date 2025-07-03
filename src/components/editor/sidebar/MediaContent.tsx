/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import axios from "axios";
import { getPositionWhenLayerCenter } from "canva-editor/utils/layer/getPositionWhenLayerCenter";
import Draggable from "canva-editor/layers/core/Dragable";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaUploadForm from "./MediaUploadForm";
import { cloneDeep } from "lodash";
import { RootLayerProps } from "canva-editor/layers/RootLayer";
// Custom scrollbar removed to fix drag functionality

// Constants for infinite loading
const PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 300; // pixels from bottom to trigger loading more

// Media section types
type MediaSection =
  | "images"
  | "backgrounds"
  | "illustrations"
  | "icons"
  | "threeDImages";

// View state types
type ViewState = "overview" | "expanded";

interface ExpandedViewState {
  section: MediaSection;
  title: string;
}

// Create a search box component for media
const MediaSearchBox: FC<{
  searchString: string;
  onStartSearch: (keyword: string) => void;
}> = ({ searchString, onStartSearch }) => {
  const [value, setValue] = useState(searchString);

  const handleSearch = useCallback(() => {
    onStartSearch(value);
  }, [value, onStartSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setValue("");
    onStartSearch("");
  }, [onStartSearch]);

  useEffect(() => {
    setValue(searchString);
  }, [searchString]);

  return (
    <div
      css={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search media..."
        css={{
          width: "100%",
          padding: "8px 32px 8px 12px",
          borderRadius: "4px",
          border: "1px solid #ddd",
          fontSize: "14px",
          "&:focus": {
            outline: "none",
            borderColor: "#0070f3",
          },
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          css={{
            position: "absolute",
            right: "40px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#666",
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      <button
        onClick={handleSearch}
        css={{
          position: "absolute",
          right: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "#666",
        }}
        aria-label="Search"
      >
        🔍
      </button>
    </div>
  );
};

// Define media item types
interface MediaItem {
  _id: string;
  name?: string;
  url?: string;
  img: string;
  desc?: string;
  category?: string;
  thumbnailUrl?: string;
}

interface MediaContentProps {
  onClose: () => void;
}

// Enhanced draggable component with higher z-index for media items
const MediaDraggable: FC<{ 
  children: React.ReactNode; 
  onDrop: (pos: any) => void; 
  onClick: () => void; 
}> = ({ children, onDrop, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isClick, setIsClick] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 50, h: 50 });

  const handleMouseDown = (e: any) => {
    setIsClick(true);

    setTimeout(() => {
      if (isClick) {
        setIsDragging(false);
        e.preventDefault();
      }
    }, 300);

    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    const offsetW = ref.current?.offsetWidth || 0;
    const offsetH = ref.current?.offsetHeight ? ref.current?.offsetHeight / 2 : 0;

    setPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY - offsetH });
    setSize({ w: offsetW, h: offsetH });

    function isInDropArea(e: MouseEvent) {
      const dropArea: any = getElementByClassNearestTheCursorPosition(e, "page-content");
      if (!dropArea) return false;

      const clientX = e.clientX;
      const clientY = e.clientY;
      const dropAreaRect = dropArea.getBoundingClientRect();
      const x = dropAreaRect.left;
      const y = dropAreaRect.top;
      const width = dropAreaRect.width;
      const height = dropAreaRect.height;

      return (
        clientX >= x &&
        clientX <= x + width &&
        clientY >= y &&
        clientY <= y + height
      );
    }

    const handleMouseMove = (e: MouseEvent) => {
      setIsClick(false);
      setIsDragging(true);

      const x = e.clientX - offsetX,
        y = e.clientY - offsetY - offsetH;
      setPosition({ x, y });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      onDrop(
        isInDropArea(e)
          ? { x: e.clientX - offsetW, y: e.clientY - offsetH }
          : null
      );
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  function getElementByClassNearestTheCursorPosition(e: MouseEvent, className: string) {
    const cursorX = e.clientX;
    const cursorY = e.clientY;
    const elements = document.querySelectorAll(`.${className}`);
    let closestElement: Element | null = null;
    let closestDistance = Infinity;

    for (const element of elements) {
      const elementRect = element.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(cursorX - elementRect.left, 2) +
          Math.pow(cursorY - elementRect.top, 2)
      );

      if (distance < closestDistance) {
        closestElement = element;
        closestDistance = distance;
      }
    }

    return closestElement;
  }

  return (
    <>
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (isClick && onClick) {
            onClick();
          }
        }}
      >
        {isDragging && (
          <div
            css={{
              width: size.w,
              height: size.h,
            }}
          >
            {""}
          </div>
        )}
        <div
          ref={dragRef}
          style={{
            ...(isDragging && {
              position: "fixed", // Use fixed instead of absolute for better positioning
              left: position.x,
              top: position.y,
              width: size.w,
              height: size.h,
              zIndex: 99999, // Much higher z-index
              pointerEvents: "none", // Prevent interference with drop detection
            }),
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

const MediaContent: FC<MediaContentProps> = ({ onClose }) => {
  const { actions, state, config } = useEditor();
  const [keyword, setKeyword] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetect();
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Enhanced view state management
  const [viewState, setViewState] = useState<ViewState>("overview");
  const [expandedView, setExpandedView] = useState<ExpandedViewState | null>(
    null
  );
  const [overviewScrollPosition, setOverviewScrollPosition] = useState(0);

  // Remove global styles as they interfere with horizontal scroll
  // The MediaDraggable component with position: fixed handles the overflow issue
  /*
  useEffect(() => {
    const styleId = 'media-drag-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        // Only allow overflow for the main media content container vertically
        .media-content-container {
          overflow: visible !important;
        }
        
        // Keep horizontal scroll functionality intact
        .media-horizontal-scroll {
          overflow-x: hidden !important;
          overflow-y: visible !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  */

  // Create refs for scroll containers (main screen - collapsed state)
  const backgroundsMainScrollRef = useRef<HTMLDivElement>(null);
  const illustrationsMainScrollRef = useRef<HTMLDivElement>(null);
  const iconsMainScrollRef = useRef<HTMLDivElement>(null);
  const threeDMainScrollRef = useRef<HTMLDivElement>(null);

  // Scroll functions for horizontal scroll
  const scrollHorizontal = (containerRef: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 140; // Width of 1 item + gap
      const currentScroll = containerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      containerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Helper function to get API endpoint for each media type
  const getApiEndpoint = (section: MediaSection): string => {
    switch (section) {
      case "images":
        return "/media/images";
      case "backgrounds":
        return "/media/backgrounds";
      case "illustrations":
        return "/media/illustrations";
      case "icons":
        return "/media/icons";
      case "threeDImages":
        return "/media/3dimages";
      default:
        return "/media/images";
    }
  };

  // Helper function to get section title
  const getSectionTitle = (section: MediaSection): string => {
    switch (section) {
      case "images":
        return "Images";
      case "backgrounds":
        return "Backgrounds";
      case "illustrations":
        return "Illustrations";
      case "icons":
        return "Icons";
      case "threeDImages":
        return "3D Images";
      default:
        return "Images";
    }
  };

  // Navigation functions
  const handleViewMore = (section: MediaSection) => {
    // Save current scroll position
    if (scrollRef.current) {
      setOverviewScrollPosition(scrollRef.current.scrollTop);
    }

    // Set expanded view state
    setExpandedView({
      section,
      title: getSectionTitle(section),
    });
    setViewState("expanded");

    // Reset scroll to top for expanded view
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const handleBackToOverview = () => {
    setViewState("overview");
    setExpandedView(null);

    // Restore scroll position
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = overviewScrollPosition;
      }
    }, 0);
  };

  // Generic media fetcher using React Query
  const useMediaQuery = (section: MediaSection, enabled: boolean = true) => {
    return useInfiniteQuery({
      queryKey: [section, keyword, viewState],
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        if (!config.apis) {
          throw new Error("API configuration is missing");
        }

        let apiUrl = `${config.apis.url}${getApiEndpoint(section)}`;
        const params = new URLSearchParams();

        // Add pagination parameters
        params.append("ps", PAGE_SIZE.toString());
        params.append("pi", pageParam.toString());

        // Add keyword if provided
        if (keyword) {
          params.append("kw", keyword);
        }

        // Append params to URL
        apiUrl += `?${params.toString()}`;

        const response = await axios.get(apiUrl);
        const items = response.data.data || response.data || [];

        return {
          items,
          nextPage:
            items.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextPage,
      enabled,
    });
  };

  // Create queries for each media type
  const backgroundsQuery = useMediaQuery(
    "backgrounds",
    viewState === "overview" || expandedView?.section === "backgrounds"
  );
  const illustrationsQuery = useMediaQuery(
    "illustrations",
    viewState === "overview" || expandedView?.section === "illustrations"
  );
  const iconsQuery = useMediaQuery(
    "icons",
    viewState === "overview" || expandedView?.section === "icons"
  );
  const threeDImagesQuery = useMediaQuery(
    "threeDImages",
    viewState === "overview" || expandedView?.section === "threeDImages"
  );
  const imagesQuery = useMediaQuery(
    "images",
    viewState === "overview" || expandedView?.section === "images"
  );

  // Flatten the pages of data into single arrays
  const backgrounds =
    backgroundsQuery.data?.pages.flatMap((page: any) => page.items) || [];
  const illustrations =
    illustrationsQuery.data?.pages.flatMap((page: any) => page.items) || [];
  const icons = iconsQuery.data?.pages.flatMap((page: any) => page.items) || [];
  const threeDImages =
    threeDImagesQuery.data?.pages.flatMap((page: any) => page.items) || [];
  const images =
    imagesQuery.data?.pages.flatMap((page: any) => page.items) || [];

  // Handle search
  const handleSearch = useCallback((kw: string) => {
    // Reset scroll position
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setKeyword(kw);
  }, []);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // When user scrolls near the bottom, load more data for the current view
    if (scrollPosition >= scrollThreshold) {
      if (viewState === "expanded" && expandedView) {
        // Load more data for the expanded section
        const query = getQueryForSection(expandedView.section);
        if (query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      }
    }
  }, [viewState, expandedView]);

  // Helper to get the appropriate query for a section
  const getQueryForSection = (section: MediaSection) => {
    switch (section) {
      case "backgrounds":
        return backgroundsQuery;
      case "illustrations":
        return illustrationsQuery;
      case "icons":
        return iconsQuery;
      case "threeDImages":
        return threeDImagesQuery;
      case "images":
        return imagesQuery;
      default:
        return backgroundsQuery;
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const handleScrollThrottled = () => {
      window.requestAnimationFrame(handleScroll);
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScroll]);

  // Handle setting image as background (adapted from LayerContextMenu.tsx)
  const handleSetAsBackground = async (imageUrl: string, naturalWidth: number, naturalHeight: number) => {
    try {
      const ratio = state.pageSize.width / state.pageSize.height;
      const imageRatio = naturalWidth / naturalHeight;

      const background = {
        url: imageUrl,
        thumb: imageUrl,
        boxSize: { width: naturalWidth, height: naturalHeight },
        position: { x: 0, y: 0 },
        rotate: 0,
      };

      if (ratio > imageRatio) {
        background.boxSize.width = state.pageSize.width;
        background.boxSize.height = state.pageSize.width / imageRatio;
        background.position.y = (background.boxSize.height - state.pageSize.height) / -2;
        background.position.x = 0;
      } else {
        background.boxSize.height = state.pageSize.height;
        background.boxSize.width = state.pageSize.height * imageRatio;
        background.position.x = (background.boxSize.width - state.pageSize.width) / -2;
        background.position.y = 0;
      }

      actions.setProp<RootLayerProps>(state.activePage, 'ROOT', {
        image: background,
      });

      return true;
    } catch (error) {
      console.error("Error setting background:", error);
      return false;
    }
  };

  // Handle adding media to canvas with enhanced functionality
  const handleAddMedia = async (item: MediaItem, section?: MediaSection) => {
    try {
      // Show loading toast
      toast.loading("Adding media to canvas...");

      // Use the complete URL with the proxy endpoint
      const encodedUrl = encodeURIComponent(item.img);

      // Get the proxied image through the backend
      const proxyResponse = await axios.get(
        `${config.apis.url}/proxy-image/${encodedUrl}`
      );
      if (!proxyResponse.data || !proxyResponse.data.url) {
        throw new Error("Invalid response from proxy server");
      }

      const imageUrl = proxyResponse.data.url;
      // For image-based media, load the image first to get its natural dimensions
      const img = new window.Image();

      // Create a promise to handle image loading
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onerror = (err) => {
          console.error(err);
          reject(new Error("Failed to load image"));
        };

        img.onload = async () => {
          try {
            // Check if this is a background image
            if (section === "backgrounds") {
              // Set as background instead of adding as layer
              const success = await handleSetAsBackground(imageUrl, img.naturalWidth, img.naturalHeight);
              if (success) {
                resolve();
              } else {
                reject(new Error("Failed to set as background"));
              }
            } else {
              // Calculate position for the center of the canvas
              const position = getPositionWhenLayerCenter(state.pageSize, {
                width: img.naturalWidth,
                height: img.naturalHeight,
              });

              // Add as image layer
              actions.addImageLayer(
                { thumb: imageUrl, url: imageUrl, position },
                {
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                }
              );

              resolve();
            }
          } catch (error) {
            reject(error);
          }
        };
      });

      // Set the image source to start loading
      img.src = imageUrl;
      img.crossOrigin = "anonymous";

      // Wait for the image to load
      await imageLoadPromise;

      // Dismiss loading toast and show success
      toast.dismiss();
      if (section === "backgrounds") {
        toast.success(`Set ${item.name || "image"} as background`);
      } else {
        toast.success(`Added ${item.name || "media"} to canvas`);
      }

      // Close sidebar on mobile
      if (isMobile) {
        onClose();
      }
    } catch (error) {
      console.error(`Error adding media:`, error);
      toast.dismiss();
      toast.error(`Failed to add media: ${(error as Error).message}`);
    }
  };

  // Render breadcrumb navigation for expanded view
  const renderBreadcrumb = () => {
    if (viewState !== "expanded" || !expandedView) return null;

    return (
      <div
        css={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
          fontSize: "14px",
          color: "#666",
        }}
      >
        <button
          onClick={handleBackToOverview}
          css={{
            background: "none",
            border: "none",
            color: "#0070f3",
            cursor: "pointer",
            fontSize: "14px",
            padding: 0,
            marginRight: "8px",
          }}
        >
          Media
        </button>
        <span css={{ margin: "0 4px" }}>{">"}</span>
        <span css={{ fontWeight: 600 }}>{expandedView.title}</span>
      </div>
    );
  };

  // Render a media section for overview
  const renderOverviewSection = (
    title: string,
    items: MediaItem[],
    section: MediaSection,
    isLoading: boolean,
    scrollContainerRef: React.RefObject<HTMLDivElement>
  ) => {
    const displayItems = items.slice(0, 8); // Show 8 items instead of 3
    const hasMoreItems = items.length > 4; // Show "View More" if more than 4 items

    return (
      <div css={{ marginBottom: "20px" }}>
        <div
          css={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 10px",
            marginBottom: "10px",
          }}
        >
          <h3
            css={{
              fontSize: "16px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {title}
          </h3>
          {hasMoreItems && (
            <button
              css={{
                background: "none",
                border: "none",
                color: "#0070f3",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={() => handleViewMore(section)}
            >
              View More
            </button>
          )}
        </div>

        {items.length === 0 && !isLoading ? (
          <div
            css={{
              padding: "20px 10px",
              textAlign: "center",
              color: "#666",
              fontSize: "14px",
            }}
          >
            No {title.toLowerCase()} available
          </div>
        ) : (
          <div
            css={{
              position: "relative",
              marginBottom: "10px",
            }}
          >
            {/* Left scroll arrow */}
            <button
              css={{
                position: "absolute",
                left: "0px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                },
              }}
              onClick={() => scrollHorizontal(scrollContainerRef, 'left')}
            >
              <ChevronLeft size={12} />
            </button>

            {/* Right scroll arrow */}
            <button
              css={{
                position: "absolute",
                right: "0px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                },
              }}
              onClick={() => scrollHorizontal(scrollContainerRef, 'right')}
            >
              <ChevronRight size={12} />
            </button>

            {/* Scrollable container */}
            <div
              ref={scrollContainerRef}
              css={{
                overflowX: "hidden",
                display: "flex",
                gap: "12px",
                height:"130px",
                // border: "1px solid #ddd",
                padding: "0 10px",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {displayItems.map((item) => (
                <MediaDraggable
                  key={item._id}
                  onDrop={async (pos) => {
                    if (pos) {
                      await handleAddMedia(item, section);
                    }
                  }}
                  onClick={() => handleAddMedia(item, section)}
                >
                  <div
                    css={{
                      cursor: "pointer",
                      position: "relative",
                      width: "120px",
                      height: "120px",
                      flexShrink: 0,
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      transition: "transform 0.2s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.03)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <img
                      src={`${config.apis?.url}/proxy-image/${encodeURIComponent(
                        item.img
                      )}`}
                      loading="lazy"
                      alt={item.name || title}
                      css={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = item.img;
                      }}
                    />
                  </div>
                </MediaDraggable>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render expanded section view
  const renderExpandedSection = () => {
    if (viewState !== "expanded" || !expandedView) return null;

    const query = getQueryForSection(expandedView.section);
    const items = query.data?.pages.flatMap((page: any) => page.items) || [];

    return (
      <div 
        css={{ 
          padding: "16px",
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#c1c1c1 transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c1c1c1",
            borderRadius: "3px",
            opacity: 0.7,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#a1a1a1",
          },
        }}
      >
        {items.length === 0 && !query.isLoading ? (
          <div
            css={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#666",
              fontSize: "16px",
            }}
          >
            No {expandedView.title.toLowerCase()} available
          </div>
        ) : (
          <div
            css={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {items.map((item) => (
              <MediaDraggable
                key={item._id}
                onDrop={async (pos) => {
                  if (pos) {
                    await handleAddMedia(item, expandedView.section);
                  }
                }}
                onClick={() => handleAddMedia(item, expandedView.section)}
              >
                <div
                  css={{
                    cursor: "pointer",
                    position: "relative",
                    width: "100%",
                    paddingBottom: "100%",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.03)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <img
                    src={`${config.apis?.url}/proxy-image/${encodeURIComponent(
                      item.img
                    )}`}
                    loading="lazy"
                    alt={item.name || expandedView.title}
                    css={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = item.img;
                    }}
                  />
                </div>
              </MediaDraggable>
            ))}
          </div>
        )}

        {query.isFetchingNextPage && (
          <div
            css={{
              textAlign: "center",
              padding: "15px 0",
              fontSize: "14px",
              color: "#666",
            }}
          >
            Loading more {expandedView.title.toLowerCase()}...
          </div>
        )}
      </div>
    );
  };

  // Handle refreshing data after upload
  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    // Refetch all media data
    backgroundsQuery.refetch();
    illustrationsQuery.refetch();
    iconsQuery.refetch();
    threeDImagesQuery.refetch();
    imagesQuery.refetch();
  };

  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        display: "flex",
        padding: 16,
        paddingRight:4,
        paddingBottom: 0,
        position: "relative", // Ensure proper positioning context
      }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}

      {showUploadForm ? (
        <MediaUploadForm
          onClose={() => setShowUploadForm(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      ) : (
        <>
          {/* Media Title */}
          <div
            css={{
              marginBottom: 16,
              padding: "0 4px",
            }}
          >
            <h2
              css={{
                fontSize: "18px",
                fontWeight: 600,
                margin: "0 0 12px 0",
                color: "#333",
              }}
            >
              Media
            </h2>
            <MediaSearchBox
              searchString={keyword}
              onStartSearch={handleSearch}
            />
          </div>

          {renderBreadcrumb()}

          <div
            ref={scrollRef}
            css={{
              flexGrow: 1,
              height: "calc(100% - 80px)",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#c1c1c1 transparent",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: "3px",
                opacity: 0.7,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#a1a1a1",
              },
            }}
          >
            <div
              css={{
                flexDirection: "column",
                display: "flex",
                padding: "4px 0",
              }}
            >
            {viewState === "overview" ? (
              <>
                {/* {renderOverviewSection(
                  "Images",
                  images,
                  "images",
                  imagesQuery.isLoading
                )} */}
                {renderOverviewSection(
                  "Backgrounds",
                  backgrounds,
                  "backgrounds",
                  backgroundsQuery.isLoading,
                  backgroundsMainScrollRef
                )}
                {renderOverviewSection(
                  "Illustrations",
                  illustrations,
                  "illustrations",
                  illustrationsQuery.isLoading,
                  illustrationsMainScrollRef
                )}
                {renderOverviewSection(
                  "Icons",
                  icons,
                  "icons",
                  iconsQuery.isLoading,
                  iconsMainScrollRef
                )}
                {renderOverviewSection(
                  "3D Images",
                  threeDImages,
                  "threeDImages",
                  threeDImagesQuery.isLoading,
                  threeDMainScrollRef
                )}
              </>
            ) : (
              renderExpandedSection()
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MediaContent;
