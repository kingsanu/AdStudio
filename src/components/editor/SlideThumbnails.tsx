import { FC, useEffect, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SlideThumbnailProps {
  pageIndex: number;
  isActive: boolean;
  onClick: () => void;
}

const SlideThumbnail: FC<SlideThumbnailProps> = ({
  pageIndex,
  isActive,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "relative p-2 cursor-pointer transition-all",
        isActive ? "bg-indigo-50" : "hover:bg-neutral-50"
      )}
      onClick={onClick}
    >
      <div className="absolute left-2 top-2 flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-sm text-xs font-medium">
        {pageIndex + 1}
      </div>
      <div
        className={cn(
          "w-full aspect-[16/9] rounded-md border overflow-hidden",
          isActive ? "border-indigo-500" : "border-neutral-200"
        )}
      >
        {/* This would be replaced with actual slide preview */}
        <div className="w-full h-full bg-white flex items-center justify-center">
          {/* Placeholder for slide content */}
          <div className="w-3/4 h-1/2 flex flex-col gap-2">
            <div className="w-1/2 h-4 bg-neutral-200 rounded"></div>
            <div className="w-3/4 h-3 bg-neutral-100 rounded"></div>
            <div className="w-2/3 h-3 bg-neutral-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SlideThumbnails: FC = () => {
  const { actions, state } = useEditor();
  const [activePage, setActivePage] = useState(0);

  // Sync with editor state
  useEffect(() => {
    setActivePage(state.activePage);
  }, [state.activePage]);

  const handlePageClick = (index: number) => {
    actions.setActivePage(index);
    setActivePage(index);
  };

  return (
    <div className="w-64 border-l border-neutral-200 bg-white flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-medium text-sm">Slides</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {state.pages.map((_, index) => (
          <SlideThumbnail
            key={index}
            pageIndex={index}
            isActive={activePage === index}
            onClick={() => handlePageClick(index)}
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
  );
};

export default SlideThumbnails;
