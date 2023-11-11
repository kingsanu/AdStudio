import { FC, useState } from 'react';
import { SearchBox } from '@canva/search-autocomplete';
import { default as Fuse, IFuseOptions } from 'fuse.js';
import { defaultFuseOptions } from '@canva/search-autocomplete/utils/config';

const items = [
  {
    id: 0,
    name: 'Cobol',
  },
  {
    id: 1,
    name: 'JavaScript',
  },
  {
    id: 2,
    name: 'Basic',
  },
  {
    id: 3,
    name: 'PHP',
  },
  {
    id: 4,
    name: 'Java',
  },
];
interface Props {}
const ShapeSearchBox: FC<Props> = () => {
  const [suggestItems, setSuggestItems] = useState([]);
  const fuse = new Fuse(items, defaultFuseOptions);
  fuse.setCollection(items);
  const fuseResults = (keyword: string) =>
    fuse
      .search(keyword, { limit: 10 })
      .map((result) => ({ ...result.item }))
      .slice(0, 10);

  const handleOnSearch = (keyword: any) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    let newResults: any = [];
    keyword?.length > 0 && (newResults = fuseResults(keyword));
    console.log(newResults);

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
      placeholder='Search shapes'
      onSearch={handleOnSearch}
      onHover={handleOnHover}
      onSelect={handleOnSelect}
      onFocus={handleOnFocus}
      autoFocus
      styling={{ zIndex: 4 }}
    />
  );
};

export default ShapeSearchBox;
