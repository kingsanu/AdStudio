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
          zIndex: 4,
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
