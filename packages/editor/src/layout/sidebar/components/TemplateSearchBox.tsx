import { FC, useState, useEffect, useCallback } from "react";
import { SearchBox } from "canva-editor/search-autocomplete";
import axios from "axios";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";

interface Props {
  searchString: string;
  onStartSearch: (kw: string) => void;
}
const TemplateSearchBox: FC<Props> = ({ searchString, onStartSearch }) => {
  const { config } = useEditor();
  const isMobile = useMobileDetect();
  const [suggestItems, setSuggestItems] = useState([]);

  const handleOnSearch = useCallback(
    async (keyword: string) => {
      // Only fetch suggestions if keyword is not empty
      if (keyword && keyword.trim() !== "") {
        try {
          const response = await axios.get(
            `${config.apis.url}${
              config.apis.templateKeywordSuggestion
            }?kw=${encodeURIComponent(keyword)}`
          );
          setSuggestItems(response?.data || []);
        } catch (error) {
          console.error("Error fetching template suggestions:", error);
          setSuggestItems([]);
        }
      } else {
        setSuggestItems([]);
      }
    },
    [config.apis.url, config.apis.templateKeywordSuggestion]
  );

  // Update suggestions when searchString changes from outside
  useEffect(() => {
    if (searchString) {
      handleOnSearch(searchString);
    }
  }, [searchString, handleOnSearch]);

  const handleOnHover = () => {};

  interface SuggestionItem {
    id: number;
    name: string;
  }

  const handleOnSelect = (item: SuggestionItem) => {
    // the item selected
    onStartSearch(item.name);
  };

  const handleOnFocus = () => {};

  // Note: The SearchBox component already handles Enter key press internally

  return (
    <SearchBox
      items={suggestItems}
      inputSearchString={searchString}
      placeholder={config.placeholders?.searchTemplate || "Search templates"}
      onSearch={handleOnSearch}
      onHover={handleOnHover}
      onSelect={handleOnSelect}
      onFocus={handleOnFocus}
      onClear={() => onStartSearch("")}
      autoFocus={!isMobile}
      styling={{ zIndex: 2 }}
    />
  );
};

export default TemplateSearchBox;
