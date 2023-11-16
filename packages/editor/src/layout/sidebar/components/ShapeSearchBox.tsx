import { FC, useState } from 'react';
import { SearchBox } from '@canva/search-autocomplete';
import axios from 'axios';

interface Props {
  onStartSearch: (kw: string) => void;
}
const ShapeSearchBox: FC<Props> = ({ onStartSearch }) => {
  const [suggestItems, setSuggestItems] = useState([]);
  const handleOnSearch = async (keyword: any) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    const response = await axios.get('/shape-suggestion?kw=' + keyword);
    setSuggestItems(response?.data || []);
  };

  const handleOnHover = (result: any) => {};

  const handleOnSelect = (item: any) => {
    // the item selected
    onStartSearch(item.name);
  };

  const handleOnFocus = () => {};

  return (
    <SearchBox
      items={suggestItems}
      placeholder='Search shapes'
      onSearch={handleOnSearch}
      onHover={handleOnHover}
      onSelect={handleOnSelect}
      onFocus={handleOnFocus}
      onClear={() => onStartSearch('')}
      autoFocus
      styling={{ zIndex: 4 }}
    />
  );
};

export default ShapeSearchBox;
