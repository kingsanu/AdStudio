import { FC, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { KIOSKS_ENDPOINT } from "canva-editor/utils/constants/api";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KioskImage {
  url: string;
  pageIndex: number;
}

interface Kiosk {
  _id: string;
  title: string;
  description: string;
  pageImages: KioskImage[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  userId: string;
}

const KioskViewer: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch kiosk data
  useEffect(() => {
    const fetchKiosk = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${KIOSKS_ENDPOINT}/${id}`);
        setKiosk(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching kiosk:", err);
        setError("Failed to load kiosk. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchKiosk();
    }
  }, [id]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle next slide
  const nextSlide = () => {
    if (kiosk && kiosk.pageImages.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % kiosk.pageImages.length);
    }
  };

  // Handle previous slide
  const prevSlide = () => {
    if (kiosk && kiosk.pageImages.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + kiosk.pageImages.length) % kiosk.pageImages.length);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [kiosk]);

  // Sort page images by pageIndex
  const sortedImages = kiosk?.pageImages
    ? [...kiosk.pageImages].sort((a, b) => a.pageIndex - b.pageIndex)
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error || !kiosk) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Kiosk</h2>
        <p className="text-gray-300">{error || "Kiosk not found"}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Kiosk title */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <h1 className="text-white text-xl font-bold">{kiosk.title}</h1>
        {kiosk.description && (
          <p className="text-gray-300 text-sm">{kiosk.description}</p>
        )}
      </div>

      {/* Slideshow */}
      <div className="h-full w-full flex items-center justify-center">
        {sortedImages.length > 0 ? (
          <img
            src={sortedImages[currentSlide].url}
            alt={`Slide ${currentSlide + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-white text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>No images available for this kiosk</p>
          </div>
        )}
      </div>

      {/* Navigation controls */}
      {sortedImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-12 w-12"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-12 w-12"
            onClick={nextSlide}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Slide indicator */}
      {sortedImages.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 rounded-full px-4 py-1 text-white text-sm">
            {currentSlide + 1} / {sortedImages.length}
          </div>
        </div>
      )}

      {/* Fullscreen button */}
      <Button
        variant="ghost"
        className="absolute bottom-4 right-4 bg-black/30 hover:bg-black/50 text-white"
        onClick={toggleFullscreen}
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </Button>
    </div>
  );
};

export default KioskViewer;
