import React, { useState, useRef, ChangeEvent } from "react";
import { useEditor } from "canva-editor/hooks";
import axios from "axios";
import { toast } from "sonner";

interface MediaUploadFormProps {
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const MediaUploadForm: React.FC<MediaUploadFormProps> = ({
  onClose,
  onUploadSuccess,
}) => {
  const { config } = useEditor();
  const [mediaType, setMediaType] = useState<string>("backgrounds");
  const [tags, setTags] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewUrl) {
      toast.error("Please select an image to upload");
      return;
    }

    if (!fileInputRef.current?.files?.[0]) {
      toast.error("Please select an image to upload");
      return;
    }

    // Tags are optional

    try {
      setIsUploading(true);

      // Get the original file
      const file = fileInputRef.current.files[0];

      // Extract file extension from the original file
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      // Extract base64 data from preview URL
      const base64Data = previewUrl.split(",")[1];

      // Create filename with original extension
      const filename = `${mediaType}_${Date.now()}.${fileExtension}`;

      // Upload to the appropriate endpoint based on media type
      const response = await axios.post(
        `${config.apis.url}/media/upload/${mediaType}`,
        {
          base64: base64Data,
          filename,
          tags,
          contentType: file.type, // Pass the original content type
        }
      );

      if (response.data.success) {
        toast.success(`${mediaType.slice(0, -1)} uploaded successfully`);
        // Reset form
        setTags("");
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Call success callback if provided
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        toast.error(`Failed to upload ${mediaType.slice(0, -1)}`);
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div css={{ padding: "16px" }}>
      <h2 css={{ marginBottom: "16px" }}>Upload Media</h2>

      <form onSubmit={handleSubmit}>
        <div css={{ marginBottom: "16px" }}>
          <label css={{ display: "block", marginBottom: "8px" }}>
            Media Type
          </label>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            css={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <option value="images">Image</option>
            <option value="backgrounds">Background</option>
            <option value="illustrations">Illustration</option>
            <option value="icons">Icon</option>
            <option value="3dimages">3D Image</option>
          </select>
        </div>

        <div css={{ marginBottom: "16px" }}>
          <label css={{ display: "block", marginBottom: "8px" }}>Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags (comma separated)"
            css={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div css={{ marginBottom: "16px" }}>
          <label css={{ display: "block", marginBottom: "8px" }}>Image</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            css={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        {previewUrl && (
          <div css={{ marginBottom: "16px", textAlign: "center" }}>
            <img
              src={previewUrl}
              alt="Preview"
              css={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "4px",
              }}
            />
          </div>
        )}

        <div css={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={onClose}
            css={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            css={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              background: "#0070f3",
              color: "white",
              cursor: isUploading ? "not-allowed" : "pointer",
              opacity: isUploading ? 0.7 : 1,
            }}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MediaUploadForm;
