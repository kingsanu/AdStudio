/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Share, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorToolbarProps {
  designName: string;
  saving: boolean;
  onChanges: (name: string) => void;
}

const EditorToolbar: FC<EditorToolbarProps> = ({ designName, onChanges }) => {
  const [name, setName] = useState(designName);
  const { actions } = useEditor();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    onChanges(newName);
  };

  return (
    <div className="h-14 border-b border-neutral-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center"></div>

        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">New Pitch Deck for Sales</span>
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </div>

        <span className="text-xs text-neutral-500">Workspace</span>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip content="Your profile">
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="ghost" size="sm" className="h-9">
          <svg
            width="20"
            height="20"
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

        <Button variant="ghost" size="sm" className="h-9">
          <svg
            width="20"
            height="20"
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
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>

          <Button
            size="sm"
            className="h-9 bg-indigo-600 hover:bg-indigo-700 gap-1"
          >
            <Play className="h-4 w-4" />
            <span>Present</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
