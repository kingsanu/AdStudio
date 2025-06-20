import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import "@/styles/hide-scrollbar.css";
import axios from "axios";
import {
  Plus,
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
  Layout,
  Image,
  Sparkles,
  TrendingUp,
  Percent,
  Users,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Template } from "@/services/templateService";
import { campaignService, Campaign } from "@/services/campaignService";
import {
  couponCampaignService,
  CouponCampaign,
} from "@/services/couponCampaignService";
import { kioskService } from "@/services/kioskService";
import { liveMenuService } from "@/services/liveMenuService";
import CustomSizeDialog from "@/components/CustomSizeDialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  COLORS,
  SHADOWS,
  BORDER_RADIUS,
  TRANSITIONS,
} from "@/constants/styles";

// Import new components
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { DesignTemplateCard } from "@/components/dashboard/DesignTemplateCard";
import { ScrollableSection } from "@/components/dashboard/ScrollableSection";
import { SectionHeader } from "@/components/dashboard/SectionHeader";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCustomSizeDialog, setShowCustomSizeDialog] = useState(false);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<Campaign[]>([]);
  const [couponCampaigns, setCouponCampaigns] = useState<CouponCampaign[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingUserTemplates, setIsLoadingUserTemplates] = useState(true);

  const templatesScrollRef = useRef<HTMLDivElement>(null);
  const lastPublicTemplateRef = useRef<HTMLDivElement>(null);
  const lastUserTemplateRef = useRef<HTMLDivElement>(null);

  // Design templates - memoized to prevent re-creation on every render
  const designTemplates = useRef([
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
      color: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
      dimensions: { width: 1080, height: 1350 },
      backgroundColor: "rgb(255, 247, 237)",
    },
    {
      id: 7,
      title: "Loyalty Card",
      icon: <ThumbsUp className="h-6 w-6" />,
      color: "bg-pink-50 dark:bg-pink-900/20",
      textColor: "text-pink-600 dark:text-pink-400",
      dimensions: { width: 1012, height: 638 },
      backgroundColor: "rgb(253, 242, 248)",
    },
    {
      id: 8,
      title: "Birthday Special",
      icon: <Cake className="h-6 w-6" />,
      color: "bg-rose-50 dark:bg-rose-900/20",
      textColor: "text-rose-600 dark:text-rose-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(255, 241, 242)",
    },
    {
      id: 9,
      title: "Gift Voucher",
      icon: <Gift className="h-6 w-6" />,
      color: "bg-indigo-50 dark:bg-indigo-900/20",
      textColor: "text-indigo-600 dark:text-indigo-400",
      dimensions: { width: 1200, height: 800 },
      backgroundColor: "rgb(238, 242, 255)",
    },
    {
      id: 10,
      title: "Event Poster",
      icon: <Calendar className="h-6 w-6" />,
      color: "bg-cyan-50 dark:bg-cyan-900/20",
      textColor: "text-cyan-600 dark:text-cyan-400",
      dimensions: { width: 1080, height: 1920 },
      backgroundColor: "rgb(236, 254, 255)",
    },
    {
      id: 11,
      title: "Menu Card",
      icon: <Utensils className="h-6 w-6" />,
      color: "bg-teal-50 dark:bg-teal-900/20",
      textColor: "text-teal-600 dark:text-teal-400",
      dimensions: { width: 800, height: 1200 },
      backgroundColor: "rgb(240, 253, 250)",
    },
  ]);

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
  // Fetch public templates using the working API endpoint
  const fetchPublicTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);

    try {
      let apiUrl = "https://adstudioserver.foodyqueen.com/api/templates";
      const params = new URLSearchParams();

      params.append("ps", "8"); // page size
      params.append("pi", "0"); // page index (0-based)
      params.append("isPublic", "true");

      apiUrl += `?${params.toString()}`;

      const response = await axios.get(apiUrl);
      const templates = response.data.data ?? response.data ?? [];

      setPublicTemplates(templates);
    } catch (error) {
      console.error("Error fetching public templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Fetch user templates
  const fetchUserTemplates = useCallback(async () => {
    if (!user?.userId) return;

    setIsLoadingUserTemplates(true);

    try {
      let apiUrl = "https://adstudioserver.foodyqueen.com/api/templates";
      const params = new URLSearchParams();

      params.append("ps", "8");
      params.append("pi", "0");
      params.append("userId", user.userId);

      apiUrl += `?${params.toString()}`;

      const response = await axios.get(apiUrl);
      const templates = response.data.data ?? response.data ?? [];

      setUserTemplates(templates);
    } catch (error) {
      console.error("Error fetching user templates:", error);
      setUserTemplates([]);
    } finally {
      setIsLoadingUserTemplates(false);
    }
  }, [user?.userId]); // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!user?.userId) return;

    try {
      // Fetch latest WhatsApp campaigns (only the most recent 3)
      const whatsappResponse = await campaignService.getCampaigns({
        userId: user.userId,
        limit: 3,
      });
      setWhatsappCampaigns(whatsappResponse.data);

      // Fetch coupon campaigns
      setIsLoadingCoupons(true);
      const couponResponse = await couponCampaignService.getCouponCampaigns({
        userId: user.userId,
      });
      if (couponResponse.success) {
        setCouponCampaigns(couponResponse.data);
      } else {
        setCouponCampaigns([]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      // Set empty arrays as fallback
      setWhatsappCampaigns([]);
      setCouponCampaigns([]);
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [user?.userId]);
  // Helper function to get campaign progress based on status
  const getCampaignProgress = (status: string) => {
    switch (status) {
      case "completed":
        return { percentage: 100, label: "Complete" };
      case "running":
      case "pending":
        return { percentage: 75, label: "Active" };
      default:
        return { percentage: 25, label: "Draft" };
    }
  };

  // Helper function to get campaign status class with improved colors
  const getCampaignStatusClass = (status: string) => {
    if (status === "running" || status === "pending") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
    }
    if (status === "completed") {
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    }
    if (status === "paused") {
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
  };

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

  useEffect(() => {
    fetchPublicTemplates();
    if (user?.userId) {
      fetchUserTemplates();
      fetchCampaigns();
    }
  }, [fetchPublicTemplates, fetchUserTemplates, fetchCampaigns, user?.userId]);

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
  return (
    <DashboardLayout>
      {/* Enhanced Hero Section */}
      <motion.div
        className="relative overflow-hidden"
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
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1
                    className="text-4xl lg:text-5xl font-bold leading-tight"
                    style={{
                      color: COLORS.text.primary,
                    }}
                  >
                    Welcome back, {user?.name ?? "Designer"}!
                  </h1>
                  <p
                    className="text-xl mt-2 leading-relaxed"
                    style={{
                      color: COLORS.text.secondary,
                    }}
                  >
                    Let's create something amazing today
                  </p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-3 lg:ml-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate("/templates")}
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    className="text-white border-0 cursor-pointer"
                    style={{
                      background: COLORS.gradients.primary,
                      borderRadius: BORDER_RADIUS.lg,
                    }}
                    onClick={() => setShowCustomSizeDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Creating
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            {/* Enhanced Quick Stats */}{" "}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <StatsCard
                title="Total Designs"
                value={userTemplates.length}
                icon={TrendingUp}
                gradient={COLORS.gradients.cool}
              />

              <StatsCard
                title="WhatsApp Campaigns"
                value={whatsappCampaigns.length}
                icon={MessageSquare}
                gradient={COLORS.gradients.warm}
              />

              <StatsCard
                title="Coupon Campaigns"
                value={couponCampaigns.length}
                icon={Tag}
                gradient={COLORS.gradients.primary}
                onClick={() => navigate("/coupon-campaigns")}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>{" "}
      {/* Enhanced Main Content Area with Parallax */}
      <div
        className="px-4 md:px-6 lg:px-8 py-16 space-y-20 min-h-screen relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${COLORS.background.secondary} 0%, ${COLORS.background.primary} 50%, ${COLORS.background.secondary} 100%)`,
        }}
      >
        {/* Subtle background patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-pink-400 to-orange-600 rounded-full blur-2xl animate-pulse delay-2000" />
        </div>{" "}
        {/* Enhanced Start Designing Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10"
        >
          <ScrollableSection
            title="Start Designing"
            subtitle="Choose from our versatile templates or start from scratch"
            className="mb-16"
          >
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="group"
            >
              <Card
                className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900/20 hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 flex-shrink-0 w-72 overflow-hidden"
                style={{
                  borderRadius: BORDER_RADIUS["2xl"],
                  boxShadow:
                    "0 8px 25px rgba(147, 51, 234, 0.08), 0 3px 10px rgba(147, 51, 234, 0.03)",
                  border: "2px dashed rgba(147, 51, 234, 0.3)",
                }}
                onClick={() => setShowCustomSizeDialog(true)}
              >
                <CardContent className="p-0">
                  {/* Enhanced header section */}
                  <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/10" />
                    <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full blur-lg" />

                    <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Enhanced content section */}
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      Custom Size
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Create your own dimensions
                    </p>

                    {/* Progress indicator */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Unlimited Options
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {designTemplates.current.map((template) => (
              <DesignTemplateCard
                key={`design-template-${template.id}`}
                title={template.title}
                icon={template.icon}
                color={template.color}
                dimensions={template.dimensions}
                isKiosk={template.isKiosk}
                isLiveMenu={template.isLiveMenu}
                onClick={() => {
                  if (template.isKiosk) {
                    handleKioskClick();
                  } else if (template.isLiveMenu) {
                    handleLiveMenuClick();
                  } else {
                    navigate(
                      `/editor?width=${template.dimensions.width}&height=${
                        template.dimensions.height
                      }&bgColor=${encodeURIComponent(template.backgroundColor)}`
                    );
                  }
                }}
              />
            ))}
            {/* Custom size option */}
          </ScrollableSection>
        </motion.div>{" "}
        {/* Enhanced Templates sections with API data */}
        <motion.div
          className="space-y-20 relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* Featured Templates - Separate Section */}
          <div>
            {" "}
            <SectionHeader
              title="Featured Templates"
              subtitle="Professionally designed templates to get you started"
              onViewAllClick={() => navigate("/templates")}
            />
            <div className="space-y-4">
              {" "}
              {isLoadingTemplates ? (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {Array.from({ length: 6 }, (_, i) => (
                    <motion.div
                      key={`loading-public-template-${i + 1}`}
                      className="animate-pulse"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <div
                        className="rounded-xl h-36 mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                        style={{
                          borderRadius: BORDER_RADIUS.xl,
                        }}
                      ></div>
                      <div
                        className="rounded-lg h-4 mb-3 bg-slate-200 dark:bg-slate-700"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {publicTemplates.slice(0, 10).map((template, index) => (
                    <TemplateCard
                      key={template._id}
                      title={template.title}
                      thumbnailUrl={template.thumbnailUrl}
                      type="template"
                      onClick={() =>
                        navigate(`/editor/template/${template._id}`)
                      }
                      ref={index === 5 ? lastPublicTemplateRef : undefined}
                    />
                  ))}{" "}
                </div>
              )}
              {/* Global WhatsApp Campaign Progress Summary */}
              {!isLoadingTemplates && whatsappCampaigns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                        Overall Campaign Performance
                      </h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Combined metrics across all WhatsApp campaigns
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {whatsappCampaigns.reduce(
                          (total, campaign) =>
                            total + (campaign.statistics?.delivered ?? 0),
                          0
                        )}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Total Delivered
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Global Delivery Rate
                      </span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        {Math.round(
                          (whatsappCampaigns.reduce(
                            (total, campaign) =>
                              total + (campaign.statistics?.delivered ?? 0),
                            0
                          ) /
                            Math.max(
                              whatsappCampaigns.reduce(
                                (total, campaign) =>
                                  total + (campaign.statistics?.sent ?? 0),
                                0
                              ),
                              1
                            )) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (whatsappCampaigns.reduce(
                          (total, campaign) =>
                            total + (campaign.statistics?.delivered ?? 0),
                          0
                        ) /
                          Math.max(
                            whatsappCampaigns.reduce(
                              (total, campaign) =>
                                total + (campaign.statistics?.sent ?? 0),
                              0
                            ),
                            1
                          )) *
                        100
                      }
                      className="h-2 bg-emerald-200 dark:bg-emerald-800"
                      indicatorClassName="bg-emerald-500 dark:bg-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        {whatsappCampaigns.length}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Active Campaigns
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        {whatsappCampaigns.reduce(
                          (total, campaign) =>
                            total + (campaign.statistics?.sent ?? 0),
                          0
                        )}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Total Sent
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        {
                          whatsappCampaigns.filter(
                            (c) => c.status === "running"
                          ).length
                        }
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Currently Running
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          {/* User Recent Designs - Separate Section */}
          <div>
            {" "}
            <SectionHeader
              title="Your Recent Designs"
              subtitle="Continue working on your latest projects"
              onViewAllClick={() => navigate("/recent-work")}
            />
            <div className="space-y-4">
              {" "}
              {isLoadingUserTemplates ? (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {Array.from({ length: 4 }, (_, i) => (
                    <motion.div
                      key={`loading-user-template-${i + 1}`}
                      className="animate-pulse"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <div
                        className="rounded-xl h-36 mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                        style={{
                          borderRadius: BORDER_RADIUS.xl,
                        }}
                      ></div>
                      <div
                        className="rounded-lg h-4 mb-3 bg-slate-200 dark:bg-slate-700"
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
                  {userTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                      {userTemplates.slice(0, 8).map((template, index) => (
                        <motion.div
                          key={template._id}
                          whileHover={{ y: -4, scale: 1.02 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          <Card
                            className="cursor-pointer group border-0 overflow-hidden pt-0"
                            style={{
                              background: COLORS.background.primary,
                              borderRadius: BORDER_RADIUS.xl,
                              boxShadow: SHADOWS.card,
                              transition: TRANSITIONS.default,
                            }}
                            onClick={() =>
                              navigate(`/editor/template/${template._id}`)
                            }
                            ref={index === 5 ? lastUserTemplateRef : null}
                          >
                            <CardContent className="p-0">
                              <div
                                className="aspect-video overflow-hidden relative"
                                style={{
                                  backgroundColor: COLORS.neutral[100],
                                  borderTopLeftRadius: BORDER_RADIUS.xl,
                                  borderTopRightRadius: BORDER_RADIUS.xl,
                                }}
                              >
                                {template.thumbnailUrl ? (
                                  <img
                                    src={template.thumbnailUrl}
                                    alt={template.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image
                                      className="h-12 w-12"
                                      style={{ color: COLORS.text.muted }}
                                    />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                              <div className="p-6">
                                <h4
                                  className="font-semibold text-lg mb-2 truncate group-hover:text-blue-600"
                                  style={{
                                    color: COLORS.text.primary,
                                    transition: TRANSITIONS.default,
                                  }}
                                >
                                  {template.title}
                                </h4>
                                <div className="flex items-center justify-between">
                                  <p
                                    className="text-sm"
                                    style={{ color: COLORS.text.muted }}
                                  >
                                    Your Design
                                  </p>
                                  <ChevronRight
                                    className="h-4 w-4 group-hover:translate-x-1 transition-transform"
                                    style={{ color: COLORS.text.muted }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center py-16 rounded-2xl"
                      style={{
                        background: COLORS.background.muted,
                        border: `2px dashed ${COLORS.border.default}`,
                        borderRadius: BORDER_RADIUS["2xl"],
                      }}
                    >
                      <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{
                          background: COLORS.gradients.primary,
                        }}
                      >
                        <Image className="h-8 w-8 text-white" />
                      </div>
                      <h4
                        className="text-xl font-semibold mb-2"
                        style={{ color: COLORS.text.primary }}
                      >
                        No designs yet
                      </h4>
                      <p
                        className="text-base mb-6 max-w-md mx-auto"
                        style={{ color: COLORS.text.secondary }}
                      >
                        Start your creative journey by creating your first
                        design with our easy-to-use tools
                      </p>{" "}
                      <Button
                        className="text-white border-0 cursor-pointer"
                        style={{
                          background: COLORS.gradients.primary,
                          borderRadius: BORDER_RADIUS.lg,
                          padding: "12px 24px",
                        }}
                        onClick={() =>
                          navigate("/editor?width=1080&height=1080")
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Design
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>{" "}
          </div>{" "}
        </motion.div>{" "}
        {/* Enhanced Campaign sections */}
        <motion.div
          className="space-y-20 relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {/* WhatsApp Campaigns Section */}
          <div className="mb-16">
            <SectionHeader
              title="WhatsApp Campaigns"
              subtitle="Latest messaging campaigns and their performance"
              onViewAllClick={() => navigate("/whatsapp-campaigns")}
            />{" "}
            {whatsappCampaigns.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {" "}
                {whatsappCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group"
                  >
                    {" "}
                    <Card
                      className="cursor-pointer border-0 overflow-hidden py-0 h-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500 group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-800/30"
                      style={{
                        borderRadius: BORDER_RADIUS.xl,
                        boxShadow:
                          "0 8px 25px rgba(15, 23, 42, 0.08), 0 3px 10px rgba(15, 23, 42, 0.03)",
                        border: "1px solid rgba(148, 163, 184, 0.1)",
                      }}
                      onClick={() =>
                        navigate(`/whatsapp-campaigns/${campaign._id}`)
                      }
                    >
                      <CardContent className="p-6">
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                                <MessageSquare className="h-5 w-5 text-white" />
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCampaignStatusClass(
                                  campaign.status
                                )}`}
                              >
                                {campaign.status.charAt(0).toUpperCase() +
                                  campaign.status.slice(1)}
                              </span>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                              {campaign.campaignName}
                            </h3>
                            <p className="text-sm line-clamp-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                              {campaign.description ??
                                "No description available"}
                            </p>
                          </div>
                        </div>{" "}
                        {/* Statistics Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                              {campaign.statistics?.sent ?? 0}
                            </p>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Sent
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-100 dark:border-emerald-800/30">
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                              {campaign.statistics?.delivered ?? 0}
                            </p>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                              Delivered
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mb-1">
                              {getCampaignProgress(campaign.status).percentage}%
                            </p>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                              {getCampaignProgress(campaign.status).label}
                            </p>
                          </div>
                        </div>
                        {/* Global Campaign Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Campaign Performance
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {Math.round(
                                ((campaign.statistics?.delivered ?? 0) /
                                  Math.max(campaign.statistics?.sent ?? 1, 1)) *
                                  100
                              )}
                              % delivery rate
                            </span>
                          </div>
                          <Progress
                            value={
                              ((campaign.statistics?.delivered ?? 0) /
                                Math.max(campaign.statistics?.sent ?? 1, 1)) *
                              100
                            }
                            className="h-2 bg-slate-200 dark:bg-slate-700"
                            indicatorClassName="bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400"
                          />
                        </div>
                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Created{" "}
                                {new Date(
                                  campaign.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>View Details</span>
                              <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />{" "}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
                  style={{ background: COLORS.gradients.cool }}
                >
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: COLORS.text.primary }}
                >
                  No WhatsApp campaigns yet
                </h3>
                <p
                  className="text-base mb-6 max-w-md mx-auto"
                  style={{ color: COLORS.text.secondary }}
                >
                  Start engaging with your customers through targeted WhatsApp
                  campaigns
                </p>{" "}
                <Button
                  className="text-white border-0 cursor-pointer"
                  style={{
                    background: COLORS.gradients.primary,
                    borderRadius: BORDER_RADIUS.lg,
                    padding: "12px 24px",
                  }}
                  onClick={() => navigate("/whatsapp-campaigns/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </motion.div>
            )}
          </div>{" "}
          {/* Coupon Campaigns Section */}
          <div className="mb-12">
            {" "}
            <SectionHeader
              title="Coupon Campaigns"
              subtitle="Discount campaigns and promotional offers"
              showViewAll={couponCampaigns.length > 0}
              onViewAllClick={() => navigate("/coupon-campaigns")}
            />{" "}
            {isLoadingCoupons && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="animate-pulse"
                  >
                    <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900/20 rounded-xl border-0 p-6">
                      <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg mb-4"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4 w-3/4"></div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg"></div>
                        <div className="h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg"></div>
                      </div>
                      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {!isLoadingCoupons && couponCampaigns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {couponCampaigns.slice(0, 3).map((campaign, index) => (
                  <motion.div
                    key={campaign._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="group cursor-pointer"
                  >
                    <Card
                      className="hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900/20 group-hover:shadow-purple-200/50 dark:group-hover:shadow-purple-800/30 overflow-hidden py-0"
                      style={{
                        borderRadius: BORDER_RADIUS.xl,
                        boxShadow:
                          "0 8px 25px rgba(147, 51, 234, 0.08), 0 3px 10px rgba(147, 51, 234, 0.03)",
                        border: "1px solid rgba(168, 85, 247, 0.1)",
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                                <Percent className="h-5 w-5 text-white" />
                              </div>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(
                                  campaign.status
                                )} border font-semibold`}
                              >
                                {campaign.status.charAt(0).toUpperCase() +
                                  campaign.status.slice(1)}
                              </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                              {campaign.campaignName}
                            </h3>

                            {campaign.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                                {campaign.description}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 mb-5">
                              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-100 dark:border-emerald-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                    {campaign.discountPercentage}%
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                  Discount
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                    {campaign.numberOfCoupons.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                  Coupons
                                </p>
                              </div>{" "}
                              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                    {campaign.statistics.totalUsed}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">
                                  Used
                                </p>
                                <Progress
                                  value={
                                    (campaign.statistics.totalUsed /
                                      campaign.numberOfCoupons) *
                                    100
                                  }
                                  className="h-1.5 bg-amber-200 dark:bg-amber-800"
                                  indicatorClassName="bg-amber-500 dark:bg-amber-400"
                                />
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  {Math.round(
                                    (campaign.statistics.totalUsed /
                                      campaign.numberOfCoupons) *
                                      100
                                  )}
                                  % used
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-100 dark:border-rose-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                                    {formatDate(campaign.validity)}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-2">
                                  Expires
                                </p>
                                <Progress
                                  value={Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      ((new Date(campaign.validity).getTime() -
                                        Date.now()) /
                                        (1000 * 60 * 60 * 24 * 30)) *
                                        100
                                    )
                                  )}
                                  className="h-1.5 bg-rose-200 dark:bg-rose-800"
                                  indicatorClassName="bg-rose-500 dark:bg-rose-400"
                                />
                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                  {Math.max(
                                    0,
                                    Math.ceil(
                                      (new Date(campaign.validity).getTime() -
                                        Date.now()) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                  )}{" "}
                                  days left
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/coupon-campaigns/${campaign._id}`)
                              }
                              className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/20 transition-all duration-300 cursor-pointer"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View Details
                              <ChevronRight className="ml-auto h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {!isLoadingCoupons && couponCampaigns.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center py-16"
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
                  style={{ background: COLORS.gradients.warm }}
                >
                  <Tag className="h-10 w-10 text-white" />
                </div>
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: COLORS.text.primary }}
                >
                  No coupon campaigns yet
                </h3>
                <p
                  className="text-base mb-6 max-w-md mx-auto"
                  style={{ color: COLORS.text.secondary }}
                >
                  Create your first coupon campaign to start offering discounts
                  to your customers.
                </p>{" "}
                <Button
                  onClick={() => navigate("/editor?isCoupon=true")}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 cursor-pointer"
                  style={{
                    borderRadius: BORDER_RADIUS.lg,
                    padding: "12px 24px",
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>{" "}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Custom Size Dialog */}
      {showCustomSizeDialog && (
        <CustomSizeDialog
          open={showCustomSizeDialog}
          onClose={() => setShowCustomSizeDialog(false)}
        />
      )}{" "}
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
            onClick={() => setShowCustomSizeDialog(true)}
          >
            <Sparkles className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          </Button>

          {/* Fixed Tooltip positioning */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Create New Design
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90" />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
