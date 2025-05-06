import { FC, useCallback, useEffect, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import { SearchBox } from "canva-editor/search-autocomplete";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import axios from "axios";

interface CustomTextSearchBoxProps {
  searchString: string;
  onStartSearch: (kw: string) => void;
}

const CustomTextSearchBox: FC<CustomTextSearchBoxProps> = ({ 
  searchString, 
  onStartSearch 
}) => {
  const { config } = useEditor();
  const isMobile = useMobileDetect();
  const [suggestItems, setSuggestItems] = useState<Array<{ id: number; name: string }>>([]);
  const [inputValue, setInputValue] = useState(searchString);

  // Handle direct search input (when user types and presses Enter)
  const handleDirectSearch = useCallback((keyword: string) => {
    // Trigger the parent component's search function
    onStartSearch(keyword);
  }, [onStartSearch]);

  const handleOnSearch = useCallback(
    async (keyword: string) => {
      // Update local input value
      setInputValue(keyword);
      
      // Only fetch suggestions if keyword is not empty
      if (keyword && keyword.trim() !== "" && config.apis) {
        try {
          const response = await axios.get(
            `${config.apis.url}${
              config.apis.textKeywordSuggestion
            }?kw=${encodeURIComponent(keyword)}`
          );
          setSuggestItems(response?.data || []);
          
          // If user presses Enter, also trigger the search
          if (keyword !== searchString) {
            handleDirectSearch(keyword);
          }
        } catch (error) {
          console.error("Error fetching text suggestions:", error);
          setSuggestItems([]);
        }
      } else {
        setSuggestItems([]);
        if (keyword === "") {
          // Clear search if input is empty
          handleDirectSearch("");
        }
      }
    },
    [config.apis, searchString, handleDirectSearch]
  );

  // Update suggestions when searchString changes from outside
  useEffect(() => {
    if (searchString !== inputValue) {
      setInputValue(searchString);
      if (searchString) {
        handleOnSearch(searchString);
      }
    }
  }, [searchString, handleOnSearch, inputValue]);

  const handleOnHover = () => {};

  const handleOnSelect = (item: { id: number; name: string }) => {
    // When a suggestion is selected, trigger the search
    onStartSearch(item.name);
    setInputValue(item.name);
  };

  const handleOnFocus = () => {};

  // Create a custom key handler to handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDirectSearch(inputValue);
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <SearchBox
        items={suggestItems}
        inputSearchString={inputValue}
        placeholder={config.placeholders?.searchText || "Search text templates"}
        onSearch={handleOnSearch}
        onHover={handleOnHover}
        onSelect={handleOnSelect}
        onFocus={handleOnFocus}
        onClear={() => {
          setInputValue("");
          onStartSearch("");
        }}
        autoFocus={!isMobile}
        styling={{ zIndex: 2 }}
      />
    </div>
  );
};

export default CustomTextSearchBox;
