/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Star,
  Grid,
  Layout,
  ImageIcon,
  Text,
  ChevronDown,
  Bell,
  Sparkles,
  Layers,
  Palette,
  TrendingUp,
  Clock,
  Filter,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { templateService, Template } from "@/services/templateService";
import {
  Sidebar as UISidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { IconArrowLeft, IconBrandTabler } from "@tabler/icons-react";

export default function Dashboard() {
  const { user, logout, userLoading, refreshUserDetails } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [notificationCount] = useState(3); // Sample notification count

  // Infinite scroll states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTemplateElementRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Track if we've already attempted to load user details
  const userDetailsAttempted = useRef(false);

  // Fetch user details when component mounts - only once
  useEffect(() => {
    // Only attempt to load user details once per session
    if (user?.userId && !userDetailsAttempted.current) {
      userDetailsAttempted.current = true;
      // Only refresh if we need to (force=false will use cached data if available)
      refreshUserDetails(false);
    }
  }, [refreshUserDetails, user?.userId]);

  // Function to handle creating a new design
  const handleCreateNew = () => {
    toast.success("Creating new design");
    navigate("/editor");
  };

  // Function to handle using a template
  const handleUseTemplate = (templateId: string) => {
    navigate(`/editor?template=${templateId}`);
  };

  // Function to handle adding a template to favorites
  const handleAddToFavorites = (
    templateId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the card click

    if (!user?.userId) {
      toast.error("Please log in to add templates to favorites");
      return;
    }

    const success = templateService.addToFavorites(templateId, user.userId);
    if (success) {
      toast.success("Added to favorites");
    } else {
      toast.error("Failed to add to favorites");
    }
  };

  // Function to check if a template is in favorites
  const isTemplateFavorite = (templateId: string) => {
    if (!user?.userId) return false;
    return templateService.isFavorite(templateId, user.userId);
  };
  const [activeTab, setActiveTab] = useState("recent");

  // Function to fetch templates with pagination
  const fetchPublicTemplates = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (pageNum === 1) {
        setIsLoadingTemplates(true);
      } else {
        setLoadingMore(true);
      }

      try {
        // Add pagination parameters
        const templates = await templateService.getTemplates({
          isPublic: true,
          page: pageNum,
          limit: 6, // Number of templates per page
          keyword: searchQuery, // Add search query if present
        });

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
        setIsLoadingTemplates(false);
        setLoadingMore(false);
      }
    },
    [searchQuery]
  );

  const fetchUserTemplates = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const templates = await templateService.getTemplates({
        userId: user.userId,
        onlyMine: true,
      });
      setUserTemplates(templates);
    } catch (error) {
      console.error("Error fetching user templates:", error);
      toast.error("Failed to load your templates");
    }
  }, [user]);

  // Initial load of templates
  useEffect(() => {
    // Reset pagination when search query changes
    setPage(1);
    setHasMore(true);
    setPublicTemplates([]);
    fetchPublicTemplates(1, false);
  }, [fetchPublicTemplates, searchQuery]);

  // Load user templates when user changes
  useEffect(() => {
    fetchUserTemplates();
  }, [fetchUserTemplates]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          // Load more templates when last template comes into view
          fetchPublicTemplates(page + 1, true);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    // Observe the last template element
    if (lastTemplateElementRef.current) {
      observerRef.current.observe(lastTemplateElementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchPublicTemplates, hasMore, loadingMore, page]);

  // Sidebar links
  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: (
        <Star className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      onClick: logout,
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  // Template categories can be defined here if needed
  /* const templateCategories = [
    {
      id: 1,
      title: "Social Media",
      count: "120+ templates",
      thumbnail: "/placeholder.svg?height=150&width=200",
      color: "from-[#0070f3] to-[#00a2ff]",
    },
    {
      id: 2,
      title: "Presentations",
      count: "85+ templates",
      thumbnail: "/placeholder.svg?height=150&width=200",
      color: "from-[#7928ca] to-[#ff0080]",
    },
    {
      id: 3,
      title: "Print Products",
      count: "65+ templates",
      thumbnail: "/placeholder.svg?height=150&width=200",
      color: "from-[#ff4d4d] to-[#f9cb28]",
    },
    {
      id: 4,
      title: "Videos",
      count: "40+ templates",
      thumbnail: "/placeholder.svg?height=150&width=200",
      color: "from-[#00b37e] to-[#00d4ff]",
    },
    {
      id: 5,
      title: "Websites",
      count: "30+ templates",
      thumbnail: "/placeholder.svg?height=150&width=200",
      color: "from-[#ff0080] to-[#7928ca]",
    },
  ]; */

  const tools = [
    {
      id: 1,
      title: "Layouts",
      description: "Pre-designed layouts",
      icon: <Layout className="h-5 w-5" />,
      color: "#0070f3",
    },
    {
      id: 2,
      title: "Images",
      description: "Stock photos & uploads",
      icon: <ImageIcon className="h-5 w-5" />,
      color: "#0070f3",
    },
    {
      id: 3,
      title: "Text",
      description: "Typography & fonts",
      icon: <Text className="h-5 w-5" />,
      color: "#0070f3",
    },
    {
      id: 4,
      title: "Elements",
      description: "Shapes & icons",
      icon: <Grid className="h-5 w-5" />,
      color: "#0070f3",
    },
    {
      id: 5,
      title: "AI Tools",
      description: "Smart design assistance",
      icon: <Sparkles className="h-5 w-5" />,
      color: "#0070f3",
      isNew: true,
    },
    {
      id: 6,
      title: "Colors",
      description: "Palettes & gradients",
      icon: <Palette className="h-5 w-5" />,
      color: "#0070f3",
    },
    {
      id: 7,
      title: "Layers",
      description: "Manage design layers",
      icon: <Layers className="h-5 w-5" />,
      color: "#0070f3",
    },
    {
      id: 8,
      title: "Analytics",
      description: "Design performance",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "#0070f3",
      isNew: true,
    },
  ];

  return (
    <div className="flex h-screen w-full flex-1 overflow-hidden bg-white dark:bg-neutral-900">
      {/* Sidebar */}
      <UISidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex items-center space-x-2 py-1">
              <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3]" />
              <span className="font-medium whitespace-pre text-black dark:text-white">
                Ads Studio
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: userLoading ? "Loading..." : user?.name || "User",
                href: "#",
                onClick: logout,
                icon: userLoading ? (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-[#0070f3] border-r-transparent"></div>
                  </div>
                ) : user ? (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage
                      src={user?.logo || "https://github.com/shadcn.png"}
                      alt="User"
                      loading="lazy"
                    />
                    <AvatarFallback>
                      {user?.name
                        ? user.name.substring(0, 2).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </UISidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-auto h-screen">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ duration: 1 }}
            className="absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-[#0070f3]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.02 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[#0070f3]"
          />
        </div>

        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80"
        >
          <div className="flex items-center gap-4 md:w-1/3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search..."
                className="w-full pl-10 transition-all focus-visible:ring-[#0070f3]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-neutral-700 dark:text-neutral-300"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0070f3] text-[10px] text-white">
                      {notificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    Mark all as read
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="p-3 border-b hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src="https://github.com/shadcn.png" />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">User Name</span> liked
                            your design
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            2 hours ago
                          </p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-[#0070f3] self-start mt-2"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[#0070f3]"
                    onClick={() => navigate("/notifications")}
                  >
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings button removed as requested */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full"
                >
                  {userLoading ? (
                    <div className="h-8 w-8 rounded-full border-2 border-[#0070f3] flex items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#0070f3] border-r-transparent"></div>
                    </div>
                  ) : user ? (
                    <Avatar className="h-8 w-8 border-2 border-[#0070f3]">
                      <AvatarImage
                        src={user?.logo || "https://github.com/shadcn.png"}
                        alt={user?.name || "User"}
                        loading="lazy"
                      />
                      <AvatarFallback className="bg-[#0070f3] text-white">
                        {user?.name
                          ? user.name.substring(0, 2).toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full border-2 border-[#0070f3] flex items-center justify-center bg-[#0070f3] text-white">
                      <span>U</span>
                    </div>
                  )}
                  {user && (
                    <span className="hidden md:inline">
                      {userLoading ? "Loading..." : user?.name || "User"}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 p-2">
                      {userLoading ? (
                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#0070f3] border-r-transparent"></div>
                        </div>
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user?.logo || "https://github.com/shadcn.png"}
                            alt={user?.name || "User"}
                            loading="lazy"
                          />
                          <AvatarFallback>
                            {user?.name
                              ? user.name.substring(0, 2).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {userLoading ? "Loading..." : user?.name || "User"}
                        </span>
                        {(user?.businessName ||
                          user?.city ||
                          user?.address ||
                          user?.phoneNumber) && (
                          <span className="text-xs text-neutral-500">
                            {user?.businessName ||
                              user?.city ||
                              user?.address ||
                              user?.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem onClick={logout} className="text-red-500">
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Create New Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Create a design</h2>
                <p className="text-neutral-500 mt-1">
                  Choose from our templates or start from scratch
                </p>
              </div>
              <Button
                className="bg-[#0070f3] hover:bg-[#0060d3] text-white shadow-md hover:shadow-lg transition-all"
                onClick={handleCreateNew}
              >
                <Plus className="mr-2 h-4 w-4" /> Create new
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {isLoadingTemplates && !loadingMore ? (
                // Initial loading skeleton
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <Card
                      key={`skeleton-${index}`}
                      className="overflow-hidden shadow-md border-0"
                    >
                      <CardContent className="p-0">
                        <div className="h-[140px] bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                        <div className="p-4">
                          <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-2"></div>
                          <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : // Render actual templates
              publicTemplates.length > 0 ? (
                publicTemplates.map((template, index) => (
                  <motion.div
                    key={template._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                    // Add ref to the last template element for infinite scrolling
                    ref={
                      index === publicTemplates.length - 1
                        ? lastTemplateElementRef
                        : null
                    }
                  >
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template._id);
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="relative">
                          {/* Template overlay - can be customized per template */}
                          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                          <img
                            src={
                              templateService.fixImageUrl(
                                template.thumbnailUrl
                              ) || "/placeholder.svg"
                            }
                            alt={template.title}
                            className="w-full h-[140px] object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              whileHover={{ scale: 1, opacity: 1 }}
                              className="bg-white text-[#0070f3] font-medium px-4 py-2 rounded-md shadow-lg cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseTemplate(template._id);
                              }}
                            >
                              Use template
                            </motion.div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`absolute top-2 right-2 ${
                              isTemplateFavorite(template._id)
                                ? "text-yellow-400"
                                : "text-white/70"
                            } bg-black/20 hover:bg-black/30`}
                            onClick={(e) =>
                              handleAddToFavorites(template._id, e)
                            }
                          >
                            <Star
                              className={`h-5 w-5 ${
                                isTemplateFavorite(template._id)
                                  ? "fill-yellow-400"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800">
                          <h3 className="font-medium text-lg">
                            {template.title}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1">
                            {template.description || "Template"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                // No templates found
                <div className="col-span-full text-center py-10">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                    <Layout className="h-10 w-10 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No templates found
                  </h3>
                  <p className="text-neutral-500 max-w-md mx-auto mb-6">
                    We couldn't find any public templates. Try again later or
                    create your own.
                  </p>
                  <Button
                    className="bg-[#0070f3] hover:bg-[#0060d3]"
                    onClick={handleCreateNew}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create new
                  </Button>
                </div>
              )}

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="col-span-full flex justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#0070f3] border-r-transparent"></div>
                    <span className="text-sm text-neutral-500">
                      Loading more templates...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* Recent Projects */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10"
          >
            <Tabs defaultValue="recent" onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Your designs</h2>
                  <p className="text-neutral-500 mt-1">
                    Access and manage your design projects
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                  <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1">
                    <TabsTrigger
                      value="recent"
                      className={`text-sm ${
                        activeTab === "recent"
                          ? "bg-white dark:bg-neutral-700 text-[#0070f3]"
                          : ""
                      }`}
                    >
                      Recent
                    </TabsTrigger>
                    <TabsTrigger
                      value="starred"
                      className={`text-sm ${
                        activeTab === "starred"
                          ? "bg-white dark:bg-neutral-700 text-[#0070f3]"
                          : ""
                      }`}
                    >
                      Starred
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className={`text-sm ${
                        activeTab === "all"
                          ? "bg-white dark:bg-neutral-700 text-[#0070f3]"
                          : ""
                      }`}
                    >
                      All designs
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <TabsContent value="recent" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoadingTemplates &&
                      // Loading skeleton
                      Array(4)
                        .fill(0)
                        .map((_, index) => (
                          <Card
                            key={`skeleton-${index}`}
                            className="overflow-hidden shadow-md border-0 h-full"
                          >
                            <CardContent className="p-0 h-full flex flex-col">
                              <div className="h-[180px] bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                              <div className="p-4 flex-1">
                                <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                                <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                                <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mt-auto"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                    {!isLoadingTemplates &&
                      userTemplates.length > 0 &&
                      userTemplates.map((template, index) => (
                        <motion.div
                          key={template._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05 + 0.1,
                          }}
                          whileHover={{ y: -5 }}
                          className="h-full"
                        >
                          <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full">
                            <CardContent className="p-0 h-full flex flex-col">
                              <div className="relative">
                                {/* Template overlay - can be customized per template */}
                                <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                <img
                                  src={
                                    templateService.fixImageUrl(
                                      template.thumbnailUrl
                                    ) || "/placeholder.svg"
                                  }
                                  alt={template.title}
                                  className="w-full h-[180px] object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    className="flex gap-2"
                                  >
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="shadow-lg"
                                      onClick={() =>
                                        navigate(
                                          `/editor?template=${template._id}`
                                        )
                                      }
                                    >
                                      Edit
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="secondary"
                                          size="icon"
                                          className="shadow-lg"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                          <Download className="mr-2 h-4 w-4" />
                                          <span>Download</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Share2 className="mr-2 h-4 w-4" />
                                          <span>Share</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-500">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </motion.div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`absolute top-2 right-2 ${
                                    isTemplateFavorite(template._id)
                                      ? "text-yellow-400"
                                      : "text-white/0 group-hover:text-white/90"
                                  } bg-black/20 hover:bg-black/30`}
                                  onClick={(e) =>
                                    handleAddToFavorites(template._id, e)
                                  }
                                >
                                  <Star
                                    className={`h-5 w-5 ${
                                      isTemplateFavorite(template._id)
                                        ? "fill-yellow-400"
                                        : ""
                                    }`}
                                  />
                                </Button>
                              </div>
                              <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-medium text-lg truncate">
                                  {template.title}
                                </h3>
                                <div className="flex items-center justify-between mt-2 mb-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-neutral-100 dark:bg-neutral-800 text-xs font-normal"
                                  >
                                    {template.isPublic ? "Public" : "Private"}
                                  </Badge>
                                </div>
                                <div className="flex items-center mt-auto text-xs text-neutral-500">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {new Date(
                                    template.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}

                    {!isLoadingTemplates && userTemplates.length === 0 && (
                      <div className="col-span-full text-center py-10">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                          <Layout className="h-10 w-10 text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          No designs yet
                        </h3>
                        <p className="text-neutral-500 max-w-md mx-auto mb-6">
                          You haven't created any designs yet. Start by creating
                          a new design or using a template.
                        </p>
                        <Button
                          className="bg-[#0070f3] hover:bg-[#0060d3]"
                          onClick={handleCreateNew}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Create new
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <TabsContent value="starred" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                      <Star className="h-12 w-12 text-[#0070f3]" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      No starred designs yet
                    </h3>
                    <p className="text-neutral-500 text-center max-w-md mb-6">
                      Star your favorite designs to access them quickly from
                      this tab.
                    </p>
                    <Button
                      variant="outline"
                      className="border-[#0070f3] text-[#0070f3]"
                    >
                      Browse your designs
                    </Button>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <TabsContent value="all" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {isLoadingTemplates &&
                        // Loading skeleton
                        Array(4)
                          .fill(0)
                          .map((_, index) => (
                            <Card
                              key={`skeleton-all-${index}`}
                              className="overflow-hidden shadow-md border-0 h-full"
                            >
                              <CardContent className="p-0 h-full flex flex-col">
                                <div className="h-[180px] bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                                <div className="p-4 flex-1">
                                  <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                                  <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                                  <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mt-auto"></div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                      {!isLoadingTemplates &&
                        userTemplates.length > 0 &&
                        userTemplates.map((template, index) => (
                          <motion.div
                            key={`all-${template._id}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.03 + 0.1,
                            }}
                            whileHover={{ y: -5 }}
                            className="h-full"
                          >
                            <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full">
                              <CardContent className="p-0 h-full flex flex-col">
                                <div className="relative">
                                  {/* Template overlay - can be customized per template */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                  <img
                                    src={
                                      templateService.fixImageUrl(
                                        template.thumbnailUrl
                                      ) || "/placeholder.svg"
                                    }
                                    alt={template.title}
                                    className="w-full h-[180px] object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      whileHover={{ opacity: 1 }}
                                      className="flex gap-2"
                                    >
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="shadow-lg"
                                        onClick={() =>
                                          navigate(
                                            `/editor?template=${template._id}`
                                          )
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="secondary"
                                            size="icon"
                                            className="shadow-lg"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>
                                            <Download className="mr-2 h-4 w-4" />
                                            <span>Download</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Share2 className="mr-2 h-4 w-4" />
                                            <span>Share</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-red-500">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </motion.div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-white/0 group-hover:text-white/90 transition-colors"
                                  >
                                    <Star className="h-5 w-5" />
                                  </Button>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                  <h3 className="font-medium text-lg truncate">
                                    {template.title}
                                  </h3>
                                  <div className="flex items-center justify-between mt-2 mb-1">
                                    <Badge
                                      variant="outline"
                                      className="bg-neutral-100 dark:bg-neutral-800 text-xs font-normal"
                                    >
                                      {template.isPublic ? "Public" : "Private"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center mt-auto text-xs text-neutral-500">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {new Date(
                                      template.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}

                      {!isLoadingTemplates && userTemplates.length === 0 && (
                        <div className="col-span-full text-center py-10">
                          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                            <Layout className="h-10 w-10 text-neutral-500" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            No designs found
                          </h3>
                          <p className="text-neutral-500 max-w-md mx-auto mb-6">
                            You don't have any designs yet. Start by creating a
                            new design or using a template.
                          </p>
                          <Button
                            className="bg-[#0070f3] hover:bg-[#0060d3]"
                            onClick={handleCreateNew}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Create new
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.section>

          {/* Tools Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Design tools</h2>
              <p className="text-neutral-500 mt-1">
                Powerful tools to enhance your designs
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border border-neutral-200 dark:border-neutral-800 group overflow-hidden">
                    <CardContent className="flex items-center gap-4 p-5 relative">
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0070f3]/10 text-[#0070f3] group-hover:bg-[#0070f3] group-hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {tool.icon}
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{tool.title}</h3>
                          {tool.isNew && (
                            <Badge className="bg-[#0070f3] text-[10px] px-1.5 py-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">
                          {tool.description}
                        </p>
                      </div>
                      <motion.div
                        className="absolute -right-10 group-hover:right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#0070f3]"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
