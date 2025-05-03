import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CustomSizeDialogProps {
  open: boolean;
  onClose: () => void;
}

interface BoxSize {
  width: number;
  height: number;
}

export default function CustomSizeDialog({ open, onClose }: CustomSizeDialogProps) {
  const navigate = useNavigate();
  const [size, setSize] = useState<BoxSize>({ width: 1080, height: 1080 });
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const aspectRatio = useRef(1);

  useEffect(() => {
    // Initialize aspect ratio
    aspectRatio.current = size.width / size.height;
  }, []);

  const handleChangeSize = (value: string, type: "width" | "height") => {
    const v = parseInt(value, 10) || 0;
    
    if (type === "width") {
      if (lockAspectRatio && v > 0) {
        const newHeight = Math.round(v / aspectRatio.current);
        setSize({ width: v, height: newHeight });
        if (heightRef.current) {
          heightRef.current.value = newHeight.toString();
        }
      } else {
        setSize({ ...size, width: v });
      }
    } else if (type === "height") {
      if (lockAspectRatio && v > 0) {
        const newWidth = Math.round(v * aspectRatio.current);
        setSize({ width: newWidth, height: v });
        if (widthRef.current) {
          widthRef.current.value = newWidth.toString();
        }
      } else {
        setSize({ ...size, height: v });
      }
    }
  };

  const toggleAspectRatio = () => {
    if (!lockAspectRatio) {
      // When locking, save the current aspect ratio
      aspectRatio.current = size.width / size.height;
    }
    setLockAspectRatio(!lockAspectRatio);
  };

  const handleCreateDesign = () => {
    if (size.width <= 0 || size.height <= 0) {
      toast.error("Width and height must be greater than 0");
      return;
    }

    if (size.width > 4000 || size.height > 4000) {
      toast.error("Maximum dimensions are 4000 x 4000 pixels");
      return;
    }

    // Create a blank design with the specified dimensions
    // We'll encode the dimensions in the URL and handle them in the Editor component
    navigate(`/editor?width=${size.width}&height=${size.height}`);
    onClose();
    toast.success("Creating new design");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Custom Size</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <label htmlFor="width" className="text-sm font-medium">
                Width (px)
              </label>
              <Input
                id="width"
                ref={widthRef}
                type="number"
                defaultValue={size.width}
                min={1}
                max={4000}
                onChange={(e) => handleChangeSize(e.target.value, "width")}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="height" className="text-sm font-medium">
                Height (px)
              </label>
              <Input
                id="height"
                ref={heightRef}
                type="number"
                defaultValue={size.height}
                min={1}
                max={4000}
                onChange={(e) => handleChangeSize(e.target.value, "height")}
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={toggleAspectRatio}
          >
            {lockAspectRatio ? (
              <>
                <Lock className="mr-2 h-4 w-4" /> Unlock Aspect Ratio
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" /> Lock Aspect Ratio
              </>
            )}
          </Button>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSize({ width: 1080, height: 1080 });
                if (widthRef.current) widthRef.current.value = "1080";
                if (heightRef.current) heightRef.current.value = "1080";
                aspectRatio.current = 1;
              }}
            >
              Square
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSize({ width: 1080, height: 1920 });
                if (widthRef.current) widthRef.current.value = "1080";
                if (heightRef.current) heightRef.current.value = "1920";
                aspectRatio.current = 1080/1920;
              }}
            >
              Story
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSize({ width: 1200, height: 628 });
                if (widthRef.current) widthRef.current.value = "1200";
                if (heightRef.current) heightRef.current.value = "628";
                aspectRatio.current = 1200/628;
              }}
            >
              Post
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleCreateDesign}
          >
            Create Design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
