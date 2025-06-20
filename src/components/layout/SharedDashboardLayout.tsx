/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bell,
  Star,
  MessageSquare,
  Tag,
  Award,
  Layout,
  Clock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS } from "@/constants/styles";
import {
  Sidebar as UISidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { IconArrowLeft, IconBrandTabler } from "@tabler/icons-react";

interface SharedDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function SharedDashboardLayout({
  children,
  title,
  description,
}: Readonly<SharedDashboardLayoutProps>) {
  const { user, logout, userLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount] = useState(3);

  const sidebarLinks = [
    {
      label: "Home",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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
      label: "WhatsApp Campaigns",
      href: "/whatsapp-campaigns",
      icon: (
        <MessageSquare className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Coupon Campaigns",
      href: "/coupon-campaigns",
      icon: (
        <Tag className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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

  return (
    <div className="flex h-screen w-full flex-1 bg-white dark:bg-neutral-900">
      {/* Sidebar */}
      <UISidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex items-center space-x-3 py-2">
              <div className="relative flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
              </div>
              {sidebarOpen && (
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-lg text-black dark:text-white tracking-tight truncate">
                    AdStudio
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 -mt-0.5 truncate">
                    Design Platform
                  </span>
                </div>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={
                    location.pathname === link.href
                      ? "bg-blue-50 dark:bg-blue-900/20 rounded-md"
                      : ""
                  }
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
        <header className="flex h-16 items-center justify-between border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-6 sticky top-0 z-40">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>

            {!userLoading && user && (
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.logo ?? "https://github.com/shadcn.png"}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main
          className="flex-1 overflow-auto bg-gray-50/50 dark:bg-neutral-950/50 p-6"
          style={{ backgroundColor: COLORS.background.secondary }}
        >
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: COLORS.text.primary }}
            >
              {title}
            </h1>
            <p className="text-lg" style={{ color: COLORS.text.secondary }}>
              {description}
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
