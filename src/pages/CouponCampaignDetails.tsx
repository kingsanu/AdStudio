import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Tag,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Copy,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SharedDashboardLayout from "@/components/layout/DashboardLayout";
import {
  couponCampaignService,
  CouponCampaign,
  CouponCode,
} from "@/services/couponCampaignService";

export default function CouponCampaignDetails() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CouponCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCodes, setCouponCodes] = useState<{
    codes: CouponCode[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      total: number;
      used: number;
      unused: number;
    };
  }>({
    codes: [],
    pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    summary: { total: 0, used: 0, unused: 0 },
  });
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  const [codesPage, setCodesPage] = useState(1);

  // Fetch campaign data
  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;

    try {
      setIsLoading(true);
      const response = await couponCampaignService.getCouponCampaign(
        campaignId
      );

      if (response.success) {
        setCampaign(response.data);
      } else {
        toast.error("Campaign not found");
        navigate("/coupon-campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign details");
      navigate("/coupon-campaigns");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, navigate]);

  // Fetch coupon codes
  const fetchCouponCodes = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (!campaignId) return;

      try {
        setLoadingCodes(true);
        const response = await couponCampaignService.getCouponCodes(
          campaignId,
          {
            status: currentTab as "all" | "used" | "unused",
            page,
            limit: 50,
            sortBy: "generatedAt",
            sortOrder: "desc",
          }
        );

        if (response.success) {
          setCouponCodes((prev) => ({
            codes: append
              ? [...prev.codes, ...response.data.codes]
              : response.data.codes,
            pagination: response.data.pagination,
            summary: response.data.summary,
          }));
        }
      } catch (error) {
        console.error("Error fetching coupon codes:", error);
        toast.error("Failed to load coupon codes");
      } finally {
        setLoadingCodes(false);
      }
    },
    [campaignId, currentTab]
  );

  // Initial data load
  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Load codes when tab changes
  useEffect(() => {
    setCodesPage(1);
    fetchCouponCodes(1, false);
  }, [fetchCampaign, currentTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setCodesPage(1);
  };

  // Handle load more codes
  const handleLoadMore = () => {
    const nextPage = codesPage + 1;
    setCodesPage(nextPage);
    fetchCouponCodes(nextPage, true);
  };

  // Helper functions
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard!");
  };
  if (isLoading) {
    return (
      <SharedDashboardLayout
        title="Campaign Details"
        description="Loading campaign information..."
      >
        <div className="space-y-6">
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
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </SharedDashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <SharedDashboardLayout
        title="Campaign Not Found"
        description="The requested campaign could not be found"
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold mb-2">Campaign Not Found</h3>
          <p className="text-gray-600 mb-4">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/coupon-campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </SharedDashboardLayout>
    );
  }

  return (
    <SharedDashboardLayout
      title={campaign.campaignName}
      description={`Campaign Details • ${formatDate(campaign.createdAt)}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate("/coupon-campaigns")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>

        {/* Campaign Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-600" />
                Campaign Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Campaign Name
                </label>
                <p className="text-lg font-semibold">{campaign.campaignName}</p>
              </div>
              {campaign.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {campaign.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Discount
                  </label>
                  <p className="text-xl font-bold text-green-600">
                    {campaign.discountPercentage}% OFF
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Valid Until
                  </label>
                  <p className="font-medium">{formatDate(campaign.validity)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created
                  </label>
                  <p className="font-medium">
                    {formatDate(campaign.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {campaign.numberOfCoupons}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Coupons
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {campaign.statistics.totalUsed}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Used
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {campaign.numberOfCoupons - campaign.statistics.totalUsed}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remaining
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {campaign.statistics.usageRate}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Usage Rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupon Codes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Coupon Codes
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCouponCodes(1, false)}
                  disabled={loadingCodes}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loadingCodes ? "animate-spin" : ""
                    }`}
                  />
                  Refresh{" "}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={currentTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All Codes ({couponCodes.summary.total})
                </TabsTrigger>
                <TabsTrigger value="used">
                  Used ({couponCodes.summary.used})
                </TabsTrigger>
                <TabsTrigger value="unused">
                  Unused ({couponCodes.summary.unused})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={currentTab} className="space-y-4">
                {loadingCodes && couponCodes.codes.length === 0 ? (
                  <div className="text-center p-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-indigo-600" />
                    <p className="text-gray-600">Loading coupon codes...</p>
                  </div>
                ) : couponCodes.codes.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {couponCodes.codes.map((code, index) => (
                        <motion.div
                          key={`${code.code}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          className={`p-3 rounded-lg border ${
                            code.isUsed
                              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                              : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono font-semibold text-sm">
                                {code.code}
                              </p>
                              <p
                                className={`text-xs ${
                                  code.isUsed
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {code.isUsed ? "Used" : "Available"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {code.isUsed && code.usedBy && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <div>
                                Used by: {code.usedBy.customerName || "Unknown"}
                              </div>
                              {code.usedBy.phoneNumber && (
                                <div>Phone: {code.usedBy.phoneNumber}</div>
                              )}
                              {code.usedBy.usedAt && (
                                <div>
                                  Used on: {formatDate(code.usedBy.usedAt)}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {couponCodes.pagination.pages > 1 && (
                      <div className="flex justify-between items-center mt-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {couponCodes.codes.length} of{" "}
                          {couponCodes.pagination.total} codes
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              fetchCouponCodes(codesPage - 1, false)
                            }
                            disabled={codesPage <= 1 || loadingCodes}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {codesPage} of {couponCodes.pagination.pages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              fetchCouponCodes(codesPage + 1, false)
                            }
                            disabled={
                              codesPage >= couponCodes.pagination.pages ||
                              loadingCodes
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <div className="mb-4">
                      {currentTab === "used" ? (
                        <XCircle className="h-12 w-12 mx-auto text-red-400" />
                      ) : currentTab === "unused" ? (
                        <CheckCircle className="h-12 w-12 mx-auto text-green-400" />
                      ) : (
                        <Tag className="h-12 w-12 mx-auto text-gray-400" />
                      )}
                    </div>
                    <p>
                      {currentTab === "used"
                        ? "No used coupon codes found"
                        : currentTab === "unused"
                        ? "No unused coupon codes found"
                        : "No coupon codes found"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </SharedDashboardLayout>
  );
}
