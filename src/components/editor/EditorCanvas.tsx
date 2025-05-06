import { FC, useRef, useState, useEffect } from "react";
import { useEditor } from "canva-editor/hooks";
import { DesignFrame } from "canva-editor/components/editor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EditorCanvasProps {
  data?: any;
  onChanges?: (changes: any) => void;
}

const EditorCanvas: FC<EditorCanvasProps> = ({ data, onChanges }) => {
  const { actions, query, state } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Default data if none provided
  const defaultData = [
    {
      name: "",
      notes: "",
      layers: {
        ROOT: {
          type: {
            resolvedName: "RootLayer",
          },
          props: {
            boxSize: {
              width: 1640,
              height: 924,
            },
            position: {
              x: 0,
              y: 0,
            },
            rotate: 0,
            color: "rgb(255, 255, 255)",
            image: null,
          },
          locked: false,
          child: [],
          parent: null,
        },
      },
    },
  ];

  // Handle zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.1, 2);
    setScale(newScale);
    actions.setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.1, 0.5);
    setScale(newScale);
    actions.setScale(newScale);
  };

  const handleZoomReset = () => {
    setScale(1);
    actions.setScale(1);
  };

  // Sync scale with editor state
  useEffect(() => {
    setScale(state.scale);
  }, [state.scale]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      ref={canvasRef}
    >
      {/* Canvas Area */}
      <div className="relative">
        <DesignFrame data={data || defaultData} onChanges={onChanges} />
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white rounded-md shadow-sm border border-neutral-200 p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomOut}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={handleZoomReset}
        >
          {Math.round(scale * 100)}%
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomIn}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        <div className="h-8 border-l border-neutral-200"></div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 3H21V9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21H3V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 3L14 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 21L10 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8V16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 12H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default EditorCanvas;
