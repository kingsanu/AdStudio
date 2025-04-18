import React, { useEffect, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import { domToPng } from "modern-screenshot";
import PageProvider from "canva-editor/layers/core/PageContext";
import PageElement from "canva-editor/layers/core/PageElement";

interface PageThumbnailProps {
  pageIndex: number;
  isActive: boolean;
  onClick: () => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pageIndex,
  isActive,
  onClick,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const { pageSize } = useEditor((state) => ({
    pageSize: state.pageSize,
  }));

  // Generate thumbnail when component mounts or when page changes
  useEffect(() => {
    // Use a simpler approach - capture the actual page content from the editor
    const generateThumbnail = async () => {
      try {
        // Find the page content for this page index
        // Wait a bit for the editor to render the page
        setTimeout(async () => {
          // Try to find the page content in the DOM
          const pageElements = document.querySelectorAll(".page-content");
          if (pageElements && pageElements.length > 0) {
            // Use the first page element as a fallback
            let targetElement = pageElements[0] as HTMLElement;

            // If we have multiple pages and the current page is visible, use that
            if (pageElements.length > pageIndex && isActive) {
              targetElement = pageElements[pageIndex] as HTMLElement;
            }

            // Generate the thumbnail
            const thumbnailData = await domToPng(targetElement, {
              width: targetElement.clientWidth,
              height: targetElement.clientHeight,
              scale: 0.2, // Scale down for better performance
            });

            setThumbnail(thumbnailData);
          }
        }, 300); // Give the editor time to render
      } catch (error) {
        console.error("Error generating thumbnail:", error);
      }
    };

    // Only generate thumbnails for the active page or when thumbnail is null
    if (isActive || thumbnail === null) {
      generateThumbnail();
    }
  }, [pageIndex, isActive, thumbnail, pageSize]);

  return (
    <div
      css={{
        padding: "8px",
        cursor: "pointer",
        borderRadius: "4px",
        background: isActive ? "#f0f9ff" : "transparent",
        "&:hover": {
          background: isActive ? "#f0f9ff" : "#f9fafb",
        },
      }}
      onClick={onClick}
    >
      <div
        css={{
          position: "relative",
        }}
      >
        <div
          css={{
            position: "absolute",
            top: "8px",
            left: "8px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 500,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            zIndex: 1,
          }}
        >
          {pageIndex + 1}
        </div>
        <div
          css={{
            width: "100%",
            aspectRatio: "16/9",
            border: `2px solid ${isActive ? "#0ea5e9" : "#e5e7eb"}`,
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            css={{
              width: "100%",
              height: "100%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={`Page ${pageIndex + 1}`}
                css={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                css={{
                  width: "50%",
                  height: "50%",
                  background: "#f3f4f6",
                  borderRadius: "4px",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageThumbnail;
