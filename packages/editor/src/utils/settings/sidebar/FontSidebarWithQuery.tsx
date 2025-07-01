/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Sidebar, { SidebarProps } from "./Sidebar";
import { FontData, FontDataApi, GetFontQuery } from "canva-editor/types";
import { useUsedFont } from "canva-editor/hooks/useUsedFont";
import { useEditor } from "canva-editor/hooks";
import CheckIcon from "canva-editor/icons/CheckIcon";
import ArrowRightIcon from "canva-editor/icons/ArrowRightIcon";
import ArrowDownIcon from "canva-editor/icons/ArrowDownIcon";
import styled from "@emotion/styled";
import {
  groupFontsByFamily,
  handleFontStyle,
  handleFontStyleName,
} from "canva-editor/utils/fontHelper";
import { getRandomItems } from "canva-editor/utils";
import FontStyle from "./FontStyle";
import { isArray, some } from "lodash";
import TrendingIcon from "canva-editor/icons/TrendingIcon";
import DocumentIcon from "canva-editor/icons/DocumentIcon";
import HorizontalCarousel from "canva-editor/components/carousel/HorizontalCarousel";
import OutlineButton from "canva-editor/components/button/OutlineButton";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseIcon from "canva-editor/icons/CloseIcon";
import { useFontsInfinite, usePrefetchPopularFonts } from "@/hooks/useFonts";

const ListItem = styled("div")`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0 12px;
  :hover: {
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

const flatFonts = (fonts: FontDataApi[]): FontData[] => {
  return fonts.reduce((acc: FontData[], font: FontDataApi) => {
    return acc.concat(
      font.styles.map((s) => {
        return {
          family: font.family,
          name: s.name,
          url: s.url,
          style: s.style,
        };
      })
    );
  }, []);
};

interface FontSidebarProps extends SidebarProps {
  selected: FontData[];
  onChangeFontFamily: (font: FontData) => void;
}

const FontSidebar: ForwardRefRenderFunction<
  HTMLDivElement,
  FontSidebarProps
> = ({ selected, onChangeFontFamily, ...props }, ref) => {
  const isMobile = useMobileDetect();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { usedFonts } = useUsedFont();
  const { actions, fontList, config } = useEditor((state, config) => ({
    config,
    fontList: useMemo(
      () => groupFontsByFamily(state.fontList),
      [state.fontList]
    ),
  }));
  
  const [keyword, setKeyword] = useState("");
  const [openingRecentItems, setOpeningRecentItems] = useState<number[]>([]);
  const [openingItems, setOpeningItems] = useState<number[]>([]);
  const [randomFonts, setRandomFonts] = useState<FontData[] | null>(null);

  // Use React Query for font loading
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFontsInfinite({ 
    kw: keyword || undefined,
    ps: '30' 
  });

  // Prefetch popular fonts on mount
  const prefetchPopularFonts = usePrefetchPopularFonts();
  useEffect(() => {
    prefetchPopularFonts();
  }, [prefetchPopularFonts]);

  // Flatten paginated font data
  const allFonts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.reduce((acc, page) => {
      return acc.concat(flatFonts(page.data));
    }, [] as FontData[]);
  }, [data?.pages]);

  // Update editor store with fetched fonts
  useEffect(() => {
    if (allFonts.length > 0) {
      actions.setFontList(allFonts);
    }
  }, [allFonts, actions]);

  // Load more fonts when scrolling
  const loadMoreFonts = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // React Query will automatically refetch when keyword changes
      // due to the query key dependency
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [keyword]);

  // Initialize random fonts for trending section
  useEffect(() => {
    if (fontList.length > 0 && !randomFonts) {
      setRandomFonts(getRandomItems(fontList, 20) as FontData[]);
    }
  }, [fontList, randomFonts]);

  // Scroll handler for infinite loading
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMoreFonts();
      }
    },
    [loadMoreFonts]
  );

  const isSelected = useCallback(
    (font: FontData) => {
      return some(selected, { family: font.family });
    },
    [selected]
  );

  const toggleFontItem = useCallback(
    (index: number, list: number[]) => {
      if (list.includes(index)) {
        return list.filter((item) => item !== index);
      } else {
        return [index];
      }
    },
    []
  );

  const renderFontItem = useCallback(
    (font: FontData, index: number, isRecent = false) => {
      const openingList = isRecent ? openingRecentItems : openingItems;
      const setOpeningList = isRecent ? setOpeningRecentItems : setOpeningItems;
      const isOpening = openingList.includes(index);
      const fontStyles = fontList.find((f) => f.family === font.family)?.styles || [];
      
      return (
        <div key={`${font.family}-${index}`}>
          <ListItem
            onClick={() => {
              if (fontStyles.length === 1) {
                onChangeFontFamily(font);
              } else {
                setOpeningList((prev) => toggleFontItem(index, prev));
              }
            }}
          >
            <span>
              {isSelected(font) && <CheckIcon />}
            </span>
            <FontDisplay fontStyle={font.style || "regular"}>
              {font.family}
            </FontDisplay>
            {fontStyles.length > 1 && (
              <span>
                {isOpening ? <ArrowDownIcon /> : <ArrowRightIcon />}
              </span>
            )}
          </ListItem>
          {isOpening && fontStyles.length > 1 && (
            <div style={{ paddingLeft: 24 }}>
              {fontStyles.map((styleFont, styleIndex) => (
                <FontStyle
                  key={`${styleFont.family}-${styleIndex}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    },
    [fontList, openingRecentItems, openingItems, isSelected, onChangeFontFamily, toggleFontItem]
  );

  // Show loading state
  if (isLoading && allFonts.length === 0) {
    return (
      <Sidebar ref={ref} {...props}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          Loading fonts...
        </div>
      </Sidebar>
    );
  }

  // Show error state
  if (error) {
    return (
      <Sidebar ref={ref} {...props}>
        <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>
          Error loading fonts. Please try again.
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar ref={ref} {...props}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Search Box */}
        <div style={{ padding: "12px 16px" }}>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search fonts..."
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          {keyword && (
            <button onClick={() => setKeyword("")}>Clear</button>
          )}
        </div>

        {/* Trending Fonts Section */}
        {!keyword && randomFonts && randomFonts.length > 0 && (
          <div style={{ padding: "0 16px", marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#666",
              }}
            >
              <TrendingIcon style={{ marginRight: 6 }} />
              Trending
            </div>
            <HorizontalCarousel>
              {randomFonts.slice(0, 10).map((font, index) => (
                <OutlineButton
                  key={`trending-${font.family}-${index}`}
                  style={{
                    fontSize: 14,
                    fontFamily: font.family,
                    marginRight: 8,
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => onChangeFontFamily(font)}
                >
                  {font.family}
                </OutlineButton>
              ))}
            </HorizontalCarousel>
          </div>
        )}

        {/* Recently Used Fonts */}
        {!keyword && usedFonts.length > 0 && (
          <div style={{ padding: "0 16px", marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#666",
              }}
            >
              <DocumentIcon style={{ marginRight: 6 }} />
              Recently used
            </div>
            <div>
              {usedFonts.slice(0, 5).map((font, index) => 
                renderFontItem(font, index, true)
              )}
            </div>
          </div>
        )}

        {/* Font List */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}
          onScroll={handleScroll}
        >
          {keyword && (
            <div style={{ marginBottom: 12, fontSize: 14, color: "#666" }}>
              {allFonts.length} font{allFonts.length !== 1 ? 's' : ''} found
            </div>
          )}
          
          {allFonts.map((font, index) => renderFontItem(font, index))}
          
          {/* Loading indicator for infinite scroll */}
          {isFetchingNextPage && (
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
              Loading more fonts...
            </div>
          )}
          
          {/* End of results indicator */}
          {!hasNextPage && allFonts.length > 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 12 }}>
              No more fonts to load
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default forwardRef(FontSidebar);

// In the FontStyle import, add the correct prop type for font
// In the Sidebar import, ensure SidebarProps includes 'title'
// If not, extend the prop types locally:

// Patch SidebarProps if needed
interface PatchedSidebarProps extends SidebarProps {
  title?: string;
}

// Patch FontSearchBox Props if needed
interface PatchedFontSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}
