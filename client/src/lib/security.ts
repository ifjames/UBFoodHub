import { z } from 'zod';

// Input validation schemas
export const emailSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .regex(/@ub\.edu\.ph$/, 'Must be a valid UB email address')
    .max(100, 'Email must be less than 100 characters')
});

export const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});

export const studentIdSchema = z.string()
  .regex(/^\d{7}$/, 'Student ID must be exactly 7 digits')
  .optional();

export const phoneNumberSchema = z.string()
  .regex(/^(\+63|0)?9\d{9}$/, 'Must be a valid Philippine phone number')
  .optional();

export const nameSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-\'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
});

export const stallNameSchema = z.string()
  .min(2, 'Stall name must be at least 2 characters')
  .max(100, 'Stall name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-\'\.&]+$/, 'Stall name contains invalid characters');

export const descriptionSchema = z.string()
  .max(500, 'Description must be less than 500 characters')
  .optional();

export const priceSchema = z.number()
  .min(0.01, 'Price must be greater than 0')
  .max(9999.99, 'Price must be less than ₱10,000');

export const quantitySchema = z.number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(99, 'Quantity cannot exceed 99');

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Limit length
}

export function sanitizeNumber(input: any): number | null {
  const parsed = parseFloat(input);
  if (isNaN(parsed) || !isFinite(parsed)) return null;
  return parsed;
}

export function sanitizeInteger(input: any): number | null {
  const parsed = parseInt(input, 10);
  if (isNaN(parsed) || !isFinite(parsed)) return null;
  return parsed;
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiters for different operations
export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const orderRateLimiter = new RateLimiter(20, 60000); // 20 orders per minute
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 API calls per minute

// Security middleware for client-side validation
export function validateUserInput(data: any, schema: z.ZodSchema): { success: boolean; data?: any; errors?: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors: errorMessages };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Secure error handler that doesn't expose sensitive information
export function createSecureError(message: string, code?: string): Error {
  const error = new Error(message);
  (error as any).code = code || 'SECURE_ERROR';
  
  // Log the full error internally but return sanitized version
  console.error('Security Error:', error);
  
  return error;
}

// Session security utilities
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function isValidRole(role: string): boolean {
  return ['student', 'stall_owner', 'admin'].includes(role);
}

// Order verification utilities
export function generateOrderToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `UBF-${timestamp}-${random}`.toUpperCase();
}

export function validateOrderToken(token: string): boolean {
  return /^UBF-[A-Z0-9]+-[A-Z0-9]+$/.test(token);
}

// Content Security Policy helpers
export function sanitizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow specific trusted domains
    const allowedDomains = [
      'images.unsplash.com',
      'upload.wikimedia.org',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com'
    ];
    
    if (!allowedDomains.some(domain => parsed.hostname.endsWith(domain))) {
      return '/placeholder-image.jpg'; // Fallback to local placeholder
    }
    
    return url;
  } catch {
    return '/placeholder-image.jpg';
  }
}

// XSS Prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// CSRF Protection Token
export function getCSRFToken(): string {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = generateSecureToken();
    sessionStorage.setItem('csrf_token', token);
  }
  return token;
}

export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token && token.length === 64;
}