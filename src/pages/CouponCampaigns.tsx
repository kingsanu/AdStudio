/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Percent,
  Users,
  TrendingUp,
  BarChart3,
  Search,
  RefreshCw,
  MoreVertical,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SharedDashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  couponCampaignService,
  CouponCampaign,
  CouponCampaignStatisticsOverview,
} from "@/services/couponCampaignService";

export default function CouponCampaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CouponCampaign[]>([]);
  const [statistics, setStatistics] =
    useState<CouponCampaignStatisticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Function to fetch data
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
        const campaignsResponse =
          await couponCampaignService.getCouponCampaigns({
            userId: user.userId,
            ...(statusFilter && { status: statusFilter }),
          });

        if (campaignsResponse.success) {
          setCampaigns(campaignsResponse.data);
        }

        // Fetch statistics
        const statsResponse =
          await couponCampaignService.getCouponCampaignStatistics({
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
    [user?.userId, statusFilter]
  );

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle manual refresh
  const handleRefresh = () => {
    fetchData(false);
  };

  // Handle creating new campaign
  const handleNewCampaign = () => {
    navigate("/editor?isCoupon=true");
  };

  // Handle viewing campaign details
  const handleViewCampaign = (campaignId: string) => {
    navigate(`/coupon-campaigns/${campaignId}`);
  };

  // Handle editing campaign
  const handleEditCampaign = (campaignId: string) => {
    // Navigate to editor with campaign data
    navigate(`/editor?isCoupon=true&campaignId=${campaignId}`);
  };

  // Handle deleting campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const response = await couponCampaignService.deleteCouponCampaign(
        campaignId
      );

      if (response.success) {
        toast.success("Campaign deleted successfully");
        // Refresh data
        fetchData(false);
      } else {
        toast.error("Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  // Helper function to get status color
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

  return (
    <SharedDashboardLayout
      title="Coupon Campaigns"
      description="Manage your coupon campaigns and track their performance"
    >
      <div className="p-6 mx-auto">
        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={handleNewCampaign}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Campaign
          </Button>
        </div>

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
                      <Tag className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Campaigns
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statistics.activeCampaigns}
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
                      <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Coupons
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statistics.totalCouponsGenerated.toLocaleString()}
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
                        Usage Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statistics.averageUsageRate}%
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
                placeholder="Search by campaign name or description..."
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
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="completed">Completed</option>
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
                  className="text-gray-600 dark:text-gray-400"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={`loading-${index}`} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="flex gap-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
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
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {campaign.campaignName}
                            </h3>
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
                                Until {formatDate(campaign.validity)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Created {formatDate(campaign.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>
                                {campaign.statistics.usageRate}% usage rate
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCampaign(campaign._id)}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
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
                                onClick={() => handleEditCampaign(campaign._id)}
                                className="text-indigo-600 dark:text-indigo-400"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteCampaign(campaign._id)
                                }
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Campaign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-800/30 rounded-full animate-ping opacity-30"></div>
                    <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md">
                      <Tag className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {searchQuery || statusFilter
                      ? "No matching campaigns"
                      : "No coupon campaigns yet"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                    {searchQuery || statusFilter
                      ? "Try adjusting your search criteria or filters to find campaigns."
                      : "Create your first coupon campaign to start distributing discount coupons to your customers."}
                  </p>
                  {!searchQuery && !statusFilter && (
                    <Button
                      onClick={handleNewCampaign}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create First Campaign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SharedDashboardLayout>
  );
}
