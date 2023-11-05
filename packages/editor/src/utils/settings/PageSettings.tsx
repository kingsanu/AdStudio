import { FC, useEffect, useRef, useState } from 'react';
import { useEditor } from '@canva/hooks';
import Page from '@canva/components/editor/Page';
import PlusIcon from '@canva/icons/PlusIcon';
import {
  PageGridItem,
  PageGridItemContainer,
  PageGridView,
} from './PageGridView';
import EditorButton from '@canva/components/EditorButton';
import EditInlineInput from '@canva/components/EditInlineInput';
import DuplicateIcon from '@canva/icons/DuplicateIcon';
import TrashIcon from '@canva/icons/TrashIcon';
import AddNewPageIcon from '@canva/icons/AddNewPageIcon';

interface PageSettingsProps {
  onChangePage: (pageIndex: number) => void;
}
const PageSettings: FC<PageSettingsProps> = ({ onChangePage }) => {
  const [newItemIndex, setNewItemIndex] = useState(-1);
  const gridItemRef = useRef(null);
  const [itemSize, setItemSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const { actions, pages, pageSize, activePage, isLocked, totalPages } =
    useEditor((state) => {
      return {
        pages: state.pages,
        pageSize: state.pageSize,
        activePage: state.activePage,
        totalPages: state.pages.length,
        isLocked:
          state.pages[state.activePage] &&
          state.pages[state.activePage].layers.ROOT.data.locked,
      };
    });

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
          flexShrink: 0,
          height: 48,
          borderBottom: '1px solid rgba(57,76,96,.15)',
          padding: '0 16px',
        }}
      >
        <div
          css={{
            marginLeft: 8,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            cursor: 'pointer',
            ':hover': {
              background: 'rgba(64, 87, 109, 0.07)',
            },
          }}
          onClick={() => {
            handleAddItem(activePage);
          }}
        >
          <AddNewPageIcon />
        </div>
        <div
          css={{
            marginLeft: 8,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            cursor: 'pointer',
            ':hover': {
              background: 'rgba(64, 87, 109, 0.07)',
            },
          }}
          onClick={() => actions.duplicatePage(activePage)}
        >
          <DuplicateIcon />
        </div>
        <div
          css={{
            marginLeft: 8,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            cursor: isLocked || totalPages <= 1 ? 'not-allowed' : 'pointer',
            color:
              isLocked || totalPages <= 1 ? 'rgba(36,49,61,.4)' : '#0d1216',
            ':hover': {
              background:
                isLocked || totalPages <= 1
                  ? undefined
                  : 'rgba(64, 87, 109, 0.07)',
            },
          }}
          onClick={() =>
            !isLocked && totalPages > 1 && actions.deletePage(activePage)
          }
        >
          <TrashIcon />
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
                onClick={() => onChangePage(index)}
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
                  <span>{index + 1} -&nbsp;</span>
                  <EditInlineInput
                    text={page.name}
                    placeholder='Add page title'
                    onSetText={(newText) => {
                      actions.setPageName(index, newText);
                    }}
                  />
                </div>
              </PageGridItem>
              <EditorButton
                className='add-btn'
                onClick={() => handleAddItem(index)}
              >
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
