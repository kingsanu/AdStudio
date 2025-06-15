/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
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
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";
import WhatsAppConnectionDialog from "@/components/WhatsAppConnectionDialog";

export default function WhatsAppCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [statistics, setStatistics] =
    useState<CampaignStatisticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
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

  // Fetch campaigns and statistics
  const fetchData = useCallback(
    async (showLoadingState = true) => {
      if (!user?.userId) return;

      try {
        if (showLoadingState) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        // Fetch campaigns
        const campaignsResponse = await campaignService.getCampaigns({
          userId: user.userId,
          status: statusFilter || undefined,
          limit: 50,
        });

        if (campaignsResponse.success) {
          setCampaigns(campaignsResponse.data);

          // Check if any campaigns are running - if so, enable auto-refresh
          const hasRunningCampaigns = campaignsResponse.data.some(
            (campaign) =>
              campaign.status === "running" || campaign.status === "pending"
          );

          if (hasRunningCampaigns && !autoRefresh) {
            setAutoRefresh(true);
          } else if (!hasRunningCampaigns && autoRefresh) {
            setAutoRefresh(false);
          }
        }

        // Fetch statistics
        const statsResponse = await campaignService.getCampaignStatistics({
          userId: user.userId,
        });

        if (statsResponse.success) {
          setStatistics(statsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (showLoadingState) {
          toast.error("Failed to load campaigns");
        }
      } finally {
        if (showLoadingState) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [user?.userId, statusFilter, autoRefresh]
  );

  // Set up auto-refresh for running campaigns
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(false); // Don't show loading state during auto-refresh
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
  }, [autoRefresh, fetchData]);

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
  }, [user?.userId]);

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

  // Initial data load
  useEffect(() => {
    fetchData();
    checkExistingWhatsAppSettings(); // This will call fetchWhatsAppAccounts if connected
  }, [fetchData, checkExistingWhatsAppSettings]);

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle manual refresh
  const handleRefresh = () => {
    fetchData(false);
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
        fetchData(); // Refresh data
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
        fetchData(); // Refresh data
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
        fetchData(); // Refresh data
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
    return "bg-gray-300 dark:bg-gray-700";
  };

  return (
    <SharedDashboardLayout
      title="WhatsApp Campaigns"
      description="Manage and track your WhatsApp marketing campaigns"
    >
      <div className="flex flex-col">
        {/* WhatsApp Connection Status & Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          {/* WhatsApp Connection Status */}
          <div className="flex items-center gap-2">
            {isCheckingConnection ? (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  Checking WhatsApp connection...
                </span>
              </div>
            ) : connectionStatus === "connected" || activeWhatsAppAccount ? (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-md">
                <div className="relative">
                  <Smartphone className="h-4 w-4" />
                  <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                </div>
                <span className="text-sm font-medium">
                  Connected:{" "}
                  {activeWhatsAppAccount?.username ||
                    (whatsappSettings?.username ?? "WhatsApp")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
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

          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {/* <Tooltip content="Refresh campaigns"> */}
              {/* <TooltipTrigger asChild> */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              {/* </TooltipTrigger> */}
              {/* <TooltipContent> */}
              <p>Refresh campaigns</p>
              {/* </TooltipContent> */}
              {/* </Tooltip> */}
            </TooltipProvider>
          </div>
        </div>

        {/* Auto-refresh status indicator */}
        {autoRefresh && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>
              Auto-refreshing because you have active campaigns running
            </span>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Search by campaign name or message content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 dark:border-gray-700 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
                  className="text-gray-500 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`${
                  isRefreshing ? "opacity-70" : ""
                } text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/20`}
              >
                {isRefreshing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {activeWhatsAppAccount && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Connected WhatsApp
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {activeWhatsAppAccount.username}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/whatsapp-campaigns/new")}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                New Campaign
              </Button>
            </div>
          )}
        </div>

        {/* Campaigns List */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
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
            <div className="grid grid-cols-1 gap-4">
              {filteredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden border-gray-200 dark:border-gray-800">
                    <CardContent className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {campaign.campaignName}
                            </h3>
                            <Badge
                              className={`${campaignService.getStatusColor(
                                campaign.status
                              )} px-2.5 py-1 font-medium`}
                            >
                              {campaign.status === "running" ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : (
                                campaignService.getStatusIcon(campaign.status) +
                                " "
                              )}
                              {campaign.status.charAt(0).toUpperCase() +
                                campaign.status.slice(1)}
                            </Badge>

                            {campaign.status === "failed" &&
                              campaign.errors &&
                              campaign.errors.length > 0 && (
                                <TooltipProvider>
                                  {/* <Tooltip> */}
                                  {/* <TooltipTrigger asChild> */}
                                  <div className="cursor-help text-red-500 flex items-center">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                    <span className="text-xs">
                                      {campaign.errors.length} error(s)
                                    </span>
                                  </div>
                                  {/* </TooltipTrigger> */}
                                  {/* <TooltipContent> */}
                                  <div className="max-w-xs">
                                    <p className="font-semibold mb-1">
                                      Latest errors:
                                    </p>
                                    <ul className="text-xs list-disc pl-4 space-y-1">
                                      {campaign.errors
                                        .slice(0, 3)
                                        .map((error, i) => (
                                          <li key={i}>{error.error}</li>
                                        ))}
                                    </ul>
                                  </div>
                                  {/* </TooltipContent> */}
                                  {/* </Tooltip> */}
                                </TooltipProvider>
                              )}
                          </div>

                          <div className="flex items-center mb-4 gap-2 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {campaign.status === "running"
                                ? campaign.startedAt
                                  ? "Started " +
                                    campaignService.getTimeAgo(
                                      campaign.startedAt
                                    )
                                  : "Just started"
                                : "Created " +
                                  campaignService.getTimeAgo(
                                    campaign.createdAt
                                  )}
                            </span>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 mb-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                              "{campaign.message}"
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium mb-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>Recipients</span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                {campaign.statistics.totalTargets}
                              </span>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400 font-medium mb-1">
                                <Send className="h-3.5 w-3.5" />
                                <span>Sent</span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                {campaign.statistics.sent}
                              </span>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-md px-3 py-2">
                              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium mb-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Delivered</span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                {campaign.statistics.delivered}
                              </span>
                            </div>

                            <div
                              className={`${
                                campaign.statistics.failed > 0
                                  ? "bg-red-50 dark:bg-red-900/20"
                                  : "bg-gray-50 dark:bg-gray-800/50"
                              } rounded-md px-3 py-2`}
                            >
                              <div
                                className={`flex items-center gap-1.5 ${
                                  campaign.statistics.failed > 0
                                    ? "text-red-700 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-400"
                                } font-medium mb-1`}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Failed</span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                {campaign.statistics.failed}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/20"
                            onClick={() => handleViewCampaign(campaign._id)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View Details
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewCampaign(campaign._id)}
                                className="text-indigo-600 dark:text-indigo-400"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              {campaign.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleLaunchCampaign(campaign._id)
                                  }
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Launch Campaign
                                </DropdownMenuItem>
                              )}

                              {campaign.status === "failed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRetryCampaign(campaign._id)
                                  }
                                  className="text-amber-600 dark:text-amber-400"
                                >
                                  <Repeat className="mr-2 h-4 w-4" />
                                  Retry Campaign
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteCampaign(campaign._id)
                                }
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>

                    {/* Progress bar and status */}
                    <CardFooter className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="w-full">
                        <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                          <span className="text-gray-700 dark:text-gray-300">
                            {getCampaignProgressStatus(campaign)}
                          </span>
                          <span
                            className={`${getProgressColor(campaign).replace(
                              "bg-",
                              "text-"
                            )}`}
                          >
                            {getCampaignProgress(campaign)}%
                          </span>
                        </div>
                        <Progress
                          value={getCampaignProgress(campaign)}
                          max={100}
                          className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800"
                          indicatorClassName={`${getProgressColor(
                            campaign
                          )} rounded-full transition-all duration-300 ease-in-out`}
                        />
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-gray-200 dark:border-gray-800 h-auto">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 py-4">
                <div className="w-full h-24 flex items-center justify-center">
                  <div className="relative">
                    <div
                      className="absolute inset-0 bg-indigo-100 dark:bg-indigo-800/30 rounded-full animate-ping opacity-30"
                      style={{ animationDuration: "3s" }}
                    ></div>
                    <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md">
                      <MessageSquare className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 text-center h-auto">
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
                {/* Only check connection status, not activeWhatsAppAccount which might be null even when connected */}
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Create New Campaign
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("");
                      }}
                      className="text-gray-600"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnectWhatsApp()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Connect WhatsApp
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

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
