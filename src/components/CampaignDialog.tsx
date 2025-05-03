import { useState } from "react";
import { toast } from "sonner";
import { 
  Check, 
  ChevronRight, 
  Users, 
  MessageSquare, 
  Image, 
  QrCode,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MultipleSelector, Option } from "@/components/ui/multiselect";

interface CampaignDialogProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
}

const customerSegments: Option[] = [
  { label: "VIP Customers", value: "vip" },
  { label: "Last 6 months not visited", value: "inactive_6m" },
  { label: "Visited last month", value: "active_1m" },
  { label: "Birthday this month", value: "birthday" },
  { label: "New customers", value: "new" },
  { label: "Regular customers", value: "regular" },
];

const CampaignDialog = ({ open, onClose, templateId }: CampaignDialogProps) => {
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<Option[]>([]);
  const [userCount, setUserCount] = useState(100);
  const [message, setMessage] = useState("");
  const [whatsappUsername, setWhatsappUsername] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Handle next step
  const handleNext = async () => {
    if (step === 1) {
      if (!campaignName) {
        toast.error("Please enter a campaign name");
        return;
      }
      if (selectedSegments.length === 0) {
        toast.error("Please select at least one customer segment");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!message) {
        toast.error("Please enter a message");
        return;
      }
      
      // Check if WhatsApp username is provided
      if (!whatsappUsername) {
        toast.error("Please enter your WhatsApp username");
        return;
      }
      
      // Check connection status
      if (!isConnected) {
        await checkWhatsAppConnection();
        return;
      }
      
      setStep(3);
    } else if (step === 3) {
      // Launch campaign
      toast.success("Campaign launched successfully!");
      onClose();
      setStep(1);
      resetForm();
    }
  };

  // Check WhatsApp connection
  const checkWhatsAppConnection = async () => {
    setIsConnecting(true);
    
    try {
      // Check if session exists
      const statusResponse = await fetch(`/api/whatsapp/session/status/${whatsappUsername}`);
      const statusData = await statusResponse.json();
      
      if (statusData.success && statusData.connected) {
        setIsConnected(true);
        toast.success("WhatsApp connected successfully!");
        setStep(3);
      } else {
        // Start session and show QR code
        const startResponse = await fetch(`/api/whatsapp/session/start/${whatsappUsername}`);
        const startData = await startResponse.json();
        
        if (startData.success || startData.error === "Session already exists") {
          // Get QR code
          setQrCodeUrl(`/api/whatsapp/session/qr/${whatsappUsername}/image`);
          setShowQR(true);
          
          // Start polling for connection status
          startPollingConnectionStatus();
        } else {
          toast.error("Failed to start WhatsApp session");
        }
      }
    } catch (error) {
      console.error("Error checking WhatsApp connection:", error);
      toast.error("Failed to connect to WhatsApp");
    } finally {
      setIsConnecting(false);
    }
  };

  // Start polling for connection status
  const startPollingConnectionStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/session/status/${whatsappUsername}`);
        const data = await response.json();
        
        if (data.success && data.connected) {
          setIsConnected(true);
          setShowQR(false);
          toast.success("WhatsApp connected successfully!");
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
      }
    }, 45000); // Check every 45 seconds
    
    // Clear interval after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);
  };

  // Reset form
  const resetForm = () => {
    setCampaignName("");
    setSelectedSegments([]);
    setUserCount(100);
    setMessage("");
    setWhatsappUsername("");
    setIsConnected(false);
    setShowQR(false);
    setQrCodeUrl("");
  };

  // Handle dialog close
  const handleClose = () => {
    onClose();
    setStep(1);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Create Campaign"}
            {step === 2 && "Campaign Message"}
            {step === 3 && "Campaign Preview"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Set up your campaign details"}
            {step === 2 && "Compose your message and connect WhatsApp"}
            {step === 3 && "Review and launch your campaign"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              {step > 1 ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              {step > 2 ? <Check className="h-5 w-5" /> : "2"}
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Campaign Details */}
        {step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="Enter campaign name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Customer Segments</Label>
              <MultipleSelector
                value={selectedSegments}
                onChange={setSelectedSegments}
                defaultOptions={customerSegments}
                placeholder="Select customer segments"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label>Number of Users</Label>
                <span className="text-sm text-gray-500">{userCount}</span>
              </div>
              <Slider
                defaultValue={[100]}
                max={1000}
                step={10}
                onValueChange={(value) => setUserCount(value[0])}
              />
            </div>
          </div>
        )}

        {/* Step 2: Message and WhatsApp */}
        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your campaign message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="whatsapp-username">WhatsApp Username</Label>
              <Input
                id="whatsapp-username"
                placeholder="Enter your WhatsApp username"
                value={whatsappUsername}
                onChange={(e) => setWhatsappUsername(e.target.value)}
                disabled={isConnected}
              />
              {isConnected && (
                <div className="text-sm text-green-600 flex items-center mt-1">
                  <Check className="h-4 w-4 mr-1" /> Connected
                </div>
              )}
            </div>
            
            {showQR && (
              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                <div className="text-sm text-gray-500 mb-2">Scan this QR code with WhatsApp</div>
                <div className="relative w-48 h-48 bg-gray-100 flex items-center justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-full h-full" />
                  ) : (
                    <QrCode className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">QR code refreshes every 45 seconds</div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="grid gap-4 py-4">
            <div className="border rounded-md p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Campaign Name:</div>
                <div className="font-medium">{campaignName}</div>
                
                <div className="text-gray-500">Customer Segments:</div>
                <div className="font-medium">
                  {selectedSegments.map(segment => segment.label).join(", ")}
                </div>
                
                <div className="text-gray-500">Number of Users:</div>
                <div className="font-medium">{userCount}</div>
                
                <div className="text-gray-500">WhatsApp Username:</div>
                <div className="font-medium">{whatsappUsername}</div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="text-gray-500 text-sm mb-2">Message:</div>
              <div className="text-sm whitespace-pre-wrap">{message}</div>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="text-gray-500 text-sm mb-2">Campaign Preview:</div>
              <div className="flex items-center justify-center p-4 bg-gray-100 rounded-md">
                <Image className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="mr-auto"
            >
              Back
            </Button>
          )}
          
          <Button 
            onClick={handleNext}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                {step === 3 ? "Launch Campaign" : "Next"}
                {step !== 3 && <ChevronRight className="ml-2 h-4 w-4" />}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
