/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { motion } from "motion/react";
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
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    if (!campaign) return "bg-gray-300 dark:bg-gray-700";

    const { status } = campaign;

    if (status === "completed") return "bg-green-500";
    if (status === "failed") return "bg-red-500";
    if (status === "running") return "bg-blue-500";
    if (status === "pending") return "bg-yellow-500";
    return "bg-gray-300 dark:bg-gray-700";
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
      description={`Campaign details and performance metrics`}
    >
      <div className="space-y-6">
        {/* Navigation and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/whatsapp-campaigns")}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCampaign(false)}
              disabled={isRefreshing}
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
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Repeat className="mr-2 h-4 w-4" />
                Retry Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Campaign Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl">
                  {campaign.campaignName}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Created {formatDate(campaign.createdAt)}
                </p>
              </div>
              <Badge
                className={campaignService.getStatusColor(campaign.status)}
              >
                {campaign.status === "running" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  campaignService.getStatusIcon(campaign.status) + " "
                )}
                {campaign.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campaign Progress */}
            <div>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                <span>{getCampaignProgressStatus()}</span>
                {campaign.status === "running" && (
                  <span>{getCampaignProgress()}%</span>
                )}
              </div>
              <Progress
                value={getCampaignProgress()}
                max={100}
                className="h-2 bg-gray-100 dark:bg-gray-800"
                indicatorClassName={getProgressColor()}
              />
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span>Recipients</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.statistics.totalTargets}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Send className="h-4 w-4" />
                  <span>Sent</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.statistics.sent}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Delivered</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.statistics.delivered}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <XCircle className="h-4 w-4" />
                  <span>Failed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.statistics.failed}
                </p>
              </div>
            </div>

            {/* WhatsApp Account Info */}
            <div className="flex items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="mr-3">
                <Avatar className="h-10 w-10 border border-green-200 dark:border-green-800">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${campaign.whatsappUsername}&background=22C55E&color=fff`}
                  />
                  <AvatarFallback className="bg-green-500 text-white">
                    {campaign.whatsappUsername.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  WhatsApp Account
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {campaign.whatsappUsername}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Content and Details */}
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="border-b border-gray-200 dark:border-gray-800">
            <TabsList className="bg-transparent h-12 p-0 mb-0 w-full justify-start space-x-6">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-1 py-3 h-full bg-transparent text-gray-600 dark:text-gray-400 font-medium data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
              >
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="recipients"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-1 py-3 h-full bg-transparent text-gray-600 dark:text-gray-400 font-medium data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
              >
                <Users className="h-4 w-4" />
                Recipients
              </TabsTrigger>
              <TabsTrigger
                value="errors"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-1 py-3 h-full bg-transparent text-gray-600 dark:text-gray-400 font-medium data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
              >
                <AlertCircle className="h-4 w-4" />
                Errors
                {campaign.errors?.length ? (
                  <span className="ml-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full px-2 py-0.5 font-medium">
                    {campaign.errors.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-6">
            <TabsContent value="overview">
              <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-500" />
                    Campaign Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Message Content */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-800 shadow-inner">
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
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                          <ImageIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="font-medium text-base text-indigo-800 dark:text-indigo-300">
                          Campaign Media
                        </h3>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                            className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-md transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Image
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campaign Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Timestamps
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Created:
                          </span>
                          <span className="font-medium">
                            {formatDate(campaign.createdAt)}
                          </span>
                        </li>
                        {campaign.startedAt && (
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Started:
                            </span>
                            <span className="font-medium">
                              {formatDate(campaign.startedAt)}
                            </span>
                          </li>
                        )}
                        {campaign.completedAt && (
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Completed:
                            </span>
                            <span className="font-medium">
                              {formatDate(campaign.completedAt)}
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Performance
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Success Rate:
                          </span>
                          <span className="font-medium">
                            {campaign.statistics.successRate}%
                          </span>
                        </li>
                        <li className="flex justify-between">
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
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Average Delivery Time:
                          </span>
                          <span className="font-medium">~10 seconds</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                            Phone Number
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {campaign.targetCustomers.map((customer, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-4 py-3">
                              {customer.name || "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              {customer.phoneNumber}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={
                                  customer.status === "delivered"
                                    ? "text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20"
                                    : customer.status === "sent"
                                    ? "text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : customer.status === "failed"
                                    ? "text-red-600 border-red-600 bg-red-50 dark:bg-red-900/20"
                                    : customer.status === "pending"
                                    ? "text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
                                    : "text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-900/20"
                                }
                              >
                                {customer.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
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
                </CardContent>
                <CardFooter className="text-sm text-gray-500 dark:text-gray-400 border-t p-4">
                  Showing {campaign.targetCustomers.length} recipients
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaign.errors && campaign.errors.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                              Phone Number
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                              Error
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {campaign.errors.map((error, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <td className="px-4 py-3">{error.phoneNumber}</td>
                              <td className="px-4 py-3 text-red-600">
                                {error.error}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {formatDate(error.timestamp)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Errors Reported
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This campaign hasn't encountered any errors yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </SharedDashboardLayout>
  );
}
