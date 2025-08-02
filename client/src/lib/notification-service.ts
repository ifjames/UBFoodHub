interface NotificationData {
  title: string;
  body: string;
  type: 'order' | 'penalty' | 'verification' | 'announcement' | 'security' | 'general';
  orderId?: string;
  timestamp?: Date;
}

class NotificationService {
  private static instance: NotificationService;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Wait for the service worker to be ready
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        // Wait for the service worker to be activated
        await navigator.serviceWorker.ready;
        
        console.log('ServiceWorker registration successful');
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public isPermissionGranted(): boolean {
    return this.getPermissionStatus() === 'granted';
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // Check if already granted
    if (this.getPermissionStatus() === 'granted') {
      return true;
    }

    try {
      // Ensure service worker is ready first
      if (!this.serviceWorkerRegistration) {
        await this.initializeServiceWorker();
      }
      
      const permission = await Notification.requestPermission();
      
      // Store permission preference
      localStorage.setItem('ub-foodhub-notifications', permission);
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  public async sendOrderNotification(orderId: string, status: string, customerName?: string, userId?: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      'preparing': 'Your order is now being prepared!',
      'ready': 'Your order is ready for pickup!',
      'cancelled': 'Your order has been cancelled',
      'completed': 'Order completed. Thank you for choosing UB FoodHub!'
    };

    const title = `Order Update`;
    const body = `${statusMessages[status] || status} - Order #${orderId.slice(-6)}${customerName ? ` for ${customerName}` : ''}`;
    
    // Store notification for the specific user in Firestore (using 'notifications' collection)
    if (userId) {
      try {
        const { addDocument } = await import('@/lib/firebase');
        await addDocument('notifications', {
          userId: userId,
          orderId: orderId,
          title: title,
          message: body, // Use 'message' field to match notification bell component
          type: 'order',
          status: status,
          isRead: false, // Use 'isRead' to match notification bell component
          createdAt: new Date()
        });
        console.log(`Order notification stored for user ${userId} about order ${orderId} with status ${status}`);
      } catch (error) {
        console.error('Error storing user notification:', error);
      }
    }
    
    await this.sendNotification({
      title,
      body,
      type: 'order',
      orderId
    });
  }

  public async sendPenaltyNotification(reason: string, amount?: number): Promise<void> {
    const title = 'Penalty Received';
    const body = amount 
      ? `You received a ₱${amount} penalty for: ${reason}`
      : `You received a penalty for: ${reason}`;
    
    await this.sendNotification({
      title,
      body,
      type: 'penalty'
    });
  }

  public async sendVerificationNotification(): Promise<void> {
    await this.sendNotification({
      title: 'Email Verification Required',
      body: 'Please verify your email address to access all features',
      type: 'verification'
    });
  }

  public async sendAnnouncementNotification(title: string, message: string): Promise<void> {
    await this.sendNotification({
      title: `Announcement: ${title}`,
      body: message,
      type: 'announcement'
    });
  }

  public async sendPasswordChangeNotification(): Promise<void> {
    await this.sendNotification({
      title: 'Password Changed',
      body: 'Your password has been successfully updated',
      type: 'security'
    });
  }

  public async sendTestNotification(): Promise<void> {
    await this.sendNotification({
      title: 'Test Notification',
      body: 'This is a test notification from UB FoodHub!',
      type: 'general'
    });
  }

  private async sendNotification(data: NotificationData): Promise<void> {
    if (!this.isPermissionGranted()) {
      console.warn('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      requireInteraction: data.type === 'order' && data.title.includes('ready'),
      tag: data.type === 'order' ? `order-${data.orderId}` : data.type,
      data: {
        type: data.type,
        orderId: data.orderId,
        timestamp: new Date()
      }
    };

    try {
      // Ensure service worker is ready
      if (!this.serviceWorkerRegistration) {
        await this.initializeServiceWorker();
      }
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Desktop/Browser compatibility - try regular notification first
      try {
        const notification = new Notification(data.title, options);
        console.log('Notification sent via regular browser method');
        
        // Auto-close after 5 seconds for desktop
        setTimeout(() => {
          notification.close();
        }, 5000);
      } catch (regularError) {
        console.log('Regular notification failed, trying service worker:', regularError);
        
        // Fallback to service worker with proper options
        if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
          const swOptions = {
            ...options,
            actions: data.type === 'order' && data.title.includes('ready') ? [
              {
                action: 'view',
                title: 'View Order'
              }
            ] : undefined
          };
          await this.serviceWorkerRegistration.showNotification(data.title, swOptions);
          console.log('Notification sent via service worker');
        } else {
          throw new Error('Both notification methods failed');
        }
      }

      // Store notification in local storage for history
      this.storeNotificationHistory(data);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Last resort fallback
      try {
        const fallbackNotification = new Notification(data.title, {
          body: data.body,
          icon: '/logo.png'
        });
        console.log('Notification sent via last resort fallback method');
        
        setTimeout(() => {
          fallbackNotification.close();
        }, 5000);
      } catch (fallbackError) {
        console.error('All notification methods failed:', fallbackError);
      }
    }
  }

  private storeNotificationHistory(data: NotificationData): void {
    try {
      const history = JSON.parse(localStorage.getItem('ub-foodhub-notification-history') || '[]');
      history.unshift({
        ...data,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      });
      
      // Keep only last 50 notifications
      const trimmedHistory = history.slice(0, 50);
      localStorage.setItem('ub-foodhub-notification-history', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error storing notification history:', error);
    }
  }

  public getNotificationHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('ub-foodhub-notification-history') || '[]');
    } catch (error) {
      console.error('Error retrieving notification history:', error);
      return [];
    }
  }

  public clearNotificationHistory(): void {
    localStorage.removeItem('ub-foodhub-notification-history');
  }

  // Check if user has previously enabled notifications
  public hasUserPreference(): boolean {
    return localStorage.getItem('ub-foodhub-notifications') !== null;
  }

  public getUserPreference(): NotificationPermission | null {
    const pref = localStorage.getItem('ub-foodhub-notifications');
    return pref as NotificationPermission || null;
  }
}

export { NotificationService };
export default NotificationService;