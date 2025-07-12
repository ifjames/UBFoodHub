// Service Worker for UB FoodHub Push Notifications
const CACHE_NAME = 'ub-foodhub-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let url = '/';
  
  // Determine where to navigate based on notification type
  if (notificationData?.type === 'order' && notificationData?.orderId) {
    url = `/orders`;
  } else if (notificationData?.type === 'penalty') {
    url = `/profile`;
  } else if (notificationData?.type === 'verification') {
    url = `/profile`;
  } else if (notificationData?.type === 'announcement') {
    url = `/`;
  }
  
  // Handle action button clicks
  if (event.action === 'view') {
    url = `/orders`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
});

// Handle push events (for server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'UB FoodHub', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'UB FoodHub', options)
  );
});