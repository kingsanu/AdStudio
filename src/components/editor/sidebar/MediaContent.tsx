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
import MediaUploadForm from "./MediaUploadForm";

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

const MediaContent: FC<MediaContentProps> = ({ onClose }) => {
  const { actions, state, config } = useEditor();
  const [keyword, setKeyword] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetect();
  const [showUploadForm, setShowUploadForm] = useState(false);

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<{
    backgrounds: boolean;
    illustrations: boolean;
    icons: boolean;
    threeDImages: boolean;
  }>({
    backgrounds: false,
    illustrations: false,
    icons: false,
    threeDImages: false,
  });

  // Constants for infinite loading
  const PAGE_SIZE = 20;
  const SCROLL_THRESHOLD = 300; // pixels from bottom to trigger loading more

  // Fetch backgrounds with infinite loading
  const {
    data: backgroundsData,
    fetchNextPage: fetchNextBackgrounds,
    hasNextPage: hasNextBackgrounds,
    isFetchingNextPage: isFetchingNextBackgrounds,
    isLoading: isLoadingBackgrounds,
    isError: isErrorBackgrounds,
    refetch: backgroundsRefetch,
  } = useInfiniteQuery({
    queryKey: ["backgrounds", keyword],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      let apiUrl = `${config.apis.url}/media/backgrounds`;
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
  });

  // Fetch illustrations with infinite loading
  const {
    data: illustrationsData,
    fetchNextPage: fetchNextIllustrations,
    hasNextPage: hasNextIllustrations,
    isFetchingNextPage: isFetchingNextIllustrations,
    isLoading: isLoadingIllustrations,
    isError: isErrorIllustrations,
    refetch: illustrationsRefetch,
  } = useInfiniteQuery({
    queryKey: ["illustrations", keyword],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      let apiUrl = `${config.apis.url}/media/illustrations`;
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
  });

  // Fetch icons with infinite loading
  const {
    data: iconsData,
    fetchNextPage: fetchNextIcons,
    hasNextPage: hasNextIcons,
    isFetchingNextPage: isFetchingNextIcons,
    isLoading: isLoadingIcons,
    isError: isErrorIcons,
    refetch: iconsRefetch,
  } = useInfiniteQuery({
    queryKey: ["icons", keyword],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      let apiUrl = `${config.apis.url}/media/icons`;
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
  });

  // Fetch 3D images with infinite loading
  const {
    data: threeDImagesData,
    fetchNextPage: fetchNextThreeDImages,
    hasNextPage: hasNextThreeDImages,
    isFetchingNextPage: isFetchingNextThreeDImages,
    isLoading: isLoadingThreeDImages,
    isError: isErrorThreeDImages,
    refetch: threeDImagesRefetch,
  } = useInfiniteQuery({
    queryKey: ["3dimages", keyword],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      let apiUrl = `${config.apis.url}/media/3dimages`;
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
  });

  // Flatten the pages of data into single arrays
  const backgrounds =
    backgroundsData?.pages.flatMap((page) => page.items) || [];
  const illustrations =
    illustrationsData?.pages.flatMap((page) => page.items) || [];
  const icons = iconsData?.pages.flatMap((page) => page.items) || [];
  const threeDImages =
    threeDImagesData?.pages.flatMap((page) => page.items) || [];

  // No need for client-side filtering with Fuse.js since the API handles search
  const filteredBackgrounds = backgrounds;
  const filteredIllustrations = illustrations;
  const filteredIcons = icons;
  const filteredThreeDImages = threeDImages;

  // Handle search
  const handleSearch = useCallback((kw: string) => {
    // Reset scroll position
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    setKeyword(kw);
  }, []);

  // Toggle section expansion and load more data if needed
  const toggleSection = (section: keyof typeof expandedSections) => {
    // If we're expanding a section, fetch the next page of data if available
    if (!expandedSections[section]) {
      // Load more data for the specific section
      switch (section) {
        case "backgrounds":
          if (hasNextBackgrounds && !isFetchingNextBackgrounds) {
            fetchNextBackgrounds();
          }
          break;
        case "illustrations":
          if (hasNextIllustrations && !isFetchingNextIllustrations) {
            fetchNextIllustrations();
          }
          break;
        case "icons":
          if (hasNextIcons && !isFetchingNextIcons) {
            fetchNextIcons();
          }
          break;
        case "threeDImages":
          if (hasNextThreeDImages && !isFetchingNextThreeDImages) {
            fetchNextThreeDImages();
          }
          break;
      }
    }

    // Toggle the section state
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle scroll to implement infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // When user scrolls near the bottom, load more data for expanded sections
    if (scrollPosition >= scrollThreshold) {
      // Check each expanded section and load more data if available
      if (
        expandedSections.backgrounds &&
        hasNextBackgrounds &&
        !isFetchingNextBackgrounds
      ) {
        fetchNextBackgrounds();
      }

      if (
        expandedSections.illustrations &&
        hasNextIllustrations &&
        !isFetchingNextIllustrations
      ) {
        fetchNextIllustrations();
      }

      if (expandedSections.icons && hasNextIcons && !isFetchingNextIcons) {
        fetchNextIcons();
      }

      if (
        expandedSections.threeDImages &&
        hasNextThreeDImages &&
        !isFetchingNextThreeDImages
      ) {
        fetchNextThreeDImages();
      }
    }
  }, [
    expandedSections,
    fetchNextBackgrounds,
    hasNextBackgrounds,
    isFetchingNextBackgrounds,
    fetchNextIllustrations,
    hasNextIllustrations,
    isFetchingNextIllustrations,
    fetchNextIcons,
    hasNextIcons,
    isFetchingNextIcons,
    fetchNextThreeDImages,
    hasNextThreeDImages,
    isFetchingNextThreeDImages,
  ]);

  // Add scroll event listener
  useEffect(() => {
    const handleScrollThrottled = () => {
      // Use requestAnimationFrame to throttle scroll events
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

  // Render a section with items
  const renderSection = (
    title: string,
    items: MediaItem[],
    isLoading: boolean,
    isError: boolean,
    isExpanded: boolean,
    sectionKey: keyof typeof expandedSections,
    isFetchingNext?: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasNextPage?: boolean // Used for API consistency but not needed in the component
  ) => {
    // If searching, show all items without "View More" button
    const showAll = isExpanded || !!keyword;
    const displayItems = showAll ? items : items.slice(0, 5);
    const hasMoreItems = items.length > 5;

    // Determine if we should show the "View More" button
    const showViewMoreButton = !showAll;

    // Determine if we should show the "View Less" button
    const showViewLessButton = showAll && hasMoreItems && !keyword;

    // Determine if we should show the loading indicator for infinite loading
    const showInfiniteLoadingIndicator = showAll && isFetchingNext;

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
          {showViewMoreButton && (
            <button
              css={{
                background: "none",
                border: "none",
                color: "#0070f3",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={() => toggleSection(sectionKey)}
            >
              View More
            </button>
          )}
          {showViewLessButton && (
            <button
              css={{
                background: "none",
                border: "none",
                color: "#0070f3",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={() => toggleSection(sectionKey)}
            >
              View Less
            </button>
          )}
        </div>

        {isLoading && items.length === 0 ? (
          <div css={{ textAlign: "center", padding: "20px 0" }}>
            Loading {title.toLowerCase()}...
          </div>
        ) : isError ? (
          <div css={{ textAlign: "center", padding: "20px 0", color: "red" }}>
            Failed to load {title.toLowerCase()}
          </div>
        ) : items.length === 0 ? (
          <div css={{ textAlign: "center", padding: "20px 0" }}>
            No {title.toLowerCase()} found
          </div>
        ) : (
          <div
            css={{
              overflowX: showAll ? "hidden" : "auto",
              display: showAll ? "grid" : "flex",
              gridTemplateColumns: showAll ? "repeat(3, 1fr)" : "none",
              gap: "12px",
              padding: "0 10px",
              marginBottom: "10px",
              scrollbarWidth: "none", // Hide scrollbar for Firefox
              msOverflowStyle: "none", // Hide scrollbar for IE/Edge
              "&::-webkit-scrollbar": {
                display: "none", // Hide scrollbar for Chrome/Safari
              },
              // Ensure the container has proper spacing
              paddingBottom: "5px",
              paddingTop: "5px",
            }}
          >
            {displayItems.map((item) => (
              <Draggable
                key={item._id}
                onDrop={async (pos) => {
                  if (pos) {
                    try {
                      // Extract the path from the URL
                      const urlParts = item.img.split("/");

                      // Remove the first three parts (protocol and domain)
                      const pathParts = urlParts.slice(4);

                      // Join the remaining parts to get the path
                      const imagePath = pathParts.join("/");

                      // Show loading toast
                      toast.loading("Adding media to canvas...");

                      // Get the proxied image through the backend
                      const proxyResponse = await axios.get(
                        `${config.apis.url}/proxy-image/${imagePath}`
                      );
                      if (!proxyResponse.data || !proxyResponse.data.url) {
                        throw new Error("Invalid response from proxy server");
                      }

                      const imageUrl = proxyResponse.data.url;
                      // For image-based media, load the image first to get its natural dimensions
                      const img = new window.Image();

                      // Create a promise to handle image loading
                      const imageLoadPromise = new Promise<void>(
                        (resolve, reject) => {
                          img.onerror = (err) => {
                            console.error(err);
                            reject(new Error("Failed to load image"));
                          };

                          img.onload = () => {
                            try {
                              // Calculate position for the center of the canvas
                              const position = getPositionWhenLayerCenter(
                                state.pageSize,
                                {
                                  width: img.naturalWidth,
                                  height: img.naturalHeight,
                                }
                              );

                              // Add as image layer
                              actions.addImageLayer(
                                { thumb: imageUrl, url: imageUrl, position },
                                {
                                  width: img.naturalWidth,
                                  height: img.naturalHeight,
                                }
                              );

                              resolve();
                            } catch (error) {
                              reject(error);
                            }
                          };
                        }
                      );

                      // Set the image source to start loading
                      img.src = imageUrl;
                      img.crossOrigin = "anonymous";

                      // Wait for the image to load
                      await imageLoadPromise;

                      // Dismiss loading toast and show success
                      toast.dismiss();
                      toast.success(`Added ${item.name || "media"} to canvas`);

                      // Close sidebar on mobile
                      if (isMobile) {
                        onClose();
                      }
                    } catch (error) {
                      console.error(`Error adding media:`, error);
                      toast.dismiss();
                      toast.error(
                        `Failed to add media: ${(error as Error).message}`
                      );
                    }
                  }
                }}
                onClick={async () => {
                  try {
                    // Extract the path from the URL
                    const urlParts = item.img.split("/");

                    // Remove the first three parts (protocol and domain)
                    const pathParts = urlParts.slice(4);

                    // Join the remaining parts to get the path
                    const imagePath = pathParts.join("/");

                    // Show loading toast
                    toast.loading("Adding media to canvas...");

                    // Get the proxied image through the backend
                    const proxyResponse = await axios.get(
                      `${config.apis.url}/proxy-image/${imagePath}`
                    );

                    if (!proxyResponse.data || !proxyResponse.data.url) {
                      throw new Error("Invalid response from proxy server");
                    }

                    const imageUrl = proxyResponse.data.url;

                    // For image-based media, load the image first to get its natural dimensions
                    const img = new window.Image();

                    // Create a promise to handle image loading
                    const imageLoadPromise = new Promise<void>(
                      (resolve, reject) => {
                        img.onerror = (err) => {
                          console.error(err);
                          reject(new Error("Failed to load image"));
                        };

                        img.onload = () => {
                          try {
                            // Calculate position for the center of the canvas
                            const position = getPositionWhenLayerCenter(
                              state.pageSize,
                              {
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                              }
                            );

                            // Add as image layer
                            actions.addImageLayer(
                              { thumb: imageUrl, url: imageUrl, position },
                              {
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                              }
                            );

                            resolve();
                          } catch (error) {
                            reject(error);
                          }
                        };
                      }
                    );

                    // Set the image source to start loading
                    img.src = imageUrl;
                    img.crossOrigin = "anonymous";

                    // Wait for the image to load
                    await imageLoadPromise;

                    // Dismiss loading toast and show success
                    toast.dismiss();
                    toast.success(`Added ${item.name || "media"} to canvas`);

                    // Close sidebar on mobile
                    if (isMobile) {
                      onClose();
                    }
                  } catch (error) {
                    console.error(`Error adding media:`, error);
                    toast.dismiss();
                    toast.error(
                      `Failed to add media: ${(error as Error).message}`
                    );
                  }
                }}
              >
                <div
                  css={{
                    cursor: "pointer",
                    position: "relative",
                    width: showAll ? "100%" : "160px", // Fixed width for horizontal scrolling (larger)
                    height: showAll ? "auto" : "160px", // Fixed height for horizontal scrolling (larger)
                    flexShrink: 0, // Prevent shrinking in flex container
                    paddingBottom: showAll ? "100%" : "0", // Only use aspect ratio in grid mode
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    margin: "0 4px", // Add some horizontal spacing
                    transition: "transform 0.2s ease-in-out", // Smooth hover effect
                    "&:hover": {
                      transform: "scale(1.03)", // Slight zoom on hover
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <img
                    src={`${config.apis?.url}/proxy-image/${item.img
                      .split("/")
                      .slice(3)
                      .join("/")}`}
                    loading="lazy"
                    alt={item.name || title}
                    css={{
                      position: showAll ? "absolute" : "relative",
                      top: showAll ? 0 : "auto",
                      left: showAll ? 0 : "auto",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // Fallback to original URL if proxy fails
                      (e.target as HTMLImageElement).src = item.img;
                    }}
                  />
                </div>
              </Draggable>
            ))}

            {/* Show loading indicator when fetching next page */}
            {showInfiniteLoadingIndicator && (
              <div
                css={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "15px 0",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Loading more {title.toLowerCase()}...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Handle refreshing data after upload
  const handleUploadSuccess = () => {
    // Close the upload form
    setShowUploadForm(false);

    // Refetch all media data
    backgroundsRefetch();
    illustrationsRefetch();
    iconsRefetch();
    threeDImagesRefetch();
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

      {showUploadForm ? (
        <MediaUploadForm
          onClose={() => setShowUploadForm(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      ) : (
        <>
          <div
            css={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div css={{ flex: 1 }}>
              <MediaSearchBox
                searchString={keyword}
                onStartSearch={handleSearch}
              />
            </div>
            {/* <button
              onClick={() => setShowUploadForm(true)}
              css={{
                marginLeft: 8,
                padding: "8px 12px",
                background: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Upload
            </button> */}
          </div>

          {/* Scrollable content area */}
          <div
            ref={scrollRef}
            css={{
              flexDirection: "column",
              display: "flex",
              flexGrow: 1,
              height: "calc(100% - 80px)", // Subtract header height
              overflowY: "auto", // Enable scrolling on this container
              padding: "4px 0", // Add padding to ensure scrolling works properly
            }}
          >
            {/* Render each section with infinite loading state */}
            {renderSection(
              "Backgrounds",
              filteredBackgrounds,
              isLoadingBackgrounds,
              isErrorBackgrounds,
              expandedSections.backgrounds,
              "backgrounds",
              isFetchingNextBackgrounds,
              hasNextBackgrounds
            )}

            {renderSection(
              "Illustrations",
              filteredIllustrations,
              isLoadingIllustrations,
              isErrorIllustrations,
              expandedSections.illustrations,
              "illustrations",
              isFetchingNextIllustrations,
              hasNextIllustrations
            )}

            {renderSection(
              "Icons",
              filteredIcons,
              isLoadingIcons,
              isErrorIcons,
              expandedSections.icons,
              "icons",
              isFetchingNextIcons,
              hasNextIcons
            )}

            {renderSection(
              "3D Images",
              filteredThreeDImages,
              isLoadingThreeDImages,
              isErrorThreeDImages,
              expandedSections.threeDImages,
              "threeDImages",
              isFetchingNextThreeDImages,
              hasNextThreeDImages
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaContent;
