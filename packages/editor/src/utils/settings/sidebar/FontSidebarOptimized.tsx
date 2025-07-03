import React, { ForwardRefRenderFunction, useMemo, useState, useRef, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { FontData, FontDataApi } from "canva-editor/types";
import { useEditor } from "canva-editor/hooks";
import { useUsedFont } from "canva-editor/hooks/useUsedFont";
import { useVirtualizedFonts, usePopularFonts, useLazyFontLoad } from "@/hooks/useFonts";
import { groupFontsByFamily, handleFontStyle, handleFontStyleName } from "canva-editor/utils/fontHelper";
import { some } from "lodash";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

// Icons (assuming these exist)
import ArrowRightIcon from "canva-editor/icons/ArrowRightIcon";
import  ArrowDownIcon  from "canva-editor/icons/ArrowDownIcon";
import CheckIcon from "canva-editor/icons/CheckIcon";
import  DocumentIcon  from "canva-editor/icons/DocumentIcon";

import  TrendingIcon  from "canva-editor/icons/TrendingIcon";
import  OutlineButton  from "canva-editor/components/button/OutlineButton";
import FontSearchBox from "../components/FontSearchBox";

import HorizontalCarousel from "canva-editor/components/carousel/HorizontalCarousel";
import Sidebar, { SidebarProps } from "./Sidebar";

export interface FontSidebarProps extends SidebarProps {
  selected: FontData[];
  onChangeFontFamily: (font: FontData) => void;
}

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
`;

const ListItem = styled("div")`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0 12px;
  :hover {
    background: #f9f9f9;
  }

  > span:nth-of-type(1) {
    flex: 0 1 auto;
    width: 24px;
    margin: 6px 8px 0 0;
    color: rgb(169 169 173);
  }

  > span:nth-of-type(2) {
    margin-right: auto;
    font-size: 16px;
  }
`;

const FontDisplay = styled("span")<{ fontStyle: string }>(
  ({ fontStyle }) => `
    text-transform: capitalize;
    ${handleFontStyle(fontStyle)};
`
);

const FontPreviewImage = styled("img")`
  height: 24px;
  max-width: 150px;
  object-fit: contain;
  object-position: left center;
`;

// Component to render font preview (either image or text)
const FontPreview: React.FC<{
  font: FontData;
  text: string;
  usePreviewImage?: boolean;
}> = ({ font, text, usePreviewImage = true }) => {
  const [imageError, setImageError] = useState(false);
  
  // Debug logging
  console.log("FontPreview render:", {
    fontFamily: font.family,
    fontName: font.name,
    hasImg: !!font.img,
    imgUrl: font.img,
    usePreviewImage,
    imageError
  });
  
  // Use preview image if available, enabled, and not errored
  if (usePreviewImage && font.img && !imageError) {
    return (
      <FontPreviewImage
        src={font.img}
        alt={`${font.family} font preview`}
        onError={() => {
          console.log(`Font preview image failed to load: ${font.img}`);
          setImageError(true);
        }}
        onLoad={() => {
          console.log(`Font preview image loaded successfully: ${font.img}`);
        }}
      />
    );
  }
  
  // Fallback to text preview
  return (
    <FontDisplay
      css={{
        fontFamily: `'${font.name}'`,
      }}
      fontStyle={font.style}
    >
      {text}
    </FontDisplay>
  );
};

const VirtualizedListContainer = styled("div")`
  flex: 1;
  min-height: 0;
`;

const LoadingItem = styled("div")`
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #666;
  font-style: italic;
`;

// Flatten fonts from API format to component format
const flatFonts = (fonts: FontDataApi[]): FontData[] => {
  console.log("flatFonts input:", fonts.slice(0, 3)); // Log first 3 fonts for debugging
  
  const result = fonts.reduce((acc: FontData[], font: FontDataApi) => {
    console.log(`Processing font: ${font.family}, img: ${font.img}`); // Debug each font
    
    return acc.concat(
      font.styles.map((s) => ({
        family: font.family,
        name: s.name,
        url: s.url,
        style: s.style,
        img: font.img, // Include preview image from font family
      }))
    );
  }, []);
  
  console.log("flatFonts result sample:", result.slice(0, 3)); // Log first 3 results
  return result;
};

interface VirtualizedFontItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    fonts: FontData[];
    selected: FontData[];
    onChangeFontFamily: (font: FontData) => void;
    openingItems: number[];
    setOpeningItems: React.Dispatch<React.SetStateAction<number[]>>;
    loadFontFamily: (family: string) => Promise<FontDataApi | null>;
    loadGoogleFont: (family: string) => void;
    loadCustomFont: (font: FontData) => void;
  };
}

const VirtualizedFontItem: React.FC<VirtualizedFontItemProps> = ({ index, style, data }) => {
  const { fonts, selected, onChangeFontFamily, openingItems, setOpeningItems, loadFontFamily, loadGoogleFont, loadCustomFont } = data;
  const font = fonts[index];
  const [isInView, setIsInView] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Always call useEffect, but handle the font loading conditionally inside
  useEffect(() => {
    // Early return if no font to avoid hooks ordering issues
    if (!font) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            // Only load font via Google Fonts if no preview image is available
            if (!font.img) {
              // Check if it's a Google Font or custom font by URL
              if (font.url && (font.url.includes('fonts.gstatic.com') || font.url.includes('fonts.googleapis.com'))) {
                loadGoogleFont(font.family);
              } else if (font.url) {
                // Load custom font using @font-face
                loadCustomFont(font);
              } else {
                // Fallback to Google Fonts
                loadGoogleFont(font.family);
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before the item is visible
        threshold: 0.1
      }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, [font?.family, font?.img, isInView, font, loadGoogleFont, loadCustomFont]);

  // Render loading state if no font
  if (!font) {
    return (
      <div style={style}>
        <LoadingItem>Loading...</LoadingItem>
      </div>
    );
  }





  const handleToggleChildren = (openingItems: number[], index: number) => {
    const currentIndex = openingItems.indexOf(index);
    if (currentIndex === -1) {
      return [...openingItems, index];
    } else {
      return openingItems.filter((item) => item !== index);
    }
  };

  const handleFontClick = async (font: FontData) => {
    // Lazy load full font family data if needed
    if (font.styles && font.styles.length === 0) {
      const fullFontData = await loadFontFamily(font.family);
      if (fullFontData) {
        // Update font with full styles data
        font.styles = flatFonts([fullFontData]);
      }
    }
    onChangeFontFamily(font);
  };

  const isExpanded = openingItems.indexOf(index) > -1;

  return (
    <div style={style} ref={itemRef}>
      <ListItem onClick={() => handleFontClick(font)}>
        <span>
          {font.styles && font.styles?.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpeningItems(handleToggleChildren(openingItems, index));
              }}
              css={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                  borderRadius: '2px'
                }
              }}
            >
              {isExpanded ? (
                <ArrowDownIcon />
              ) : (
                <ArrowRightIcon />
              )}
            </button>
          )}
        </span>
        <FontPreview 
          font={font}
          text={!font.styles?.length ? font.name : font.family}
        />
        <span>
          {!isExpanded &&
            some(font.styles, (fontStyle) =>
              selected.map((s) => s.name).includes(fontStyle.name)
            ) && <CheckIcon />}
        </span>
      </ListItem>
      {/* Render expanded styles */}
      {isExpanded &&
        font.styles &&
        font.styles?.length > 1 &&
        font.styles.map((fontStyle, subIdx) => (
          <ListItem
            css={{ marginLeft: 16,background:"white",zIndex:10, position:'relative', }}
            key={subIdx + "-" + fontStyle.name}
            onClick={() => onChangeFontFamily(fontStyle)}
          >
            <span></span>
            <FontPreview 
              font={fontStyle}
              text={handleFontStyleName(fontStyle.style)}
              usePreviewImage={false} // For style variants, always use text
            />
            <span>
              {selected
                .map((s) => s.name)
                .includes(fontStyle.name) && <CheckIcon />}
            </span>
          </ListItem>
        ))}
    </div>
  );
};

const FontSidebarOptimized: ForwardRefRenderFunction<HTMLDivElement, FontSidebarProps> = (
  { selected, onChangeFontFamily, ...props },
  ref
) => {
  const { usedFonts } = useUsedFont();
  const { actions } = useEditor();
  const { loadFontFamily } = useLazyFontLoad();

  const [keyword, setKeyword] = useState("");
  const [openingItems, setOpeningItems] = useState<number[]>([]);

  // Load popular fonts first for quick preview
  const { data: popularFontsData, isLoading: popularLoading, error: popularError } = usePopularFonts(20);

  // Use virtualized loading for all fonts
  const {
    data: virtualizedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: virtualizedLoading,
    error: virtualizedError
  } = useVirtualizedFonts(keyword, 50);

  // Debug logging
  console.log("FontSidebarOptimized render:", {
    popularFontsData,
    popularLoading,
    popularError,
    virtualizedData,
    virtualizedLoading,
    virtualizedError,
    selected,
    keyword
  });

  // Process fonts data
  const fontList = useMemo(() => {
    if (!virtualizedData?.pages) return [];
    
    const allFonts = virtualizedData.pages.flatMap(page => page.data);
    const flattened = flatFonts(allFonts);
    const grouped = groupFontsByFamily(flattened);
    
    return grouped;
  }, [virtualizedData]);

  // Popular fonts for quick access
  const popularFonts = useMemo(() => {
    if (!popularFontsData) return [];
    const flattened = flatFonts(popularFontsData);
    return groupFontsByFamily(flattened).slice(0, 10);
  }, [popularFontsData]);

  // Update editor font list
  useEffect(() => {
    if (fontList.length > 0) {
      actions.setFontList(fontList);
    }
  }, [fontList, actions]);

  // Helper function to load Google Fonts (shared)
  const loadGoogleFont = useCallback((fontFamily: string) => {
    const fontName = fontFamily.replace(/\s+/g, '+');
    const linkId = `google-font-${fontName}`;

    // Check if already loaded
    if (document.getElementById(linkId)) {
      return;
    }

    // Create Google Fonts link
    const link = document.createElement('link');
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    link.type = 'text/css';

    document.head.appendChild(link);
    console.log("Loaded Google Font:", fontFamily);
  }, []);

  // Helper function to load custom fonts via CSS @font-face
  const loadCustomFont = useCallback((font: FontData) => {
    const fontFaceId = `custom-font-${font.family.replace(/\s+/g, '-')}`;
    
    // Check if already loaded
    if (document.getElementById(fontFaceId)) {
      return;
    }

    // Create @font-face CSS for custom fonts
    const style = document.createElement('style');
    style.id = fontFaceId;
    style.textContent = `
      @font-face {
        font-family: '${font.name}';
        src: url('${font.url}') format('${font.url.includes('.woff2') ? 'woff2' : font.url.includes('.woff') ? 'woff' : 'truetype'}');
        font-weight: ${font.style === 'regular' ? 'normal' : font.style};
        font-style: normal;
        font-display: swap;
      }
    `;
    
    document.head.appendChild(style);
    console.log("Loaded Custom Font:", font.name, font.url);
  }, []);

  // Preload popular fonts when sidebar opens
  useEffect(() => {
    if (props.open && popularFonts.length > 0) {
      // Preload first few popular fonts for immediate preview (only those without preview images)
      const fontsToPreload = popularFonts.slice(0, 8).filter(font => !font.img);
      fontsToPreload.forEach((font) => {
        if (font.url && (font.url.includes('fonts.gstatic.com') || font.url.includes('fonts.googleapis.com'))) {
          loadGoogleFont(font.family);
        } else if (font.url) {
          loadCustomFont(font);
        } else {
          loadGoogleFont(font.family);
        }
      });
    }
  }, [props.open, popularFonts, loadGoogleFont, loadCustomFont]);



  const handleSearch = (searchKeyword: string) => {
    setKeyword(searchKeyword);
  };

  const renderHeader = () => (
    <div css={{ padding: "16px 16px 0" }}>
      <FontSearchBox onSearch={handleSearch} />
      {/* Popular fonts carousel */}
      {popularFonts.length > 0 && !keyword && (
        <div css={{ marginTop: 8 }}>
          <HorizontalCarousel>
            {popularFonts.map((font, idx) => (
              <div key={`popular-${idx}`} className="carousel-item">
                <OutlineButton onClick={() => {
                  // Load appropriate font type
                  if (!font.img) {
                    if (font.url && (font.url.includes('fonts.gstatic.com') || font.url.includes('fonts.googleapis.com'))) {
                      loadGoogleFont(font.family);
                    } else if (font.url) {
                      loadCustomFont(font);
                    } else {
                      loadGoogleFont(font.family);
                    }
                  }
                  onChangeFontFamily(font);
                }}>
                  <FontPreview 
                    font={font}
                    text={font.family}
                  />
                </OutlineButton>
              </div>
            ))}
          </HorizontalCarousel>
        </div>
      )}
    </div>
  );

  // Check if item is loaded for infinite loader
  const isItemLoaded = (index: number) => !!fontList[index];

  // Load more items - InfiniteLoader expects (startIndex, stopIndex) => Promise<void>
  const loadMoreItems = async (_startIndex: number, _stopIndex: number): Promise<void> => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const itemCount = hasNextPage ? fontList.length + 1 : fontList.length;

  return (
    <Sidebar {...props}>
      <Container ref={ref}>
        {renderHeader()}

        {/* Used fonts section */}
        {usedFonts.length > 0 && (
          <div>
            <div css={{ padding: "16px 16px 8px 8px", fontWeight: 700, display: "flex", columnGap: 8, alignItems: "center" }}>
              <DocumentIcon css={{ width: 24 }} />
              <span>Document fonts</span>
            </div>
            {usedFonts.slice(0, 5).map((font, idx) => (
              <ListItem key={`used-${idx}`} onClick={() => onChangeFontFamily(font)}>
                <span></span>
                <FontPreview 
                  font={font}
                  text={font.family}
                />
                <span>
                  {selected.map((s) => s.name).includes(font.name) && <CheckIcon />}
                </span>
              </ListItem>
            ))}
          </div>
        )}

        {/* All fonts section with virtualization */}
        <div css={{ padding: "16px 16px 8px 8px", fontWeight: 700, display: "flex", columnGap: 8, alignItems: "center" }}>
          <TrendingIcon />
          <span>{keyword ? 'Search Results' : 'All fonts'}</span>
        </div>

        <VirtualizedListContainer>
          {virtualizedLoading && fontList.length === 0 ? (
            <LoadingItem>Loading fonts...</LoadingItem>
          ) : (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref: infiniteRef }) => (
                <List
                  ref={infiniteRef}
                  height={480}
                  width="100%"
                  itemCount={itemCount}
                  itemSize={40}
                  onItemsRendered={onItemsRendered}
                  itemData={{
                    fonts: fontList,
                    selected,
                    onChangeFontFamily,
                    openingItems,
                    setOpeningItems,
                    loadFontFamily,
                    loadGoogleFont,
                    loadCustomFont,
                  }}
                >
                  {VirtualizedFontItem}
                </List>
              )}
            </InfiniteLoader>
          )}
        </VirtualizedListContainer>
      </Container>
    </Sidebar>
  );
};

export default React.forwardRef(FontSidebarOptimized);
