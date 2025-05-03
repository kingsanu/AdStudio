import React, { useCallback, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { SlideshowComposition } from "../../remotion/SlideshowComposition";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../utils/constants/api";

interface RemotionPreviewProps {
  open: boolean;
  onClose: () => void;
  slides: string[]; // Array of image data URLs
  transitions: {
    type: string;
    duration: number;
  }[];
}

const RemotionPreview: React.FC<RemotionPreviewProps> = ({
  open,
  onClose,
  slides,
  transitions,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Calculate total duration in frames
  const durationPerSlide = 5; // 5 seconds per slide
  const fps = 30;
  const totalFrames = slides.length * durationPerSlide * fps;

  // Debug the slides
  useEffect(() => {
    if (slides.length > 0) {
      console.log(`RemotionPreview: Received ${slides.length} slides`);
      console.log(`First slide starts with: ${slides[0].substring(0, 50)}...`);
    } else {
      console.warn("RemotionPreview: No slides received");
    }
  }, [slides]);

  // Memoize the composition to avoid unnecessary re-renders
  const composition = useMemo(() => {
    return (
      <SlideshowComposition
        slides={slides}
        transitions={transitions}
        durationPerSlide={durationPerSlide}
      />
    );
  }, [slides, transitions]);

  // Handle export to video
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);

      // Show toast notification for starting the process
      toast.info("Exporting video", {
        description: "Sending slides to server for processing...",
        duration: 5000,
      });

      // Create a form data object to send to the server
      const formData = new FormData();

      // Add each image to the form data
      slides.forEach((dataUrl, index) => {
        // Convert data URL to blob
        const blob = dataURLtoBlob(dataUrl);
        formData.append(`image_${index}`, blob, `slide_${index}.png`);
      });

      // Add transition data
      formData.append("transitions", JSON.stringify(transitions));

      // Send the images to the server for processing
      const response = await fetch(
        `${API_BASE_URL}/api/create-remotion-slideshow`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to export video";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Download the video
      const link = document.createElement("a");
      link.href = data.videoUrl;
      link.download = "slideshow.mp4";
      link.click();

      // Show success toast notification
      toast.success("Video exported successfully", {
        description: "Your slideshow video has been downloaded.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error exporting video:", error);

      // Show error toast notification
      toast.error("Export failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  }, [slides, transitions]);

  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL: string) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-xl w-[90vw] max-w-5xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Video Preview</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Video Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <Player
              component={SlideshowComposition}
              durationInFrames={totalFrames}
              fps={fps}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls
              autoPlay
              loop
              inputProps={{
                slides,
                transitions,
                durationPerSlide,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                isExporting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Video"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemotionPreview;
