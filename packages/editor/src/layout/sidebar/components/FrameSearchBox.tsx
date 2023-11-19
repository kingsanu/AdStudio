import { FC, useState } from 'react';
import { SearchBox } from '@canva/search-autocomplete';
import axios from 'axios';
import { useEditor } from '@canva/hooks';

interface Props {
  onStartSearch: (kw: string) => void;
}
const FrameSearchBox: FC<Props> = ({ onStartSearch }) => {
  const { config } = useEditor();
  const [suggestItems, setSuggestItems] = useState([]);
  const handleOnSearch = async (keyword: any) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    const response = await axios.get(
      `${config.apis.url}${config.apis.frameKeywordSuggestion}?kw=` + keyword
    );
    setSuggestItems(response?.data || []);
  };

  const handleOnHover = (result: any) => {
    // the item hovered
  };

  const handleOnSelect = (item: any) => {
    // the item selected
    onStartSearch(item.name);
  };

  const handleOnFocus = () => {};

  return (
    <SearchBox
      items={suggestItems}
      placeholder='Search frames'
      onSearch={handleOnSearch}
      onHover={handleOnHover}
      onSelect={handleOnSelect}
      onClear={() => onStartSearch('')}
      onFocus={handleOnFocus}
      autoFocus
      styling={{ zIndex: 4 }}
    />
  );
};

export default FrameSearchBox;
