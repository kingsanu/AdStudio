/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeEvent,
  FC,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useEditor } from "canva-editor/hooks";
import CloseSidebarButton from "./CloseButton";
import Button from "canva-editor/components/button/Button";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import axios from "axios";
import Draggable from "canva-editor/layers/core/Dragable";
import { Delta } from "canva-editor/types";
import {
  GET_TEMPLATE_ENDPOINT,
  GET_TEMPLATE_PATH_ENDPOINT,
} from "canva-editor/utils/constants/api";
import {
  QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";

import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedImage {
  _id: string;
  url: string;
  filename: string;
  createdAt: string;
}

interface UploadContentProps {
  visibility: boolean;
  onClose: () => void;
}

const UploadContent: FC<UploadContentProps> = ({ visibility, onClose }) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { actions, config } = useEditor();
  const isMobile = useMobileDetect();
  const { user } = useAuth();
  const userId = user?.userId || Cookies.get("auth_token") || "anonymous";
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempUploadingImage, setTempUploadingImage] = useState<{
    url: string;
    type: "svg" | "image";
    isUploading: boolean;
  } | null>(null);

  // Constants for better control
  const PAGE_SIZE = 20;
  const SCROLL_THRESHOLD = 200; // px from bottom to trigger loading
  const scrollRef = useRef<HTMLDivElement>(null);

  const addImage = async (url: string, position?: Delta) => {
    console.log("Original URL:", url);

    // Ensure the URL is properly formatted
    let imageUrl = url;

    // Check if this is a base64 string without data URL prefix
    if (
      url.startsWith("iVBOR") ||
      url.startsWith("/9j/") ||
      url.startsWith("PHN2") ||
      url.startsWith("R0lGOD")
    ) {
      // It's a base64 string without prefix, add the data URL prefix
      imageUrl = `data:image/png;base64,${url}`;
      console.log("Converted base64 to data URL:", imageUrl);
    }
    // Check if the URL is valid
    else if (
      !imageUrl.startsWith("http://") &&
      !imageUrl.startsWith("https://") &&
      !imageUrl.startsWith("data:")
    ) {
      // If it's a relative URL, prepend the base URL
      imageUrl = `https://business.foodyqueen.com${imageUrl}`;
      console.log("Formatted URL:", imageUrl);
    }

    const img = new Image();
    img.onerror = (err) => {
      console.error("Error loading image:", err);
      // Try alternative URL format if the first one fails
      if (imageUrl.includes("business.foodyqueen.com/blob")) {
        const altUrl = imageUrl.replace(
          "business.foodyqueen.com/blob",
          "foodyqueen.blob.core.windows.net"
        );
        console.log("Trying alternative URL format:", altUrl);
        img.src = altUrl;
      } else {
        window.alert("Failed to load image. Please try another one.");
      }
    };
    img.src = imageUrl;
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      actions.addImageLayer(
        { url: img.src, thumb: img.src, position },
        { width: img.naturalWidth, height: img.naturalHeight }
      );
      if (isMobile) {
        onClose();
      }
    };
  };
  // Fetch user's uploaded images using React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["userImages", userId],
    enabled: visibility, // Only fetch when the component is visible
    queryFn: async ({ pageParam = 0 }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      console.log(
        `[UploadContent] Loading page ${pageParam} for user ${userId}`
      );

      // Build the API URL with query parameters
      const apiUrl = `${config.apis.url}${config.apis.getUserImages}?userId=${userId}&ps=${PAGE_SIZE}&pi=${pageParam}`;

      const response = await axios.get(apiUrl);
      console.log("Raw user images response:", response.data);

      // Get the images data and pagination info
      const imagesData = response.data.data || response.data;
      const paginationInfo = response.data.pagination;

      // Convert the uploaded images to the format used by the component
      const userImages = imagesData
        .map((img: UploadedImage) => {
          // Ensure the URL is properly formatted
          let imageUrl;

          // Handle both formats - direct URL string or object with url property
          if (typeof img === "string") {
            imageUrl = img;
          } else if (img && img.url) {
            imageUrl = img.url;
          } else {
            console.error("Invalid image data:", img);
            return null; // Skip this item
          }

          return {
            url: imageUrl,
            type: "image",
            _id:
              img._id ||
              `img_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 11)}`,
          };
        })
        .filter(Boolean); // Remove any null items

      console.log("Fetched user images:", userImages);

      // Determine if there are more images to load
      let hasMoreImages = false;

      if (paginationInfo) {
        // Use pagination info from API if available
        hasMoreImages = paginationInfo.hasMore;
      } else {
        // Fallback to checking if we got a full page
        hasMoreImages = userImages.length === PAGE_SIZE;
      }

      return {
        images: userImages,
        nextPage: hasMoreImages ? pageParam + 1 : undefined,
        hasMore: hasMoreImages,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of images into a single array
  const images = useCallback(() => {
    const allImages = data?.pages.flatMap((page) => page.images) || [];

    // Add the temporary uploading image if it exists
    if (tempUploadingImage) {
      return [...allImages, tempUploadingImage];
    }

    return allImages;
  }, [data?.pages, tempUploadingImage])();

  // Check if we need to load more data when the container is too small
  useEffect(() => {
    // Skip if already loading, no more content, or no images yet
    if (isLoading || !hasNextPage || images.length === 0 || !visibility) {
      return;
    }

    // Check if content fills the viewport
    const checkContentHeight = () => {
      if (!scrollRef.current) return;

      const scrollContainer = scrollRef.current;
      const isContentShorterThanContainer =
        scrollContainer.scrollHeight <= scrollContainer.clientHeight;

      // If content doesn't fill viewport and we have more to load, load next page
      if (isContentShorterThanContainer && hasNextPage && !isFetchingNextPage) {
        console.log(
          "[UploadContent] Content doesn't fill viewport, loading more images"
        );
        fetchNextPage();
      }
    };

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkContentHeight, 300);
    return () => clearTimeout(timer);
  }, [
    images,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    visibility,
  ]);

  // Check if we need to load more data when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // When user scrolls near the bottom, load more images
    if (scrollPosition >= scrollThreshold) {
      console.log(
        "[UploadContent] User scrolled to bottom, loading more images"
      );
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Add scroll event listener
  useEffect(() => {
    const handleScrollThrottled = () => {
      // Use requestAnimationFrame to throttle scroll events
      window.requestAnimationFrame(handleScroll);
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef && visibility) {
      console.log("[UploadContent] Adding scroll event listener");
      currentScrollRef.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (currentScrollRef) {
        console.log("[UploadContent] Removing scroll event listener");
        currentScrollRef.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScroll, visibility]);

  const uploadImageToCloud = async (base64Image: string) => {
    try {
      // Extract the base64 data without the prefix
      const base64Data = base64Image.split(",")[1] || base64Image;
      const filename = `image_${Date.now()}.png`;

      // Upload to the cloud storage service with progress tracking
      const response = await axios.post(
        `${config.apis.url}${config.apis.uploadImage}`,
        {
          base64: base64Data,
          filename,
          userId, // Include the user ID for tracking ownership
        },
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(progress);
          },
        }
      );

      // The response is the direct URL string, not an object with a url property
      const imageUrl = response.data;
      console.log("Uploaded image URL:", imageUrl);
      return imageUrl; // Return the properly formatted URL
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string;

        // Add temporary uploading image
        setTempUploadingImage({
          url: imageDataUrl,
          type: "image",
          isUploading: true,
        });

        try {
          setIsUploading(true);
          // Upload the image to cloud storage
          await uploadImageToCloud(imageDataUrl);

          // After successful upload, refresh the user's images by invalidating the query
          // This will trigger a refetch of the first page
          await fetchNextPage();
        } catch (error) {
          // Handle upload error
          console.error("Failed to upload image:", error);
          window.alert("Failed to upload image. Please try again.");
        } finally {
          queryClient.invalidateQueries({ queryKey: ["userImages"] });
          setIsUploading(false);
          setTempUploadingImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        overflowY: "hidden",
        display: visibility ? "flex" : "none",
      }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}

      <div css={{ padding: "0 16px" }}>
        <h2 css={{ fontSize: "16px", fontWeight: 500, margin: "8px 0" }}>
          My Images
        </h2>
      </div>

      <div
        css={{
          margin: 16,
        }}
      >
        <Button
          css={{ width: "100%" }}
          onClick={() => inputFileRef.current?.click()}
        >
          Upload New Image
        </Button>
      </div>
      <input
        ref={inputFileRef}
        type={"file"}
        accept="image/*"
        css={{ display: "none" }}
        onChange={handleUpload}
      />
      <div
        css={{
          padding: "16px",
          height: "calc(100% - 100px)", // Subtract header height
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          ref={scrollRef}
          css={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          }}
        >
          {images.length === 0 ? (
            <div css={{ textAlign: "center", padding: "20px", color: "#666" }}>
              {isLoading
                ? "Loading images..."
                : isError
                ? "Failed to load images. Please try again."
                : "No uploaded images found. Upload some images to see them here."}
            </div>
          ) : (
            <div
              css={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gridGap: 8,
                width: "100%",
              }}
            >
              {images.map((item, idx) => (
                <Draggable
                  key={`${item._id || idx}`}
                  onDrop={(pos) => {
                    if (pos) {
                      // Handle image data fetching and adding with position
                      (async () => {
                        const file = item.url.split("/");
                        console.log(file[file.length - 1]);
                        const templateData = await axios.get(
                          `${GET_TEMPLATE_PATH_ENDPOINT}/${encodeURI(item.url)}`
                        );
                        console.log(templateData);
                        addImage(templateData.data.data);
                      })();
                    }
                  }}
                  onClick={async () => {
                    const file = item.url.split("/");
                    console.log(file[file.length - 1]);
                    const templateData = await axios.get(
                      `${GET_TEMPLATE_PATH_ENDPOINT}/${encodeURIComponent(
                        item.url
                      )}`
                    );
                    addImage(templateData.data.data);
                  }}
                >
                  <div
                    css={{
                      cursor: "pointer",
                      position: "relative",
                      paddingBottom: "100%",
                      width: "100%",
                    }}
                  >
                    <div
                      css={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.isUploading ? (
                        <div
                          css={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            width: "100%",
                            backgroundColor: "#f0f0f0",
                            position: "relative",
                          }}
                        >
                          <div
                            css={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              backgroundColor: "rgba(0,0,0,0.1)",
                            }}
                          >
                            <div
                              css={{
                                height: "100%",
                                width: `${uploadProgress}%`,
                                backgroundColor: "#0066ff",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                          <div css={{ position: "relative", zIndex: 1 }}>
                            Uploading... {uploadProgress}%
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Add error handling for image loading */}
                          <img
                            src={item.url}
                            loading="lazy"
                            alt="Uploaded image"
                            css={{
                              maxHeight: "100%",
                              maxWidth: "100%",
                              objectFit: "contain",
                              backgroundColor: "#f8f8f8",
                              border: "1px solid #eee",
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Draggable>
              ))}

              {/* Loading spinner for fetching next page */}
              {isFetchingNextPage && (
                <div
                  css={{
                    gridColumn: "span 2",
                    textAlign: "center",
                    padding: "10px 0",
                  }}
                >
                  <div
                    css={{
                      display: "inline-block",
                      width: "30px",
                      height: "30px",
                      border: "3px solid rgba(0, 0, 0, 0.1)",
                      borderTopColor: "#3498db",
                      borderRadius: "50%",
                      animation: "spin 1s ease-in-out infinite",
                      "@keyframes spin": {
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </div>
              )}

              {/* End of images message */}
              {!isLoading && !hasNextPage && images.length > 0 && (
                <div
                  css={{
                    gridColumn: "span 2",
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: "12px",
                    color: "#888",
                  }}
                >
                  End of images
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadContent;
