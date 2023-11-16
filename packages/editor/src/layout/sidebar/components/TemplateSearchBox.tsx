import { FC, useState } from 'react';
import { SearchBox } from '@canva/search-autocomplete';

interface Props {}
const TemplateSearchBox: FC<Props> = () => {
  const [suggestItems, setSuggestItems] = useState([]);
  const handleOnSearch = (keyword: any) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    let newResults: any = [];
    setSuggestItems(newResults);
  };

  const handleOnHover = (result: any) => {
    // the item hovered
    console.log(result);
  };

  const handleOnSelect = (item: any) => {
    // the item selected
    console.log(item);
  };

  const handleOnFocus = () => {
    console.log('Focused');
  };

  return (
    <SearchBox
      items={suggestItems}
      placeholder='Search templates'
      onSearch={handleOnSearch}
      onHover={handleOnHover}
      onSelect={handleOnSelect}
      onFocus={handleOnFocus}
      autoFocus
      styling={{ zIndex: 4 }}
    />
  );
};

export default TemplateSearchBox;
