import React, { useState, useContext } from "react";
import { EditorContext } from "canva-editor/components/editor/EditorContext";
import { domToPng } from "modern-screenshot";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, X, FileText } from "lucide-react";
import CouponCampaignDialog from "./CouponCampaignDialog";

interface BulkCouponDialogProps {
  open: boolean;
  onClose: () => void;
  isCoupon?: boolean;
}

const BulkCouponDialog: React.FC<BulkCouponDialogProps> = ({
  open,
  onClose,
  isCoupon = false,
}) => {
  const { getState } = useContext(EditorContext);
  const [quantity, setQuantity] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignCreated, setCampaignCreated] = useState(false);

  // Show campaign dialog first if this is a coupon editor
  React.useEffect(() => {
    if (open && isCoupon && !campaignCreated) {
      setShowCampaignDialog(true);
    }
  }, [open, isCoupon, campaignCreated]);

  const handleCampaignSuccess = (result: string | { type: 'template-edit-mode'; data: any }) => {
    if (typeof result === 'string') {
      // Campaign ID returned - campaign was created successfully
      console.log("Campaign created:", result);
      setCampaignCreated(true);
      setShowCampaignDialog(false);
      toast.success(
        "Coupon campaign created! Now you can generate the bulk PDF."
      );
    } else if (result.type === 'template-edit-mode') {
      // User wants to edit template first
      console.log("Template edit mode requested:", result.data);
      setShowCampaignDialog(false);
      // You might want to handle template editing here if needed
      // For now, we'll just close the dialog
      onClose();
    }
  };

  const handleCampaignClose = () => {
    setShowCampaignDialog(false);
    if (isCoupon && !campaignCreated) {
      // If user closes campaign dialog without creating campaign, close the whole dialog
      onClose();
    }
  };

  // Generate unique coupon codes
  const generateCouponCode = (index: number): string => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, 3).toUpperCase();
    return `C${timestamp}${random}${index.toString().padStart(2, "0")}`;
  };

  // Capture page with coupon code
  const capturePageWithCode = async (couponCode: string): Promise<string> => {
    const pageContentEl = document.querySelector(
      ".page-content"
    ) as HTMLElement;
    if (!pageContentEl) throw new Error("Page content element not found");

    // Replace {auto-code} in DOM temporarily
    const textElements = pageContentEl.querySelectorAll('[id^="text-"]');
    const originalTexts: { element: Element; originalText: string }[] = [];

    textElements.forEach((element) => {
      const originalText = element.innerHTML;
      originalTexts.push({ element, originalText });
      if (originalText.includes("{auto-code}")) {
        element.innerHTML = originalText.replace(/{auto-code}/g, couponCode);
      }
    });

    // Capture at high resolution
    const dataUrl = await domToPng(pageContentEl, {
      width: pageContentEl.clientWidth,
      height: pageContentEl.clientHeight,
      style: { transform: "scale(1)", transformOrigin: "top left" },
      backgroundColor: "#ffffff",
    });

    // Restore original text
    originalTexts.forEach(({ element, originalText }) => {
      element.innerHTML = originalText;
    });

    return dataUrl;
  };

  // Generate bulk PDF
  const handleGenerateBulkPDF = async () => {
    if (quantity < 1 || quantity > 1000) {
      toast.error("Please enter a quantity between 1 and 1000");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const state = getState();
      const originalPageSize = state.pageSize;

      // A4 dimensions in points (72 DPI)
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      // Create PDF document with A4 size
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
        orientation: "portrait",
      });

      // Calculate coupon dimensions to fit 2 per row with minimal margins
      const margin = 5; // Minimal margin
      const gap = 5; // Minimal gap between coupons
      const availableWidth = A4_WIDTH - 2 * margin - gap;
      const couponWidth = availableWidth / 2;

      // Calculate height maintaining aspect ratio
      const aspectRatio = originalPageSize.height / originalPageSize.width;
      const couponHeight = couponWidth * aspectRatio;

      // Check if we can fit 2 rows per page
      const availableHeight = A4_HEIGHT - 2 * margin;
      const couponsPerPage =
        Math.floor(availableHeight / (couponHeight + gap)) * 2;
      const maxCouponsPerPage = Math.max(2, couponsPerPage); // At least 2 per page

      const images: string[] = [];

      // Generate images for each coupon
      for (let i = 0; i < quantity; i++) {
        const couponCode = generateCouponCode(i + 1);
        const imageDataUrl = await capturePageWithCode(couponCode);
        images.push(imageDataUrl);

        // Update progress
        setProgress(Math.round(((i + 1) / quantity) * 90)); // First 50% for image generation
      }

      // Add images to PDF in 2-column layout
      let currentPage = 0;
      for (let i = 0; i < images.length; i += maxCouponsPerPage) {
        if (currentPage > 0) {
          doc.addPage();
        }

        // Process coupons for current page
        const couponsOnThisPage = images.slice(i, i + maxCouponsPerPage);

        for (let j = 0; j < couponsOnThisPage.length; j++) {
          const row = Math.floor(j / 2);
          const col = j % 2;

          const x = margin + col * (couponWidth + gap);
          const y = margin + row * (couponHeight + gap);

          // Only add if it fits on the page
          if (y + couponHeight <= A4_HEIGHT - margin) {
            doc.addImage(
              couponsOnThisPage[j],
              "PNG",
              x,
              y,
              couponWidth,
              couponHeight,
              `coupon-${i + j}`,
              "SLOW"
            );
          }
        }

        currentPage++;

        // Update progress for PDF generation
        setProgress(
          50 + Math.round(((i + maxCouponsPerPage) / images.length) * 50)
        );
      }

      // Save the PDF
      const fileName = `bulk-coupons-${quantity}-${Date.now()}.pdf`;
      doc.save(fileName);

      toast.success(`Successfully generated ${quantity} coupons in A4 format!`);
      onClose();
    } catch (error) {
      console.error("Error generating bulk PDF:", error);
      toast.error("Failed to generate bulk PDF. Please try again.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Generate Bulk Coupons</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="quantity">Number of Coupons</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="1000"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Enter quantity (1-1000)"
              disabled={isGenerating}
            />
            <p className="text-sm text-gray-500 mt-1">
              Each coupon will have a unique auto-generated code
            </p>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating coupons...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Short unique codes replace {"{auto-code}"}</li>
              <li>• A4 format, 2 per row, ultra-minimal gaps</li>
              <li>• Maximum coupons per page, high-quality</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateBulkPDF}
            disabled={
              isGenerating ||
              quantity < 1 ||
              quantity > 1000 ||
              (isCoupon && !campaignCreated)
            }
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate PDF"}
          </Button>
        </div>

        {isCoupon && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              {campaignCreated
                ? "✅ Campaign created! You can now generate the bulk PDF."
                : "⚠️ Please create a coupon campaign first before generating bulk coupons."}
            </p>
          </div>
        )}
      </div>

      {/* Coupon Campaign Dialog */}
      <CouponCampaignDialog
        open={showCampaignDialog}
        onClose={handleCampaignClose}
        onSuccess={handleCampaignSuccess}
        templateData={getState()}
      />
    </div>
  );
};

export default BulkCouponDialog;
