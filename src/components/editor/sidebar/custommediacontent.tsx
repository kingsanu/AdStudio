import { FC, useRef, useState, useCallback } from "react";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

// Types for media items
interface MediaItem {
  _id: string;
  img: string;
  url?: string;
  type?: string;
  category?: string;
  name?: string;
  desc?: string;
  trend?: boolean;
}

interface CustomMediaContentProps {
  onClose: () => void;
}

const CustomMediaContent: FC<CustomMediaContentProps> = ({ onClose }) => {
  const { actions, config } = useEditor();
  const isMobile = useMobileDetect();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Constants for pagination
  const ITEMS_PER_PAGE = 20;
  const TRENDING_ITEMS_COUNT = 8;

  // Fetch media items using React Query
  const fetchMediaItems = async ({ pageParam = 0, queryKey }: any) => {
    const [_, category, isViewMore] = queryKey;

    if (!config.apis) {
      throw new Error("API configuration is missing");
    }

    try {
      let endpoint = "";
      
      // Map category names to API endpoints
      switch (category) {
        case "backgrounds":
          endpoint = "/backgrounds";
          break;
        case "illustrations":
          endpoint = "/illustrations";
          break;
        case "icons":
          endpoint = "/icons";
          break;
        case "3d":
          endpoint = "/3d-images";
          break;
        default:
          endpoint = `/${category}`;
      }

      let mediaData: any[] = [];

      if (!isViewMore && pageParam === 0) {
        // For main view, prioritize trending items
        try {
          // First, get trending items
          const trendingResponse = await axios.get(`${config.apis.url}${endpoint}`, {
            params: {
              ps: TRENDING_ITEMS_COUNT,
              pi: 0,
              trend: true,
            },
          });
          
          let trendingData = trendingResponse.data.data || trendingResponse.data || [];
          
          // If we don't have enough trending items, fetch regular items to fill up to 8
          if (trendingData.length < TRENDING_ITEMS_COUNT) {
            const regularResponse = await axios.get(`${config.apis.url}${endpoint}`, {
              params: {
                ps: TRENDING_ITEMS_COUNT - trendingData.length,
                pi: 0,
                trend: false,
              },
            });
            
            const regularData = regularResponse.data.data || regularResponse.data || [];
            mediaData = [...trendingData, ...regularData];
          } else {
            mediaData = trendingData;
          }
        } catch (error) {
          console.error("Error fetching trending items, falling back to regular items:", error);
          // Fallback to regular items if trending fails
          const response = await axios.get(`${config.apis.url}${endpoint}`, {
            params: {
              ps: TRENDING_ITEMS_COUNT,
              pi: 0,
            },
          });
          mediaData = response.data.data || response.data || [];
        }
      } else {
        // For view more mode, get all items with pagination, trending first
        let allMediaData: any[] = [];
        
        if (pageParam === 0) {
          // First page: Get all trending items first
          try {
            const trendingResponse = await axios.get(`${config.apis.url}${endpoint}`, {
              params: {
                ps: 100, // Get more trending items for view more
                pi: 0,
                trend: true,
              },
            });
            const trendingData = trendingResponse.data.data || trendingResponse.data || [];
            allMediaData = [...trendingData];
          } catch (error) {
            console.error("Error fetching trending items in view more:", error);
          }
          
          // Then fill the rest with regular items
          const remainingCount = ITEMS_PER_PAGE - allMediaData.length;
          if (remainingCount > 0) {
            const regularResponse = await axios.get(`${config.apis.url}${endpoint}`, {
              params: {
                ps: remainingCount,
                pi: 0,
                trend: false,
              },
            });
            const regularData = regularResponse.data.data || regularResponse.data || [];
            allMediaData = [...allMediaData, ...regularData];
          }
          
          mediaData = allMediaData.slice(0, ITEMS_PER_PAGE);
        } else {
          // Subsequent pages: Regular pagination
          const response = await axios.get(`${config.apis.url}${endpoint}`, {
            params: {
              ps: ITEMS_PER_PAGE,
              pi: pageParam,
              trend: false, // After first page, just get regular items
            },
          });
          mediaData = response.data.data || response.data || [];
        }
      }
      
      // Transform the data to match our interface
      mediaData = mediaData.map((item: any) => ({
        ...item,
        url: item.img || item.url,
      }));

      const hasMoreItems = mediaData.length === ITEMS_PER_PAGE;

      return {
        items: mediaData,
        nextPage: hasMoreItems ? pageParam + 1 : undefined,
        hasMore: hasMoreItems,
      };
    } catch (error) {
      console.error(`Error loading ${category} media:`, error);
      return {
        items: [],
        nextPage: undefined,
        hasMore: false,
      };
    }
  };

  // Simple queries for main screen (8 items only)
  const backgroundsQuery = useQuery({
    queryKey: ["media", "backgrounds", false],
    queryFn: () => fetchMediaItems({ pageParam: 0, queryKey: ["media", "backgrounds", false] }),
  });

  const backgroundsViewMoreQuery = useInfiniteQuery({
    queryKey: ["media", "backgrounds", true],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: expandedSection === "backgrounds",
  });

  const illustrationsQuery = useQuery({
    queryKey: ["media", "illustrations", false],
    queryFn: () => fetchMediaItems({ pageParam: 0, queryKey: ["media", "illustrations", false] }),
  });

  const illustrationsViewMoreQuery = useInfiniteQuery({
    queryKey: ["media", "illustrations", true],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: expandedSection === "illustrations",
  });

  const iconsQuery = useQuery({
    queryKey: ["media", "icons", false],
    queryFn: () => fetchMediaItems({ pageParam: 0, queryKey: ["media", "icons", false] }),
  });

  const iconsViewMoreQuery = useInfiniteQuery({
    queryKey: ["media", "icons", true],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: expandedSection === "icons",
  });

  const threeDQuery = useQuery({
    queryKey: ["media", "3d", false],
    queryFn: () => fetchMediaItems({ pageParam: 0, queryKey: ["media", "3d", false] }),
  });

  const threeDViewMoreQuery = useInfiniteQuery({
    queryKey: ["media", "3d", true],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: expandedSection === "3d",
  });

  // Get main screen data (8 items only - no pagination)
  const backgrounds = backgroundsQuery.data?.items || [];
  console.log(backgrounds);
  const backgroundsViewMore = backgroundsViewMoreQuery.data?.pages.flatMap((page) => page.items) || [];

  const illustrations = illustrationsQuery.data?.items || [];
  const illustrationsViewMore = illustrationsViewMoreQuery.data?.pages.flatMap((page) => page.items) || [];

  const icons = iconsQuery.data?.items || [];
  const iconsViewMore = iconsViewMoreQuery.data?.pages.flatMap((page) => page.items) || [];

  const threeDImages = threeDQuery.data?.items || [];
  const threeDViewMore = threeDViewMoreQuery.data?.pages.flatMap((page) => page.items) || [];

  // Handle adding media to canvas
  const handleAddMedia = (item: MediaItem) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const imageUrl = item.url || item.img;
    img.src = imageUrl;

    img.onload = () => {
      actions.addImageLayer(
        { url: imageUrl, thumb: imageUrl },
        { width: img.naturalWidth, height: img.naturalHeight }
      );

      if (isMobile) {
        onClose();
      }
    };
  };

  // Toggle section expansion
  const toggleSectionExpansion = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Scroll functions for horizontal scroll
  const scrollHorizontal = (containerRef: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 240; // Width of 2 items + gap
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

  // Create refs for scroll containers (main screen - collapsed state)
  const backgroundsMainScrollRef = useRef<HTMLDivElement>(null);
  const illustrationsMainScrollRef = useRef<HTMLDivElement>(null);
  const iconsMainScrollRef = useRef<HTMLDivElement>(null);
  const threeDMainScrollRef = useRef<HTMLDivElement>(null);

  // Render a media section
  const renderMediaSection = (
    title: string,
    trendingItems: MediaItem[],
    allItems: MediaItem[],
    isLoading: boolean,
    hasNextPage: boolean,
    fetchNextPage: () => void,
    isFetchingNextPage: boolean,
    mainScrollRef: React.RefObject<HTMLDivElement>
  ) => {
    const sectionKey = title.toLowerCase().replace(/\s+/g, '').replace('3dimages', '3d');
    const isExpanded = expandedSection === sectionKey;
    const displayItems = isExpanded ? allItems : trendingItems;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold m-0">{title}</h3>
          <button
            className="bg-none border-none text-blue-600 text-xs cursor-pointer p-0 hover:text-blue-800"
            onClick={() => toggleSectionExpansion(sectionKey)}
          >
            {isExpanded ? "View Less" : "View More"}
          </button>
        </div>

        {isExpanded ? (
          <div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 mb-6">
              {displayItems.map((item) => (
                <div
                  key={item._id}
                  className="min-w-[120px] h-20 rounded-lg bg-gray-100 overflow-hidden cursor-pointer relative transition-transform duration-200 hover:-translate-y-0.5"
                  onClick={() => handleAddMedia(item)}
                >
                  <img 
                    src={item.url || item.img} 
                    alt={item.name || item.desc || title}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            {hasNextPage && (
              <button
                className="w-full p-3 mt-4 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-sm transition-colors duration-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        ) : (          <div className="relative mb-6">
            <button
              className="absolute top-1/2 left-2 -translate-y-1/2 z-10 bg-white/95 border border-black/20 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => scrollHorizontal(mainScrollRef, 'left')}
            >
              <ChevronLeft size={12} />
            </button>
            <button
              className="absolute top-1/2 right-2 -translate-y-1/2 z-10 bg-white/95 border border-black/20 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => scrollHorizontal(mainScrollRef, 'right')}
            >
              <ChevronRight size={12} />
            </button>
            <div className="overflow-hidden">
              <div 
                ref={mainScrollRef}
                className="flex gap-3 pb-4 mb-6 overflow-x-auto scroll-smooth scrollbar-none"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {displayItems.map((item) => (
                  <div
                    key={item._id}
                    className="w-[120px] h-20 rounded-lg bg-gray-100 overflow-hidden cursor-pointer relative transition-transform duration-200 hover:-translate-y-0.5 flex-shrink-0"
                    onClick={() => handleAddMedia(item)}
                  >
                    <img 
                      src={item.url || item.img} 
                      alt={item.name || item.desc || title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Debug info */}
            {displayItems.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                Showing {displayItems.length} items
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
        <h2 className="text-base font-semibold m-0">Media j</h2>
        <CloseSidebarButton onClose={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {renderMediaSection(
          "Backgrounds",
          backgrounds,
          backgroundsViewMore,
          backgroundsViewMoreQuery.isFetchingNextPage,
          backgroundsViewMoreQuery.hasNextPage || false,
          backgroundsViewMoreQuery.fetchNextPage,
          backgroundsViewMoreQuery.isFetchingNextPage,
          backgroundsMainScrollRef
        )}
        {renderMediaSection(
          "Illustrations",
          illustrations,
          illustrationsViewMore,
          illustrationsViewMoreQuery.isFetchingNextPage,
          illustrationsViewMoreQuery.hasNextPage || false,
          illustrationsViewMoreQuery.fetchNextPage,
          illustrationsViewMoreQuery.isFetchingNextPage,
          illustrationsMainScrollRef
        )}
        {renderMediaSection(
          "Icons",
          icons,
          iconsViewMore,
          iconsViewMoreQuery.isFetchingNextPage,
          iconsViewMoreQuery.hasNextPage || false,
          iconsViewMoreQuery.fetchNextPage,
          iconsViewMoreQuery.isFetchingNextPage,
          iconsMainScrollRef
        )}
        {renderMediaSection(
          "3D Images",
          threeDImages,
          threeDViewMore,
          threeDViewMoreQuery.isFetchingNextPage,
          threeDViewMoreQuery.hasNextPage || false,
          threeDViewMoreQuery.fetchNextPage,
          threeDViewMoreQuery.isFetchingNextPage,
          threeDMainScrollRef
        )}
      </div>
    </div>
  );
};

export default CustomMediaContent;