import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Tag, Calendar as CalendarIcon, Percent, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { couponCampaignService } from "@/services/couponCampaignService";
import { domToPng } from "modern-screenshot";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CouponCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: string | { type: 'template-edit-mode'; data: any }) => void;
  templateData?: unknown;
  templateImageUrl?: string;
}

const CouponCampaignDialog: React.FC<CouponCampaignDialogProps> = ({
  open,
  onClose,
  onSuccess,
  templateData,
  templateImageUrl,
}) => {
  const { user } = useAuth();  const [formData, setFormData] = useState({
    campaignName: "",
    description: "",
    discountPercentage: 10,
    validity: "",
    numberOfCoupons: 100,
  });
  const [validityDate, setValidityDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);  const [step, setStep] = useState<"create" | "verify" | "edit">("create");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

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
      const fileName = `${formData.campaignName.replace(
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

  // Get button text based on current state
  const getButtonText = () => {
    if (isLoading) return "Creating Campaign...";
    if (isGeneratingPDF) return "Generating PDF...";
    return "Create Campaign ";
  };  // Get tomorrow's date as minimum validity date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "discountPercentage" || name === "numberOfCoupons"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setValidityDate(date);
      setFormData((prev) => ({
        ...prev,
        validity: format(date, "yyyy-MM-dd"),
      }));
    }
  };
  const validateForm = () => {
    if (!formData.campaignName.trim()) {
      toast.error("Campaign name is required");
      return false;
    }
    if (formData.discountPercentage < 1 || formData.discountPercentage > 100) {
      toast.error("Discount percentage must be between 1 and 100");
      return false;
    }
    if (formData.numberOfCoupons < 1 || formData.numberOfCoupons > 10000) {
      toast.error("Number of coupons must be between 1 and 10,000");
      return false;
    }
    if (!validityDate) {
      toast.error("Validity date is required");
      return false;
    }
    if (validityDate <= new Date()) {
      toast.error("Validity date must be greater than today");
      return false;
    }
    return true;
  };
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.userId) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      const campaignData = {
        ...formData,
        userId: user.userId,
        outletId: user.userId, // Using userId as outletId as per existing pattern
        templateData,
        templateImageUrl,
      };

      const response = await couponCampaignService.createCouponCampaign(
        campaignData
      );

      if (response.success) {
        toast.success("Coupon campaign created successfully!");

        // Automatically generate PDF with all coupon codes
        await generateCouponsPDF(formData.numberOfCoupons);

        onSuccess(response.data._id);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error("Error creating coupon campaign:", error);
      toast.error("Failed to create coupon campaign");
    } finally {
      setIsLoading(false);
    }
  };  const resetForm = () => {
    setFormData({
      campaignName: "",
      description: "",
      discountPercentage: 10,
      validity: "",
      numberOfCoupons: 100,
    });
    setValidityDate(undefined);
    setStep("create");
  };  const handleBulkGenerate = () => {
    if (!validateForm()) {
      return;
    }
    // Close the dialog and let user edit the template
    // Pass the campaign data to the parent component
    onSuccess({ 
      type: 'template-edit-mode', 
      data: {
        ...formData,
        validity: validityDate ? format(validityDate, "yyyy-MM-dd") : formData.validity
      }
    });
    onClose();
  };

  const handleClose = () => {
    // Only allow closing if not in create step or if form is not filled
    if (step === "create" && (formData.campaignName.trim() || formData.description.trim())) {
      toast.error("Please complete the campaign creation or clear all fields to cancel");
      return;
    }
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />{" "}            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {step === "create"
                ? "Create New Coupon Campaign"
                : step === "verify"
                ? "Verify Coupon Campaign Details"
                : "Edit Coupon Campaign"}
            </h2>
          </div>          <button
            onClick={step === "create" ? handleClose : () => setStep("create")}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={step === "create" ? "Cancel (only if form is empty)" : "Back to create step"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>{" "}        <div className="p-6">
          {step === "create" ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Create a new coupon campaign</strong> by filling in the details below. 
                  All fields marked with * are required.
                </p>
              </div>              <div>
                <Label htmlFor="campaignName">Coupon Campaign Name *</Label>
                <Input
                  id="campaignName"
                  name="campaignName"
                  value={formData.campaignName}
                  onChange={handleInputChange}
                  placeholder="Summer Sale 2024, Holiday Special, Black Friday Deal"
                  required
                  disabled={isLoading || isGeneratingPDF}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Get 20% off on all items. Valid for new and existing customers. Cannot be combined with other offers."
                  rows={3}
                  disabled={isLoading || isGeneratingPDF}
                />
              </div>

              <div>
                <Label htmlFor="numberOfCoupons">Number of Coupons *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="numberOfCoupons"
                    name="numberOfCoupons"
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.numberOfCoupons}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="100"
                    required
                    disabled={isLoading || isGeneratingPDF}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maximum 10,000 coupons per campaign
                </p>
              </div>

              <div>
                <Label htmlFor="discountPercentage">
                  Discount Percentage *
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="discountPercentage"
                    name="discountPercentage"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="10"
                    required
                    disabled={isLoading || isGeneratingPDF}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter percentage value (1-100)
                </p>
              </div>

              <div>
                <Label>Validity Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !validityDate && "text-muted-foreground"
                      )}
                      disabled={isLoading || isGeneratingPDF}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validityDate ? (
                        format(validityDate, "PPP")
                      ) : (
                        <span>Pick an expiry date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validityDate}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date <= new Date() || date < getTomorrowDate()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose when the coupons will expire
                </p>
              </div>
            </div>
          ) : step === "edit" ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Coupon Campaign Name *</Label>{" "}
                <Input
                  id="campaignName"
                  name="campaignName"
                  value={formData.campaignName}
                  onChange={handleInputChange}
                  placeholder="Summer Sale 2024, Holiday Special, Black Friday Deal"
                  required
                  disabled={isLoading || isGeneratingPDF}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>{" "}
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Get 20% off on all items. Valid for new and existing customers. Cannot be combined with other offers."
                  rows={3}
                  disabled={isLoading || isGeneratingPDF}
                />
              </div>

              <div>
                <Label htmlFor="numberOfCoupons">Number of Coupons *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />{" "}                  <Input
                    id="numberOfCoupons"
                    name="numberOfCoupons"
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.numberOfCoupons}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="100"
                    required
                    disabled={isLoading || isGeneratingPDF}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maximum 10,000 coupons per campaign
                </p>
              </div>

              <div>
                <Label htmlFor="discountPercentage">
                  Discount Percentage *
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />{" "}                  <Input
                    id="discountPercentage"
                    name="discountPercentage"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="10"
                    required
                    disabled={isLoading || isGeneratingPDF}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter percentage value (1-100)
                </p>
              </div>              <div>
                <Label htmlFor="validity">Validity Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !validityDate && "text-muted-foreground"
                      )}
                      disabled={isLoading || isGeneratingPDF}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validityDate ? (
                        format(validityDate, "PPP")
                      ) : (
                        <span>Pick an expiry date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validityDate}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date <= new Date() || date < getTomorrowDate()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose when the coupons will expire
                </p>
              </div>

              {/* Campaign Creation Progress - Edit Mode */}
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
                        Generating {formData.numberOfCoupons} unique coupon
                        codes...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
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
                      {formData.campaignName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Number of Coupons:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.numberOfCoupons.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.discountPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Valid Until:
                    </span>                    <span className="font-medium text-gray-900 dark:text-white">
                      {validityDate ? format(validityDate, "PPP") : "Not selected"}
                    </span>
                  </div>
                  {formData.description && (
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <span className="text-gray-600 dark:text-gray-400">
                        Description:
                      </span>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {formData.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Creation Progress */}
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

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Once created, the coupon codes will be
                  automatically generated and a PDF with all{" "}
                  {formData.numberOfCoupons} coupon codes will be downloaded.
                  You can manage and view usage statistics from the dashboard.
                </p>
              </div>

              {/* PDF Generation Progress */}
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
                    Generating {formData.numberOfCoupons} unique coupon codes...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>{" "}        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {step === "create" ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading || isGeneratingPDF}
              >
                Cancel
              </Button>              <Button
                onClick={handleBulkGenerate}
                disabled={isLoading || isGeneratingPDF || !formData.campaignName.trim()}
              >
                Continue
              </Button>
            </>
          ) : step === "verify" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("create")}
                disabled={isLoading || isGeneratingPDF}
              >
                Back to Edit
              </Button>
              <Button
                onClick={() => setStep("edit")}
                disabled={isLoading || isGeneratingPDF}
              >
                Edit Details
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isGeneratingPDF}
              >
                {getButtonText()}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("verify")}
                disabled={isLoading || isGeneratingPDF}
              >
                Back to Verify
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isGeneratingPDF}
              >
                {getButtonText()}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponCampaignDialog;
