import { Request, Response, NextFunction } from 'express';

// Rate limiting middleware
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export function createRateLimit(windowMs = 60000, max = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(k => {
      if (rateLimitStore[k].resetTime < now) {
        delete rateLimitStore[k];
      }
    });
    
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else if (rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[key].count++;
    }
    
    const current = rateLimitStore[key];
    
    if (current.count > max) {
      return res.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - current.count).toString(),
      'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString()
    });
    
    next();
  };
}

// Input validation middleware
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize all string inputs
  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>\"'&]/g, '').substring(0, 1000);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  }
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

// Enhanced security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.set({
    // Core security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Enhanced Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://*.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: wss: https://*.googleapis.com https://*.firebaseio.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // Additional security headers
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Download-Options': 'noopen',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Cache control for sensitive endpoints
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
}

// Request logging middleware for security monitoring
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Security Alert:', JSON.stringify(logData));
    }
  });
  
  next();
}

// CORS middleware with strict origin checking
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = [
    'http://localhost:5000',
    'https://ubfoodhub.replit.app',
    process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : null
  ].filter(Boolean);
  
  const origin = req.get('Origin');
  
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  
  res.set({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  });
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}

// Error handling middleware that doesn't expose sensitive information
export function secureErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Server Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Invalid input data',
      ...(isDevelopment && { details: err.message })
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }
  
  // Generic error response
  res.status(500).json({
    message: 'Internal server error',
    ...(isDevelopment && { error: err.message })
  });
}