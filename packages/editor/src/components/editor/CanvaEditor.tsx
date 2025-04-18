/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { EditorConfig, EditorContext } from "./EditorContext";
import { useEditorStore } from "../../hooks/useEditorStore";
import Sidebar from "canva-editor/layout/Sidebar";
import EditorContent from "canva-editor/layout/pages/EditorContent";
import AppLayerSettings from "canva-editor/layout/AppLayerSettings";
import Preview from "./Preview";
import PageThumbnail from "./PageThumbnail";
import CloseIcon from "canva-editor/icons/CloseIcon";
import { dataMapping, pack } from "canva-editor/utils/minifier";
import { initSyncService } from "../../services/syncService";
// import { downloadObjectAsJson } from "canva-editor/utils/download";
import WorkspaceIcon from "../../icons/WorkspaceIcon";
import HeaderFileMenu from "canva-editor/layout/sidebar/components/HeaderFileMenu";
import PlayArrowIcon from "canva-editor/icons/PlayArrowIcon";
import {
  setupDesignChangeListeners,
  cleanupDesignChangeListeners,
} from "../../utils/designChangeEvent";

export type EditorProps = {
  data?: {
    name: string;
    editorConfig: unknown;
  };
  saving?: boolean;
  config: EditorConfig;
  onChanges: (changes: unknown) => void;
  onDesignNameChanges?: (name: string) => void;
};

const CanvaEditor: FC<PropsWithChildren<EditorProps>> = ({
  data,
  config,
  onChanges,
}) => {
  const version = "1.0.69";
  const { getState, actions, query } = useEditorStore();
  const [viewPortHeight, setViewPortHeight] = useState<number>();
  const [showPreview, setShowPreview] = useState(false);

  // Initialize sync service and design change listeners
  useEffect(() => {
    // Initialize the sync service
    initSyncService();

    // Set up design change listeners
    setupDesignChangeListeners();

    // Set up a callback to handle changes
    const handleChanges = () => {
      if (onChanges) {
        // Pack the data for the parent component
        onChanges(pack(query.serialize(), dataMapping)[0]);
      }
    };

    // Listen for sync status changes
    window.addEventListener("sync-status-changed", handleChanges);

    return () => {
      // Clean up design change listeners
      cleanupDesignChangeListeners();
      window.removeEventListener("sync-status-changed", handleChanges);
    };
  }, [onChanges, query]);

  useEffect(() => {
    const windowHeight = () => {
      setViewPortHeight(window.innerHeight);
    };
    window.addEventListener("resize", windowHeight);
    windowHeight();
    return () => {
      window.removeEventListener("resize", windowHeight);
    };
  }, []);

  // Monitor sidebar state
  useEffect(() => {
    // This effect is kept for future sidebar state monitoring if needed
    const checkSidebarState = () => {
      // No longer tracking sidebar expanded state
    };

    // Check initially
    checkSidebarState();
  }, []);

  return (
    <EditorContext.Provider value={{ config, getState, actions, query }}>
      <div
        css={{
          display: "flex",
          flexDirection: "column",
          width: "100vw",
          height: "100vh",
          maxHeight: viewPortHeight ? `${viewPortHeight}px` : "auto",
          background: "white",
        }}
      >
        {/* Top Header Bar */}
        <div
          css={{
            height: "56px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <div css={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3]" />
            <span className="font-bold whitespace-pre text-black dark:text-white">
              Ads Studio
            </span>
            <div
              css={{
                marginLeft: "16px",
                background: "#0070f3",
                borderRadius: "4px",
              }}
            >
              <HeaderFileMenu
                designName={data?.name || "New Pitch Deck for Sales"}
              />
            </div>
          </div>

          <div
            css={{
              display: "flex",
              alignItems: "center",
              marginBlock: "auto",
            }}
            className="mx-auto flex-row"
          >
            <div
              css={{ marginRight: "8px", fontSize: "18px", color: "#6b7280" }}
            >
              <WorkspaceIcon />
            </div>
            <div css={{ display: "flex", flexDirection: "column" }}>
              <span css={{ fontWeight: 500 }}>
                {data?.name || "New Pitch Deck for Sales"}
              </span>
              <span css={{ fontSize: "12px", color: "#6b7280" }}>
                Workspace
              </span>
            </div>
          </div>

          <div css={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              css={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "#0070f3",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              {data?.name ? data.name.substring(0, 1).toUpperCase() : "U"}
            </div>

            <div css={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  "&:hover": { background: "#16a34a" },
                }}
                onClick={() => {
                  // Start Campaign functionality
                  // This would change the content of the pages section
                  const pagesSection = document.querySelector(
                    '[css*="width: 256px"][css*="borderLeft"]'
                  );
                  if (pagesSection) {
                    const header = pagesSection.querySelector("h3");
                    if (header) header.textContent = "Start Campaign";
                  }
                }}
              >
                <span>Start Campaign</span>
              </button>

              <button
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  "&:hover": { background: "rgba(0,0,0,0.02)" },
                }}
                onClick={() => setShowPreview(true)}
              >
                <PlayArrowIcon />
                <span>Preview</span>
              </button>

              <button
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: "#0070f3",
                  color: "white",
                  border: "none",
                  "&:hover": { background: "#4f46e5" },
                }}
                onClick={() => {
                  actions.fireDownloadPNGCmd(0);
                }}
              >
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          css={{
            display: "flex",
            flex: "1",
            overflow: "hidden",
            position: "relative", // Added for absolute positioning of expanded sidebar
          }}
        >
          {/* Left Sidebar - Tools */}
          <div
            css={{
              borderRight: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "8px 0",
              overflow: "visible",
              zIndex: 20, // Ensure the sidebar tabs are above the expanded content
              background: "white",
              height: "100vh",
              position: "relative", // Needed for z-index to work
            }}
          >
            <Sidebar version={version} />
          </div>

          {/* Main Canvas Area */}
          <div
            css={{
              flexGrow: 1,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              background: "#f3f4f6",
              transition: "margin-left 0.3s ease",
              marginLeft: "0",
            }}
          >
            <AppLayerSettings />
            <EditorContent data={data?.editorConfig} onChanges={onChanges} />
          </div>

          {/* Right Sidebar - Slide Thumbnails */}
          <div
            css={{
              width: "256px",
              borderLeft: "1px solid #e5e7eb",
              background: "white",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              css={{
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h3 css={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>
                Pages
              </h3>
            </div>

            <div
              css={{
                flex: 1,
                overflowY: "auto",
                padding: "8px",
              }}
            >
              {getState().pages.map((_, index) => (
                <PageThumbnail
                  key={index}
                  pageIndex={index}
                  isActive={getState().activePage === index}
                  onClick={() => actions.setActivePage(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview/Presentation Mode */}
      {showPreview && (
        <div
          css={{
            position: "fixed",
            inset: 0,
            zIndex: 1040,
            background: "rgba(13,18,22,.95)",
          }}
        >
          <Preview onClose={() => setShowPreview(false)} />
          <div
            css={{
              background: "transparent",
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "fixed",
              right: 24,
              top: 24,
              borderRadius: "50%",
              fontSize: 36,
              color: "#fff",
              cursor: "pointer",
              ":hover": {
                background: "rgba(255,255,255,0.3)",
                transition: "background-color 200ms linear",
              },
            }}
            onClick={() => setShowPreview(false)}
          >
            <CloseIcon />
          </div>
        </div>
      )}
    </EditorContext.Provider>
  );
};

export default CanvaEditor;
