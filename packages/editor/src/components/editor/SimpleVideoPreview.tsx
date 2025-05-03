import React, { useState, useEffect } from 'react';
import { X, Download, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../utils/constants/api';

interface SimpleVideoPreviewProps {
  open: boolean;
  onClose: () => void;
  slides: string[]; // Array of image data URLs
  transitions: {
    type: string;
    duration: number;
  }[];
}

const SimpleVideoPreview: React.FC<SimpleVideoPreviewProps> = ({
  open,
  onClose,
  slides,
  transitions,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Auto-advance slides when playing
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = prev + 1;
        if (next >= slides.length) {
          return 0; // Loop back to the beginning
        }
        return next;
      });
    }, 2000); // 2 seconds per slide
    
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);
  
  // Reset to first slide when closed
  useEffect(() => {
    if (!open) {
      setCurrentSlide(0);
      setIsPlaying(false);
    }
  }, [open]);
  
  // Handle export to video
  const handleExport = async () => {
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
        description: error instanceof Error ? error.message : "Please try again.",
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };
  
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
        
        {/* Slideshow Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-6 relative">
            {/* Current slide */}
            {slides.length > 0 && (
              <img
                src={slides[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error(`Error loading slide ${currentSlide}:`, e);
                  // Set a fallback background
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgbG9hZCBlcnJvcjwvdGV4dD48L3N2Zz4=';
                }}
              />
            )}
            
            {/* Slide controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Play/Pause button */}
            <button
              className="absolute bottom-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
          
          {/* Slide info */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Slide {currentSlide + 1} of {slides.length}
            </p>
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
                isExporting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleVideoPreview;
