import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Edit,
  Download,
  Copy,
  Trash2,
  Eye,
  QrCode,
  Palette,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SharedDashboardLayout from "@/components/layout/SharedDashboardLayout";

interface MembershipCard {
  id: string;
  name: string;
  description: string;
  design: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  qrCodeEnabled: boolean;
  isActive: boolean;
  membersCount: number;
  createdAt: string;
  lastModified: string;
}

export default function MembershipCard() {
  const navigate = useNavigate();
  const [membershipCards, setMembershipCards] = useState<MembershipCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockCards: MembershipCard[] = [
    {
      id: "1",
      name: "VIP Gold Card",
      description: "Premium membership card for VIP customers",
      design: "premium",
      backgroundColor: "#FFD700",
      textColor: "#000000",
      qrCodeEnabled: true,
      isActive: true,
      membersCount: 245,
      createdAt: "2024-01-15",
      lastModified: "2024-01-20",
    },
    {
      id: "2",
      name: "Silver Member Card",
      description: "Standard membership card for regular customers",
      design: "classic",
      backgroundColor: "#C0C0C0",
      textColor: "#000000",
      qrCodeEnabled: true,
      isActive: true,
      membersCount: 892,
      createdAt: "2024-01-10",
      lastModified: "2024-01-18",
    },
    {
      id: "3",
      name: "Student Discount Card",
      description: "Special card for student members",
      design: "modern",
      backgroundColor: "#4F46E5",
      textColor: "#FFFFFF",
      qrCodeEnabled: false,
      isActive: false,
      membersCount: 156,
      createdAt: "2024-01-05",
      lastModified: "2024-01-15",
    },
  ];

  const cardTemplates = [
    {
      id: "template-1",
      name: "Classic Business",
      description: "Professional design for business memberships",
      preview: "bg-gradient-to-r from-blue-600 to-blue-800",
    },
    {
      id: "template-2",
      name: "Modern Minimal",
      description: "Clean and modern card design",
      preview: "bg-gradient-to-r from-gray-800 to-gray-900",
    },
    {
      id: "template-3",
      name: "Premium Gold",
      description: "Luxury design for premium members",
      preview: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    },
    {
      id: "template-4",
      name: "Vibrant Colors",
      description: "Colorful design for creative businesses",
      preview: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
  ];

  const stats = {
    totalTemplates: 12,
    popularTemplates: 4,
    categories: 4,
    downloads: 567,
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMembershipCards(mockCards);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCreateCard = (templateId?: string) => {
    if (templateId) {
      navigate(`/editor?template=${templateId}&type=membership-card`);
    } else {
      navigate("/editor?type=membership-card");
    }
    toast.success("Opening membership card designer...");
  };

  const handleEditCard = (cardId: string) => {
    navigate(`/editor?membership-card=${cardId}`);
    toast.info("Opening card editor...");
  };

  const handleDuplicateCard = (card: MembershipCard) => {
    toast.success(`Duplicating "${card.name}"...`);
    // Implement duplication logic
  };

  const handleDeleteCard = (cardId: string) => {
    if (
      window.confirm("Are you sure you want to delete this membership card?")
    ) {
      setMembershipCards(membershipCards.filter((c) => c.id !== cardId));
      toast.success("Membership card deleted successfully");
    }
  };

  const handleToggleActive = (cardId: string) => {
    setMembershipCards(
      membershipCards.map((c) =>
        c.id === cardId ? { ...c, isActive: !c.isActive } : c
      )
    );
    toast.success("Card status updated");
  };

  const handleDownloadCard = (card: MembershipCard) => {
    toast.success(`Downloading "${card.name}"...`);
    // Implement download logic
  };

  const handlePreviewCard = (card: MembershipCard) => {
    toast.info(`Previewing "${card.name}"...`);
    // Implement preview logic
  };

  const handleGenerateQR = (card: MembershipCard) => {
    toast.success("Generating QR codes for members...");
    // Implement QR code generation
  };

  return (
    <SharedDashboardLayout
      title="Membership Card Templates"
      description="Create professional membership card designs for your business"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Templates
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Membership card designs
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
            <QrCode className="h-4 w-4 text-muted-foreground" />
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

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Start</h2>
          <Button
            onClick={() => handleCreateCard()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Card
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4">
                <div
                  className={`aspect-[1.6/1] ${template.preview} rounded-lg mb-3 flex items-center justify-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10"></div>
                  <CreditCard className="h-8 w-8 text-white relative z-10" />
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                    MEMBER
                  </div>
                  <div className="absolute bottom-2 right-2 text-white text-xs">
                    ****
                  </div>
                </div>
                <h3 className="font-medium mb-1">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {template.description}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCreateCard(template.id)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Existing Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Membership Cards</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : membershipCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <CreditCard className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">
              No membership cards yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create your first membership card to start building customer
              loyalty.
            </p>
            <Button
              onClick={() => handleCreateCard()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Card
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membershipCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Card Preview */}
                    <div
                      className="aspect-[1.6/1] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: card.backgroundColor }}
                    >
                      <div className="absolute inset-0 bg-black/5"></div>
                      <CreditCard
                        className="h-8 w-8 relative z-10"
                        style={{ color: card.textColor }}
                      />
                      <div
                        className="absolute bottom-2 left-2 text-xs font-medium"
                        style={{ color: card.textColor }}
                      >
                        {card.name.toUpperCase()}
                      </div>
                      {card.qrCodeEnabled && (
                        <div className="absolute top-2 right-2">
                          <QrCode
                            className="h-4 w-4"
                            style={{ color: card.textColor }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{card.name}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                card.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                              }`}
                            >
                              {card.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {card.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {card.membersCount} members
                            </span>
                            {card.qrCodeEnabled && (
                              <span className="flex items-center gap-1">
                                <QrCode className="h-4 w-4" />
                                QR enabled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCard(card.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewCard(card)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateCard(card)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadCard(card)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {card.qrCodeEnabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateQR(card)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(card.id)}
                        >
                          {card.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
