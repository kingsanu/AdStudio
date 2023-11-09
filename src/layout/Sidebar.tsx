import SidebarTab from '../tabs/TabList';
import TextContent from './sidebar/TextContent';
import ShapeContent from './sidebar/ShapeContent';
import ImageContent from './sidebar/ImageContent';
import UploadContent from './sidebar/UploadContent';
import TemplateContent from './sidebar/TemplateContent';
import FrameContent from './sidebar/FrameContent';
import VideoContent from './sidebar/VideoContent';
import { useEditor } from '@canva/hooks';

// Icons
import LayoutIcon from '@canva/icons/LayoutIcon';
import TextIcon from '@canva/icons/TextIcon';
import ElementsIcon from '@canva/icons/ElementsIcon';
import UploadIcon from '@canva/icons/UploadIcon';
import VideoIcon from '@canva/icons/VideoIcon';
import ImageIcon from '@canva/icons/ImageIcon';
import Notes from '@canva/utils/settings/sidebar/Notes';

const tabs = [
  {
    name: 'Template',
    icon: <LayoutIcon />,
  },
  {
    name: 'Shape',
    icon: <ElementsIcon />,
  },
  {
    name: 'Frame',
    icon: <ElementsIcon />,
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
    name: 'Video',
    icon: <VideoIcon />,
  },
  {
    name: 'Upload',
    icon: <UploadIcon />,
  },
];
const Sidebar = () => {
  const { actions, state } = useEditor();
  return (
    <div
      css={{
        display: 'flex',
        zIndex: 2,
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRight: '1px solid rgba(217, 219, 228, 0.6)',
      }}
    >
      <div
        css={{
          display: 'flex',
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
        {state.sideBarTab && (
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
            {state.sideBarTab === 'Template' && (
              <TemplateContent
                onClose={() => {
                  actions.setSidebarTab();
                  actions.setSidebar();
                }}
              />
            )}
            {state.sideBarTab === 'Text' && (
              <TextContent
                onClose={() => {
                  actions.setSidebarTab();
                  actions.setSidebar();
                }}
              />
            )}
            {state.sideBarTab === 'Frame' && (
              <FrameContent
                onClose={() => {
                  actions.setSidebarTab();
                  actions.setSidebar();
                }}
              />
            )}
            {state.sideBarTab === 'Image' && (
              <ImageContent
                onClose={() => {
                  actions.setSidebarTab();
                  actions.setSidebar();
                }}
              />
            )}
            {state.sideBarTab === 'Video' && (
              <VideoContent
                onClose={() => {
                  actions.setSidebarTab();
                  actions.setSidebar();
                }}
              />
            )}
            {state.sideBarTab === 'Shape' && (
              <ShapeContent
                onClose={() => {
                  actions.setSidebarTab();
                  actions.setSidebar();
                }}
              />
            )}
            {state.sideBarTab === 'Notes' && <Notes />}
            <UploadContent
              visibility={state.sideBarTab === 'Upload'}
              onClose={() => {
                actions.setSidebarTab();
                actions.setSidebar();
              }}
            />
          </div>
        )}
      </div>
      <div
        css={{
          width: state.sidebar ? 360 : 0,
          overflow: 'hidden',
          height: '100%',
          pointerEvents: 'none',
          ...(state.sideBarTab ? {
            position: 'absolute',
            top: 0,
            left: 73
          } : {})
        }}
        id={'settings'}
      />
    </div>
  );
};

export default Sidebar;
