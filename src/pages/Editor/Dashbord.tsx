/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import "@/styles/hide-scrollbar.css";
import {
  Search,
  Plus,
  Star,
  Bell,
  FileText,
  Phone,
  Video,
  MessageSquare,
  Tag,
  Award,
  ThumbsUp,
  Cake,
  Gift,
  Calendar,
  Utensils,
  ChevronRight,
  ChevronLeft,
  Edit,
  Download,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { templateService, Template } from "@/services/templateService";
import {
  Sidebar as UISidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { IconArrowLeft, IconBrandTabler } from "@tabler/icons-react";
import CustomSizeDialog from "@/components/CustomSizeDialog";

export default function Dashboard() {
  const { user, logout, userLoading, refreshUserDetails } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3); // Sample notification count
  const [showCustomSizeDialog, setShowCustomSizeDialog] = useState(false);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingUserTemplates, setIsLoadingUserTemplates] = useState(true);
  const [loadingMoreTemplates, setLoadingMoreTemplates] = useState(false);
  const [loadingMoreUserTemplates, setLoadingMoreUserTemplates] =
    useState(false);
  const [hasMoreTemplates, setHasMoreTemplates] = useState(true);
  const [hasMoreUserTemplates, setHasMoreUserTemplates] = useState(true);
  const [publicTemplatePage, setPublicTemplatePage] = useState(1);
  const [userTemplatePage, setUserTemplatePage] = useState(1);
  const templatesScrollRef = useRef<HTMLDivElement>(null);
  const lastPublicTemplateRef = useRef<HTMLDivElement>(null);
  const lastUserTemplateRef = useRef<HTMLDivElement>(null);
  const publicTemplatesObserver = useRef<IntersectionObserver | null>(null);
  const userTemplatesObserver = useRef<IntersectionObserver | null>(null);

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
    // Use default dimensions for a blank design (1080x1080)
    navigate("/editor?width=1080&height=1080&bgColor=rgb(255,%20255,%20255)");
  };

  // Function to handle using a template
  const handleUseTemplate = (templateId: string) => {
    navigate(`/editor?template=${templateId}`);
  };

  // Function to open the classic editor (for testing)
  const handleOpenClassicEditor = () => {
    navigate("/classic-editor");
  };

  // Fetch public templates
  const fetchPublicTemplates = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoadingTemplates(true);
    } else {
      setLoadingMoreTemplates(true);
    }

    try {
      const templates = await templateService.getTemplates({
        isPublic: true,
        page,
        limit: 8,
      });

      if (templates.length === 0) {
        setHasMoreTemplates(false);
      } else {
        if (append) {
          setPublicTemplates((prev) => [...prev, ...templates]);
        } else {
          setPublicTemplates(templates);
        }
        setPublicTemplatePage(page);
      }
    } catch (error) {
      console.error("Error fetching public templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoadingTemplates(false);
      setLoadingMoreTemplates(false);
    }
  }, []);

  // Fetch user templates
  const fetchUserTemplates = useCallback(
    async (page = 1, append = false) => {
      if (!user?.userId) return;

      if (page === 1) {
        setIsLoadingUserTemplates(true);
      } else {
        setLoadingMoreUserTemplates(true);
      }

      try {
        const templates = await templateService.getTemplates({
          userId: user.userId,
          onlyMine: true,
          page,
          limit: 4,
        });

        if (templates.length === 0) {
          setHasMoreUserTemplates(false);
        } else {
          if (append) {
            setUserTemplates((prev) => [...prev, ...templates]);
          } else {
            setUserTemplates(templates);
          }
          setUserTemplatePage(page);
        }
      } catch (error) {
        console.error("Error fetching user templates:", error);
        toast.error("Failed to load your templates");
      } finally {
        setIsLoadingUserTemplates(false);
        setLoadingMoreUserTemplates(false);
      }
    },
    [user?.userId]
  );

  // Load templates when component mounts
  useEffect(() => {
    fetchPublicTemplates(1, false);
  }, [fetchPublicTemplates]);

  // Load user templates when user changes
  useEffect(() => {
    if (user?.userId) {
      fetchUserTemplates(1, false);
    }
  }, [fetchUserTemplates, user?.userId]);

  // Setup intersection observer for public templates infinite scrolling
  useEffect(() => {
    if (publicTemplatesObserver.current) {
      publicTemplatesObserver.current.disconnect();
    }

    publicTemplatesObserver.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreTemplates && !loadingMoreTemplates) {
          fetchPublicTemplates(publicTemplatePage + 1, true);
        }
      },
      { threshold: 0.5 }
    );

    if (lastPublicTemplateRef.current) {
      publicTemplatesObserver.current.observe(lastPublicTemplateRef.current);
    }

    return () => {
      if (publicTemplatesObserver.current) {
        publicTemplatesObserver.current.disconnect();
      }
    };
  }, [
    fetchPublicTemplates,
    hasMoreTemplates,
    loadingMoreTemplates,
    publicTemplatePage,
  ]);

  // Setup intersection observer for user templates infinite scrolling
  useEffect(() => {
    if (userTemplatesObserver.current) {
      userTemplatesObserver.current.disconnect();
    }

    userTemplatesObserver.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMoreUserTemplates &&
          !loadingMoreUserTemplates
        ) {
          fetchUserTemplates(userTemplatePage + 1, true);
        }
      },
      { threshold: 0.5 }
    );

    if (lastUserTemplateRef.current) {
      userTemplatesObserver.current.observe(lastUserTemplateRef.current);
    }

    return () => {
      if (userTemplatesObserver.current) {
        userTemplatesObserver.current.disconnect();
      }
    };
  }, [
    fetchUserTemplates,
    hasMoreUserTemplates,
    loadingMoreUserTemplates,
    userTemplatePage,
  ]);

  // Scroll templates horizontally with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (templatesScrollRef.current) {
        e.preventDefault();
        templatesScrollRef.current.scrollLeft += e.deltaY;
      }
    };

    const currentRef = templatesScrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

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

  // Design templates
  const designTemplates = [
    {
      id: 1,
      title: "Blank Design",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-white dark:bg-neutral-800",
      textColor: "text-blue-600 dark:text-blue-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(255, 255, 255)",
    },
    {
      id: 2,
      title: "AI Calling",
      icon: <Phone className="h-6 w-6" />,
      color: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
      dimensions: { width: 1080, height: 1920 },
      backgroundColor: "rgb(245, 243, 255)",
    },
    {
      id: 3,
      title: "Self Order Video",
      icon: <Video className="h-6 w-6" />,
      color: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      dimensions: { width: 1920, height: 1080 },
      backgroundColor: "rgb(240, 253, 244)",
    },
    {
      id: 4,
      title: "WhatsApp Campaign",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-600 dark:text-emerald-400",
      dimensions: { width: 800, height: 800 },
      backgroundColor: "rgb(236, 253, 245)",
    },
    {
      id: 5,
      title: "Coupon Code Design",
      icon: <Tag className="h-6 w-6" />,
      color: "bg-yellow-50 dark:bg-yellow-900/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
      dimensions: { width: 1200, height: 628 },
      backgroundColor: "rgb(254, 252, 232)",
    },
    {
      id: 6,
      title: "Royalty Program",
      icon: <Award className="h-6 w-6" />,
      color: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-600 dark:text-red-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(254, 242, 242)",
    },
    {
      id: 7,
      title: "Google Feedback",
      icon: <ThumbsUp className="h-6 w-6" />,
      color: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
      dimensions: { width: 1200, height: 628 },
      backgroundColor: "rgb(255, 247, 237)",
    },
    {
      id: 8,
      title: "Birthday Wishes",
      icon: <Cake className="h-6 w-6" />,
      color: "bg-pink-50 dark:bg-pink-900/20",
      textColor: "text-pink-600 dark:text-pink-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(253, 242, 248)",
    },
    {
      id: 9,
      title: "Anniversary Wishes",
      icon: <Gift className="h-6 w-6" />,
      color: "bg-indigo-50 dark:bg-indigo-900/20",
      textColor: "text-indigo-600 dark:text-indigo-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(238, 242, 255)",
    },
    {
      id: 10,
      title: "New Event",
      icon: <Calendar className="h-6 w-6" />,
      color: "bg-cyan-50 dark:bg-cyan-900/20",
      textColor: "text-cyan-600 dark:text-cyan-400",
      dimensions: { width: 1200, height: 628 },
      backgroundColor: "rgb(236, 254, 255)",
    },
    {
      id: 11,
      title: "New Food Launch",
      icon: <Utensils className="h-6 w-6" />,
      color: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-600 dark:text-amber-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(255, 251, 235)",
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
          className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-6 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="h-8 w-8 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3] flex items-center justify-center mr-2">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-bold">Ads Studio</span>
            </div>
            <div className="relative ml-6 w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search all templates"
                className="w-full pl-10 transition-all focus-visible:ring-blue-500 rounded-full bg-gray-100 dark:bg-gray-800 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Try Premium
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-neutral-700 dark:text-neutral-300"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {notificationCount}
                </span>
              )}
            </Button>

            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarImage
                src={user?.logo || "https://github.com/shadcn.png"}
                alt={user?.name || "User"}
                loading="lazy"
              />
              <AvatarFallback className="bg-blue-500 text-white">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Create a new project section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Create a new project</h2>
                <p className="text-neutral-500 mt-1">
                  Create confidently, share fearlessly
                  <span
                    className="ml-2 text-xs text-blue-500 cursor-pointer hover:underline"
                    onClick={handleOpenClassicEditor}
                  >
                    (Classic Editor)
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 hidden md:flex"
                  onClick={() => {
                    if (templatesScrollRef.current) {
                      templatesScrollRef.current.scrollLeft -= 300;
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 hidden md:flex"
                  onClick={() => {
                    if (templatesScrollRef.current) {
                      templatesScrollRef.current.scrollLeft += 300;
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              ref={templatesScrollRef}
              className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar"
              style={{ scrollBehavior: "smooth" }}
            >
              {/* Custom size card */}
              <Card
                className="overflow-hidden border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group flex-shrink-0 w-[180px]"
                onClick={() => setShowCustomSizeDialog(true)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center h-[180px] text-center">
                  <div className="mb-3 p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                    <Plus className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium">Custom size</h3>
                </CardContent>
              </Card>

              {/* Design templates */}
              {designTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group flex-shrink-0 w-[180px]"
                  onClick={() => {
                    if (template.dimensions) {
                      // If template has specific dimensions, use them
                      navigate(
                        `/editor?width=${template.dimensions.width}&height=${
                          template.dimensions.height
                        }&bgColor=${encodeURIComponent(
                          template.backgroundColor || "rgb(255, 255, 255)"
                        )}`
                      );
                    } else {
                      // Otherwise use default dimensions
                      handleCreateNew();
                    }
                    toast.success(`Creating ${template.title.toLowerCase()}`);
                  }}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-[180px] text-center">
                    <div className={`mb-3 p-3 rounded-full ${template.color}`}>
                      <div className={template.textColor}>{template.icon}</div>
                    </div>
                    <h3 className="text-sm font-medium">{template.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom Size Dialog */}
            <CustomSizeDialog
              open={showCustomSizeDialog}
              onClose={() => setShowCustomSizeDialog(false)}
            />
          </motion.section>

          {/* Prebuilt Templates Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Prebuilt Templates</h2>
                <p className="text-neutral-500 mt-1">
                  Ready-to-use templates for your marketing needs
                </p>
              </div>
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => navigate("/templates")}
              >
                <span className="mr-2">View all</span> →
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isLoadingTemplates ? (
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
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : publicTemplates.length > 0 ? (
                publicTemplates.map((template, index) => (
                  <motion.div
                    key={template._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                    ref={
                      index === publicTemplates.length - 1
                        ? lastPublicTemplateRef
                        : null
                    }
                  >
                    <Card
                      className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full"
                      onClick={() => handleUseTemplate(template._id)}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="relative">
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
                              initial={{ scale: 0.8, opacity: 0 }}
                              whileHover={{ scale: 1, opacity: 1 }}
                              className="bg-white text-blue-600 font-medium px-4 py-2 rounded-md shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              Use template
                            </motion.div>
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800">
                          <h3 className="font-medium text-lg truncate">
                            {template.title}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            {template.description || "Template"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleCreateNew}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create new
                  </Button>
                </div>
              )}

              {/* Loading more indicator */}
              {loadingMoreTemplates && (
                <div className="col-span-full flex justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                    <span className="text-sm text-neutral-500">
                      Loading more templates...
                    </span>
                  </div>
                </div>
              )}

              {/* Loading more indicator */}
              {loadingMoreUserTemplates && (
                <div className="col-span-full flex justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                    <span className="text-sm text-neutral-500">
                      Loading more designs...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* Recent projects section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Your Recent Designs</h2>
                <p className="text-neutral-500 mt-1">
                  Continue working on your recent projects
                </p>
              </div>
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => navigate("/my-designs")}
              >
                <span className="mr-2">View all</span> →
              </Button>
            </div>

            {isLoadingUserTemplates ? (
              // Loading skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <Card
                      key={`user-skeleton-${index}`}
                      className="overflow-hidden shadow-md border-0 h-full"
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="h-[180px] bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                        <div className="p-4 flex-1">
                          <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                          <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : userTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userTemplates.map((template, index) => (
                  <motion.div
                    key={`user-${template._id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                    ref={
                      index === userTemplates.length - 1
                        ? lastUserTemplateRef
                        : null
                    }
                  >
                    <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full">
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="relative">
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
                                  navigate(`/editor?template=${template._id}`);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle download or other actions
                                  toast.success("Downloading design...");
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" /> Download
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800">
                          <h3 className="font-medium text-lg truncate">
                            {template.title}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-neutral-500">
                              {new Date(
                                template.createdAt
                              ).toLocaleDateString()}
                            </p>
                            <Star
                              className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-yellow-400"
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
            ) : (
              <div className="flex items-center justify-center p-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You currently have no designs.
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleCreateNew}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create your first design
                  </Button>
                </div>
              </div>
            )}
          </motion.section>
        </main>
      </div>
    </div>
  );
}
