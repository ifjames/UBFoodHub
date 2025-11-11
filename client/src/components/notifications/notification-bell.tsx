import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Shield, ShoppingBag, Megaphone, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { subscribeToQuery, updateDocument, deleteDocument } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  userId: string;
  type: "account" | "order" | "admin" | "penalty" | "security";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  orderId?: string;
  adminId?: string;
  metadata?: Record<string, any>;
}

export default function NotificationBell() {
  const { state } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!state.user?.id) return;

    const unsubscribe = subscribeToQuery(
      "notifications",
      "userId",
      "==",
      state.user.id,
      (notifs) => {
        const sortedNotifs = notifs.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        setNotifications(sortedNotifs);
      }
    );

    return unsubscribe;
  }, [state.user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDocument("notifications", notificationId, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n => updateDocument("notifications", n.id, { isRead: true }))
      );
      toast({
        title: "All notifications marked as read",
        description: `${unreadNotifications.length} notifications updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      });
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      await deleteDocument("notifications", notificationId);
      toast({
        title: "Notification removed",
        description: "The notification has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove notification.",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "account":
        return <Shield className="w-4 h-4" />;
      case "order":
        return <ShoppingBag className="w-4 h-4" />;
      case "admin":
        return <Megaphone className="w-4 h-4" />;
      case "penalty":
        return <AlertTriangle className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "account":
        return "text-blue-600";
      case "order":
        return "text-green-600";
      case "admin":
        return "text-purple-600";
      case "penalty":
        return "text-red-600";
      case "security":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? "Just now" : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Handle navigation based on notification type
      if (notification.type === "order" && notification.orderId) {
        // Close the popover
        setIsOpen(false);
        
        // Navigate to the appropriate page based on user role
        if (state.user?.role === "stall_owner") {
          // Store the order ID in localStorage so the stall dashboard can open it
          localStorage.setItem('openOrderId', notification.orderId);
          setLocation("/stall-dashboard");
        } else if (state.user?.role === "student") {
          // Students go to their orders page
          toast({
            title: "Viewing order details",
            description: "Opening your order from notification",
          });
          setLocation("/orders");
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
      toast({
        title: "Error",
        description: "Failed to process notification. Navigating anyway.",
        variant: "destructive",
      });
      
      // Continue with navigation even if marking as read failed
      if (notification.type === "order" && notification.orderId) {
        setIsOpen(false);
        if (state.user?.role === "stall_owner") {
          localStorage.setItem('openOrderId', notification.orderId);
          setLocation("/stall-dashboard");
        } else if (state.user?.role === "student") {
          setLocation("/orders");
        }
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative text-white hover:bg-red-700 h-10 w-10 p-0"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 flex items-center justify-center bg-yellow-500 text-black text-xs font-bold rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 mr-4" align="end">
        <div className="p-4 border-b bg-[#6d031e] text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-white hover:bg-red-700 h-auto p-1"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-red-100 mt-1">
              {unreadCount} new notification{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                You'll see updates about your orders and account here
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium text-sm ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 w-6 p-0 hover:bg-green-100"
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}