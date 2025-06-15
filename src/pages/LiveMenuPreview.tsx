import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { liveMenuService } from "@/services/liveMenuService";
import { Loader2, Monitor, AlertCircle } from "lucide-react";

const LiveMenuPreview: React.FC = () => {
  const { liveMenuId } = useParams<{ liveMenuId: string }>();
  const [liveMenuData, setLiveMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (liveMenuId) {
      loadLiveMenuData();
    }
  }, [liveMenuId]);

  // Auto-advance pages every 10 seconds
  useEffect(() => {
    if (liveMenuData?.pageImages?.length > 1) {
      const interval = setInterval(() => {
        setCurrentPage((prev) => 
          (prev + 1) % liveMenuData.pageImages.length
        );
      }, 10000); // 10 seconds per page

      return () => clearInterval(interval);
    }
  }, [liveMenuData?.pageImages?.length]);

  const loadLiveMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll need to get the userId from the live menu ID
      // In a real implementation, you might want to create a separate endpoint
      // that gets live menu by ID directly
      
      // This is a placeholder - you'll need to implement the actual API call
      // const response = await liveMenuService.getLiveMenuById(liveMenuId!);
      
      // For now, let's simulate loading
      setTimeout(() => {
        setLiveMenuData({
          id: liveMenuId,
          title: "Sample Live Menu",
          description: "TV Display Menu",
          pageImages: [
            { url: "/placeholder-menu-1.jpg", pageIndex: 0 },
            { url: "/placeholder-menu-2.jpg", pageIndex: 1 },
          ]
        });
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error("Error loading live menu:", err);
      setError("Failed to load live menu");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading Live Menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-xl mb-2">Error Loading Live Menu</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!liveMenuData?.pageImages?.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p className="text-xl mb-2">No Content Available</p>
          <p className="text-gray-400">This live menu has no pages to display</p>
        </div>
      </div>
    );
  }

  const currentImage = liveMenuData.pageImages[currentPage];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with title and page indicator */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{liveMenuData.title}</h1>
          {liveMenuData.description && (
            <p className="text-gray-400">{liveMenuData.description}</p>
          )}
        </div>
        
        {liveMenuData.pageImages.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              Page {currentPage + 1} of {liveMenuData.pageImages.length}
            </span>
            <div className="flex space-x-1">
              {liveMenuData.pageImages.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPage ? "bg-white" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl max-h-[calc(100vh-80px)] relative">
          {/* Page image */}
          <img
            src={currentImage.url}
            alt={`Live Menu Page ${currentPage + 1}`}
            className="w-full h-full object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              // Handle image load error
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-menu.jpg"; // Fallback image
            }}
          />
          
          {/* Page navigation buttons (for manual control) */}
          {liveMenuData.pageImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPage((prev) => 
                  prev === 0 ? liveMenuData.pageImages.length - 1 : prev - 1
                )}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Previous page"
              >
                ←
              </button>
              
              <button
                onClick={() => setCurrentPage((prev) => 
                  (prev + 1) % liveMenuData.pageImages.length
                )}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Next page"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer with auto-advance indicator */}
      {liveMenuData.pageImages.length > 1 && (
        <div className="bg-gray-900 text-white p-2 text-center">
          <p className="text-sm text-gray-400">
            Auto-advancing every 10 seconds • Click arrows to navigate manually
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveMenuPreview;
