/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Edit,
  Copy,
  Trash2,
  Download,
  Eye,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";

interface Coupon {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function CouponDesigner() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockCoupons: Coupon[] = [
    {
      id: "1",
      title: "Summer Special",
      description: "Get 20% off on all summer items",
      discountType: "percentage",
      discountValue: 20,
      expiryDate: "2024-08-31",
      usageLimit: 100,
      usedCount: 45,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      title: "New Customer Discount",
      description: "$10 off your first order",
      discountType: "fixed",
      discountValue: 10,
      expiryDate: "2024-12-31",
      usageLimit: 500,
      usedCount: 123,
      isActive: true,
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      title: "Weekend Deal",
      description: "15% off weekend orders",
      discountType: "percentage",
      discountValue: 15,
      expiryDate: "2024-06-30",
      usageLimit: 200,
      usedCount: 89,
      isActive: false,
      createdAt: "2024-01-05",
    },
  ];

  const stats = {
    totalCoupons: 12,
    activeCoupons: 8,
    totalRedemptions: 456,
    totalSavings: 2340,
  };

  const couponTemplates = [
    {
      id: "template-1",
      name: "Classic Discount",
      description: "Traditional coupon design with bold text",
      thumbnail: "/coupon-templates/classic.jpg",
    },
    {
      id: "template-2",
      name: "Modern Minimal",
      description: "Clean and modern coupon design",
      thumbnail: "/coupon-templates/modern.jpg",
    },
    {
      id: "template-3",
      name: "Festive Special",
      description: "Colorful design for special occasions",
      thumbnail: "/coupon-templates/festive.jpg",
    },
    {
      id: "template-4",
      name: "Restaurant Style",
      description: "Perfect for food and restaurant coupons",
      thumbnail: "/coupon-templates/restaurant.jpg",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCoupons(mockCoupons);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCreateCoupon = (templateId?: string) => {
    if (templateId) {
      navigate(`/editor?template=${templateId}&isCoupon=true`);
    } else {
      navigate("/editor?isCoupon=true");
    }
    toast.success("Opening coupon designer...");
  };

  const handleEditCoupon = (couponId: string) => {
    navigate(`/editor?coupon=${couponId}`);
    toast.info("Opening coupon editor...");
  };

  const handleDuplicateCoupon = (coupon: Coupon) => {
    toast.success(`Duplicating "${coupon.title}"...`);
    // Implement duplication logic
  };

  const handleDeleteCoupon = (couponId: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      setCoupons(coupons.filter((c) => c.id !== couponId));
      toast.success("Coupon deleted successfully");
    }
  };

  const handleToggleActive = (couponId: string) => {
    setCoupons(
      coupons.map((c) =>
        c.id === couponId ? { ...c, isActive: !c.isActive } : c
      )
    );
    toast.success("Coupon status updated");
  };

  const handleDownloadCoupon = (coupon: Coupon) => {
    toast.success(`Downloading "${coupon.title}"...`);
    // Implement download logic
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <SharedDashboardLayout
      title="Coupon Designer"
      description="Create, manage, and track your promotional coupons"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCoupons} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Coupons
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeCoupons}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.activeCoupons / stats.totalCoupons) * 100)}% of
              total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Redemptions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRedemptions}</div>
            <p className="text-xs text-muted-foreground">Across all coupons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSavings}</div>
            <p className="text-xs text-muted-foreground">
              Customer savings generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Start</h2>
          <Button
            onClick={() => handleCreateCoupon()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Coupon
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {couponTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4">
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-3 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium mb-1">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {template.description}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCreateCoupon(template.id)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Existing Coupons */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Coupons</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <Tag className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">No coupons yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create your first coupon to start offering discounts to your
              customers.
            </p>
            <Button
              onClick={() => handleCreateCoupon()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Coupon
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon, index) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{coupon.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              coupon.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </span>
                          {isExpired(coupon.expiryDate) && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {coupon.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            {coupon.discountType === "percentage" ? (
                              <Percent className="h-4 w-4 text-blue-600" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-green-600" />
                            )}
                            <span className="font-medium">
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}%`
                                : `$${coupon.discountValue}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(coupon.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Usage</span>
                            <span>
                              {coupon.usedCount}/{coupon.usageLimit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${getUsagePercentage(
                                  coupon.usedCount,
                                  coupon.usageLimit
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCoupon(coupon.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateCoupon(coupon)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCoupon(coupon)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(coupon.id)}
                      >
                        {coupon.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SharedDashboardLayout>
  );
}
