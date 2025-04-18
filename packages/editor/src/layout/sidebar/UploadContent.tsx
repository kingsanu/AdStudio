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
import { GET_TEMPLATE_ENDPOINT } from "canva-editor/utils/constants/api";

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

  const [images, setImages] = useState<
    {
      url: string;
      type: "svg" | "image";
      isUploading?: boolean;
      _id?: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
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
  // Fetch user's uploaded images
  const fetchUserImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${config.apis.url}${config.apis.getUserImages}?userId=${userId}`
      );

      console.log("Raw user images response:", response.data);

      // Convert the uploaded images to the format used by the component
      const userImages = response.data
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

          // Transform blob storage URLs to the correct format

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
      setImages(userImages);
    } catch (error) {
      console.error("Error fetching user images:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    config.apis.url,
    config.apis.getUserImages,
    userId,
    setIsLoading,
    setImages,
  ]);

  // Load user images when the component mounts
  useEffect(() => {
    if (visibility) {
      fetchUserImages();
    }
  }, [visibility, userId, fetchUserImages]);

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

        // Add image to the list with uploading state
        const newImageIndex = images.length;
        setImages((prevState) => [
          ...prevState,
          { url: imageDataUrl, type: "image", isUploading: true },
        ]);

        try {
          setIsUploading(true);
          // Upload the image to cloud storage
          await uploadImageToCloud(imageDataUrl);

          // After successful upload, refresh the user's images
          fetchUserImages();
        } catch (error) {
          // Handle upload error
          console.error("Failed to upload image:", error);
          window.alert("Failed to upload image. Please try again.");

          // Remove the failed image
          setImages((prevImages) =>
            prevImages.filter((_, idx) => idx !== newImageIndex)
          );
        } finally {
          setIsUploading(false);
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
        overflowY: "auto",
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
      <div css={{ padding: "16px" }}>
        {isLoading ? (
          <div css={{ textAlign: "center", padding: "20px" }}>
            Loading images...
          </div>
        ) : images.length === 0 ? (
          <div css={{ textAlign: "center", padding: "20px", color: "#666" }}>
            No uploaded images found. Upload some images to see them here.
          </div>
        ) : (
          <div
            css={{
              flexGrow: 1,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gridGap: 8,
            }}
          >
            {images.map((item, idx) => (
              <Draggable
                key={idx}
                onDrop={(pos) => {
                  if (pos) {
                    // Handle image data fetching and adding with position
                    (async () => {
                      const file = item.url.split("/");
                      console.log(file[4]);
                      const templateData = await axios.get(
                        `${GET_TEMPLATE_ENDPOINT}/${file[4]}`
                      );
                      console.log(templateData);
                      addImage(templateData.data.data);
                    })();
                  }
                }}
                onClick={async () => {
                  const file = item.url.split("/");
                  console.log(file[4]);
                  const templateData = await axios.get(
                    `${GET_TEMPLATE_ENDPOINT}/${file[4]}`
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
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadContent;
