import { FC } from 'react';
import { SearchBox } from '@canva/search-autocomplete';
import SearchIcon from '@canva/icons/SearchIcon';

interface Props {
  onSearch: (keyword: string) => void;
}
const FontSearchBox: FC<Props> = ({ onSearch }) => {
  return (
    <SearchBox
      items={[]}
      svgIcon={<SearchIcon />}
      onSearch={onSearch}
      autoFocus
      showNoResults={false}
      styling={{ zIndex: 4 }}
      placeholder='Search fonts'
    />
  );
};

export default FontSearchBox;
