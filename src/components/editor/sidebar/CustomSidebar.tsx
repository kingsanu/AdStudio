/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from "react";
import { useEditor } from "canva-editor/hooks";
import SidebarTab from "canva-editor/layout/TabList";
import FrameContent from "canva-editor/layout/sidebar/FrameContent";
import UploadContent from "canva-editor/layout/sidebar/UploadContent";
import Notes from "canva-editor/utils/settings/sidebar/Notes";
import BottomSheet from "canva-editor/components/bottom-sheet/BottomSheet";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import LayoutIcon from "canva-editor/icons/LayoutIcon";
import TextIcon from "canva-editor/icons/TextIcon";
import ImageIcon from "canva-editor/icons/ImageIcon";
import ElementsIcon from "canva-editor/icons/ElementsIcon";
import FrameIcon from "canva-editor/icons/FrameIcon";
import UploadIcon from "canva-editor/icons/UploadIcon";

import CustomTemplateContent from "./CustomTemplateContent";
import CustomTextContent from "./CustomTextContent";
import CustomImageContent from "./CustomImageContent";
import CustomShapeContent from "./CustomShapeContent";
import MediaIcon from "canva-editor/icons/VideoIcon";
import MediaContent from "./MediaContent";

const tabs = [
  {
    name: "Template",
    icon: <LayoutIcon />,
  },
  {
    name: "Text",
    icon: <TextIcon />,
  },
  {
    name: "Image",
    icon: <ImageIcon />,
  },
  {
    name: "Shape",
    icon: <ElementsIcon />,
  },
  {
    name: "Frame",
    icon: <FrameIcon />,
  },
  {
    name: "Upload",
    icon: <UploadIcon />,
  },
  {
    name: "Media",
    icon: <MediaIcon />,
  },
];

interface CustomSidebarProps {
  version: string;
}

const CustomSidebar: FC<CustomSidebarProps> = (_props) => {
  const { actions, state } = useEditor();
  const isMobile = useMobileDetect();

  const getSidebarComponent = (tabName: string) => {
    switch (tabName) {
      case "Template":
        return (
          <CustomTemplateContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case "Text":
        return (
          <CustomTextContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case "Frame":
        return (
          <FrameContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case "Image":
        return (
          <CustomImageContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case "Shape":
        return (
          <CustomShapeContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case "Media":
        return (
          <MediaContent
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      case "Notes":
        return <Notes />;
      case "Upload":
        return (
          <UploadContent
            visibility={true}
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      css={{
        display: "flex",
        position: "relative",
        height: "100%",
        maxHeight: "90vh",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid rgba(217, 219, 228, 0.6)",
        borderRight: "1px solid rgba(217, 219, 228, 0.6)",
      }}
    >
      {isMobile && (
        <>
          <BottomSheet
            isOpen={!!state.sideBarTab}
            onClose={() => {
              actions.setSidebarTab();
              actions.setSidebar();
            }}
          >
            {state.sideBarTab && getSidebarComponent(state.sideBarTab)}
          </BottomSheet>
          <div id="bottom_sheet" />
        </>
      )}
      <div
        css={{
          display: "flex",
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
        {!isMobile && (
          <>
            {state.sideBarTab && (
              <div
                css={{
                  width: 360,
                  "@media (max-width: 900px)": {
                    width: "100%",
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    top: 0,
                    background: "#fff",
                  },
                }}
              >
                {getSidebarComponent(state.sideBarTab)}
              </div>
            )}
          </>
        )}
      </div>
      <div
        css={{
          width: state.sidebar ? 360 : 0,
          overflow: "hidden",
          height: "100%",
          pointerEvents: "none",
          borderLeft: "1px solid rgba(217, 219, 228, 0.6)",
          zIndex: isMobile ? 1000 : 30,
          ...(state.sideBarTab
            ? {
                position: "absolute",
                top: 0,
                left: 77,
              }
            : {}),
        }}
        id={"settings"}
      />
    </div>
  );
};

export default CustomSidebar;
