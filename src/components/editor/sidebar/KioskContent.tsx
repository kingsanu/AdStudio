import { FC, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import {
  KIOSKS_ENDPOINT,
  GET_TEMPLATE_ENDPOINT,
  GET_TEMPLATE_PATH_ENDPOINT,
} from "canva-editor/utils/constants/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Search, Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import { useEditor } from "canva-editor/hooks";
import { unpack } from "canva-editor/utils/minifier";
import { toast } from "sonner";

interface KioskContentProps {
  onClose: () => void;
}

interface Kiosk {
  _id: string;
  title: string;
  description: string;
  pageImages: {
    url: string;
    pageIndex: number;
  }[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  userId: string;
  templateId?: string;
  templateData?: Record<string, unknown>; // Template JSON data
  templateUrl?: string; // URL to the JSON file
}

const KioskContent: FC<KioskContentProps> = ({ onClose }) => {
  const { user } = useAuth();
  const isMobile = useMobileDetect();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"public" | "mine">("mine");
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // Get editor state and actions
  const { actions, state } = useEditor();
  const activePage = state.activePage;

  // Fetch kiosks based on active tab
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kiosks", activeTab, user?.userId],
    queryFn: async () => {
      const params: Record<string, string> = {
        ps: "20", // Page size
        pi: "0", // Page index
      };

      if (activeTab === "mine" && user?.userId) {
        params.onlyMine = "true";
        // Extract just the ID part if userId contains city and name
        const userId = user.userId.split("_").pop() || user.userId;
        params.userId = userId;
      } else {
        params.isPublic = "true";
      }

      if (searchQuery) {
        params.kw = searchQuery;
      }

      const response = await axios.get(KIOSKS_ENDPOINT, { params });
      return response.data;
    },
    enabled: !!user,
  });

  // Refetch when search query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        refetch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, refetch, user]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "public" | "mine");
  };

  // Open kiosk in a new window
  const handleOpenKiosk = (kioskId: string) => {
    window.open(`/kiosk/${kioskId}`, "_blank");
  };

  // Load kiosk template in editor
  const loadInEditor = async (kioskId: string) => {
    try {
      setIsTemplateLoading(true);
      toast.loading("Loading template...");

      // Fetch the kiosk data
      const response = await axios.get(`${KIOSKS_ENDPOINT}/${kioskId}`);
      const kiosk = response.data;

      let templateData;

      // Check if the kiosk has a template URL
      if (kiosk.templateUrl) {
        // Use the complete URL with the proxy endpoint
        console.log(
          "Fetching template through proxy with complete URL:",
          kiosk.templateUrl
        );

        // URL encode the complete URL to handle special characters
        const encodedUrl = encodeURIComponent(kiosk.templateUrl);

        const templateResponse = await axios.get(
          `${GET_TEMPLATE_PATH_ENDPOINT}/${encodedUrl}`
        );
        templateData = templateResponse.data;
      }
      // Check if the kiosk has template data directly
      else if (kiosk.templateData) {
        console.log("Using template data from kiosk");
        templateData = kiosk.templateData;
      }
      // Fall back to fetching from the template endpoint if templateId is available
      else if (kiosk.templateId) {
        console.log("Fetching template from template endpoint");
        const templateResponse = await axios.get(
          `${GET_TEMPLATE_ENDPOINT}/${kiosk.templateId}`
        );
        templateData = templateResponse.data;
      } else {
        throw new Error("No template data found for this kiosk");
      }

      // Process the template data
      if (templateData) {
        if (Array.isArray(templateData)) {
          templateData.forEach((page, idx) => {
            const serializedData = unpack(page);
            actions.changePageSize(serializedData.layers.ROOT.props.boxSize);
            actions.setPage(activePage + idx, serializedData);
          });
        } else {
          const serializedData = unpack(templateData);
          actions.changePageSize(serializedData.layers.ROOT.props.boxSize);
          actions.setPage(activePage, serializedData);
        }

        // Show success message
        toast.dismiss();
        toast.success("Template loaded successfully");

        // Close the sidebar
        onClose();
      } else {
        throw new Error("Failed to load template data");
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.dismiss();
      toast.error("Failed to load template");
    } finally {
      setIsTemplateLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ padding: "16px" }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}

      <h2 className="text-lg font-semibold mb-4">Kiosks</h2>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search kiosks..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="mine"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="mine">My Kiosks</TabsTrigger>
          {/* <TabsTrigger value="public">Public</TabsTrigger> */}
        </TabsList>

        <TabsContent value="mine" className="mt-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                  Failed to load kiosks. Please try again.
                </p>
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Monitor className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  You haven't created any kiosks yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a kiosk template to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {data?.data?.map((kiosk: Kiosk) => (
                  <div
                    key={kiosk._id}
                    className="border rounded-lg overflow-hidden hover:border-primary transition-colors"
                  >
                    <div
                      className="aspect-[3/2] relative overflow-hidden bg-muted cursor-pointer"
                      onClick={() => handleOpenKiosk(kiosk._id)}
                    >
                      {kiosk.pageImages && kiosk.pageImages.length > 0 ? (
                        <img
                          src={kiosk.pageImages[0].url}
                          alt={kiosk.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Monitor className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">
                        {kiosk.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {new Date(kiosk.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadInEditor(kiosk._id);
                          }}
                          disabled={isTemplateLoading}
                        >
                          {isTemplateLoading ? "Loading..." : "Load in Editor"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="public" className="mt-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                  Failed to load kiosks. Please try again.
                </p>
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Monitor className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No public kiosks available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {data?.data?.map((kiosk: Kiosk) => (
                  <div
                    key={kiosk._id}
                    className="border rounded-lg overflow-hidden hover:border-primary transition-colors"
                  >
                    <div
                      className="aspect-[3/2] relative overflow-hidden bg-muted cursor-pointer"
                      onClick={() => handleOpenKiosk(kiosk._id)}
                    >
                      {kiosk.pageImages && kiosk.pageImages.length > 0 ? (
                        <img
                          src={kiosk.pageImages[0].url}
                          alt={kiosk.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Monitor className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">
                        {kiosk.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {new Date(kiosk.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadInEditor(kiosk._id);
                          }}
                          disabled={isTemplateLoading}
                        >
                          {isTemplateLoading ? "Loading..." : "Load in Editor"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KioskContent;
