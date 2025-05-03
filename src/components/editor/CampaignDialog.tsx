/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import MultipleSelector, { Option } from "@/components/ui/multiselect";

// Customer segments options
const customerSegments: Option[] = [
  { label: "VIP Customers", value: "vip" },
  { label: "Last 6 months not visited", value: "inactive_6m" },
  { label: "Visited last month", value: "active_1m" },
  { label: "Birthday this month", value: "birthday" },
  { label: "New customers", value: "new" },
  { label: "Regular customers", value: "regular" },
];

interface CampaignDialogProps {
  open: boolean;
  onClose: () => void;
}

const CampaignDialog: React.FC<CampaignDialogProps> = ({ open, onClose }) => {
  // Campaign data state
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    numUsers: 100,
    message: "",
    whatsappUsername: "",
    customSegments: [] as Option[],
  });

  // WhatsApp connection states
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showQR, setShowQR] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCampaignData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSegmentsChange = (newSegments: Option[]) => {
    setCampaignData((prev) => ({
      ...prev,
      customSegments: newSegments,
    }));
  };

  const handleUserCountChange = (value: number) => {
    setCampaignData((prev) => ({
      ...prev,
      numUsers: value,
    }));
  };

  const handleNext = () => {
    // Validate required fields for step 1
    if (!campaignData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (!campaignData.message.trim()) {
      toast.error("Campaign message is required");
      return;
    }

    if (campaignData.customSegments.length === 0) {
      toast.error("Please select at least one customer segment");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      // Simulate WhatsApp connection check
      setIsConnecting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success toast
      toast.success("Campaign started successfully!", {
        description: `Sending messages to ${campaignData.numUsers} recipients`,
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        duration: 5000,
      });

      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Error in campaign submission:", error);
      toast.error("Failed to start campaign");
    } finally {
      setIsConnecting(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setCampaignData({
        name: "",
        numUsers: 100,
        message: "",
        whatsappUsername: "",
        customSegments: [],
      });
      setIsConnected(false);
      setShowQR(false);
      setQrCodeUrl("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Start Campaign" : "Connect WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Create a new campaign to share your design"
              : "Scan the QR code with your phone to connect WhatsApp"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={campaignData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Enter campaign name"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Segments</Label>
              <div className="col-span-3">
                <MultipleSelector
                  value={campaignData.customSegments}
                  onChange={handleSegmentsChange}
                  defaultOptions={customerSegments}
                  placeholder="Select customer segments"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Users</Label>
              <div className="col-span-3">
                <div className="flex items-center justify-between">
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={campaignData.numUsers}
                    onChange={(e) =>
                      handleUserCountChange(parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <span className="ml-2 text-sm font-medium">
                    {campaignData.numUsers}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                value={campaignData.message}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Enter your campaign message"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Preview</Label>
              <div className="col-span-3 border rounded-md p-4 bg-gray-50">
                <div className="text-sm font-medium mb-2">
                  {campaignData.name || "Campaign Preview"}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {campaignData.message ||
                    "Your campaign message will appear here"}
                </div>
                <div className="text-xs text-gray-500">
                  Will be sent to {campaignData.numUsers} users
                  {campaignData.customSegments.length > 0 && (
                    <>
                      {" "}
                      in the segments:{" "}
                      <span className="font-medium">
                        {campaignData.customSegments.map((segment, index) => (
                          <React.Fragment key={segment.value}>
                            {index > 0 && ", "}
                            {segment.label}
                          </React.Fragment>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="text-center p-4">
              <div className="mb-4">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  WhatsApp integration is not available in this demo version.
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsConnected(true);
                  setStep(1);
                }}
              >
                Simulate Connection
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {isConnected ? (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    "Start Campaign"
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsConnected(true);
                  setStep(1);
                }}
              >
                Connect
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
