import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search,
  Bell,
  Home,
  Clock,
  Layout,
  MessageSquare,
  Tag,
  Award,
  CreditCard,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { templateService, Template } from "@/services/templateService";
import {
  Sidebar as UISidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { IconArrowLeft, IconBrandTabler } from "@tabler/icons-react";
import axios from "axios";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
  description = "Manage your designs and templates",
}: DashboardLayoutProps) {
  const { user, logout, userLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    designTemplates: any[];
    publicTemplates: Template[];
    userTemplates: Template[];
  }>({
    designTemplates: [],
    publicTemplates: [],
    userTemplates: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Design templates for search
  const designTemplates = [
    {
      id: 1,
      title: "Blank Design",
      icon: <Layout className="h-4 w-4" />,
      color: "bg-white dark:bg-neutral-800",
      textColor: "text-blue-600 dark:text-blue-400",
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: "rgb(255, 255, 255)",
    },
    // Add more design templates as needed
  ];

  // Enhanced sidebar links with new sections
  const sidebarLinks = [
    {
      label: "Home",
      href: "/dashboard",
      icon: (
        <Home className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Recent Work",
      href: "/recent-work",
      icon: (
        <Clock className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Templates",
      href: "/templates",
      icon: (
        <Layout className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Google Feedback",
      href: "/google-feedback",
      icon: (
        <MessageSquare className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Coupon Designer",
      href: "/coupon-designer",
      icon: (
        <Tag className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Royalty Program",
      href: "/royalty-program",
      icon: (
        <Award className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Membership Card",
      href: "/membership-card",
      icon: (
        <CreditCard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: (
        <Star className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  // Search functionality
  const fetchSearchResults = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults({
          designTemplates: [],
          publicTemplates: [],
          userTemplates: [],
        });
        setShowSearchDropdown(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setShowSearchDropdown(true);

      try {
        // Filter design templates
        const filteredDesignTemplates = designTemplates.filter((template) =>
          template.title.toLowerCase().includes(keyword.toLowerCase())
        );

        // Fetch public templates
        let publicApiUrl =
          "https://adstudioserver.foodyqueen.com/api/templates";
        const publicParams = new URLSearchParams();
        publicParams.append("ps", "6");
        publicParams.append("pi", "0");
        publicParams.append("isPublic", "true");
        publicParams.append("kw", keyword);
        publicApiUrl += `?${publicParams.toString()}`;

        const publicResponse = await axios.get(publicApiUrl);
        const publicSearchResults =
          publicResponse.data.data || publicResponse.data || [];

        // Fetch user templates
        let userSearchResults: Template[] = [];
        if (user?.userId) {
          let userApiUrl =
            "https://adstudioserver.foodyqueen.com/api/templates";
          const userParams = new URLSearchParams();
          userParams.append("ps", "4");
          userParams.append("pi", "0");
          userParams.append("userId", user.userId);
          userParams.append("onlyMine", "true");
          userParams.append("kw", keyword);
          userApiUrl += `?${userParams.toString()}`;

          const userResponse = await axios.get(userApiUrl);
          userSearchResults = userResponse.data.data || userResponse.data || [];
        }

        setSearchResults({
          designTemplates: filteredDesignTemplates,
          publicTemplates: publicSearchResults,
          userTemplates: userSearchResults,
        });
      } catch (error) {
        console.error("Error fetching search results:", error);
        toast.error("Failed to search templates");
      } finally {
        setIsSearching(false);
      }
    },
    [user?.userId, designTemplates]
  );

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchSearchResults]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreateNew = () => {
    navigate("/editor");
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`/editor?template=${templateId}`);
  };

  return (
    <div className="flex h-screen w-full flex-1 overflow-hidden bg-white dark:bg-neutral-900">
      {/* Sidebar */}
      <UISidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex items-center space-x-2 py-1">
              <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3] dark:bg-[#0070f3]" />
              <span className="font-medium whitespace-pre text-black dark:text-white">
                Ads Studio
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={{
                    ...link,
                    className:
                      location.pathname === link.href
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "",
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: userLoading ? "Loading..." : user?.name || "User",
                href: "#",
                onClick: logout,
                icon: userLoading ? (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-[#0070f3] border-r-transparent"></div>
                  </div>
                ) : user ? (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage
                      src={user?.logo || "https://github.com/shadcn.png"}
                      alt="User"
                      loading="lazy"
                    />
                    <AvatarFallback>
                      {user?.name
                        ? user.name.substring(0, 2).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </UISidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 px-6">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-[#0070f3]">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-bold">Ads Studio</span>
            </div>
            <div className="relative ml-6 w-64" ref={searchDropdownRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search all templates"
                className="w-full pl-10 pr-8 transition-all focus-visible:ring-blue-500 rounded-full bg-gray-100 dark:bg-gray-800 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    setShowSearchDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery) {
                    setShowSearchDropdown(true);
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-neutral-500">
                          Searching...
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Search results content */}
                        {searchResults.designTemplates.length === 0 &&
                          searchResults.publicTemplates.length === 0 &&
                          searchResults.userTemplates.length === 0 &&
                          searchQuery && (
                            <div className="p-4 text-center">
                              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                No results found for "{searchQuery}"
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Try a different search term
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.logo || "https://github.com/shadcn.png"}
                alt="User"
                loading="lazy"
              />
              <AvatarFallback>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
