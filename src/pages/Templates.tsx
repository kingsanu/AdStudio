import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Eye,
  Plus,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { templateService, Template } from "@/services/templateService";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";
import axios from "axios";

export default function Templates() {
  const navigate = useNavigate();
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "business", label: "Business" },
    { value: "social", label: "Social Media" },
    { value: "marketing", label: "Marketing" },
    { value: "presentation", label: "Presentation" },
    { value: "flyer", label: "Flyers" },
    { value: "poster", label: "Posters" },
  ];

  // Fetch public templates
  const fetchPublicTemplates = useCallback(
    async (pageNum = 1, append = false, keyword = "") => {
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
        params.append("isPublic", "true");

        if (keyword) {
          params.append("kw", keyword);
        }

        if (category !== "all") {
          params.append("category", category);
        }

        apiUrl += `?${params.toString()}`;

        const response = await axios.get(apiUrl);
        const templates = response.data.data || response.data || [];

        if (templates.length === 0) {
          setHasMore(false);
        } else {
          if (append) {
            setPublicTemplates((prev) => [...prev, ...templates]);
          } else {
            setPublicTemplates(templates);
          }
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error fetching public templates:", error);
        toast.error("Failed to load templates");
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  useEffect(() => {
    fetchPublicTemplates(1, false, searchQuery);
  }, [fetchPublicTemplates, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPublicTemplates(1, false, searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchPublicTemplates]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPublicTemplates(page + 1, true, searchQuery);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`/editor?template=${templateId}`);
  };

  const handlePreviewTemplate = (template: Template) => {
    // Implement preview functionality
    toast.info(`Previewing ${template.title}`);
  };

  const handleDownloadTemplate = (template: Template) => {
    toast.success(`Downloading ${template.title}...`);
    // Implement download logic here
  };

  const handleCreateNew = () => {
    navigate("/editor");
  };

  return (
    <SharedDashboardLayout
      title="Templates"
      description="Browse and use professional templates for your designs"
    >
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : publicTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <Layout className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">No templates found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? `No templates match "${searchQuery}". Try a different search term.`
              : "No templates available in this category."}
          </p>
          <div className="flex gap-4 justify-center">
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Design
            </Button>
          </div>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {publicTemplates.map((template, index) => (
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
                            templateService.fixImageUrl(
                              template.thumbnailUrl
                            ) || "/placeholder.svg"
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
                                handleUseTemplate(template._id);
                              }}
                            >
                              Use Template
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewTemplate(template);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                        <h3 className="font-medium text-lg truncate mb-2">
                          {template.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{template.description || "Template"}</span>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 cursor-pointer hover:text-yellow-400" />
                            <Download
                              className="h-4 w-4 cursor-pointer hover:text-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadTemplate(template);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {publicTemplates.map((template, index) => (
                <motion.div
                  key={template._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        templateService.fixImageUrl(template.thumbnailUrl) ||
                        "/placeholder.svg"
                      }
                      alt={template.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{template.title}</h3>
                      <p className="text-sm text-gray-500">
                        {template.description || "Professional template"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template._id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

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
