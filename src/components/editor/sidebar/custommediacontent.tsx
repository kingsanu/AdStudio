import { FC, useRef, useState, useCallback } from "react";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import styled from "@emotion/styled";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #ffffff;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(217, 219, 228, 0.6);
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
`;

const ViewMoreButton = styled.button`
  background: none;
  border: none;
  color: #0070f3;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
`;

const HorizontalScroll = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 24px;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const MediaItem = styled.div`
  min-width: 120px;
  height: 80px;
  border-radius: 8px;
  background-color: #f5f5f5;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-2px);
  }
`;

const MediaImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FullSectionView = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

// Types for media items
interface MediaItem {
  _id: string;
  url: string;
  type: string;
  category: string;
  name?: string;
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
  const ITEMS_PER_PAGE = 10;
  const SCROLL_THRESHOLD = 100;

  // Fetch media items using React Query
  const fetchMediaItems = async ({ pageParam = 0, queryKey }: any) => {
    const [_, category] = queryKey;

    if (!config.apis) {
      throw new Error("API configuration is missing");
    }

    try {
      // This would be replaced with actual API endpoints when implemented
      const response = await axios.get(
        `${config.apis.url}/media?category=${category}&ps=${ITEMS_PER_PAGE}&pi=${pageParam}`
      );

      const mediaData = response.data.data || response.data || [];
      const paginationInfo = response.data.pagination;

      // Determine if there are more items to load
      let hasMoreItems = false;
      if (paginationInfo?.hasMore) {
        hasMoreItems = true;
      } else {
        hasMoreItems = mediaData.length === ITEMS_PER_PAGE;
      }

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

  // Create queries for each media category
  const backgroundsQuery = useInfiniteQuery({
    queryKey: ["media", "backgrounds"],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const illustrationsQuery = useInfiniteQuery({
    queryKey: ["media", "illustrations"],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const iconsQuery = useInfiniteQuery({
    queryKey: ["media", "icons"],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const threeDQuery = useInfiniteQuery({
    queryKey: ["media", "3d"],
    queryFn: fetchMediaItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of items into arrays
  const backgrounds = useCallback(() => {
    return backgroundsQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [backgroundsQuery.data?.pages])();

  const illustrations = useCallback(() => {
    return illustrationsQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [illustrationsQuery.data?.pages])();

  const icons = useCallback(() => {
    return iconsQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [iconsQuery.data?.pages])();

  const threeDImages = useCallback(() => {
    return threeDQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [threeDQuery.data?.pages])();

  // Handle adding media to canvas
  const handleAddMedia = (item: MediaItem) => {
    // Add the media item to the canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.url;

    img.onload = () => {
      actions.addImageLayer(
        { url: img.src, thumb: img.src },
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

  // Render a media section
  const renderMediaSection = (
    title: string,
    items: MediaItem[],
    isLoading: boolean
  ) => {
    const isExpanded = expandedSection === title.toLowerCase();

    return (
      <div>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          <ViewMoreButton
            onClick={() => toggleSectionExpansion(title.toLowerCase())}
          >
            {isExpanded ? "View Less" : "View More"}
          </ViewMoreButton>
        </SectionHeader>

        {isExpanded ? (
          <FullSectionView>
            {items.map((item) => (
              <MediaItem key={item._id} onClick={() => handleAddMedia(item)}>
                <MediaImage src={item.url} alt={item.name || title} />
              </MediaItem>
            ))}
            {isLoading && <div>Loading more...</div>}
          </FullSectionView>
        ) : (
          <HorizontalScroll>
            {items.slice(0, 8).map((item) => (
              <MediaItem key={item._id} onClick={() => handleAddMedia(item)}>
                <MediaImage src={item.url} alt={item.name || title} />
              </MediaItem>
            ))}
          </HorizontalScroll>
        )}
      </div>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Media</Title>
        <CloseSidebarButton onClick={onClose} />
      </Header>

      <ScrollContainer ref={scrollRef}>
        {renderMediaSection(
          "Backgrounds",
          backgrounds,
          backgroundsQuery.isFetchingNextPage
        )}
        {renderMediaSection(
          "Illustrations",
          illustrations,
          illustrationsQuery.isFetchingNextPage
        )}
        {renderMediaSection("Icons", icons, iconsQuery.isFetchingNextPage)}
        {renderMediaSection(
          "3D Images",
          threeDImages,
          threeDQuery.isFetchingNextPage
        )}
      </ScrollContainer>
    </Container>
  );
};

export default CustomMediaContent;