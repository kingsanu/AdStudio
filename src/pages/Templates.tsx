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
import SharedDashboardLayout from "@/components/layout/DashboardLayout";
import { COLORS, SHADOWS, BORDER_RADIUS } from "@/constants/styles";
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
        let apiUrl = "http://localhost:4000/api/templates";
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
        const templates = response.data.data ?? response.data ?? [];

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
        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-blue-600/20 rounded-full blur-2xl animate-pulse delay-1000" />

        <div className="relative px-6 py-12 lg:py-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8"
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
                  <Layout className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1
                    className="text-4xl lg:text-5xl font-bold leading-tight"
                    style={{
                      color: COLORS.text.primary,
                    }}
                  >
                    Professional Templates
                  </h1>
                  <p
                    className="text-xl mt-2 leading-relaxed"
                    style={{
                      color: COLORS.text.secondary,
                    }}
                  >
                    {publicTemplates.length} hand-crafted designs ready to use
                  </p>
                </div>
              </div>

              {/* Quick action button */}
              <div className="lg:ml-auto">
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
                      padding: "12px 24px",
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start from Scratch
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>{" "}
      {/* Enhanced Search and Filters */}
      <motion.div
        className="mb-8 p-6 rounded-2xl"
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
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 cursor-pointer transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                style={{
                  background: COLORS.background.secondary,
                  borderRadius: BORDER_RADIUS.lg,
                  padding: "12px 12px 12px 40px",
                }}
              />
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
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </motion.div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border-0 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    background: COLORS.background.secondary,
                    color: COLORS.text.primary,
                    borderRadius: BORDER_RADIUS.lg,
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
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
        </div>
      </motion.div>{" "}
      {/* Enhanced Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        {isLoading ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {" "}
            {Array.from(
              { length: 12 },
              (_, i) => `skeleton-${Date.now()}-${i}`
            ).map((skeletonKey, i) => (
              <motion.div
                key={skeletonKey}
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
          <>
            {publicTemplates.length === 0 ? (
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
                  <Layout className="h-12 w-12 text-white" />
                </div>
                <h2
                  className="text-3xl font-bold mb-4"
                  style={{ color: COLORS.text.primary }}
                >
                  No templates found
                </h2>
                <p
                  className="text-lg max-w-md mx-auto mb-8"
                  style={{ color: COLORS.text.secondary }}
                >
                  {searchQuery
                    ? `No templates match "${searchQuery}". Try a different search term.`
                    : "No templates available in this category."}
                </p>
                <div className="flex gap-4 justify-center">
                  {searchQuery && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                        className="cursor-pointer"
                        style={{
                          borderColor: COLORS.border.default,
                          color: COLORS.text.primary,
                          borderRadius: BORDER_RADIUS.lg,
                        }}
                      >
                        Clear search
                      </Button>
                    </motion.div>
                  )}
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
                        padding: "12px 24px",
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Design
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {publicTemplates.map((template, index) => (
                      <motion.div
                        key={template._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="h-full group"
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
                                        handleUseTemplate(template._id);
                                      }}
                                    >
                                      Use Template
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
                                        handlePreviewTemplate(template);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
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
                                <p
                                  className="text-sm line-clamp-2"
                                  style={{ color: COLORS.text.muted }}
                                >
                                  {template.description ||
                                    "Professional template"}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-4">
                                <span
                                  className="text-sm"
                                  style={{ color: COLORS.text.muted }}
                                >
                                  Template
                                </span>
                                <div className="flex items-center gap-2">
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
                                  <motion.div
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.8 }}
                                  >
                                    <Download
                                      className="h-4 w-4 cursor-pointer hover:text-blue-400 transition-colors duration-300"
                                      style={{ color: COLORS.text.muted }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadTemplate(template);
                                      }}
                                    />
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {publicTemplates.map((template, index) => (
                      <motion.div
                        key={template._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                        className="group"
                      >
                        <Card
                          className="overflow-hidden border-0 cursor-pointer bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500 py-0"
                          style={{
                            borderRadius: BORDER_RADIUS.xl,
                            boxShadow: SHADOWS.card,
                            border: "1px solid rgba(148, 163, 184, 0.1)",
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                              <div className="relative overflow-hidden">
                                <img
                                  src={
                                    templateService.fixImageUrl(
                                      template.thumbnailUrl
                                    ) || "/placeholder.svg"
                                  }
                                  alt={template.title}
                                  className="w-20 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                  style={{
                                    borderRadius: BORDER_RADIUS.lg,
                                  }}
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1">
                                <h3
                                  className="font-semibold text-xl mb-2 group-hover:text-blue-600 transition-colors duration-300"
                                  style={{ color: COLORS.text.primary }}
                                >
                                  {template.title}
                                </h3>
                                <p
                                  className="text-base"
                                  style={{ color: COLORS.text.secondary }}
                                >
                                  {template.description ||
                                    "Professional template ready to use"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handlePreviewTemplate(template)
                                    }
                                    className="cursor-pointer"
                                    style={{
                                      borderColor: COLORS.border.default,
                                      color: COLORS.text.primary,
                                      borderRadius: BORDER_RADIUS.lg,
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUseTemplate(template._id)
                                    }
                                    className="text-white border-0 cursor-pointer"
                                    style={{
                                      background: COLORS.gradients.primary,
                                      borderRadius: BORDER_RADIUS.lg,
                                    }}
                                  >
                                    Use Template
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Enhanced Load More Button */}
                {hasMore && (
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
                        disabled={loadingMore}
                        className="min-w-32 cursor-pointer"
                        style={{
                          borderColor: COLORS.border.default,
                          color: COLORS.text.primary,
                          borderRadius: BORDER_RADIUS.lg,
                          padding: "12px 24px",
                        }}
                      >
                        {loadingMore ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                        ) : (
                          "Load More Templates"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </>
            )}
          </>
        )}{" "}
      </motion.div>
      {/* Enhanced Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relative group">
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: COLORS.gradients.primary,
              transform: "scale(1.2)",
            }}
          />

          {/* Main button */}
          <Button
            size="lg"
            className="relative w-16 h-16 rounded-full shadow-2xl border-0 text-white cursor-pointer group-hover:shadow-3xl transition-all duration-300"
            style={{
              background: COLORS.gradients.primary,
              boxShadow:
                "0 20px 40px rgba(147, 51, 234, 0.3), 0 8px 16px rgba(147, 51, 234, 0.2)",
            }}
            onClick={handleCreateNew}
          >
            <Plus className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          </Button>

          {/* Fixed Tooltip positioning */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Create New Design
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90" />
          </div>
        </div>
      </motion.div>
    </SharedDashboardLayout>
  );
}
