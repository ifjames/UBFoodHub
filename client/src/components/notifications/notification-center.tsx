import { useState, useEffect } from "react";
import { Bell, X, Check, Clock, ShoppingBag, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { subscribeToCollection, updateDocument } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  userId: string;
  type: "order" | "system" | "promotion" | "review";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  orderId?: string;
  restaurantId?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUpdateCount: (count: number) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "order":
      return <ShoppingBag className="w-5 h-5 text-blue-600" />;
    case "promotion":
      return <Gift className="w-5 h-5 text-green-600" />;
    case "review":
      return <Star className="w-5 h-5 text-yellow-600" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "order":
      return "bg-blue-50 border-blue-200";
    case "promotion":
      return "bg-green-50 border-green-200";
    case "review":
      return "bg-yellow-50 border-yellow-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

export default function NotificationCenter({ isOpen, onClose, unreadCount, onUpdateCount }: NotificationCenterProps) {
  const { state } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state.user?.id || !isOpen) return;

    const unsubscribe = subscribeToCollection(
      "notifications",
      (notificationsData) => {
        const userNotifications = notificationsData
          .filter((notification: any) => notification.userId === state.user?.id)
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date();
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date();
            return bTime.getTime() - aTime.getTime();
          })
          .slice(0, 50); // Limit to 50 most recent notifications

        setNotifications(userNotifications);
        
        // Update unread count
        const unreadCount = userNotifications.filter((n: any) => !n.isRead).length;
        onUpdateCount(unreadCount);
        
        setIsLoading(false);
      },
      {
        conditions: [
          { field: "userId", operator: "==", value: state.user.id }
        ]
      }
    );

    return () => unsubscribe();
  }, [state.user?.id, isOpen, onUpdateCount]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDocument("notifications", notificationId, { isRead: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDocument("notifications", notification.id, { isRead: true })
        )
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatNotificationTime = (createdAt: any) => {
    try {
      const date = createdAt?.toDate?.() || new Date(createdAt) || new Date();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          className="w-full max-w-md mx-4 bg-white rounded-lg shadow-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#6d031e]" />
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="bg-[#6d031e] text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#6d031e] hover:bg-red-50"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d031e]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications</h3>
                <p className="text-sm text-gray-500 text-center">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.isRead ? getNotificationColor(notification.type) : "bg-white"
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-800 text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[#6d031e] rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatNotificationTime(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}