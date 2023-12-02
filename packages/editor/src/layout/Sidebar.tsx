import ReactDOM from 'react-dom';
import SidebarTab from './TabList';
import TextContent from './sidebar/TextContent';
import ShapeContent from './sidebar/ShapeContent';
import ImageContent from './sidebar/ImageContent';
import UploadContent from './sidebar/UploadContent';
import TemplateContent from './sidebar/TemplateContent';
import FrameContent from './sidebar/FrameContent';
import { useEditor } from 'canva-editor/hooks';

// Icons
import LayoutIcon from 'canva-editor/icons/LayoutIcon';
import TextIcon from 'canva-editor/icons/TextIcon';
import ElementsIcon from 'canva-editor/icons/ElementsIcon';
import UploadIcon from 'canva-editor/icons/UploadIcon';
import ImageIcon from 'canva-editor/icons/ImageIcon';
import Notes from 'canva-editor/utils/settings/sidebar/Notes';
import FrameIcon from 'canva-editor/icons/FrameIcon';
import useMobileDetect from 'canva-editor/hooks/useMobileDetect';
import { useRef, useState } from 'react';
import BottomSheet from 'canva-editor/components/bottom-sheet/BottomSheet';

const tabs = [
  {
    name: 'Template',
    icon: <LayoutIcon />,
  },
  {
    name: 'Text',
    icon: <TextIcon />,
  },
  {
    name: 'Image',
    icon: <ImageIcon />,
  },
  {
    name: 'Shape',
    icon: <ElementsIcon />,
  },
  {
    name: 'Frame',
    icon: <FrameIcon />,
  },
  {
    name: 'Upload',
    icon: <UploadIcon />,
  },
];
const Sidebar = () => {
  const { actions, state } = useEditor();
  const isMobile = useMobileDetect();

  const getSidebarComponent = (tabName: string) => {
    switch (tabName) {
      case 'Template':
        return (
          <TemplateContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case 'Text':
        return (
          <TextContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case 'Frame':
        return (
          <FrameContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case 'Image':
        return (
          <ImageContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case 'Shape':
        return (
          <ShapeContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case 'Notes':
        return <Notes />;
      case 'Upload':
        return (
          <UploadContent
            visibility={true}
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
    }
  };

  return (
    <div
      css={{
        display: 'flex',
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRight: '1px solid rgba(217, 219, 228, 0.6)',
      }}
    >
      {isMobile && (
        <BottomSheet
          isOpen={!!state.sideBarTab}
          onClose={() => {
            actions.setSidebarTab();
            actions.setSidebar();
          }}
        >
          {state.sideBarTab && getSidebarComponent(state.sideBarTab)}
        </BottomSheet>
      )}
      <div
        css={{
          display: 'flex'
        }}
      >
        <SidebarTab
          tabs={tabs}
          active={state.sideBarTab}
          onChange={(_, tab) => {
            actions.setSidebar();
            actions.setSidebarTab(tab);
          }}
        />
        {!isMobile && state.sideBarTab && (
          <div
            css={{
              width: 360,
              '@media (max-width: 900px)': {
                width: '100%',
                position: 'fixed',
                bottom: 0,
                left: 0,
                top: 0,
                background: '#fff',
              },
            }}
          >
            {getSidebarComponent(state.sideBarTab)}
          </div>
        )}
      </div>
      <div
        css={{
          width: state.sidebar ? 360 : 0,
          overflow: 'hidden',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
          ...(state.sideBarTab
            ? {
                position: 'absolute',
                top: 0,
                left: 73,
              }
            : {}),
        }}
        id={'settings'}
      />
    </div>
  );
};

export default Sidebar;
