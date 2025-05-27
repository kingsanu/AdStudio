import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Award,
  TrendingUp,
  Gift,
  Star,
  Crown,
  Plus,
  Layout,
  CreditCard,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";

interface LoyaltyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  dimensions: { width: number; height: number };
  isPopular: boolean;
  icon: React.ReactNode;
  color: string;
}

export default function RoyaltyProgram() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<LoyaltyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Loyalty program design templates
  const mockTemplates: LoyaltyTemplate[] = [
    {
      id: "1",
      name: "Loyalty Card Design",
      description: "Professional loyalty card template with tier system",
      category: "Cards",
      dimensions: { width: 1080, height: 680 },
      isPopular: true,
      icon: <CreditCard className="h-6 w-6" />,
      color: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "2",
      name: "Points Reward Poster",
      description: "Eye-catching poster to promote your points system",
      category: "Posters",
      dimensions: { width: 800, height: 1200 },
      isPopular: true,
      icon: <Star className="h-6 w-6" />,
      color: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      id: "3",
      name: "VIP Member Certificate",
      description: "Elegant certificate for VIP members",
      category: "Certificates",
      dimensions: { width: 1200, height: 900 },
      isPopular: false,
      icon: <Crown className="h-6 w-6" />,
      color: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      id: "4",
      name: "Tier Upgrade Notification",
      description: "Congratulatory design for tier upgrades",
      category: "Notifications",
      dimensions: { width: 1080, height: 1080 },
      isPopular: true,
      icon: <TrendingUp className="h-6 w-6" />,
      color: "bg-green-50 dark:bg-green-900/20",
    },
    {
      id: "5",
      name: "Rewards Catalog Cover",
      description: "Professional cover for your rewards catalog",
      category: "Catalogs",
      dimensions: { width: 800, height: 1000 },
      isPopular: false,
      icon: <Gift className="h-6 w-6" />,
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "6",
      name: "Loyalty Program Flyer",
      description: "Promotional flyer for your loyalty program",
      category: "Flyers",
      dimensions: { width: 1080, height: 1350 },
      isPopular: true,
      icon: <Layout className="h-6 w-6" />,
      color: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "Cards", label: "Loyalty Cards" },
    { value: "Posters", label: "Posters" },
    { value: "Certificates", label: "Certificates" },
    { value: "Notifications", label: "Notifications" },
    { value: "Catalogs", label: "Catalogs" },
    { value: "Flyers", label: "Flyers" },
  ];

  const stats = {
    totalTemplates: 18,
    popularTemplates: 6,
    categories: 6,
    downloads: 890,
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
      navigate(`/editor?template=${templateId}&type=loyalty`);
    } else {
      navigate("/editor?type=loyalty");
    }
    toast.success("Opening loyalty program designer...");
  };

  const handleUseTemplate = (template: LoyaltyTemplate) => {
    navigate(
      `/editor?width=${template.dimensions.width}&height=${template.dimensions.height}&type=loyalty`
    );
    toast.success(`Creating ${template.name.toLowerCase()}...`);
  };

  return (
    <SharedDashboardLayout
      title="Loyalty Program Templates"
      description="Create professional designs for your customer loyalty program"
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
              Loyalty program designs
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
            <Award className="h-4 w-4 text-muted-foreground" />
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
          <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search loyalty templates..."
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
            <Award className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">No templates found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery || selectedCategory !== "all"
              ? "No templates match your current filters."
              : "No loyalty program templates available yet."}
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
                    <div className="text-purple-600 dark:text-purple-400">
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
