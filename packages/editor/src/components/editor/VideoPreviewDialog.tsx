import { FC } from "react";
import { Download, X } from "lucide-react";

interface VideoPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  onDownload: () => void;
}

const VideoPreviewDialog: FC<VideoPreviewDialogProps> = ({
  open,
  onClose,
  videoUrl,
  onDownload,
}) => {
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
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
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
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewDialog;
