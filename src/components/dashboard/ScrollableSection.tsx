import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/styles";

interface ScrollableSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const ScrollableSection: React.FC<ScrollableSectionProps> = ({
  title,
  subtitle,
  children,
  className = "",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }
  };
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2
            className="text-3xl font-bold mb-2"
            style={{
              color: COLORS.text.primary,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-lg"
              style={{
                color: COLORS.text.secondary,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Left arrow - centered vertically */}
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 h-10 w-10"
          style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Right arrow - centered vertically */}
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 h-10 w-10"
          style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar px-12"
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
