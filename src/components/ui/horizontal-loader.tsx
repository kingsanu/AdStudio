import React from "react";
import { cn } from "@/lib/utils";

interface HorizontalLoaderProps {
  className?: string;
}

const HorizontalLoader: React.FC<HorizontalLoaderProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "relative h-1 bg-white/20 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-white/60 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
          animation: "shimmer 1.5s infinite linear",
          transform: "translateX(-100%)",
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
};

export { HorizontalLoader };
