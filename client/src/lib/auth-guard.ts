import { useStore } from './store';
import { useEffect, useState } from 'react';
import { auth } from './firebase';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: 'student' | 'stall_owner' | 'admin';
  requireEmailVerified?: boolean;
  fallback?: React.ReactNode;
}

// Session management utilities
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutes

let sessionTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;

export function useAuthGuard(requireRole?: string, requireEmailVerified = true) {
  const { state } = useStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!state.user || !auth.currentUser) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Check email verification if required
        if (requireEmailVerified && !auth.currentUser.emailVerified) {
          setError('Email verification required');
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Check UB email domain
        if (!auth.currentUser.email?.endsWith('@ub.edu.ph')) {
          setError('Only UB email addresses are allowed');
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Check role if required
        if (requireRole && state.user.role !== requireRole) {
          setError(`Access denied. Required role: ${requireRole}`);
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);
        resetSessionTimer();
      } catch (err) {
        console.error('Auth guard error:', err);
        setError('Authentication error');
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(checkAuth);

    return () => {
      unsubscribe();
      clearSessionTimers();
    };
  }, [state.user, requireRole, requireEmailVerified]);

  return { isAuthorized, isLoading, error };
}

function resetSessionTimer() {
  clearSessionTimers();
  
  // Set warning timer
  warningTimer = setTimeout(() => {
    const shouldExtend = window.confirm(
      'Your session will expire in 5 minutes. Do you want to extend it?'
    );
    
    if (shouldExtend) {
      resetSessionTimer();
    }
  }, WARNING_TIMEOUT);
  
  // Set logout timer
  sessionTimer = setTimeout(() => {
    alert('Session expired. You will be logged out.');
    auth.signOut();
  }, SESSION_TIMEOUT);
}

function clearSessionTimers() {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
}

// Activity tracking for session extension
let lastActivity = Date.now();

export function trackUserActivity() {
  lastActivity = Date.now();
  
  // Reset timer on user activity
  if (auth.currentUser) {
    resetSessionTimer();
  }
}

// Add event listeners for user activity
if (typeof window !== 'undefined') {
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, trackUserActivity, true);
  });
}

// Role-based access control utilities
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    admin: 3,
    stall_owner: 2,
    student: 1
  };
  
  return (roleHierarchy as any)[userRole] >= (roleHierarchy as any)[requiredRole];
}

export function canAccessRoute(userRole: string, route: string): boolean {
  const routePermissions = {
    '/admin': 'admin',
    '/stall-dashboard': 'stall_owner',
    '/orders': 'student',
    '/profile': 'student',
    '/cart': 'student',
    '/checkout': 'student'
  };
  
  const requiredRole = (routePermissions as any)[route];
  
  if (!requiredRole) return true; // Public route
  
  return hasPermission(userRole, requiredRole);
}

// Account security utilities
const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkAccountLockout(email: string): { isLocked: boolean; timeRemaining?: number } {
  const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
  const userAttempts = attempts[email];
  
  if (!userAttempts) return { isLocked: false };
  
  const { count, lastAttempt } = userAttempts;
  const timeSinceLastAttempt = Date.now() - lastAttempt;
  
  if (count >= 5 && timeSinceLastAttempt < LOCKOUT_DURATION) {
    return {
      isLocked: true,
      timeRemaining: LOCKOUT_DURATION - timeSinceLastAttempt
    };
  }
  
  return { isLocked: false };
}

export function recordLoginAttempt(email: string, success: boolean) {
  const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
  
  if (success) {
    // Clear attempts on successful login
    delete attempts[email];
  } else {
    // Increment failed attempts
    if (!attempts[email]) {
      attempts[email] = { count: 0, lastAttempt: 0 };
    }
    
    attempts[email].count++;
    attempts[email].lastAttempt = Date.now();
  }
  
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

// User activity logging
interface UserActivity {
  timestamp: number;
  action: string;
  details?: any;
  ip?: string;
  userAgent?: string;
}

const ACTIVITY_LOG_KEY = 'user_activity_log';
const MAX_LOG_ENTRIES = 100;

export function logUserActivity(action: string, details?: any) {
  try {
    const logs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]') as UserActivity[];
    
    const newLog: UserActivity = {
      timestamp: Date.now(),
      action,
      details,
      userAgent: navigator.userAgent
    };
    
    logs.unshift(newLog);
    
    // Keep only the last MAX_LOG_ENTRIES
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(MAX_LOG_ENTRIES);
    }
    
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

export function getUserActivityLogs(): UserActivity[] {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

// Suspicious activity detection
export function detectSuspiciousActivity(): boolean {
  const logs = getUserActivityLogs();
  const recentLogs = logs.filter(log => Date.now() - log.timestamp < 5 * 60 * 1000); // Last 5 minutes
  
  // Check for rapid successive actions
  if (recentLogs.length > 50) {
    console.warn('Suspicious activity detected: Too many actions in short time');
    return true;
  }
  
  // Check for unusual patterns (e.g., rapid order cancellations)
  const cancellations = recentLogs.filter(log => log.action === 'cancel_order');
  if (cancellations.length > 5) {
    console.warn('Suspicious activity detected: Multiple order cancellations');
    return true;
  }
  
  return false;
}