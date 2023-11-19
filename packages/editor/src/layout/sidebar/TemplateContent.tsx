import { FC, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import { PageSize, SerializedPage } from '@canva/types';
import CloseSidebarButton from './CloseButton';
import TemplateSearchBox from './components/TemplateSearchBox';
import HorizontalCarousel from '@canva/components/carousel/HorizontalCarousel';
import OutlineButton from '@canva/components/button/OutlineButton';

interface Template {
  img: string;
  data: string;
  pages: number;
}
const TemplateContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { actions, activePage, config } = useEditor((state, config) => ({
    config,
    activePage: state.activePage,
  }));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const dataRef = useRef(false);
  const [keyword, setKeyword] = useState('');

  const loadData = useCallback(
    async (offset = 0, kw = '') => {
      dataRef.current = true;
      setIsLoading(true);
      const res: any = await axios.get(
        `${config.apis.url}${config.apis.searchTemplates}?ps=18&pi=${offset}&kw=${kw}`
      );
      setTemplates((templates) => [...templates, ...res.data]);
      setIsLoading(false);
      if (res.data.length > 0) {
        dataRef.current = false;
      }
    },
    [setIsLoading]
  );

  useEffect(() => {
    loadData(offset, keyword);
  }, [offset, keyword]);

  useEffect(() => {
    const handleLoadMore = async (e: Event) => {
      const node = e.target as HTMLDivElement;
      if (
        node.scrollHeight - node.scrollTop - 80 <= node.clientHeight &&
        !dataRef.current
      ) {
        setOffset((prevOffset) => prevOffset + 1);
      }
    };

    scrollRef.current?.addEventListener('scroll', handleLoadMore);
    return () => {
      scrollRef.current?.removeEventListener('scroll', handleLoadMore);
    };
  }, [loadData]);

  const handleSearch = async (kw: string) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setOffset(0);
    setKeyword(kw);
    setTemplates([]);
  };

  const addPages = async (data: Array<SerializedPage> | SerializedPage) => {
    try {
      if (Array.isArray(data)) {
        data.forEach((page, idx) => {
          actions.changePageSize(page.layers.ROOT.props.boxSize as PageSize);
          actions.setPage(activePage + idx, page);
        });
      } else {
        actions.changePageSize(data.layers.ROOT.props.boxSize as PageSize);
        actions.setPage(activePage, data);
      }
    } catch (err) {
      console.warn('Something went wrong!');
      console.log(err);
    }
    if (isMobile) {
      onClose();
    }
  };
  return (
    <div
      css={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        overflowY: 'auto',
        display: 'flex',
        padding: 16,
      }}
    >
      <CloseSidebarButton onClose={onClose} />
      <div>
        <TemplateSearchBox
          searchString={keyword}
          onStartSearch={handleSearch}
        />
        <div css={{ paddingTop: 8 }}>
          <HorizontalCarousel>
            {config.templateKeywordSuggestions && config.templateKeywordSuggestions.split(',').map((kw) => (
              <div key={kw} className='carousel-item'>
                <OutlineButton
                  onClick={() => {
                    setKeyword(kw);
                    handleSearch(kw);
                  }}
                >
                  {kw}
                </OutlineButton>
              </div>
            ))}
          </HorizontalCarousel>
        </div>
      </div>
      <div
        css={{ flexDirection: 'column', overflowY: 'auto', display: 'flex' }}
      >
        <div
          ref={scrollRef}
          css={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
            gridGap: 8,
          }}
        >
          {templates.map((item, index) => (
            <div
              key={index}
              css={{ cursor: 'pointer' }}
              onClick={() => addPages(JSON.parse(item.data))}
            >
              <img src={item.img} loading='lazy' />
            </div>
          ))}
          {isLoading && <div>Loading...</div>}
        </div>
      </div>
    </div>
  );
};

export default TemplateContent;
