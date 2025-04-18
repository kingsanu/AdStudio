/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Star,
  Plus,
  Layout,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { templateService } from "@/services/templateService";
import { FavoriteTemplateWithDetails } from "@/models/FavoriteTemplate";
import { toast } from "sonner";

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteTemplateWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorite templates
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.userId) return;

      setIsLoading(true);
      try {
        const favoriteTemplates = await templateService.getFavoriteTemplates(
          user.userId
        );
        setFavorites(favoriteTemplates);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        toast.error("Failed to load favorite templates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.userId]);

  // Handle removing from favorites
  const handleRemoveFromFavorites = (templateId: string) => {
    if (!user?.userId) return;

    try {
      const success = templateService.removeFromFavorites(
        templateId,
        user.userId
      );
      if (success) {
        setFavorites((prev) =>
          prev.filter((fav) => fav.templateId !== templateId)
        );
        toast.success("Removed from favorites");
      } else {
        toast.error("Failed to remove from favorites");
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  // Handle using a template
  const handleUseTemplate = (templateId: string) => {
    navigate(`/editor?template=${templateId}`);
  };

  // Handle creating a new design
  const handleCreateNew = () => {
    toast.success("Creating new design");
    navigate("/editor");
  };

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Favorite Templates</h1>
            <p className="text-neutral-500 mt-1">
              Your saved templates for quick access
            </p>
          </div>
          <Button
            className="bg-[#0070f3] hover:bg-[#0060d3] text-white shadow-md hover:shadow-lg transition-all"
            onClick={handleCreateNew}
          >
            <Plus className="mr-2 h-4 w-4" /> Create new
          </Button>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  className="overflow-hidden shadow-md border-0 h-full"
                >
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="h-[180px] bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                    <div className="p-4 flex-1">
                      <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                      <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mb-3"></div>
                      <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded mt-auto"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : favorites.length > 0 ? (
          // Favorite templates
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map((favorite, index) => (
              <motion.div
                key={favorite.templateId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      <img
                        src={
                          favorite.thumbnailUrl
                            ? templateService.fixImageUrl(favorite.thumbnailUrl)
                            : "/placeholder.svg"
                        }
                        alt={favorite.title || "Template"}
                        className="w-full h-[180px] object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="flex gap-2"
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shadow-lg"
                            onClick={() =>
                              handleUseTemplate(favorite.templateId)
                            }
                          >
                            Use Template
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="shadow-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" />
                                <span>Share</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() =>
                                  handleRemoveFromFavorites(favorite.templateId)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Remove from favorites</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-yellow-400 bg-black/20 hover:bg-black/30"
                        onClick={() =>
                          handleRemoveFromFavorites(favorite.templateId)
                        }
                      >
                        <Star className="h-5 w-5 fill-yellow-400" />
                      </Button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-medium text-lg truncate">
                        {favorite.title || "Untitled Template"}
                      </h3>
                      <div className="flex items-center justify-between mt-2 mb-1">
                        <Badge
                          variant="outline"
                          className="bg-neutral-100 dark:bg-neutral-800 text-xs font-normal"
                        >
                          {favorite.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-500 line-clamp-2 mt-2">
                        {favorite.description || "No description available"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          // No favorites
          <div className="text-center py-16">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
              <Star className="h-10 w-10 text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              No favorite templates yet
            </h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">
              Star your favorite templates to access them quickly from this
              page.
            </p>
            <Button
              className="bg-[#0070f3] hover:bg-[#0060d3]"
              onClick={() => navigate("/dashboard")}
            >
              Browse templates
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
