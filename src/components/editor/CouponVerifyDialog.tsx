import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Tag, Calendar, Percent, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { couponCampaignService } from "@/services/couponCampaignService";
import { domToPng } from "modern-screenshot";
import { jsPDF } from "jspdf";

interface CouponVerifyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (campaignId: string) => void;
  campaignData: {
    campaignName: string;
    description: string;
    discountPercentage: number;
    validity: string;
    numberOfCoupons: number;
  };
  templateData?: unknown;
  templateImageUrl?: string;
}

const CouponVerifyDialog: React.FC<CouponVerifyDialogProps> = ({
  open,
  onClose,
  onSuccess,
  campaignData,
  templateData,
  templateImageUrl,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [step, setStep] = useState<"verify" | "edit">("verify");

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

  // Generate PDF with all coupon codes
  const generateCouponsPDF = async (quantity: number) => {
    setIsGeneratingPDF(true);
    setPdfProgress(0);

    try {
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
      const margin = 5;
      const gap = 5;
      const availableWidth = A4_WIDTH - 2 * margin - gap;
      const couponWidth = availableWidth / 2;

      // Calculate height maintaining aspect ratio (coupon template is 1200x350)
      const aspectRatio = 350 / 1200;
      const couponHeight = couponWidth * aspectRatio;

      // Check how many coupons fit per page
      const availableHeight = A4_HEIGHT - 2 * margin;
      const couponsPerPage =
        Math.floor(availableHeight / (couponHeight + gap)) * 2;
      const maxCouponsPerPage = Math.max(2, couponsPerPage);

      const images: string[] = [];

      // Generate images for each coupon
      for (let i = 0; i < quantity; i++) {
        const couponCode = generateCouponCode(i + 1);
        const imageDataUrl = await capturePageWithCode(couponCode);
        images.push(imageDataUrl);

        // Update progress
        setPdfProgress(Math.round(((i + 1) / quantity) * 70));
      }

      // Add images to PDF in 2-column layout
      let currentPage = 0;
      for (let i = 0; i < images.length; i += maxCouponsPerPage) {
        if (currentPage > 0) {
          doc.addPage();
        }

        const couponsOnThisPage = images.slice(i, i + maxCouponsPerPage);

        for (let j = 0; j < couponsOnThisPage.length; j++) {
          const row = Math.floor(j / 2);
          const col = j % 2;

          const x = margin + col * (couponWidth + gap);
          const y = margin + row * (couponHeight + gap);

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
        setPdfProgress(
          70 + Math.round(((i + maxCouponsPerPage) / images.length) * 30)
        );
      }

      // Save the PDF
      const fileName = `${campaignData.campaignName.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}-coupons-${quantity}-${Date.now()}.pdf`;
      doc.save(fileName);

      toast.success(
        `Successfully generated PDF with ${quantity} coupon codes!`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!user?.userId) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      const campaignDataWithAuth = {
        ...campaignData,
        userId: user.userId,
        outletId: user.userId, // Using userId as outletId as per existing pattern
        templateData,
        templateImageUrl,
      };

      const response = await couponCampaignService.createCouponCampaign(
        campaignDataWithAuth
      );

      if (response.success) {
        toast.success("Coupon campaign created successfully!");

        // Automatically generate PDF with all coupon codes
        await generateCouponsPDF(campaignData.numberOfCoupons);

        onSuccess(response.data._id);
        onClose();
      }
    } catch (error) {
      console.error("Error creating coupon campaign:", error);
      toast.error("Failed to create coupon campaign");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Verify & Generate Coupons
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                Campaign Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Campaign Name:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {campaignData.campaignName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Number of Coupons:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {campaignData.numberOfCoupons.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {campaignData.discountPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Valid Until:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(campaignData.validity).toLocaleDateString()}
                  </span>
                </div>
                {campaignData.description && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Description:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {campaignData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Once created, the coupon codes will be
                automatically generated and a PDF with all{" "}
                {campaignData.numberOfCoupons} coupon codes will be downloaded.
                You can manage and view usage statistics from the dashboard.
              </p>
            </div>

            {/* Progress indicators */}
            {(isLoading || isGeneratingPDF) && (
              <div className="space-y-3">
                {isLoading && !isGeneratingPDF && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Creating campaign...
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" />
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Setting up your coupon campaign in the database...
                    </p>
                  </div>
                )}

                {isGeneratingPDF && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Generating PDF...
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {pdfProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                      <div
                        className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pdfProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Generating {campaignData.numberOfCoupons} unique coupon
                      codes...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isGeneratingPDF}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isGeneratingPDF}
          >
            {isLoading
              ? "Creating Campaign..."
              : isGeneratingPDF
              ? "Generating PDF..."
              : "Create Campaign & Generate PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CouponVerifyDialog;
