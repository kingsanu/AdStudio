import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Check, Clock, Download, Heart, MessageSquare, Share2, Star, User } from "lucide-react";
import { useState } from "react";

// Sample notification data
const sampleNotifications = [
  {
    id: 1,
    type: "like",
    user: {
      name: "John Doe",
      avatar: "https://github.com/shadcn.png",
    },
    content: "liked your design",
    designName: "Marketing Campaign",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    user: {
      name: "Jane Smith",
      avatar: "https://github.com/shadcn.png",
    },
    content: "commented on your design",
    designName: "Social Media Post",
    comment: "This looks amazing! I love the color scheme.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "share",
    user: {
      name: "Alex Johnson",
      avatar: "https://github.com/shadcn.png",
    },
    content: "shared your design",
    designName: "Website Banner",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    type: "system",
    content: "Your design has been successfully exported",
    designName: "Product Showcase",
    time: "2 days ago",
    read: true,
  },
  {
    id: 5,
    type: "mention",
    user: {
      name: "Sarah Williams",
      avatar: "https://github.com/shadcn.png",
    },
    content: "mentioned you in a comment",
    designName: "Team Presentation",
    comment: "I think @you would have some great insights on this!",
    time: "3 days ago",
    read: true,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [activeTab, setActiveTab] = useState("all");
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-green-500" />;
      case "system":
        return <Bell className="h-4 w-4 text-purple-500" />;
      case "mention":
        return <User className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/dashboard" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-[#0070f3]">{unreadCount} new</Badge>
            )}
          </div>
          
          <Button variant="ghost" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    All
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-[#0070f3]">{notifications.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-[#0070f3]">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="like">Likes</TabsTrigger>
                  <TabsTrigger value="comment">Comments</TabsTrigger>
                  <TabsTrigger value="share">Shares</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-lg ${
                        !notification.read
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "bg-neutral-50 dark:bg-neutral-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {notification.user ? (
                          <Avatar>
                            <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                            <AvatarFallback>
                              {notification.user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-neutral-500" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {notification.user && (
                                  <span className="font-semibold">{notification.user.name} </span>
                                )}
                                {notification.content}
                                {notification.designName && (
                                  <span className="font-semibold"> "{notification.designName}"</span>
                                )}
                              </p>
                              
                              {notification.comment && (
                                <p className="mt-1 text-neutral-600 dark:text-neutral-300 text-sm bg-neutral-100 dark:bg-neutral-700/50 p-2 rounded">
                                  {notification.comment}
                                </p>
                              )}
                              
                              <div className="flex items-center mt-2 text-xs text-neutral-500">
                                <Clock className="mr-1 h-3 w-3" />
                                {notification.time}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                                {getNotificationIcon(notification.type)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                    <Bell className="h-10 w-10 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    {activeTab === "all"
                      ? "You don't have any notifications yet."
                      : activeTab === "unread"
                      ? "You don't have any unread notifications."
                      : `You don't have any ${activeTab} notifications.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
