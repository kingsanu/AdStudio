import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Edit,
  Download,
  Star,
  Trash2,
  Plus,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { templateService, Template } from "@/services/templateService";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";
import axios from "axios";

export default function RecentWork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "modified">(
    "recent"
  );

  // Fetch user templates
  const fetchUserTemplates = useCallback(
    async (pageNum = 1, append = false) => {
      if (!user?.userId) return;

      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let apiUrl = "https://adstudioserver.foodyqueen.com/api/templates";
        const params = new URLSearchParams();
        params.append("ps", "12"); // page size
        params.append("pi", (pageNum - 1).toString()); // page index (0-based)
        params.append("userId", user.userId);
        params.append("onlyMine", "true");

        // Add sorting
        if (sortBy === "recent") {
          params.append("sort", "createdAt");
          params.append("order", "desc");
        } else if (sortBy === "modified") {
          params.append("sort", "updatedAt");
          params.append("order", "desc");
        } else if (sortBy === "name") {
          params.append("sort", "title");
          params.append("order", "asc");
        }

        apiUrl += `?${params.toString()}`;

        const response = await axios.get(apiUrl);
        const templates = response.data.data || response.data || [];

        if (templates.length === 0) {
          setHasMore(false);
        } else {
          if (append) {
            setUserTemplates((prev) => [...prev, ...templates]);
          } else {
            setUserTemplates(templates);
          }
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error fetching user templates:", error);
        toast.error("Failed to load your designs");
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [user?.userId, sortBy]
  );

  useEffect(() => {
    fetchUserTemplates(1, false);
  }, [fetchUserTemplates]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchUserTemplates(page + 1, true);
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/editor?template=${templateId}`);
  };

  const handleDownloadTemplate = (template: Template) => {
    toast.success(`Downloading ${template.title}...`);
    // Implement download logic here
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this design?")) {
      try {
        // Implement delete API call
        toast.success("Design deleted successfully");
        fetchUserTemplates(1, false); // Refresh the list
      } catch (error) {
        toast.error("Failed to delete design");
      }
    }
  };

  const handleCreateNew = () => {
    navigate("/editor");
  };

  return (
    <SharedDashboardLayout
      title="Recent Work"
      description="View and manage your recent designs and templates"
    >
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
            >
              <option value="recent">Most Recent</option>
              <option value="modified">Last Modified</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
          <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Design
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : userTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <Star className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">No recent work</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            You haven't created any designs yet. Start creating to see your work
            here.
          </p>
          <Button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Design
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userTemplates.map((template, index) => (
              <motion.div
                key={template._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="relative">
                      <img
                        src={
                          templateService.fixImageUrl(template.thumbnailUrl) ||
                          "/placeholder.svg"
                        }
                        alt={template.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <motion.div
                          className="flex gap-2"
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template._id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTemplate(template);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                      <h3 className="font-medium text-lg truncate mb-2">
                        {template.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                        <Star
                          className="h-4 w-4 cursor-pointer hover:text-yellow-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success("Added to favorites");
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-32"
              >
                {loadingMore ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </SharedDashboardLayout>
  );
}
