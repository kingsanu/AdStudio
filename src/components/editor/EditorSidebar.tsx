import { FC, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const ToolButton: FC<ToolButtonProps> = ({ icon, label, active, onClick }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex flex-col items-center justify-center w-16 h-16 rounded-md transition-colors",
              active
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50"
            )}
            onClick={onClick}
          >
            <div className="text-xl mb-1">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const EditorSidebar: FC = () => {
  const { actions } = useEditor();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleToolClick = (tabName: string) => {
    if (activeTab === tabName) {
      setActiveTab(null);
      actions.setSidebarTab(null);
    } else {
      setActiveTab(tabName);
      actions.setSidebarTab(tabName);
    }
  };

  return (
    <div className="w-16 border-r border-neutral-200 flex flex-col items-center py-2 bg-white">
      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
          </svg>
        }
        label="Text"
        active={activeTab === "Text"}
        onClick={() => handleToolClick("Text")}
      />

      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="12"
              cy="12"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        }
        label="Image"
        active={activeTab === "Image"}
        onClick={() => handleToolClick("Image")}
      />

      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        }
        label="Shape"
        active={activeTab === "Shape"}
        onClick={() => handleToolClick("Shape")}
      />

      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 10L12 15L17 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 15V3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Video"
        active={activeTab === "Video"}
        onClick={() => handleToolClick("Video")}
      />

      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        }
        label="Elements"
        active={activeTab === "Elements"}
        onClick={() => handleToolClick("Elements")}
      />

      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 6H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 12H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 6H3.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 12H3.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 18H3.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Chart"
        active={activeTab === "Chart"}
        onClick={() => handleToolClick("Chart")}
      />

      <ToolButton
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="9"
              x2="21"
              y2="9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="15"
              x2="21"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="9"
              y1="21"
              x2="9"
              y2="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="21"
              x2="15"
              y2="3"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        }
        label="Table"
        active={activeTab === "Table"}
        onClick={() => handleToolClick("Table")}
      />

      <div className="mt-auto text-xs text-neutral-400">Help</div>
    </div>
  );
};

export default EditorSidebar;
