/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Tv, Eye, Calendar, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import axios from "axios";
import { GET_TEMPLATE_PATH_ENDPOINT } from "canva-editor/utils/constants/api";
import { useEditor } from "canva-editor/hooks";
import { unpack } from "canva-editor/utils/minifier";
import { toast } from "sonner";

interface LiveMenuContentProps {
  onClose: () => void;
}

interface LiveMenu {
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

const LiveMenuContent: FC<LiveMenuContentProps> = ({ onClose }) => {
  const { user } = useAuth();
  const isMobile = useMobileDetect();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"public" | "mine">("mine");
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // Get editor state and actions
  const { actions, state } = useEditor();
  const activePage = state.activePage;

  // Mock data for now - in real implementation, you'd fetch from API
  const [liveMenus, setLiveMenus] = useState<LiveMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveMenus();
  }, [activeTab, user?.userId]);

  const loadLiveMenus = async () => {
    try {
      setLoading(true);
      
      // For now, we'll use mock data
      // In real implementation, you'd call an API endpoint
      const mockLiveMenus: LiveMenu[] = [
        {
          _id: "1",
          title: "Restaurant Menu Display",
          description: "Main menu for TV display",
          pageImages: [
            { url: "/placeholder-menu-1.jpg", pageIndex: 0 },
            { url: "/placeholder-menu-2.jpg", pageIndex: 1 },
          ],
          tags: ["restaurant", "menu", "tv"],
          isPublic: activeTab === "public",
          createdAt: new Date().toISOString(),
          userId: activeTab === "mine" ? user?.userId || "" : "other-user",
          templateUrl: "https://example.com/template.json",
        },
      ];

      setLiveMenus(mockLiveMenus);
    } catch (error) {
      console.error("Error loading live menus:", error);
      toast.error("Failed to load live menus");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLiveMenu = async (liveMenu: LiveMenu) => {
    if (!liveMenu.templateUrl && !liveMenu.templateData) {
      toast.error("No template data available for this live menu");
      return;
    }

    try {
      setIsTemplateLoading(true);
      let templateData;

      if (liveMenu.templateUrl) {
        // Load template from URL using proxy
        console.log("Loading live menu template from URL:", liveMenu.templateUrl);
        
        // URL encode the complete URL to handle special characters
        const encodedUrl = encodeURIComponent(liveMenu.templateUrl);
        
        const response = await axios.get(
          `${GET_TEMPLATE_PATH_ENDPOINT}/${encodedUrl}`
        );
        templateData = response.data;
      } else if (liveMenu.templateData) {
        // Use template data directly
        templateData = liveMenu.templateData;
      }

      if (templateData) {
        // Unpack and load the template
        const unpackedData = unpack(templateData);
        // Load the template into the editor
        // TODO: Implement template loading logic here
        toast.success(`Live menu "${liveMenu.title}" loaded successfully`);
        onClose();
      } else {
        toast.error("Failed to load live menu template data");
      }
    } catch (error) {
      console.error("Error loading live menu template:", error);
      toast.error("Failed to load live menu template");
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const filteredLiveMenus = liveMenus.filter((liveMenu) =>
    liveMenu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    liveMenu.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    liveMenu.tags.some((tag) =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Live Menu Templates</h2>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search live menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "public" | "mine")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mine">My Live Menus</TabsTrigger>
            <TabsTrigger value="public">Public Templates</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Loading live menus...
              </p>
            </div>
          </div>
        ) : filteredLiveMenus.length === 0 ? (
          <div className="text-center py-8">
            <Tv className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? "No live menus found" : "No live menus yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : activeTab === "mine"
                ? "Create your first live menu template"
                : "No public live menu templates available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLiveMenus.map((liveMenu) => (
              <Card
                key={liveMenu._id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleLoadLiveMenu(liveMenu)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {liveMenu.title}
                    </h3>
                    {liveMenu.isPublic && (
                      <Badge variant="secondary" className="ml-2">
                        Public
                      </Badge>
                    )}
                  </div>
                  
                  {liveMenu.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {liveMenu.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{liveMenu.pageImages.length} pages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(liveMenu.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {activeTab === "public" && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Public</span>
                      </div>
                    )}
                  </div>

                  {liveMenu.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {liveMenu.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {liveMenu.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{liveMenu.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isTemplateLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
            <p className="text-sm font-medium">Loading live menu template...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMenuContent;
