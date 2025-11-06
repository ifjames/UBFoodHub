import { addDocument } from "./firebase";

export interface NotificationData {
  userId: string;
  type: "account" | "order" | "admin" | "penalty" | "security";
  title: string;
  message: string;
  isRead: boolean;
  orderId?: string;
  adminId?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(data: NotificationData): Promise<string | null> {
  try {
    const notificationData = {
      ...data,
      createdAt: new Date(),
    };

    const docRef = await addDocument("notifications", notificationData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Notification templates for common scenarios
export const NotificationTemplates = {
  accountNotVerified: (userId: string) => ({
    userId,
    type: "account" as const,
    title: "Account Verification Required",
    message: "Please verify your email address to access all features of UB FoodHub.",
    isRead: false,
  }),

  orderStatusChanged: (userId: string, orderId: string, status: string, stallName: string) => ({
    userId,
    type: "order" as const,
    title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your order from ${stallName} is now ${status}.`,
    isRead: false,
    orderId,
  }),

  passwordChanged: (userId: string) => ({
    userId,
    type: "security" as const,
    title: "Password Changed",
    message: "Your account password has been successfully updated.",
    isRead: false,
  }),

  adminBroadcast: (userId: string, title: string, message: string, adminId: string) => ({
    userId,
    type: "admin" as const,
    title,
    message,
    isRead: false,
    adminId,
  }),

  penaltyAssigned: (userId: string, reason: string, penaltyType: string) => ({
    userId,
    type: "penalty" as const,
    title: "Penalty Assigned",
    message: `You have received a ${penaltyType} penalty: ${reason}`,
    isRead: false,
    metadata: { penaltyType, reason },
  }),

  orderCancellationRequest: (userId: string, orderId: string, status: "approved" | "declined", reason?: string) => ({
    userId,
    type: "order" as const,
    title: `Order Cancellation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: status === "approved" 
      ? "Your order cancellation request has been approved."
      : `Your order cancellation request has been declined. Reason: ${reason}`,
    isRead: false,
    orderId,
    metadata: { cancellationStatus: status, reason },
  }),
};

// Send notification to specific user
export async function sendNotificationToUser(
  userId: string,
  template: ReturnType<typeof NotificationTemplates[keyof typeof NotificationTemplates]>
): Promise<boolean> {
  try {
    await createNotification(template);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

// Send broadcast notification to multiple users
export async function sendBroadcastNotification(
  userIds: string[],
  title: string,
  message: string,
  adminId: string
): Promise<boolean> {
  try {
    const notifications = userIds.map(userId => 
      NotificationTemplates.adminBroadcast(userId, title, message, adminId)
    );

    await Promise.all(notifications.map(notification => createNotification(notification)));
    return true;
  } catch (error) {
    console.error("Error sending broadcast notification:", error);
    return false;
  }
}