/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  RefreshCw,
  MoreVertical,
  Play,
  Trash2,
  Eye,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Smartphone,
  Loader2,
  Info,
  Repeat,
  Plus,
  Grid3X3,
  List,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  campaignService,
  Campaign,
  CampaignStatisticsOverview,
  WhatsAppAccount,
} from "@/services/campaignService";
import {
  whatsappService,
  WhatsAppConnectionState,
  WhatsAppSettings,
} from "@/services/whatsappService";
import SharedDashboardLayout from "@/components/layout/DashboardLayout";
import WhatsAppConnectionDialog from "@/components/WhatsAppConnectionDialog";
import { COLORS, SHADOWS, BORDER_RADIUS } from "@/constants/styles";

// Helper function to get status gradient
const getStatusGradient = (status: string) => {
  switch (status) {
    case "completed":
      return "linear-gradient(90deg, #10b981, #059669)";
    case "running":
      return "linear-gradient(90deg, #3b82f6, #2563eb)";
    case "failed":
      return "linear-gradient(90deg, #ef4444, #dc2626)";
    case "pending":
      return "linear-gradient(90deg, #f59e0b, #d97706)";
    default:
      return "#e5e7eb";
  }
};

// Campaign Card Component for both grid and list views
interface CampaignCardProps {
  campaign: Campaign;
  viewType: "grid" | "list";
  onLaunch: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  getCampaignProgress: (campaign: Campaign) => number;
  getCampaignProgressStatus: (campaign: Campaign) => string;
  getProgressColor: (campaign: Campaign) => string;
}

const CampaignCard = ({
  campaign,
  viewType,
  onLaunch,
  onRetry,
  onDelete,
  onView,
  getCampaignProgress,
  getCampaignProgressStatus,
  getProgressColor,
}: CampaignCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "completed":
        return "text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20";
      case "failed":
        return "text-red-600 border-red-600 bg-red-50 dark:bg-red-900/20";
      case "pending":
        return "text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getTimeText = () => {
    if (campaign.status === "running") {
      return campaign.startedAt
        ? `Started ${formatTimeAgo(campaign.startedAt)}`
        : "Starting...";
    } else if (campaign.status === "completed") {
      return `Completed ${formatTimeAgo(
        campaign.completedAt || campaign.updatedAt
      )}`;
    } else if (campaign.status === "failed") {
      return `Failed ${formatTimeAgo(campaign.updatedAt)}`;
    } else {
      return `Created ${formatTimeAgo(campaign.createdAt)}`;
    }
  };

  if (viewType === "grid") {
    return (
      <Card
        className="group border-0 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer pt-0 h-[340px] flex flex-col relative overflow-hidden"
        style={{
          borderRadius: BORDER_RADIUS.lg,
          boxShadow: SHADOWS.md,
        }}
      >
        {/* Status indicator line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: getStatusGradient(campaign.status),
          }}
        />

        <CardContent className="p-5 h-full flex flex-col">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-2 group-hover:text-blue-600 transition-colors">
                {campaign.campaignName}
              </h3>
              <Badge
                className={`${getStatusColor(
                  campaign.status
                )} px-3 py-1 text-xs font-medium`}
                style={{
                  borderRadius: BORDER_RADIUS.full,
                }}
              >
                {campaign.status === "running" && (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                )}
                {campaign.status.charAt(0).toUpperCase() +
                  campaign.status.slice(1)}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onView(campaign._id)}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {(campaign.status === "draft" ||
                  campaign.status === "failed") && (
                  <DropdownMenuItem
                    onClick={() =>
                      campaign.status === "draft"
                        ? onLaunch(campaign._id)
                        : onRetry(campaign._id)
                    }
                    className="cursor-pointer"
                  >
                    {campaign.status === "draft" ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Launch Campaign
                      </>
                    ) : (
                      <>
                        <Repeat className="mr-2 h-4 w-4" />
                        Retry Campaign
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {campaign.status === "draft" && (
                  <DropdownMenuItem
                    onClick={() => onDelete(campaign._id)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Message Preview */}
          <div className="mb-4 flex-grow">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
              {campaign.message}
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mb-1">
                <Users className="h-3 w-3" />
                <span>Targets</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {campaign.statistics.totalTargets}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mb-1">
                <Send className="h-3 w-3" />
                <span>Sent</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {campaign.statistics.sent}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mb-1">
                <CheckCircle className="h-3 w-3" />
                <span>Delivered</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {campaign.statistics.delivered}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mb-1">
                <Clock className="h-3 w-3" />
                <span>Time</span>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {getTimeText()}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-auto mb-4 ">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {getCampaignProgressStatus(campaign)}
              </span>
              <span className="text-gray-900 dark:text-white font-bold">
                {getCampaignProgress(campaign)}%
              </span>
            </div>
            <Progress
              value={getCampaignProgress(campaign)}
              max={100}
              className="h-2.5"
              indicatorClassName={`${getProgressColor(
                campaign
              )} transition-all duration-300`}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card
      className="group border-0 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer py-0 relative overflow-hidden"
      style={{
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.md,
      }}
    >
      {/* Status indicator line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: getStatusGradient(campaign.status),
        }}
      />

      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {campaign.campaignName}
              </h3>
              <Badge
                className={`${getStatusColor(
                  campaign.status
                )} px-3 py-1.5 font-medium`}
                style={{
                  borderRadius: BORDER_RADIUS.full,
                }}
              >
                {campaign.status === "running" && (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                )}
                {campaign.status.charAt(0).toUpperCase() +
                  campaign.status.slice(1)}
              </Badge>
            </div>

            {/* Message Preview */}
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
              {campaign.message}
            </p>

            {/* Statistics Row */}
            <div className="flex items-center justify-between gap-8 mb-5">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Targets
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.totalTargets}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sent
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.sent}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Delivered
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.delivered}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Time
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getTimeText()}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {getCampaignProgressStatus(campaign)}
                </span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {getCampaignProgress(campaign)}%
                </span>
              </div>
              <Progress
                value={getCampaignProgress(campaign)}
                max={100}
                className="h-3"
                indicatorClassName={`${getProgressColor(
                  campaign
                )} transition-all duration-300`}
              />
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 ml-4 opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onView(campaign._id)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {(campaign.status === "draft" ||
                campaign.status === "failed") && (
                <DropdownMenuItem
                  onClick={() =>
                    campaign.status === "draft"
                      ? onLaunch(campaign._id)
                      : onRetry(campaign._id)
                  }
                  className="cursor-pointer"
                >
                  {campaign.status === "draft" ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Launch Campaign
                    </>
                  ) : (
                    <>
                      <Repeat className="mr-2 h-4 w-4" />
                      Retry Campaign
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {campaign.status === "draft" && (
                <DropdownMenuItem
                  onClick={() => onDelete(campaign._id)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default function WhatsAppCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewType, setViewType] = useState<"grid" | "list">("list");
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [whatsAppAccounts, setWhatsAppAccounts] = useState<WhatsAppAccount[]>(
    []
  );
  const [activeWhatsAppAccount, setActiveWhatsAppAccount] =
    useState<WhatsAppAccount | null>(null);
  const [showWhatsAppConnectionDialog, setShowWhatsAppConnectionDialog] =
    useState(false);
  const [selectedWhatsAppUsername, setSelectedWhatsAppUsername] = useState("");

  // WhatsApp connection state
  const [whatsappSettings, setWhatsappSettings] =
    useState<WhatsAppSettings | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<WhatsAppConnectionState>("disconnected");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // React Query for campaigns with infinite loading
  const {
    data: campaignsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isCampaignsLoading,
    isError: isCampaignsError,
    refetch: refetchCampaigns,
  } = useInfiniteQuery({
    queryKey: ["campaigns", user?.userId, statusFilter, searchQuery],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!user?.userId) throw new Error("User not found");

      const response = await campaignService.getCampaigns({
        userId: user.userId,
        status: statusFilter || undefined,
        limit: 10, // Smaller page size for infinite loading
        page: pageParam,
      });

      if (!response.success) {
        throw new Error("Failed to fetch campaigns");
      }

      return {
        campaigns: response.data,
        nextPage: response.data.length === 10 ? pageParam + 1 : undefined,
        hasMore: response.data.length === 10,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // React Query for statistics
  const {
    data: statistics,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["campaign-statistics", user?.userId],
    queryFn: async () => {
      if (!user?.userId) throw new Error("User not found");

      const response = await campaignService.getCampaignStatistics({
        userId: user.userId,
      });

      if (!response.success) {
        throw new Error("Failed to fetch statistics");
      }

      return response.data;
    },
    enabled: !!user?.userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Flatten campaigns from all pages
  const campaigns =
    campaignsData?.pages.flatMap((page) => page.campaigns) || [];
  const isLoading = isCampaignsLoading || isStatsLoading;

  // Set up auto-refresh for running campaigns
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        refetchCampaigns();
        refetchStats();
      }, 10000); // Refresh every 10 seconds
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refetchCampaigns, refetchStats]);

  // Fetch WhatsApp accounts
  const fetchWhatsAppAccounts = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await campaignService.getWhatsAppAccounts(user.userId);

      if (response.success) {
        setWhatsAppAccounts(response.data);

        // Set active account if available
        const connectedAccount = response.data.find(
          (account) => account.status === "connected"
        );
        if (connectedAccount) {
          setActiveWhatsAppAccount(connectedAccount);
        } else {
          // If no connected account found, double-check connection status with whatsappService
          const statusResponse = await whatsappService.checkConnectionStatus(
            user.userId
          );
          if (
            statusResponse.status === "connected" &&
            response.data.length > 0
          ) {
            // If connected but no account is marked as connected, mark the first one as connected
            setActiveWhatsAppAccount({
              ...response.data[0],
              status: "connected",
            });
          } else {
            setActiveWhatsAppAccount(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching WhatsApp accounts:", error);
    }
  }, [user?.userId]);

  // Check for existing WhatsApp settings and connection status
  const checkExistingWhatsAppSettings = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setIsCheckingConnection(true);
      setConnectionStatus("checking");

      // First, try to get existing WhatsApp settings
      const existingSettings = await whatsappService.getSettings(user.userId);

      if (existingSettings) {
        console.log("Found existing WhatsApp settings:", existingSettings);
        setWhatsappSettings(existingSettings);

        // Check current connection status
        const statusResponse = await whatsappService.checkConnectionStatus(
          user.userId
        );
        console.log("Connection status check:", statusResponse);
        setConnectionStatus(statusResponse.status);

        if (statusResponse.status === "connected") {
          console.log("WhatsApp is connected!");
          // Fetch WhatsApp accounts to update UI
          await fetchWhatsAppAccounts();
        } else {
          console.log("WhatsApp not connected, UI will show connect button");
          setActiveWhatsAppAccount(null);
        }
      } else {
        console.log(
          "No existing WhatsApp settings found, ready for new connection"
        );
        setConnectionStatus("disconnected");
        setActiveWhatsAppAccount(null);
      }
    } catch (error) {
      console.error("Error checking existing WhatsApp settings:", error);
      setConnectionStatus("error");
      setActiveWhatsAppAccount(null);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [user?.userId, fetchWhatsAppAccounts]);

  // Initial data load - handled by React Query automatically
  useEffect(() => {
    checkExistingWhatsAppSettings(); // This will call fetchWhatsAppAccounts if connected
  }, [checkExistingWhatsAppSettings]);

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle manual refresh
  const handleRefresh = () => {
    refetchCampaigns();
    refetchStats();
  };

  // Handle campaign actions
  // Handle WhatsApp connection
  const handleConnectWhatsApp = (username?: string) => {
    if (username) {
      setSelectedWhatsAppUsername(username);
    } else {
      setSelectedWhatsAppUsername("");
    }
    setShowWhatsAppConnectionDialog(true);
  };

  // Success handler for WhatsApp connection
  const handleWhatsAppConnectionSuccess = () => {
    // Re-check connection status and fetch accounts
    checkExistingWhatsAppSettings();
    setShowWhatsAppConnectionDialog(false);
    toast.success("WhatsApp connected successfully!");
  };

  // Handle campaign actions
  const handleLaunchCampaign = async (campaignId: string) => {
    // Check if WhatsApp is connected first
    if (!activeWhatsAppAccount && connectionStatus !== "connected") {
      toast.error("Please connect to WhatsApp before launching a campaign");
      handleConnectWhatsApp();
      return;
    }

    try {
      const response = await campaignService.launchCampaign(campaignId);
      if (response.success) {
        toast.success("Campaign launched successfully!");
        setAutoRefresh(true); // Enable auto-refresh when launching a campaign
        refetchCampaigns(); // Refresh data
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
      toast.error("Failed to launch campaign");
    }
  };

  const handleRetryCampaign = async (campaignId: string) => {
    // Check if WhatsApp is connected first
    if (!activeWhatsAppAccount && connectionStatus !== "connected") {
      toast.error("Please connect to WhatsApp before retrying a campaign");
      handleConnectWhatsApp();
      return;
    }

    try {
      const response = await campaignService.retryCampaign(campaignId);
      if (response.success) {
        toast.success("Campaign retry initiated successfully!");
        setAutoRefresh(true); // Enable auto-refresh
        refetchCampaigns(); // Refresh data
      }
    } catch (error) {
      console.error("Error retrying campaign:", error);
      toast.error("Failed to retry campaign");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await campaignService.deleteCampaign(campaignId);
      if (response.success) {
        toast.success("Campaign deleted successfully!");
        refetchCampaigns(); // Refresh data
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/whatsapp-campaigns/${campaignId}`);
  };

  // Calculate campaign progress percentage
  const getCampaignProgress = (campaign: Campaign) => {
    const { statistics } = campaign;
    const total = statistics.totalTargets;
    if (total === 0) return 0;

    // For completed campaigns, show actual success rate instead of processing percentage
    if (campaign.status === "completed") {
      return statistics.successRate;
    }

    // For other statuses, show percentage of messages processed
    const processed =
      statistics.sent + statistics.delivered + statistics.failed;
    return Math.min(100, Math.round((processed / total) * 100)); // Ensure it never exceeds 100%
  };

  // Get campaign progress status text
  const getCampaignProgressStatus = (campaign: Campaign) => {
    const { statistics } = campaign;
    const total = statistics.totalTargets;
    if (total === 0) return "No targets";

    const processed =
      statistics.sent + statistics.delivered + statistics.failed;
    const percentage = Math.round((processed / total) * 100);

    if (campaign.status === "running") {
      return `In progress (${percentage}%)`;
    } else if (campaign.status === "completed") {
      return `Completed (${statistics.successRate}% success)`;
    } else if (campaign.status === "failed") {
      return "Failed";
    } else if (campaign.status === "pending") {
      return "Queued, waiting to start";
    } else {
      return "Draft";
    }
  };

  // Get color for campaign progress bar
  const getProgressColor = (campaign: Campaign) => {
    const { status } = campaign;

    if (status === "completed") return "bg-green-500";
    if (status === "failed") return "bg-red-500";
    if (status === "running") return "bg-blue-500";
    if (status === "pending") return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <SharedDashboardLayout
      title="WhatsApp Campaigns"
      description="Manage and track your WhatsApp marketing campaigns"
    >
      <div className="space-y-8">
        {/* Statistics Overview */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card
              className="border-0 cursor-pointer hover:scale-105 transition-transform duration-200 py-0"
              style={{
                borderRadius: BORDER_RADIUS.lg,
                boxShadow: SHADOWS.md,
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${COLORS.brand.primary}15` }}
                  >
                    <MessageSquare
                      className="h-6 w-6"
                      style={{ color: COLORS.brand.primary }}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Campaigns
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalCampaigns}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 cursor-pointer hover:scale-105 transition-transform duration-200 py-0"
              style={{
                borderRadius: BORDER_RADIUS.lg,
                boxShadow: SHADOWS.md,
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${COLORS.brand.success}15` }}
                  >
                    <Send
                      className="h-6 w-6"
                      style={{ color: COLORS.brand.success }}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Messages Sent
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalMessagesSent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 cursor-pointer hover:scale-105 transition-transform duration-200 py-0"
              style={{
                borderRadius: BORDER_RADIUS.lg,
                boxShadow: SHADOWS.md,
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${COLORS.brand.secondary}15` }}
                  >
                    <CheckCircle
                      className="h-6 w-6"
                      style={{ color: COLORS.brand.secondary }}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Delivered
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalMessagesDelivered.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 cursor-pointer hover:scale-105 transition-transform duration-200 py-0"
              style={{
                borderRadius: BORDER_RADIUS.lg,
                boxShadow: SHADOWS.md,
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${COLORS.brand.warning}15` }}
                  >
                    <TrendingUp
                      className="h-6 w-6"
                      style={{ color: COLORS.brand.warning }}
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.averageSuccessRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* WhatsApp Connection Status & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <Card
            className="border-0 py-0"
            style={{
              borderRadius: BORDER_RADIUS.lg,
              boxShadow: SHADOWS.sm,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* WhatsApp Connection Status */}
                <div className="flex items-center gap-3">
                  {isCheckingConnection ? (
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">
                        Checking WhatsApp connection...
                      </span>
                    </div>
                  ) : connectionStatus === "connected" ||
                    activeWhatsAppAccount ? (
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                      <div className="relative">
                        <Smartphone className="h-5 w-5" />
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <div>
                        <div className="font-medium">
                          Connected:{" "}
                          {activeWhatsAppAccount?.username ||
                            (whatsappSettings?.username ?? "WhatsApp")}
                        </div>
                        <div className="text-xs opacity-75">
                          Ready to send campaigns
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 text-xs hover:bg-green-100 dark:hover:bg-green-900/30"
                        onClick={() =>
                          handleConnectWhatsApp(
                            activeWhatsAppAccount?.username ||
                              whatsappSettings?.username
                          )
                        }
                      >
                        Manage
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleConnectWhatsApp()}
                      className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      Connect WhatsApp
                    </Button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {activeWhatsAppAccount && (
                    <Button
                      onClick={() => navigate("/whatsapp-campaigns/new")}
                      className="cursor-pointer"
                      style={{
                        background: COLORS.gradients.primary,
                        borderRadius: BORDER_RADIUS.md,
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Campaign
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isCampaignsLoading || isStatsLoading}
                    className="cursor-pointer"
                  >
                    {isCampaignsLoading || isStatsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Auto-refresh indicator */}
              {autoRefresh && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Auto-refreshing active campaigns every 10 seconds</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8"
        >
          <Card
            className="border-0 py-0"
            style={{
              borderRadius: BORDER_RADIUS.lg,
              boxShadow: SHADOWS.sm,
            }}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="Search campaigns by name or message content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 dark:border-gray-700"
                    style={{ borderRadius: BORDER_RADIUS.md }}
                  />
                </div>

                <div className="flex gap-3 items-center">
                  {/* View Toggle */}
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <Button
                      variant={viewType === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewType("list")}
                      className="rounded-none border-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewType === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewType("grid")}
                      className="rounded-none border-0"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none px-4 py-2 pr-10 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                      style={{
                        borderRadius: BORDER_RADIUS.md,
                        boxShadow: SHADOWS.sm,
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {(searchQuery || statusFilter) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("");
                      }}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaigns List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="w-full"
        >
          {isLoading ? (
            <div
              className={
                viewType === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "grid grid-cols-1 gap-6"
              }
            >
              {Array(viewType === "grid" ? 8 : 3)
                .fill(0)
                .map((_, index) => (
                  <Card
                    key={index}
                    className="animate-pulse border-0 py-0"
                    style={{
                      borderRadius: BORDER_RADIUS.lg,
                      boxShadow: SHADOWS.sm,
                    }}
                  >
                    <CardContent
                      className={viewType === "grid" ? "p-4" : "p-6"}
                    >
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="flex gap-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div
              className={
                viewType === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "grid grid-cols-1 gap-6"
              }
            >
              {filteredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <CampaignCard
                    campaign={campaign}
                    viewType={viewType}
                    onLaunch={handleLaunchCampaign}
                    onRetry={handleRetryCampaign}
                    onDelete={handleDeleteCampaign}
                    onView={handleViewCampaign}
                    getCampaignProgress={getCampaignProgress}
                    getCampaignProgressStatus={getCampaignProgressStatus}
                    getProgressColor={getProgressColor}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card
                className="border-0 py-0"
                style={{
                  borderRadius: BORDER_RADIUS.xl,
                  boxShadow: SHADOWS.lg,
                }}
              >
                <div
                  className="py-6"
                  style={{
                    background: COLORS.gradients.cool,
                    borderTopLeftRadius: BORDER_RADIUS.xl,
                    borderTopRightRadius: BORDER_RADIUS.xl,
                  }}
                >
                  <div className="w-full h-24 flex items-center justify-center">
                    <div className="relative">
                      <div
                        className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-30"
                        style={{ animationDuration: "3s" }}
                      ></div>
                      <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                        <MessageSquare className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {searchQuery || statusFilter
                      ? "No matching campaigns"
                      : "No campaigns yet"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8 text-base">
                    {searchQuery || statusFilter
                      ? "We couldn't find any campaigns that match your current filters. Try adjusting your search criteria or clearing filters."
                      : connectionStatus === "connected"
                      ? "You haven't created any WhatsApp campaigns yet. Create your first campaign to start reaching your customers."
                      : "Connect your WhatsApp account to start creating and sending marketing campaigns to your customers."}
                  </p>
                  {connectionStatus === "connected" ? (
                    <div className="flex flex-col gap-4 items-center">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-2 px-4 rounded-full mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          WhatsApp Connected
                        </span>
                      </div>
                      <Button
                        onClick={() => navigate("/whatsapp-campaigns/new")}
                        className="cursor-pointer"
                        style={{
                          background: COLORS.gradients.primary,
                          borderRadius: BORDER_RADIUS.md,
                        }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Create New Campaign
                      </Button>
                      {(searchQuery || statusFilter) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("");
                          }}
                          className="cursor-pointer"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleConnectWhatsApp()}
                      className="cursor-pointer"
                      style={{
                        background: COLORS.gradients.warm,
                        borderRadius: BORDER_RADIUS.md,
                      }}
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      Connect WhatsApp
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Floating Action Button */}
        {connectionStatus === "connected" && filteredCampaigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => navigate("/whatsapp-campaigns/new")}
              className="h-14 w-14 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-all duration-300"
              style={{
                background: COLORS.gradients.primary,
                boxShadow: `0 10px 25px -5px ${COLORS.brand.primary}40, 0 20px 40px -15px ${COLORS.brand.primary}30`,
              }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        )}

        {/* WhatsApp Connection Dialog */}
        <WhatsAppConnectionDialog
          open={showWhatsAppConnectionDialog}
          onClose={() => setShowWhatsAppConnectionDialog(false)}
          onSuccess={handleWhatsAppConnectionSuccess}
          username={selectedWhatsAppUsername}
        />
      </div>
    </SharedDashboardLayout>
  );
}
