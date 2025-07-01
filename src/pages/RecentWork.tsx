import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Edit,
  Download,
  Star,
  Trash2,
  Plus,
  Filter,
  Grid,
  List,
  Sparkles,
  Image,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { templateService, Template } from "@/services/templateService";
import SharedDashboardLayout from "@/components/layout/DashboardLayout";
import {
  COLORS,
  SHADOWS,
  BORDER_RADIUS,
  TRANSITIONS,
} from "@/constants/styles";
import axios from "axios";

export default function RecentWork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "modified">(
    "recent"
  );

  const ITEMS_PER_PAGE = 10;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user templates using React Query's useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["userTemplates", user?.userId, sortBy],
    queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
      if (!user?.userId) {
        throw new Error("User ID is required");
      }

      console.log(
        `[RecentWork] Loading page ${pageParam} with sortBy: ${sortBy}`
      );

      let apiUrl = "http://localhost:4000/api/templates";
      const params = new URLSearchParams();
      
      params.append("ps", ITEMS_PER_PAGE.toString());
      params.append("pi", pageParam.toString());
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
      const templates = response.data.data ?? response.data ?? [];
      const paginationInfo = response.data.pagination;

      console.log(
        `[RecentWork] Loaded ${templates.length} templates for page ${pageParam}`
      );

      // Determine if there are more templates to load
      let hasMoreTemplates = false;
      if (paginationInfo) {
        hasMoreTemplates = paginationInfo.hasMore;
      } else {
        // Fallback if pagination info is not available
        hasMoreTemplates = templates.length === ITEMS_PER_PAGE;
      }

      console.log(
        `[RecentWork] Has more templates: ${hasMoreTemplates}`
      );

      return {
        templates,
        nextPage: hasMoreTemplates ? pageParam + 1 : undefined,
        hasMore: hasMoreTemplates,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    enabled: !!user?.userId, // Only run query when user is available
  });

  // Flatten all pages into a single array of templates
  const userTemplates = data?.pages.flatMap((page: any) => page.templates) ?? [];
  
  // Get total count from the first page's pagination info if available
  const firstPageResponse = data?.pages[0];
  const totalCount = firstPageResponse ? userTemplates.length : 0;

  const handleLoadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // Load more when 100px from bottom

      if (
        scrollHeight - scrollTop - clientHeight < threshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleEditTemplate = (templateId: string) => {
    // Add edit=true parameter to indicate editing existing design
    navigate(`/editor?template=${templateId}&edit=true`);
  };

  const handleDownloadTemplate = (template: Template) => {
    toast.success(`Downloading ${template.title}...`);
    // Implement download logic here
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this design?")) {
      try {
        // Implement delete API call
        console.log("Deleting template:", templateId);
        toast.success("Design deleted successfully");
        refetch(); // Refresh the list using React Query
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete design");
      }
    }
  };

  const handleCreateNew = () => {
    navigate("/editor");
  };

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto">
      <SharedDashboardLayout
        title="Recent Work"
        description="View and manage your recent designs and templates"
        showSearch={false}
      >
      {/* Enhanced Hero Section */}
      <motion.div
        className="relative overflow-hidden mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${COLORS.gradients.primary}, ${COLORS.gradients.cool})`,
          }}
        />

        <div className="relative px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="flex flex-col lg:flex-row lg:items-center gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl shadow-lg"
                  style={{
                    background: COLORS.gradients.primary,
                    borderRadius: BORDER_RADIUS.xl,
                  }}
                >
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1
                    className="text-4xl lg:text-5xl font-bold leading-tight"
                    style={{
                      color: COLORS.text.primary,
                    }}
                  >
                    Your Creative Journey
                  </h1>
                  <p
                    className="text-xl mt-2 leading-relaxed"
                    style={{
                      color: COLORS.text.secondary,
                    }}
                  >
                    {totalCount} designs created and counting
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      {/* Enhanced Controls */}
      <motion.div
        className="flex items-center justify-between mb-8 p-6 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          background: COLORS.background.primary,
          border: `1px solid ${COLORS.border.default}`,
          borderRadius: BORDER_RADIUS["2xl"],
          boxShadow: SHADOWS.card,
        }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                background: COLORS.gradients.cool,
                borderRadius: BORDER_RADIUS.lg,
              }}
            >
              <Filter className="h-5 w-5 text-white" />
            </div>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "recent" | "name" | "modified")
              }
              className="border-0 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: COLORS.background.secondary,
                color: COLORS.text.primary,
                borderRadius: BORDER_RADIUS.lg,
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="modified">Last Modified</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div
            className="flex items-center gap-1 rounded-lg overflow-hidden"
            style={{
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: BORDER_RADIUS.lg,
            }}
          >
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none cursor-pointer transition-all duration-300"
              style={{
                ...(viewMode === "grid" && {
                  background: COLORS.gradients.primary,
                  color: "white",
                }),
              }}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none cursor-pointer transition-all duration-300"
              style={{
                ...(viewMode === "list" && {
                  background: COLORS.gradients.primary,
                  color: "white",
                }),
              }}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreateNew}
            className="text-white border-0 cursor-pointer"
            style={{
              background: COLORS.gradients.primary,
              borderRadius: BORDER_RADIUS.lg,
              padding: "12px 24px",
            }}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Design
          </Button>
        </motion.div>
      </motion.div>

      {/* Enhanced Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        {isLoading ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`loading-${i}`}
                className="animate-pulse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <div
                  className="rounded-xl h-48 mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                  style={{
                    borderRadius: BORDER_RADIUS.xl,
                  }}
                ></div>
                <div
                  className="rounded-lg h-4 mb-2 bg-slate-200 dark:bg-slate-700"
                  style={{
                    borderRadius: BORDER_RADIUS.lg,
                  }}
                ></div>
                <div
                  className="rounded-lg h-3 w-2/3 bg-slate-200 dark:bg-slate-700"
                  style={{
                    borderRadius: BORDER_RADIUS.lg,
                  }}
                ></div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div>
            {userTemplates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-20"
              >
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: COLORS.gradients.primary,
                  }}
                >
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <h2
                  className="text-3xl font-bold mb-4"
                  style={{ color: COLORS.text.primary }}
                >
                  No designs yet
                </h2>
                <p
                  className="text-lg max-w-md mx-auto mb-8"
                  style={{ color: COLORS.text.secondary }}
                >
                  Start your creative journey by creating your first design with
                  our powerful editor
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleCreateNew}
                    className="text-white border-0 cursor-pointer"
                    style={{
                      background: COLORS.gradients.primary,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: "16px 32px",
                      fontSize: "16px",
                    }}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Design
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {userTemplates.map((template, index) => (
                  <motion.div
                    key={template._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group h-full"
                  >
                    <Card
                      className="overflow-hidden border-0 cursor-pointer h-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500 py-0"
                      style={{
                        borderRadius: BORDER_RADIUS.xl,
                        boxShadow: SHADOWS.card,
                        border: "1px solid rgba(148, 163, 184, 0.1)",
                      }}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="relative overflow-hidden">
                          <div
                            className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center"
                            style={{
                              borderTopLeftRadius: BORDER_RADIUS.xl,
                              borderTopRightRadius: BORDER_RADIUS.xl,
                            }}
                          >
                            {template.thumbnailUrl ? (
                              <img
                                src={
                                  templateService.fixImageUrl(
                                    template.thumbnailUrl
                                  ) || "/placeholder.svg"
                                }
                                alt={template.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <Image className="h-12 w-12 text-slate-400" />
                            )}
                          </div>

                          {/* Enhanced hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <motion.div
                              className="flex gap-2"
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="shadow-lg bg-white/90 hover:bg-white border-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTemplate(template._id);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="shadow-lg bg-white/90 hover:bg-white border-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadTemplate(template);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="shadow-lg bg-red-500 hover:bg-red-600 text-white border-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate(template._id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </motion.div>
                          </div>
                        </div>

                        {/* Enhanced content section */}
                        <div
                          className="p-6 flex-1 flex flex-col justify-between"
                          style={{
                            background: COLORS.background.primary,
                          }}
                        >
                          <div>
                            <h3
                              className="font-semibold text-lg mb-2 truncate group-hover:text-blue-600 transition-colors duration-300"
                              style={{
                                color: COLORS.text.primary,
                              }}
                            >
                              {template.title}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <span
                              className="text-sm"
                              style={{ color: COLORS.text.muted }}
                            >
                              {new Date(
                                template.createdAt
                              ).toLocaleDateString()}
                            </span>
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                            >
                              <Star
                                className="h-4 w-4 cursor-pointer hover:text-yellow-400 transition-colors duration-300"
                                style={{ color: COLORS.text.muted }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success("Added to favorites");
                                }}
                              />
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Loading indicator for fetching next page */}
            {isFetchingNextPage && (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                <p className="text-sm text-gray-500 mt-2">Loading more designs...</p>
              </motion.div>
            )}

            {hasNextPage && (
              <motion.div
                className="text-center mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isFetchingNextPage}
                    className="min-w-32 cursor-pointer"
                    style={{
                      borderColor: COLORS.border.default,
                      color: COLORS.text.primary,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: "12px 24px",
                    }}
                  >
                    {isFetchingNextPage ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                    ) : (
                      "Load More Designs"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </SharedDashboardLayout>
    </div>
  );
}
