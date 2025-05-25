/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, PropsWithChildren, useEffect, useState } from "react";
import {
  EditorConfig,
  EditorContext,
} from "canva-editor/components/editor/EditorContext";
import { useEditorStore } from "canva-editor/hooks/useEditorStore";
import EditorContent from "canva-editor/layout/pages/EditorContent";
import AppLayerSettings from "canva-editor/layout/AppLayerSettings";
import Preview from "canva-editor/components/editor/Preview";
import PageThumbnail from "canva-editor/components/editor/PageThumbnail";
import CloseIcon from "canva-editor/icons/CloseIcon";
import { dataMapping, pack } from "canva-editor/utils/minifier";
import CustomHeader from "./CustomHeader";
import { CustomSidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export type CustomCanvaEditorProps = {
  data?: {
    name: string;
    editorConfig: unknown;
  };
  saving?: boolean;
  config: EditorConfig;
  onChanges: (changes: unknown) => void;
  onDesignNameChanges?: (name: string) => void;
  isTextTemplate?: boolean;
  isAdmin?: boolean;
  isKiosk?: boolean;
  onShare?: () => void;
  onSaveAsTemplate?: () => void;
  onDownload?: () => void;
};

const CustomCanvaEditor: FC<PropsWithChildren<CustomCanvaEditorProps>> = ({
  data,
  config,
  onChanges,
  onDesignNameChanges: _onDesignNameChanges, // Rename to avoid unused variable warning
  isAdmin = false,
  isKiosk = false,
  onShare,
  onSaveAsTemplate: _onSaveAsTemplate, // Rename to avoid unused variable warning
  onDownload,
}) => {
  const version = "1.0.69";
  const { getState, actions, query } = useEditorStore();
  const [viewPortHeight, setViewPortHeight] = useState<number>();
  const [showPreview, setShowPreview] = useState(false);

  // Set up a callback to handle changes
  useEffect(() => {
    const handleChanges = () => {
      if (onChanges) {
        // Pack the data for the parent component
        onChanges(pack(query.serialize(), dataMapping)[0]);
      }
    };

    // Listen for sync status changes
    window.addEventListener("sync-status-changed", handleChanges);

    return () => {
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

  return (
    <EditorContext.Provider value={{ config, getState, actions, query }}>
      <div
        className="flex flex-col w-full h-screen overflow-hidden"
        style={{
          maxHeight: viewPortHeight ? `${viewPortHeight}px` : "auto",
          background: "white",
        }}
      >
        {/* Custom Header */}
        <CustomHeader
          isAdmin={isAdmin}
          isKiosk={isKiosk}
          onShare={onShare}
          onDownload={onDownload}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar - Tools */}
          <div className="border-r border-gray-200 flex flex-col items-center py-2 overflow-visible z-20 bg-white h-full relative">
            <CustomSidebar version={version} />
          </div>

          {/* Main Canvas Area */}
          <div className="flex-grow relative flex flex-col overflow-y-auto overflow-x-hidden bg-gray-100 transition-all duration-300 ease-in-out">
            <AppLayerSettings />
            <EditorContent data={data?.editorConfig} onChanges={onChanges} />
          </div>

          {/* Right Sidebar - Slide Thumbnails */}
          <div className="w-64 border-l border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium m-0">Pages</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {getState().pages.map((_, index) => (
                <PageThumbnail
                  key={index}
                  pageIndex={index}
                  isActive={getState().activePage === index}
                  onClick={() => actions.setActivePage(index)}
                />
              ))}

              {/* Add Page Button */}
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-1 border-dashed"
                  onClick={() => actions.addPage()}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Page</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview/Presentation Mode */}
        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/95">
            <Preview onClose={() => setShowPreview(false)} />
            <div
              className="bg-transparent w-15 h-15 flex items-center justify-center fixed right-6 top-6 rounded-full text-white cursor-pointer hover:bg-white/30 transition-colors duration-200"
              onClick={() => setShowPreview(false)}
            >
              <CloseIcon />
            </div>
          </div>
        )}
      </div>
    </EditorContext.Provider>
  );
};

export default CustomCanvaEditor;
