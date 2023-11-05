import { FC, useEffect, useRef, useState } from 'react';
import { useEditor } from '@canva/hooks';
import Page from '@canva/components/editor/Page';
import ArrowLeftIcon from '@canva/icons/ArrowLeftIcon';
import PlusIcon from '@canva/icons/PlusIcon';
import {
  PageGridItem,
  PageGridItemContainer,
  PageGridView,
} from './PageGridView';
import EditorButton from '@canva/components/EditorButton';

interface PageSettingsProps {}
const PageSettings: FC<PageSettingsProps> = () => {
  const [newItemIndex, setNewItemIndex] = useState(-1);
  const gridItemRef = useRef(null);
  const [itemSize, setItemSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const { actions, pages, pageSize, activePage } = useEditor((state) => {
    return {
      pages: state.pages,
      pageSize: state.pageSize,
      activePage: state.activePage,
    };
  });

  const handleChangePage = (pageIndex: number) => {
    actions.setActivePage(pageIndex);
  };
  const handleAddItem = (index: number) => {
    actions.addPage(index);
    setNewItemIndex(-1);
    setTimeout(() => {
      setNewItemIndex(index + 1);
    });
  };

  useEffect(() => {
    const resizeContent = () => {
      if (gridItemRef.current) {
        const borderWidth = 6; // 3 x 2 sides
        const gridItemWidth =
          (gridItemRef.current as HTMLInputElement).clientWidth - borderWidth;
        const calculatedHeight =
          (gridItemWidth * pageSize.height) / pageSize.width + borderWidth;
        setItemSize({
          width: gridItemWidth,
          height: calculatedHeight,
        });
        setScale(gridItemWidth / pageSize.width);
      }
    };

    resizeContent();

    window.addEventListener('resize', resizeContent);
    return () => window.removeEventListener('resize', resizeContent);
  }, []);

  return (
    <div
      css={{
        top: 0,
        left: 0,
        height: `calc(100% - 40px)`,
        width: '100%',
        position: 'absolute',
        background: '#fff',
        zIndex: 2050,
        '@media (max-width: 900px)': {
          height: `calc(100% - 73px)`,
        },
      }}
    >
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          height: 48,
          borderBottom: '1px solid rgba(57,76,96,.15)',
          padding: '0 20px',
        }}
      >
        <p
          css={{
            lineHeight: '48px',
            fontWeight: 600,
            color: '#181C32',
            flexGrow: 1,
          }}
        >
          Pages
        </p>
        <div
          css={{
            '@media (max-width: 900px)': {
              pointerEvents: 'auto',
              display: 'flex',
              position: 'absolute',
              bottom: 24,
              left: 24,
              background: '#3d8eff',
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              color: '#fff',
              fontSize: 24,
            },
          }}
          onClick={() => {
            actions.addPage();
          }}
        >
          <PlusIcon />
        </div>
        <div
          css={{
            fontSize: 20,
            flexShrink: 0,
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => actions.togglePageSettings()}
        >
          <ArrowLeftIcon />
        </div>
      </div>
      <div
        css={{
          padding: 24,
        }}
      >
        <PageGridView>
          {pages.map((page: any, index: any) => (
            <PageGridItemContainer
              key={index}
              className={activePage === index ? 'is-active' : ''}
            >
              <PageGridItem
                ref={gridItemRef}
                className='page-btn'
                isNew={index === newItemIndex}
                onClick={() => handleChangePage(index)}
              >
                <div
                  css={{
                    position: 'relative',
                    height: itemSize.height,
                  }}
                >
                  <Page
                    pageIndex={index}
                    width={pageSize.width}
                    height={pageSize.height}
                    scale={scale}
                    isActive={true}
                  />
                </div>
                <div>
                  <p>{index}</p>
                </div>
              </PageGridItem>
              <EditorButton className='add-btn' onClick={() => handleAddItem(index)}>
                <PlusIcon />
              </EditorButton>
            </PageGridItemContainer>
          ))}
        </PageGridView>
      </div>
    </div>
  );
};
export default PageSettings;
