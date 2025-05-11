/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState, useRef, useEffect } from "react";
import { useEditor } from "canva-editor/hooks";
import {
  EditorContext,
  EditorConfig,
} from "canva-editor/components/editor/EditorContext";
import { useEditorStore } from "canva-editor/hooks/useEditorStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dataMapping, pack } from "canva-editor/utils/minifier";
import EditorToolbar from "./EditorToolbar";
import EditorSidebar from "./EditorSidebar";
import EditorCanvas from "./EditorCanvas";
import PropertiesPanel from "./PropertiesPanel";
import SlideThumbnails from "./SlideThumbnails";

// Components

export interface PitchEditorProps {
  data?: {
    name: string;
    editorConfig: any;
  };
  saving?: boolean;
  onChanges: (changes: any) => void;
  onDesignNameChanges: (name: any) => void;
}

const PitchEditor: FC<PitchEditorProps> = ({
  data,
  saving: externalSaving,
  onChanges,
  onDesignNameChanges,
}) => {
  // Define editor config
  const editorConfig: EditorConfig = {
    apis: {
      url: "https://adstudioserver.foodyqueen.com/api",
      searchFonts: "/fonts",
      searchTemplates: "/templates",
      searchTexts: "/texts",
      searchImages: "/images",
      searchShapes: "/shapes",
      searchFrames: "/frames",
      templateKeywordSuggestion: "/template-suggestion",
      textKeywordSuggestion: "/text-suggestion",
      imageKeywordSuggestion: "/image-suggestion",
      shapeKeywordSuggestion: "/shape-suggestion",
      frameKeywordSuggestion: "/frame-suggestion",
      getUserImages: "/user-images",
      uploadImage: "/upload-image",
    },
    placeholders: {
      searchTemplate: "Search templates",
      searchText: "Search texts",
      searchImage: "Search images",
      searchShape: "Search shapes",
      searchFrame: "Search frames",
    },
    editorAssetsUrl: "https://adstudioserver.foodyqueen.com/editor",
    imageKeywordSuggestions: "animal,sport,love,scene,dog,cat,whale",
    templateKeywordSuggestions:
      "mother,sale,discount,fashion,model,deal,motivation,quote",
  };

  const { getState, actions, query } = useEditorStore();
  const [viewPortHeight, setViewPortHeight] = useState<number>();
  const [saving, setSaving] = useState(externalSaving || false);
  const [showProperties, setShowProperties] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);

  // Handle changes to the editor content
  useEffect(() => {
    // Set up a callback to handle changes
    const handleChanges = () => {
      if (onChanges) {
        setSaving(true);
        // Pack the data for the parent component
        onChanges(pack(query.serialize(), dataMapping)[0]);
        // Reset saving state after a short delay
        setTimeout(() => setSaving(false), 500);
      }
    };

    // Listen for sync status changes
    window.addEventListener("sync-status-changed", handleChanges);

    return () => {
      window.removeEventListener("sync-status-changed", handleChanges);
    };
  }, [onChanges, query]);

  // Handle viewport height
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

  // Listen for selected layers to show properties panel
  useEffect(() => {
    const checkSelectedLayers = () => {
      const state = getState();
      const activePage = state.activePage;
      const selected = state.selectedLayers[activePage] || [];
      setSelectedLayerIds(selected);
      setShowProperties(selected.length > 0);
    };

    // Check initially
    checkSelectedLayers();

    // Set up interval to check for changes
    const interval = setInterval(checkSelectedLayers, 500);

    return () => clearInterval(interval);
  }, [getState]);

  return (
    <EditorContext.Provider
      value={{ config: editorConfig, getState, actions, query }}
    >
      <div className="flex flex-col w-screen h-screen bg-white">
        {/* Top Toolbar */}
        <EditorToolbar
          designName={data?.name || "New Pitch Deck"}
          saving={saving}
          onChanges={onDesignNameChanges}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools */}
          <EditorSidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Canvas Area */}
            <div
              ref={canvasRef}
              className="flex-1 overflow-auto bg-neutral-100 flex items-center justify-center"
            >
              <EditorCanvas data={data?.editorConfig} onChanges={onChanges} />
            </div>

            {/* Properties Panel - Shows when element is selected */}
            {showProperties && (
              <PropertiesPanel onClose={() => setShowProperties(false)} />
            )}
          </div>

          {/* Right Sidebar - Slide Thumbnails */}
          <SlideThumbnails />
        </div>
      </div>
    </EditorContext.Provider>
  );
};

export default PitchEditor;
