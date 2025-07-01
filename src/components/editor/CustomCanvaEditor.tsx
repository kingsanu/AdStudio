/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, PropsWithChildren, useEffect, useState, useMemo } from "react";
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
  designId?: string | null; // The ID of the design being edited (null for new designs)
  onChanges: (changes: unknown) => void;
  onDesignNameChanges?: (name: string) => void;
  isTextTemplate?: boolean;
  isAdmin?: boolean;
  isKiosk?: boolean;
  isLiveMenu?: boolean;
  isCoupon?: boolean;
  isInCouponTemplateMode?: boolean;
  onShare?: (editorContext?: { query: any; actions: any; getState: any }) => void;
  onSaveAsTemplate?: (editorContext?: { query: any; actions: any; getState: any }) => void;
  onDownload?: (editorContext?: { query: any; actions: any; getState: any }) => void;
  onBulkGenerate?: (editorContext?: { query: any; actions: any; getState: any }) => void;
};

const CustomCanvaEditor: FC<PropsWithChildren<CustomCanvaEditorProps>> = ({
  data,
  config,
  designId = null, // Default to null for new designs (temporarily unused)
  onChanges,
  onDesignNameChanges: _onDesignNameChanges, // Rename to avoid unused variable warning
  isAdmin = false,
  isKiosk = false,
  isLiveMenu = false,
  isCoupon = false,
  isInCouponTemplateMode = false,
  onShare,
  onDownload,
  onBulkGenerate,
}) => {
  const version = "1.0.69";
  const { getState, actions, query } = useEditorStore({
    isAdmin,
  });
  const [viewPortHeight, setViewPortHeight] = useState<number>();
  const [showPreview, setShowPreview] = useState(false);

  // Determine editor type
  const editorType = isCoupon ? "coupon" : "design";

  // TODO: Implement designId support properly when CustomCanvaEditor is refactored
  console.log("🆔 CustomCanvaEditor designId prop:", designId);

  // Data binding - synchronize data with the editor
  useEffect(() => {
    if (data?.editorConfig) {
      // TODO: Load editor data properly - loadEditorData method doesn't exist
      // actions.loadEditorData(data.editorConfig);
      console.log("📝 Editor data available but loading method not implemented");
    }
  }, [actions, data?.editorConfig]);
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
    <EditorContext.Provider
      value={useMemo(
        () => ({
          config: { ...config, isAdmin, type: editorType },
          getState,
          actions,
          query,
        }),
        [config, isAdmin, editorType, getState, actions, query]
      )}
    >
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
          isLiveMenu={isLiveMenu}
          isCoupon={isCoupon}
          isInCouponTemplateMode={isInCouponTemplateMode}
          onShare={() => onShare?.({ query, actions, getState })}
          onDownload={() => onDownload?.({ query, actions, getState })}
          onBulkGenerate={() => onBulkGenerate?.({ query, actions, getState })}
          editorContext={{ query, actions, getState, config: { ...config, isAdmin, type: editorType } }}
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

          {/* Right Sidebar - Slide Thumbnails - Hidden for coupon editor */}
          {!isCoupon && (
            <div className="w-64 border-l border-gray-200 bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium m-0">Pages</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {getState().pages.map((page, index) => (
                  <PageThumbnail
                    key={`page-${getState().pages.length}-${index}`}
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
          )}
        </div>

        {/* Preview/Presentation Mode */}
        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/95">
            <Preview onClose={() => setShowPreview(false)} />
            <button
              type="button"
              className="bg-transparent w-15 h-15 flex items-center justify-center fixed right-6 top-6 rounded-full text-white cursor-pointer hover:bg-white/30 transition-colors duration-200"
              onClick={() => setShowPreview(false)}
              aria-label="Close preview"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </EditorContext.Provider>
  );
};

export default CustomCanvaEditor;