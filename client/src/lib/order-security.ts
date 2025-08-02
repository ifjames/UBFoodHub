import { generateOrderToken, validateOrderToken } from './security';
import { auth } from './firebase';

// Order verification and security utilities

export interface SecureOrder {
  id: string;
  userId: string;
  token: string;
  checksum: string;
  createdAt: number;
  lastModified: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  stallId: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  customizations?: string;
}

// Generate secure checksum for order integrity
function generateOrderChecksum(order: Omit<SecureOrder, 'checksum'>): string {
  const data = JSON.stringify({
    id: order.id,
    userId: order.userId,
    token: order.token,
    createdAt: order.createdAt,
    items: order.items,
    totalAmount: order.totalAmount,
    stallId: order.stallId
  });
  
  // Simple checksum using character codes
  let checksum = 0;
  for (let i = 0; i < data.length; i++) {
    checksum = ((checksum << 5) - checksum + data.charCodeAt(i)) & 0xffffffff;
  }
  
  return checksum.toString(16);
}

// Verify order integrity
export function verifyOrderIntegrity(order: SecureOrder): boolean {
  const expectedChecksum = generateOrderChecksum(order);
  
  if (order.checksum !== expectedChecksum) {
    console.error('Order integrity check failed: Checksum mismatch');
    return false;
  }
  
  if (!validateOrderToken(order.token)) {
    console.error('Order integrity check failed: Invalid token format');
    return false;
  }
  
  return true;
}

// Create secure order with tamper detection
export function createSecureOrder(orderData: {
  id: string;
  userId: string;
  stallId: string;
  items: OrderItem[];
  totalAmount: number;
}): SecureOrder {
  const now = Date.now();
  const token = generateOrderToken();
  
  const order: Omit<SecureOrder, 'checksum'> = {
    ...orderData,
    token,
    createdAt: now,
    lastModified: now,
    status: 'pending'
  };
  
  const checksum = generateOrderChecksum(order);
  
  return {
    ...order,
    checksum
  };
}

// Update order with integrity preservation
export function updateSecureOrder(order: SecureOrder, updates: Partial<Pick<SecureOrder, 'status' | 'lastModified'>>): SecureOrder {
  // Verify current order integrity first
  if (!verifyOrderIntegrity(order)) {
    throw new Error('Cannot update corrupted order');
  }
  
  const updatedOrder: Omit<SecureOrder, 'checksum'> = {
    ...order,
    ...updates,
    lastModified: Date.now()
  };
  
  const newChecksum = generateOrderChecksum(updatedOrder);
  
  return {
    ...updatedOrder,
    checksum: newChecksum
  };
}

// Order ownership verification
export function verifyOrderOwnership(order: SecureOrder, userId?: string): boolean {
  const currentUserId = userId || auth.currentUser?.uid;
  
  if (!currentUserId) {
    console.error('No authenticated user for order ownership verification');
    return false;
  }
  
  return order.userId === currentUserId;
}

// Anti-fraud measures
const ORDER_VELOCITY_LIMITS = {
  maxOrdersPerHour: 10,
  maxOrdersPerDay: 50,
  maxTotalAmountPerDay: 5000
};

export function checkOrderVelocityLimits(userId: string, newOrderAmount: number): { allowed: boolean; reason?: string } {
  try {
    const today = new Date().toDateString();
    const lastHour = Date.now() - (60 * 60 * 1000);
    
    const ordersKey = `orders_${userId}_${today}`;
    const orderHistory = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    
    // Check hourly limit
    const recentOrders = orderHistory.filter((order: any) => order.timestamp > lastHour);
    if (recentOrders.length >= ORDER_VELOCITY_LIMITS.maxOrdersPerHour) {
      return { allowed: false, reason: 'Too many orders in the past hour' };
    }
    
    // Check daily limit
    if (orderHistory.length >= ORDER_VELOCITY_LIMITS.maxOrdersPerDay) {
      return { allowed: false, reason: 'Daily order limit exceeded' };
    }
    
    // Check daily spending limit
    const totalSpentToday = orderHistory.reduce((total: number, order: any) => total + order.amount, 0);
    if (totalSpentToday + newOrderAmount > ORDER_VELOCITY_LIMITS.maxTotalAmountPerDay) {
      return { allowed: false, reason: 'Daily spending limit exceeded' };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking order velocity limits:', error);
    return { allowed: true }; // Fail open for better user experience
  }
}

// Record order for velocity tracking
export function recordOrderForVelocityTracking(userId: string, amount: number) {
  try {
    const today = new Date().toDateString();
    const ordersKey = `orders_${userId}_${today}`;
    const orderHistory = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    
    orderHistory.push({
      timestamp: Date.now(),
      amount
    });
    
    localStorage.setItem(ordersKey, JSON.stringify(orderHistory));
  } catch (error) {
    console.error('Error recording order for velocity tracking:', error);
  }
}

// Suspicious order detection
export function detectSuspiciousOrder(order: SecureOrder): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check for unusual order amounts
  if (order.totalAmount > 2000) {
    reasons.push('Unusually high order amount');
  }
  
  if (order.totalAmount < 1) {
    reasons.push('Invalid order amount');
  }
  
  // Check for unusual quantity
  const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
  if (totalQuantity > 50) {
    reasons.push('Unusually high item quantity');
  }
  
  // Check for rapid successive orders
  const recentOrders = getUserRecentOrders(order.userId);
  if (recentOrders.length > 5) {
    reasons.push('Multiple recent orders');
  }
  
  // Check for price manipulation
  const hasInvalidPrices = order.items.some(item => item.price <= 0 || item.price > 1000);
  if (hasInvalidPrices) {
    reasons.push('Invalid item prices detected');
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

// Get user's recent orders for analysis
function getUserRecentOrders(userId: string): any[] {
  try {
    const recentOrdersKey = `recent_orders_${userId}`;
    const recentOrders = JSON.parse(localStorage.getItem(recentOrdersKey) || '[]');
    
    // Filter orders from last 30 minutes
    const thirtyMinsAgo = Date.now() - (30 * 60 * 1000);
    return recentOrders.filter((order: any) => order.timestamp > thirtyMinsAgo);
  } catch {
    return [];
  }
}

// Order cancellation security
export function canCancelOrder(order: SecureOrder, userRole: string): { canCancel: boolean; reason?: string } {
  // Check order ownership
  if (!verifyOrderOwnership(order)) {
    return { canCancel: false, reason: 'Not your order' };
  }
  
  // Check order status
  if (order.status === 'completed') {
    return { canCancel: false, reason: 'Order already completed' };
  }
  
  if (order.status === 'cancelled') {
    return { canCancel: false, reason: 'Order already cancelled' };
  }
  
  // Check time limits for cancellation
  const orderAge = Date.now() - order.createdAt;
  const maxCancellationTime = 10 * 60 * 1000; // 10 minutes
  
  if (order.status === 'preparing' && orderAge > maxCancellationTime) {
    return { canCancel: false, reason: 'Order is being prepared and cannot be cancelled' };
  }
  
  if (order.status === 'ready') {
    return { canCancel: false, reason: 'Order is ready for pickup and cannot be cancelled' };
  }
  
  return { canCancel: true };
}

// Order audit logging
interface OrderAuditLog {
  orderId: string;
  userId: string;
  action: string;
  timestamp: number;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}

export function logOrderAction(order: SecureOrder, action: string, previousState?: any, newState?: any) {
  try {
    const auditLog: OrderAuditLog = {
      orderId: order.id,
      userId: order.userId,
      action,
      timestamp: Date.now(),
      previousState,
      newState,
      userAgent: navigator.userAgent
    };
    
    const logsKey = `order_audit_${order.id}`;
    const existingLogs = JSON.parse(localStorage.getItem(logsKey) || '[]');
    existingLogs.push(auditLog);
    
    // Keep only last 50 entries per order
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    
    localStorage.setItem(logsKey, JSON.stringify(existingLogs));
    
    // Also log to console for monitoring
    console.log('Order Action:', auditLog);
  } catch (error) {
    console.error('Failed to log order action:', error);
  }
}

// Get order audit trail
export function getOrderAuditTrail(orderId: string): OrderAuditLog[] {
  try {
    const logsKey = `order_audit_${orderId}`;
    return JSON.parse(localStorage.getItem(logsKey) || '[]');
  } catch {
    return [];
  }
}