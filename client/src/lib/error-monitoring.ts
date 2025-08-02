import { auth } from './firebase';

// Error types for categorization
export type ErrorCategory = 
  | 'auth' 
  | 'api' 
  | 'validation' 
  | 'network' 
  | 'security' 
  | 'performance' 
  | 'ui' 
  | 'unknown';

export interface ErrorLog {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  message: string;
  stack?: string;
  userId?: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  resolved?: boolean;
}

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  metric: 'page_load' | 'api_response' | 'render_time' | 'bundle_size';
  value: number;
  url: string;
  userId?: string;
  context?: any;
}

// Error logging system
const ERROR_LOG_KEY = 'error_logs';
const PERFORMANCE_LOG_KEY = 'performance_metrics';
const MAX_LOG_ENTRIES = 200;

class ErrorMonitor {
  private errorBoundaryStack: any[] = [];

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        category: 'unknown',
        message: event.message,
        stack: event.error?.stack,
        severity: 'medium',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        category: 'unknown',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          promise: event.promise,
          reason: event.reason
        }
      });
    });

    // Console error override for additional logging
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      
      this.logError({
        category: 'unknown',
        message: args.join(' '),
        severity: 'low',
        context: { source: 'console.error' }
      });
    };
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          this.logPerformance({
            metric: 'page_load',
            value: navigation.loadEventEnd - navigation.fetchStart,
            context: {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              firstPaint: this.getFirstPaint(),
              firstContentfulPaint: this.getFirstContentfulPaint()
            }
          });
        }, 100);
      });
    }
  }

  private getFirstPaint(): number | null {
    const entry = performance.getEntriesByName('first-paint')[0];
    return entry?.startTime || null;
  }

  private getFirstContentfulPaint(): number | null {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry?.startTime || null;
  }

  logError(error: Omit<ErrorLog, 'id' | 'timestamp' | 'userAgent' | 'url' | 'userId'>): void {
    try {
      const errorLog: ErrorLog = {
        id: this.generateId(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: auth.currentUser?.uid,
        ...error
      };

      const logs = this.getErrorLogs();
      logs.unshift(errorLog);

      // Keep only the most recent entries
      if (logs.length > MAX_LOG_ENTRIES) {
        logs.splice(MAX_LOG_ENTRIES);
      }

      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));

      // Send critical errors to console immediately
      if (error.severity === 'critical') {
        console.error('CRITICAL ERROR:', errorLog);
      }

      // Check for error patterns
      this.checkErrorPatterns(logs);

    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  logPerformance(metric: Omit<PerformanceMetric, 'id' | 'timestamp' | 'url' | 'userId'>): void {
    try {
      const performanceMetric: PerformanceMetric = {
        id: this.generateId(),
        timestamp: Date.now(),
        url: window.location.href,
        userId: auth.currentUser?.uid,
        ...metric
      };

      const metrics = this.getPerformanceMetrics();
      metrics.unshift(performanceMetric);

      // Keep only the most recent entries
      if (metrics.length > MAX_LOG_ENTRIES) {
        metrics.splice(MAX_LOG_ENTRIES);
      }

      localStorage.setItem(PERFORMANCE_LOG_KEY, JSON.stringify(metrics));

      // Check for performance issues
      this.checkPerformanceIssues(performanceMetric);

    } catch (logError) {
      console.error('Failed to log performance metric:', logError);
    }
  }

  private checkErrorPatterns(logs: ErrorLog[]): void {
    const recentLogs = logs.filter(log => Date.now() - log.timestamp < 5 * 60 * 1000);
    
    // Check for error spikes
    if (recentLogs.length > 20) {
      console.warn('Error spike detected:', recentLogs.length, 'errors in 5 minutes');
    }

    // Check for recurring errors
    const errorCounts = new Map<string, number>();
    recentLogs.forEach(log => {
      const key = log.message.substring(0, 100); // First 100 chars
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    errorCounts.forEach((count, message) => {
      if (count >= 5) {
        console.warn('Recurring error detected:', message, 'occurred', count, 'times');
      }
    });
  }

  private checkPerformanceIssues(metric: PerformanceMetric): void {
    const thresholds = {
      page_load: 3000, // 3 seconds
      api_response: 2000, // 2 seconds
      render_time: 16, // 16ms (60fps)
    };

    const threshold = (thresholds as any)[metric.metric];
    if (threshold && metric.value > threshold) {
      this.logError({
        category: 'performance',
        message: `Slow ${metric.metric}: ${metric.value}ms (threshold: ${threshold}ms)`,
        severity: 'medium',
        context: { metric: metric.metric, value: metric.value, threshold }
      });
    }
  }

  getErrorLogs(): ErrorLog[] {
    try {
      return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    try {
      return JSON.parse(localStorage.getItem(PERFORMANCE_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Get error summary for dashboard
  getErrorSummary(timeRange = 24 * 60 * 60 * 1000): any {
    const logs = this.getErrorLogs();
    const cutoff = Date.now() - timeRange;
    const recentLogs = logs.filter(log => log.timestamp > cutoff);

    const bySeverity = recentLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = recentLogs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: recentLogs.length,
      bySeverity,
      byCategory,
      resolved: recentLogs.filter(log => log.resolved).length,
      unresolved: recentLogs.filter(log => !log.resolved).length
    };
  }

  // Get performance summary
  getPerformanceSummary(timeRange = 24 * 60 * 60 * 1000): any {
    const metrics = this.getPerformanceMetrics();
    const cutoff = Date.now() - timeRange;
    const recentMetrics = metrics.filter(metric => metric.timestamp > cutoff);

    const byMetric = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = { values: [], avg: 0, min: 0, max: 0 };
      }
      acc[metric.metric].values.push(metric.value);
      return acc;
    }, {} as Record<string, any>);

    // Calculate statistics
    Object.keys(byMetric).forEach(key => {
      const values = byMetric[key].values;
      byMetric[key].avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      byMetric[key].min = Math.min(...values);
      byMetric[key].max = Math.max(...values);
      byMetric[key].count = values.length;
    });

    return byMetric;
  }

  // Clear old logs to prevent storage bloat
  cleanupOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    const errorLogs = this.getErrorLogs().filter(log => log.timestamp > cutoff);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(errorLogs));
    
    const performanceMetrics = this.getPerformanceMetrics().filter(metric => metric.timestamp > cutoff);
    localStorage.setItem(PERFORMANCE_LOG_KEY, JSON.stringify(performanceMetrics));
  }

  // Mark error as resolved
  resolveError(errorId: string): void {
    const logs = this.getErrorLogs();
    const errorIndex = logs.findIndex(log => log.id === errorId);
    
    if (errorIndex !== -1) {
      logs[errorIndex].resolved = true;
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
    }
  }
}

// API monitoring utilities
export function monitorApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string
): Promise<T> {
  const startTime = performance.now();
  
  return apiCall()
    .then(result => {
      const duration = performance.now() - startTime;
      
      errorMonitor.logPerformance({
        metric: 'api_response',
        value: duration,
        context: { endpoint, success: true }
      });
      
      return result;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      
      errorMonitor.logError({
        category: 'api',
        message: `API Error: ${endpoint} - ${error.message}`,
        stack: error.stack,
        severity: 'medium',
        context: { endpoint, duration }
      });
      
      throw error;
    });
}

// React Error Boundary component helper
export function createErrorBoundary(component: string) {
  return (error: Error, errorInfo: any) => {
    errorMonitor.logError({
      category: 'ui',
      message: `React Error Boundary: ${component} - ${error.message}`,
      stack: error.stack,
      severity: 'high',
      context: { 
        component, 
        errorInfo: errorInfo.componentStack 
      }
    });
  };
}

// Global instance
export const errorMonitor = new ErrorMonitor();

// Cleanup old logs on startup
errorMonitor.cleanupOldLogs();

// Export monitoring functions
export { ErrorMonitor };
export default errorMonitor;