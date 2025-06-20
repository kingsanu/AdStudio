, /* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import "@/styles/hide-scrollbar.css";
import axios from "axios";
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
  X,
  Clock,
  CreditCard,
  Percent,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { templateService, Template } from "@/services/templateService";
import { kioskService } from "@/services/kioskService";
import { liveMenuService } from "@/services/liveMenuService";
import {
  couponCampaignService,
  CouponCampaign,
  CouponCampaignStatisticsOverview,
} from "@/services/couponCampaignService";
import {
  Sidebar as UISidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { IconArrowLeft, IconBrandTabler } from "@tabler/icons-react";
import CustomSizeDialog from "@/components/CustomSizeDialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";

export default function Dashboard() {
  const { user, logout, userLoading, refreshUserDetails } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Coupon campaigns state
  const [couponCampaigns, setCouponCampaigns] = useState<CouponCampaign[]>([]);
  const [couponStatistics, setCouponStatistics] =
    useState<CouponCampaignStatisticsOverview | null>(null);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);

  // Search dropdown state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    designTemplates: any[];
    publicTemplates: Template[];
    userTemplates: Template[];
  }>({
    designTemplates: [],
    publicTemplates: [],
    userTemplates: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const templatesScrollRef = useRef<HTMLDivElement>(null);
  const lastPublicTemplateRef = useRef<HTMLDivElement>(null);
  const lastUserTemplateRef = useRef<HTMLDivElement>(null);
  const publicTemplatesObserver = useRef<IntersectionObserver | null>(null);
  const userTemplatesObserver = useRef<IntersectionObserver | null>(null);

  // Track if we've already attempted to load user details
  const userDetailsAttempted = useRef(false);

  // Design templates - memoized to prevent re-creation on every render
  const designTemplates = useMemo(
    () => [
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
        id: 12,
        title: "Kiosk Display",
        icon: <Layout className="h-6 w-6" />,
        color: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-600 dark:text-blue-400",
        dimensions: { width: 900, height: 1200 },
        backgroundColor: "rgb(239, 246, 255)",
        isKiosk: true,
      },
      {
        id: 13,
        title: "Live Menu TV",
        icon: <Layout className="h-6 w-6" />,
        color: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-600 dark:text-purple-400",
        dimensions: { width: 1920, height: 1080 },
        backgroundColor: "rgb(250, 245, 255)",
        isLiveMenu: true,
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
    ],
    []
  );

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

  // Function to handle kiosk creation/loading
  const handleKioskClick = async () => {
    if (!user?.userId) {
      toast.error("Please log in to access kiosk functionality");
      return;
    }

    try {
      toast.loading("Loading your kiosk...");

      // Get or create user's kiosk
      const response = await kioskService.getUserKiosk(user.userId);
      const kiosk = response.kiosk;

      toast.dismiss();

      if (kiosk.templateUrl || kiosk.templateData) {
        // User has existing kiosk content, load it in editor
        toast.success("Loading your existing kiosk");
        navigate(
          `/editor?width=900&height=1200&bgColor=${encodeURIComponent(
            "rgb(239, 246, 255)"
          )}&isKiosk=true&kioskId=${kiosk.id}`
        );
      } else {
        // User has a kiosk but no content, start with blank kiosk template
        toast.success("Creating your kiosk");
        navigate(
          `/editor?width=900&height=1200&bgColor=${encodeURIComponent(
            "rgb(239, 246, 255)"
          )}&isKiosk=true&kioskId=${kiosk.id}`
        );
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error handling kiosk click:", error);
      toast.error("Failed to load kiosk. Please try again.");
    }
  };

  // Function to handle live menu creation/loading
  const handleLiveMenuClick = async () => {
    if (!user?.userId) {
      toast.error("Please log in to access live menu functionality");
      return;
    }

    try {
      toast.loading("Loading your live menu...");

      // Get or create user's live menu
      const response = await liveMenuService.getUserLiveMenu(user.userId);
      const liveMenu = response.liveMenu;

      toast.dismiss();

      if (liveMenu.templateUrl || liveMenu.templateData) {
        // User has existing live menu content, load it in editor
        toast.success("Loading your existing live menu");
        navigate(
          `/editor?width=1920&height=1080&bgColor=${encodeURIComponent(
            "rgb(250, 245, 255)"
          )}&isLiveMenu=true&liveMenuId=${liveMenu.id}`
        );
      } else {
        // User has a live menu but no content, start with blank live menu template
        toast.success("Creating your live menu");
        navigate(
          `/editor?width=1920&height=1080&bgColor=${encodeURIComponent(
            "rgb(250, 245, 255)"
          )}&isLiveMenu=true&liveMenuId=${liveMenu.id}`
        );
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error handling live menu click:", error);
      toast.error("Failed to load live menu. Please try again.");
    }
  };

  // Function to open the classic editor (for testing)
  const handleOpenClassicEditor = () => {
    navigate("/classic-editor");
  };

  // Fetch public templates using the working API endpoint
  const fetchPublicTemplates = useCallback(
    async (page = 1, append = false, keyword = "") => {
      if (page === 1) {
        setIsLoadingTemplates(true);
      } else {
        setLoadingMoreTemplates(true);
      }

      try {
        // Use the same API endpoint as CustomTemplateContent.tsx
        let apiUrl = "https://adstudioserver.foodyqueen.com/api/templates";
        const params = new URLSearchParams();

        // Convert page to page index (0-based)
        params.append("ps", "8"); // page size
        params.append("pi", (page - 1).toString()); // page index (0-based)
        params.append("isPublic", "true");

        if (keyword) {
          params.append("kw", keyword);
        }

        apiUrl += `?${params.toString()}`;

        console.log(`[Dashboard] Fetching public templates from: ${apiUrl}`);

        const response = await axios.get(apiUrl);
        const templates = response.data.data || response.data || [];

        console.log(`[Dashboard] Public templates response:`, {
          keyword,
          page,
          templatesCount: templates.length,
          templates: templates.slice(0, 2), // Log first 2 for debugging
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
    },
    []
  );

  // Fetch user templates using the working API endpoint
  const fetchUserTemplates = useCallback(
    async (page = 1, append = false, keyword = "") => {
      if (!user?.userId) return;

      if (page === 1) {
        setIsLoadingUserTemplates(true);
      } else {
        setLoadingMoreUserTemplates(true);
      }

      try {
        // Use the same API endpoint as TemplateContent.tsx
        let apiUrl = "https://adstudioserver.foodyqueen.com/api/templates";
        const params = new URLSearchParams();

        // Convert page to page index (0-based)
        params.append("ps", "4"); // page size
        params.append("pi", (page - 1).toString()); // page index (0-based)
        params.append("userId", user.userId);
        params.append("onlyMine", "true");

        if (keyword) {
          params.append("kw", keyword);
        }

        apiUrl += `?${params.toString()}`;

        console.log(`[Dashboard] Fetching user templates from: ${apiUrl}`);

        const response = await axios.get(apiUrl);
        const templates = response.data.data || response.data || [];

        console.log(`[Dashboard] User templates response:`, {
          keyword,
          page,
          userId: user.userId,
          templatesCount: templates.length,
          templates: templates.slice(0, 2), // Log first 2 for debugging
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
  // Fetch coupon campaigns
  const fetchCouponCampaigns = useCallback(async () => {
    if (!user?.userId) {
      console.log("[Dashboard] No user ID, skipping coupon campaigns fetch");
      return;
    }

    try {
      console.log(
        "[Dashboard] Fetching coupon campaigns for user:",
        user.userId
      );
      setIsLoadingCoupons(true); // Fetch campaigns
      const campaignsResponse = await couponCampaignService.getCouponCampaigns({
        userId: user.userId,
      });

      console.log("[Dashboard] Campaigns response:", campaignsResponse);

      if (campaignsResponse.success) {
        console.log("[Dashboard] Setting campaigns:", campaignsResponse.data);
        setCouponCampaigns(campaignsResponse.data);
      } else {
        console.error(
          "[Dashboard] Failed to fetch campaigns:",
          campaignsResponse.error
        );
      }

      // Fetch statistics
      const statsResponse =
        await couponCampaignService.getCouponCampaignStatistics({
          userId: user.userId,
        });

      console.log("[Dashboard] Statistics response:", statsResponse);

      if (statsResponse.success) {
        setCouponStatistics(statsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching coupon campaigns:", error);
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [user?.userId]);

  // Fetch search results for dropdown
  const fetchSearchResults = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults({
          designTemplates: [],
          publicTemplates: [],
          userTemplates: [],
        });
        setShowSearchDropdown(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setShowSearchDropdown(true);
      console.log(`[Dashboard] Searching for: ${keyword}`);

      try {
        // Filter design templates
        const filteredDesignTemplates = designTemplates.filter((template) =>
          template.title.toLowerCase().includes(keyword.toLowerCase())
        );

        // Fetch search results for public templates
        let publicApiUrl =
          "https://adstudioserver.foodyqueen.com/api/templates";
        const publicParams = new URLSearchParams();
        publicParams.append("ps", "6"); // Limit results for dropdown
        publicParams.append("pi", "0");
        publicParams.append("isPublic", "true");
        publicParams.append("kw", keyword);
        publicApiUrl += `?${publicParams.toString()}`;

        const publicResponse = await axios.get(publicApiUrl);
        const publicSearchResults =
          publicResponse.data.data || publicResponse.data || [];

        // Fetch search results for user templates
        let userSearchResults: Template[] = [];
        if (user?.userId) {
          let userApiUrl =
            "https://adstudioserver.foodyqueen.com/api/templates";
          const userParams = new URLSearchParams();
          userParams.append("ps", "4"); // Limit results for dropdown
          userParams.append("pi", "0");
          userParams.append("userId", user.userId);
          userParams.append("onlyMine", "true");
          userParams.append("kw", keyword);
          userApiUrl += `?${userParams.toString()}`;

          const userResponse = await axios.get(userApiUrl);
          userSearchResults = userResponse.data.data || userResponse.data || [];
        }

        console.log(`[Dashboard] Search results:`, {
          keyword,
          designTemplates: filteredDesignTemplates.length,
          publicTemplates: publicSearchResults.length,
          userTemplates: userSearchResults.length,
        });

        setSearchResults({
          designTemplates: filteredDesignTemplates,
          publicTemplates: publicSearchResults,
          userTemplates: userSearchResults,
        });
      } catch (error) {
        console.error("Error fetching search results:", error);
        toast.error("Failed to search templates");
      } finally {
        setIsSearching(false);
      }
    },
    [user?.userId, designTemplates]
  );

  // Handle search functionality
  const handleSearch = useCallback(
    (keyword: string) => {
      fetchSearchResults(keyword);
    },
    [fetchSearchResults]
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

  // Load coupon campaigns when user changes
  useEffect(() => {
    if (user?.userId) {
      fetchCouponCampaigns();
    }
  }, [fetchCouponCampaigns, user?.userId]);

  // Debug effect to log coupon campaigns state
  useEffect(() => {
    console.log("[Dashboard] Coupon campaigns state changed:", {
      isLoadingCoupons,
      couponCampaignsLength: couponCampaigns.length,
      couponCampaigns: couponCampaigns.slice(0, 2), // Log first 2 for debugging
    });
  }, [isLoadingCoupons, couponCampaigns]);

  // Helper function to get status color for coupon campaigns
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20";
      case "expired":
        return "text-red-600 border-red-600 bg-red-50 dark:bg-red-900/20";
      case "completed":
        return "text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "draft":
        return "text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-900/20";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle search when searchQuery changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Enhanced sidebar links with new sections

  return (
    <div className="flex h-screen w-full flex-1 overflow-hidden bg-white dark:bg-neutral-900">
      {/* Sidebar */}

      <SharedDashboardLayout
        title="Create a new project"
        description="Create confidently, share fearlessly"
      >
        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-auto">
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 ">
            {/* Create a new project section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-10 relative "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2"
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
                    className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2"
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
                      if (template.isKiosk) {
                        // Handle kiosk template with single-kiosk-per-user logic
                        handleKioskClick();
                      } else if (template.isLiveMenu) {
                        // Handle live menu template with single-live-menu-per-user logic
                        handleLiveMenuClick();
                      } else if (template.dimensions) {
                        // If template has specific dimensions, use them
                        navigate(
                          `/editor?width=${template.dimensions.width}&height=${
                            template.dimensions.height
                          }&bgColor=${encodeURIComponent(
                            template.backgroundColor || "rgb(255, 255, 255)"
                          )}`
                        );
                        toast.success(
                          `Creating ${template.title.toLowerCase()}`
                        );
                      } else {
                        // Otherwise use default dimensions
                        handleCreateNew();
                        toast.success(
                          `Creating ${template.title.toLowerCase()}`
                        );
                      }
                    }}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center h-[180px] text-center">
                      <div
                        className={`mb-3 p-3 rounded-full ${template.color}`}
                      >
                        <div className={template.textColor}>
                          {template.icon}
                        </div>
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
                      No templates available
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

            {/* Coupon Campaigns section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Your Coupon Campaigns
                  </h2>
                  <p className="text-neutral-500 mt-1">
                    Active and recent coupon campaigns
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  onClick={() => navigate("/coupon-campaigns")}
                >
                  <span className="mr-2">View all</span> →
                </Button>
              </div>{" "}
              <div>
                {isLoadingCoupons ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Array.from(
                      { length: 3 },
                      (_, i) => `coupon-skeleton-${i}`
                    ).map((key) => (
                      <Card key={key} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {Array.from(
                                  { length: 4 },
                                  (_, i) => `metric-${i}`
                                ).map((metricKey) => (
                                  <div
                                    key={metricKey}
                                    className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
                                  ></div>
                                ))}
                              </div>
                            </div>
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : couponCampaigns.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {couponCampaigns.slice(0, 3).map((campaign, index) => (
                      <motion.div
                        key={campaign._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                          onClick={() =>
                            navigate(`/coupon-campaigns/${campaign._id}`)
                          }
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {campaign.campaignName}
                                  </h3>{" "}
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(campaign.status)}
                                  >
                                    {campaign.status.charAt(0).toUpperCase() +
                                      campaign.status.slice(1)}
                                  </Badge>
                                </div>

                                {campaign.description && (
                                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {campaign.description}
                                  </p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Percent className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {campaign.discountPercentage}% off
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {campaign.numberOfCoupons.toLocaleString()}{" "}
                                      coupons
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {campaign.statistics.totalUsed} used
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Until{" "}
                                      {new Date(
                                        campaign.validity
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      Created{" "}
                                      {new Date(
                                        campaign.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>
                                      {Math.round(
                                        (campaign.statistics.totalUsed /
                                          campaign.numberOfCoupons) *
                                          100
                                      )}
                                      % redemption rate
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/coupon-campaigns/${campaign._id}`
                                    );
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                        <Tag className="h-10 w-10 text-gray-500" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-4">
                        No coupon campaigns yet
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Create your first coupon campaign to start offering
                        discounts to your customers.
                      </p>{" "}
                      <Button
                        onClick={() => navigate("/coupon-campaigns")}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        View Coupon Campaigns
                      </Button>
                    </CardContent>
                  </Card>
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
                  <h2 className="text-2xl font-semibold">
                    Your Recent Designs
                  </h2>
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
                                    navigate(
                                      `/editor?template=${template._id}`
                                    );
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
      </SharedDashboardLayout>
    </div>
  );
}
