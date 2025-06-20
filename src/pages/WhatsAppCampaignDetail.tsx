/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  BarChart3,
  FileText,
  Phone,
  Image as ImageIcon,
  Download,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService, Campaign } from "@/services/campaignService";
import SharedDashboardLayout from "@/components/layout/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COLORS, SHADOWS, BORDER_RADIUS } from "@/constants/styles";

export default function WhatsAppCampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch campaign data
  const fetchCampaign = useCallback(
    async (showLoadingState = true) => {
      if (!campaignId || !user?.userId) return;

      try {
        if (showLoadingState) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const response = await campaignService.getCampaign(campaignId);

        if (response.success) {
          setCampaign(response.data);
        } else {
          toast.error("Failed to load campaign details");
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast.error("An error occurred while loading campaign details");
      } finally {
        if (showLoadingState) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [campaignId, user?.userId]
  );

  // Initial data load
  useEffect(() => {
    fetchCampaign();

    // Set up polling for active campaigns
    let intervalId: NodeJS.Timeout | null = null;

    if (campaign?.status === "running" || campaign?.status === "pending") {
      intervalId = setInterval(() => {
        fetchCampaign(false);
      }, 5000); // Poll every 5 seconds for updates
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchCampaign, campaign?.status]);

  // Handle retrying a failed campaign
  const handleRetryCampaign = async () => {
    if (!campaignId) return;

    try {
      const response = await campaignService.retryCampaign(campaignId);

      if (response.success) {
        toast.success("Campaign retry initiated successfully!");
        fetchCampaign();
      } else {
        toast.error(response.message || "Failed to retry campaign");
      }
    } catch (error) {
      console.error("Error retrying campaign:", error);
      toast.error("An error occurred while retrying the campaign");
    }
  };

  // Calculate campaign progress percentage
  const getCampaignProgress = () => {
    if (!campaign) return 0;

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
  const getCampaignProgressStatus = () => {
    if (!campaign) return "";

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
  const getProgressColor = () => {
    if (!campaign) return "bg-gray-400";

    const { status } = campaign;

    if (status === "completed") return "bg-green-500";
    if (status === "failed") return "bg-red-500";
    if (status === "running") return "bg-blue-500";
    if (status === "pending") return "bg-yellow-500";
    return "bg-gray-400";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper functions for status styling
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
      case "draft":
        return "text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-900/20";
      default:
        return "text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return "⚡";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "pending":
        return "⏳";
      case "draft":
        return "📝";
      default:
        return "📊";
    }
  };

  // Render skeleton during loading
  if (isLoading) {
    return (
      <SharedDashboardLayout
        title="Campaign Details"
        description="Loading campaign information..."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="animate-pulse"
              disabled
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </SharedDashboardLayout>
    );
  }

  // Render 404 if campaign not found
  if (!campaign) {
    return (
      <SharedDashboardLayout
        title="Campaign Not Found"
        description="The requested campaign could not be found"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            onClick={() => navigate("/whatsapp-campaigns")}
            variant="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </SharedDashboardLayout>
    );
  }
  return (
    <SharedDashboardLayout
      title={campaign.campaignName}
      description="Campaign details and performance metrics"
    >
      <div className="space-y-8">
        {/* Navigation and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/whatsapp-campaigns")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCampaign(false)}
              disabled={isRefreshing}
              className="cursor-pointer"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            {campaign.status === "failed" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleRetryCampaign}
                className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Repeat className="mr-2 h-4 w-4" />
                Retry Campaign
              </Button>
            )}
          </div>
        </motion.div>
        {/* Campaign Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="border-0 py-0"
            style={{
              borderRadius: BORDER_RADIUS.lg,
              boxShadow: SHADOWS.sm,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {campaign.campaignName}
                  </h1>{" "}
                  <Badge
                    className={`${getStatusColor(campaign.status)} px-3 py-1`}
                  >
                    {campaign.status === "running" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      getStatusIcon(campaign.status) + " "
                    )}
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Created {formatDate(campaign.createdAt)}
              </p>

              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {getCampaignProgressStatus()}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {getCampaignProgress()}%
                  </span>
                </div>{" "}
                <Progress
                  value={getCampaignProgress()}
                  max={100}
                  className="h-3"
                  indicatorClassName={getProgressColor()}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>{" "}
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
                  <Users
                    className="h-6 w-6"
                    style={{ color: COLORS.brand.primary }}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Recipients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.totalTargets}
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
                  <Send
                    className="h-6 w-6"
                    style={{ color: COLORS.brand.warning }}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sent
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.sent}
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
                  <CheckCircle
                    className="h-6 w-6"
                    style={{ color: COLORS.brand.success }}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Delivered
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.delivered}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 cursor-pointer hover:scale-105 transition-transform duration-200 py-0 ${
              campaign.statistics.failed > 0 ? "" : "opacity-75"
            }`}
            style={{
              borderRadius: BORDER_RADIUS.lg,
              boxShadow: SHADOWS.md,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor:
                      campaign.statistics.failed > 0
                        ? `${COLORS.brand.error}15`
                        : `${COLORS.neutral[300]}15`,
                  }}
                >
                  <XCircle
                    className="h-6 w-6"
                    style={{
                      color:
                        campaign.statistics.failed > 0
                          ? COLORS.brand.error
                          : COLORS.neutral[400],
                    }}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {campaign.statistics.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>{" "}
        {/* WhatsApp Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card
            className="border-0 py-0"
            style={{
              borderRadius: BORDER_RADIUS.lg,
              boxShadow: SHADOWS.sm,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <Avatar className="h-12 w-12 border-2 border-green-200 dark:border-green-800">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${campaign.whatsappUsername}&background=22C55E&color=fff`}
                  />
                  <AvatarFallback className="bg-green-500 text-white">
                    {campaign.whatsappUsername.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    WhatsApp Account
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {campaign.whatsappUsername}
                  </p>
                </div>
                <div className="ml-auto">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>{" "}
        {/* Campaign Content and Details with Modern Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div
              className="border-b mb-8"
              style={{ borderColor: `${COLORS.neutral[200]}` }}
            >
              <TabsList className="bg-transparent h-12 p-0 mb-0 w-full justify-start space-x-8">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none px-1 py-3 h-full bg-transparent text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  style={{
                    borderBottomColor: COLORS.brand.primary,
                    color:
                      activeTab === "overview"
                        ? COLORS.brand.primary
                        : undefined,
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="recipients"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none px-1 py-3 h-full bg-transparent text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  style={{
                    borderBottomColor: COLORS.brand.primary,
                    color:
                      activeTab === "recipients"
                        ? COLORS.brand.primary
                        : undefined,
                  }}
                >
                  <Users className="h-4 w-4" />
                  Recipients ({campaign.targetCustomers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="errors"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none px-1 py-3 h-full bg-transparent text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  style={{
                    borderBottomColor: COLORS.brand.primary,
                    color:
                      activeTab === "errors" ? COLORS.brand.primary : undefined,
                  }}
                >
                  <AlertCircle className="h-4 w-4" />
                  Errors
                  {campaign.errors?.length ? (
                    <span
                      className="ml-1 text-xs rounded-full px-2 py-0.5 font-medium"
                      style={{
                        backgroundColor: `${COLORS.brand.error}15`,
                        color: COLORS.brand.error,
                      }}
                    >
                      {campaign.errors.length}
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="overview">
              <Card
                className="border-0 py-0"
                style={{
                  borderRadius: BORDER_RADIUS.lg,
                  boxShadow: SHADOWS.sm,
                }}
              >
                <CardHeader
                  className="pb-4 border-b"
                  style={{ borderColor: `${COLORS.neutral[200]}` }}
                >
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${COLORS.brand.primary}15` }}
                    >
                      <MessageSquare
                        className="h-5 w-5"
                        style={{ color: COLORS.brand.primary }}
                      />
                    </div>
                    Campaign Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  {/* Message Content */}
                  <div
                    className="p-6 border"
                    style={{
                      backgroundColor: COLORS.background.muted,
                      borderColor: `${COLORS.neutral[200]}`,
                      borderRadius: BORDER_RADIUS.lg,
                    }}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 text-base leading-relaxed">
                          {campaign.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Media Content (if any) */}
                  {campaign.imageUrl && (
                    <div
                      className="p-6 border"
                      style={{
                        background: COLORS.gradients.cool,
                        borderColor: `${COLORS.brand.accent}30`,
                        borderRadius: BORDER_RADIUS.lg,
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="p-2 rounded-full"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                          }}
                        >
                          <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-lg text-white">
                          Campaign Media
                        </h3>
                      </div>

                      <div
                        className="bg-white p-3 border overflow-hidden"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          borderRadius: BORDER_RADIUS.lg,
                          boxShadow: SHADOWS.md,
                        }}
                      >
                        <div className="relative overflow-hidden rounded-md max-w-lg mx-auto">
                          <img
                            src={campaign.imageUrl}
                            alt="Campaign media"
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                        </div>

                        <div className="mt-3 flex justify-end">
                          <a
                            href={campaign.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer hover:scale-105 transform duration-200"
                            style={{
                              backgroundColor: `${COLORS.brand.primary}15`,
                              color: COLORS.brand.primary,
                              borderRadius: BORDER_RADIUS.md,
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Image
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campaign Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Timeline
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Created:
                          </span>
                          <span className="font-medium">
                            {formatDate(campaign.createdAt)}
                          </span>
                        </div>
                        {campaign.startedAt && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400">
                              Started:
                            </span>
                            <span className="font-medium">
                              {formatDate(campaign.startedAt)}
                            </span>
                          </div>
                        )}
                        {campaign.completedAt && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400">
                              Completed:
                            </span>
                            <span className="font-medium">
                              {formatDate(campaign.completedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Performance Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Success Rate:
                          </span>
                          <span
                            className="font-semibold"
                            style={{ color: COLORS.brand.success }}
                          >
                            {campaign.statistics.successRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Delivery Rate:
                          </span>
                          <span className="font-medium">
                            {campaign.statistics.totalTargets
                              ? Math.round(
                                  (campaign.statistics.delivered /
                                    campaign.statistics.totalTargets) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Avg. Delivery Time:
                          </span>
                          <span className="font-medium">~10 seconds</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>{" "}
            <TabsContent value="recipients">
              <Card
                className="border-0 py-0"
                style={{
                  borderRadius: BORDER_RADIUS.lg,
                  boxShadow: SHADOWS.sm,
                }}
              >
                <CardHeader
                  className="pb-4 border-b"
                  style={{ borderColor: `${COLORS.neutral[200]}` }}
                >
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${COLORS.brand.primary}15` }}
                    >
                      <Users
                        className="h-5 w-5"
                        style={{ color: COLORS.brand.primary }}
                      />
                    </div>
                    Campaign Recipients ({campaign.targetCustomers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead
                          className="border-b"
                          style={{
                            backgroundColor: COLORS.background.secondary,
                            borderColor: `${COLORS.neutral[200]}`,
                          }}
                        >
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Name
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Phone Number
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                              Timestamp
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className="divide-y"
                          style={{ borderColor: `${COLORS.neutral[200]}` }}
                        >
                          {campaign.targetCustomers.map((customer, idx) => (
                            <tr
                              key={`${customer.phoneNumber}-${idx}`}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="px-6 py-4 font-medium">
                                {customer.name || "N/A"}
                              </td>
                              <td className="px-6 py-4 font-mono">
                                {customer.phoneNumber}
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="outline"
                                  className={
                                    customer.status === "delivered"
                                      ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                                      : customer.status === "sent"
                                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                      : customer.status === "failed"
                                      ? "border-red-600 bg-red-50 dark:bg-red-900/20"
                                      : customer.status === "pending"
                                      ? "border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
                                      : "border-gray-600 bg-gray-50 dark:bg-gray-900/20"
                                  }
                                  style={{
                                    color:
                                      customer.status === "delivered"
                                        ? COLORS.brand.success
                                        : customer.status === "sent"
                                        ? COLORS.brand.primary
                                        : customer.status === "failed"
                                        ? COLORS.brand.error
                                        : customer.status === "pending"
                                        ? COLORS.brand.warning
                                        : COLORS.neutral[500],
                                  }}
                                >
                                  {customer.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                {customer.deliveredAt
                                  ? formatDate(customer.deliveredAt)
                                  : customer.sentAt
                                  ? formatDate(customer.sentAt)
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
                <CardFooter
                  className="text-sm text-gray-500 dark:text-gray-400 border-t p-6"
                  style={{ borderColor: `${COLORS.neutral[200]}` }}
                >
                  Showing {campaign.targetCustomers.length} recipients
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="errors">
              <Card
                className="border-0 py-0"
                style={{
                  borderRadius: BORDER_RADIUS.lg,
                  boxShadow: SHADOWS.sm,
                }}
              >
                <CardHeader
                  className="pb-4 border-b"
                  style={{ borderColor: `${COLORS.neutral[200]}` }}
                >
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${COLORS.brand.error}15` }}
                    >
                      <AlertCircle
                        className="h-5 w-5"
                        style={{ color: COLORS.brand.error }}
                      />
                    </div>
                    Campaign Errors
                    {campaign.errors?.length ? (
                      <span
                        className="ml-2 text-sm rounded-full px-2 py-1 font-medium"
                        style={{
                          backgroundColor: `${COLORS.brand.error}15`,
                          color: COLORS.brand.error,
                        }}
                      >
                        {campaign.errors.length}
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {campaign.errors && campaign.errors.length > 0 ? (
                    <div className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead
                            className="border-b"
                            style={{
                              backgroundColor: COLORS.background.secondary,
                              borderColor: `${COLORS.neutral[200]}`,
                            }}
                          >
                            <tr>
                              <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Phone Number
                              </th>
                              <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Error Message
                              </th>
                              <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                                Time
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className="divide-y"
                            style={{ borderColor: `${COLORS.neutral[200]}` }}
                          >
                            {campaign.errors.map((error, idx) => (
                              <tr
                                key={`${error.phoneNumber}-${idx}`}
                                className="hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                              >
                                <td className="px-6 py-4 font-mono">
                                  {error.phoneNumber}
                                </td>
                                <td
                                  className="px-6 py-4"
                                  style={{ color: COLORS.brand.error }}
                                >
                                  {error.error}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                  {formatDate(error.timestamp)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.brand.success}15` }}
                      >
                        <CheckCircle
                          className="h-8 w-8"
                          style={{ color: COLORS.brand.success }}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Errors Reported
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This campaign hasn't encountered any errors yet. All
                        messages are being processed successfully.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </SharedDashboardLayout>
  );
}
