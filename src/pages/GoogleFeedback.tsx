import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  MessageSquare,
  Star,
  Plus,
  Search,
  Download,
  Eye,
  QrCode,
  ThumbsUp,
  FileText,
  Layout,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";

interface FeedbackTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  dimensions: { width: number; height: number };
  isPopular: boolean;
  icon: React.ReactNode;
  color: string;
}

export default function GoogleFeedback() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Feedback design templates
  const mockTemplates: FeedbackTemplate[] = [
    {
      id: "1",
      name: "Google Review Request Card",
      description: "Professional card to request Google reviews from customers",
      category: "Review Request",
      dimensions: { width: 1080, height: 1080 },
      isPopular: true,
      icon: <Star className="h-6 w-6" />,
      color: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      id: "2",
      name: "5-Star Thank You Card",
      description: "Thank you card for customers who left 5-star reviews",
      category: "Thank You",
      dimensions: { width: 1200, height: 800 },
      isPopular: true,
      icon: <ThumbsUp className="h-6 w-6" />,
      color: "bg-green-50 dark:bg-green-900/20",
    },
    {
      id: "3",
      name: "Feedback QR Code Poster",
      description: "Poster with QR code linking to review platforms",
      category: "QR Code",
      dimensions: { width: 800, height: 1200 },
      isPopular: false,
      icon: <QrCode className="h-6 w-6" />,
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "4",
      name: "Review Response Template",
      description: "Professional template for responding to reviews",
      category: "Response",
      dimensions: { width: 1080, height: 1350 },
      isPopular: true,
      icon: <MessageSquare className="h-6 w-6" />,
      color: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "5",
      name: "Customer Survey Card",
      description: "Survey card to gather customer feedback",
      category: "Survey",
      dimensions: { width: 1080, height: 1920 },
      isPopular: false,
      icon: <FileText className="h-6 w-6" />,
      color: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      id: "6",
      name: "Review Incentive Flyer",
      description: "Flyer offering incentives for leaving reviews",
      category: "Incentive",
      dimensions: { width: 1080, height: 1080 },
      isPopular: true,
      icon: <Layout className="h-6 w-6" />,
      color: "bg-pink-50 dark:bg-pink-900/20",
    },
  ];

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "Review Request", label: "Review Requests" },
    { value: "Thank You", label: "Thank You Cards" },
    { value: "QR Code", label: "QR Code Designs" },
    { value: "Response", label: "Response Templates" },
    { value: "Survey", label: "Surveys" },
    { value: "Incentive", label: "Incentive Offers" },
  ];

  const stats = {
    totalTemplates: 24,
    popularTemplates: 8,
    categories: 6,
    downloads: 1250,
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = (templateId?: string) => {
    if (templateId) {
      navigate(`/editor?template=${templateId}&type=feedback`);
    } else {
      navigate("/editor?type=feedback");
    }
    toast.success("Opening feedback template designer...");
  };

  const handleUseTemplate = (template: FeedbackTemplate) => {
    navigate(
      `/editor?width=${template.dimensions.width}&height=${template.dimensions.height}&type=feedback`
    );
    toast.success(`Creating ${template.name.toLowerCase()}...`);
  };

  return (
    <SharedDashboardLayout
      title="Google Feedback Templates"
      description="Create professional templates for customer feedback and review management"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Templates
            </CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Feedback design templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Popular Templates
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.popularTemplates}</div>
            <p className="text-xs text-muted-foreground">Most used designs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">Template categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.downloads}</div>
            <p className="text-xs text-muted-foreground">Total downloads</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search feedback templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <Button
          onClick={() => handleCreateTemplate()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Custom
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <MessageSquare className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">No templates found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery || selectedCategory !== "all"
              ? "No templates match your current filters."
              : "No feedback templates available yet."}
          </p>
          <Button
            onClick={() => handleCreateTemplate()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full">
                <CardContent className="p-6">
                  <div
                    className={`aspect-video ${template.color} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}
                  >
                    <div className="text-blue-600 dark:text-blue-400">
                      {template.icon}
                    </div>
                    {template.isPopular && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{template.category}</span>
                    <span>
                      {template.dimensions.width}×{template.dimensions.height}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </SharedDashboardLayout>
  );
}
