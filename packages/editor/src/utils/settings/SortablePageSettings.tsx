import { SortableContainer, SortableElement } from '@canva/drag-and-drop';
import { PageSize, Page as PageType } from '@canva/types';
import { FC } from 'react';
import { SortEnd } from '@canva/drag-and-drop/types';
import { PageGridItem, PageGridItemContainer } from './PageGridView';
import Page from '@canva/components/editor/Page';
import EditInlineInput from '@canva/components/EditInlineInput';
import EditorButton from '@canva/components/EditorButton';
import PlusIcon from '@canva/icons/PlusIcon';

type PageSortableType = {
  items?: Array<PageType> | any;
  containerRef: React.MutableRefObject<null>;
  newItemIndex: number;
  activePage: number;
  scale: number;
  pageSize: PageSize;
  itemSize: PageSize;
  onSetText: (txt: string) => void;
  onChangePage: (index: number) => void;
  onAddNewPage: (index: number) => void;
  onChange: (change: {
    fromIndex: number;
    toIndex: number;
  }) => void;
};

const SortableItem = SortableElement(
  ({
    item,
    containerRef,
    idx,
    newItemIndex,
    scale,
    activePage,
    pageSize,
    itemSize,
    onSetText,
    onChangePage,
    onAddNewPage,
  }: {
    containerRef: React.MutableRefObject<null>;
    item: PageType;
    idx: number;
    newItemIndex: number;
    activePage: number;
    scale: number;
    pageSize: PageSize;
    itemSize: PageSize;
    onSetText: (txt: string) => void;
    onChangePage: (index: number) => void;
    onAddNewPage: (index: number) => void;
  }): JSX.Element => {
    return (
      <li css={{ float: 'left', listStyle: 'none' }}>
        <PageGridItemContainer
          key={idx}
          className={activePage === idx ? 'is-active' : ''}
        >
          <PageGridItem
            ref={containerRef}
            className='page-btn'
            isNew={idx === newItemIndex}
            onClick={() => onChangePage(idx)}
          >
            <div
              css={{
                position: 'relative',
                height: itemSize.height,
              }}
            >
              <Page
                pageIndex={idx}
                width={pageSize.width}
                height={pageSize.height}
                scale={scale}
                isActive={true}
              />
            </div>
            <div>
              <span>{idx + 1} -&nbsp;</span>
              <EditInlineInput
                text={item.name}
                placeholder='Add page title'
                onSetText={onSetText}
              />
            </div>
          </PageGridItem>
          <EditorButton
            className='add-btn'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddNewPage(idx);
            }}
          >
            <PlusIcon />
          </EditorButton>
        </PageGridItemContainer>
      </li>
    );
  }
);

const SortableList = SortableContainer(
  ({
    items,
    containerRef,
    newItemIndex,
    scale,
    activePage,
    pageSize,
    itemSize,
    onSetText,
    onChangePage,
    onAddNewPage,
  }: PageSortableType) => {
    return (
      <div
        css={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(217px, 1fr))',
          gap: 10,
          position: 'relative',
        }}
      >
        {items.map((page: PageType, index: number) => (
          <SortableItem
            key={`page-${index}`}
            containerRef={containerRef}
            item={page}
            idx={index}
            index={index}
            activePage={activePage}
            scale={scale}
            newItemIndex={newItemIndex}
            pageSize={pageSize}
            itemSize={itemSize}
            onSetText={onSetText}
            onChangePage={onChangePage}
            onAddNewPage={onAddNewPage}
          />
        ))}
      </div>
    );
  }
);

const SortablePageSettings: FC<PageSortableType> = ({
  items,
  containerRef,
  newItemIndex,
  scale,
  activePage,
  pageSize,
  itemSize,
  onSetText,
  onChangePage,
  onAddNewPage,
  onChange,
}) => {
  return (
    <SortableList
      items={items}
      containerRef={containerRef}
      activePage={activePage}
      scale={scale}
      newItemIndex={newItemIndex}
      pageSize={pageSize}
      itemSize={itemSize}
      onSetText={onSetText}
      onChangePage={onChangePage}
      onAddNewPage={onAddNewPage}
      axis='xy'
      pressDelay={120}
      onSortEnd={(change: SortEnd) => {
        if (change?.newIndex !== change.oldIndex) {
          onChange({
            fromIndex: change.oldIndex,
            toIndex: change.newIndex,
          });
        }
      }}
    />
  );
};

export default SortablePageSettings;
