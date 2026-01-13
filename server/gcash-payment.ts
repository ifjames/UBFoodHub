/**
 * GCash Payment Integration Module
 * 
 * This module handles GCash payment processing using a secure P2P transfer approach.
 * Since Adyen/official GCash merchant APIs require business registration,
 * we implement a secure manual verification system suitable for campus food stalls.
 * 
 * Security Features:
 * - Payment reference codes for tracking
 * - Expiration time for payments
 * - Server-side verification
 * - Payment status tracking
 */

import crypto from 'crypto';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  AWAITING_VERIFICATION = 'awaiting_verification', 
  VERIFIED = 'verified',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded'
}

// GCash payment record interface
export interface GCashPayment {
  id: string;
  orderId: string;
  userId: string;
  stallId: string;
  stallGcashNumber: string;
  stallGcashName: string;
  amount: number;
  referenceCode: string;
  status: PaymentStatus;
  customerGcashNumber?: string;
  gcashReferenceNumber?: string;  // Customer's GCash transaction reference
  createdAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  metadata?: Record<string, any>;
}

// Generate a unique reference code for the payment
export function generatePaymentReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `UBF-${timestamp}-${random}`;
}

// Generate a secure payment ID
export function generatePaymentId(): string {
  return crypto.randomUUID();
}

// Validate Philippine phone number format (GCash)
export function validateGcashNumber(number: string): { valid: boolean; formatted: string; error?: string } {
  // Remove spaces, dashes, and other non-numeric characters except +
  let cleaned = number.replace(/[^\d+]/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('+63')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('63')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Should be 10 digits starting with 9
  if (cleaned.length !== 10) {
    return { valid: false, formatted: '', error: 'Phone number must be 10 digits' };
  }
  
  if (!cleaned.startsWith('9')) {
    return { valid: false, formatted: '', error: 'Invalid Philippine mobile number' };
  }
  
  // Validate it's a valid mobile prefix (Globe/Smart/etc)
  const validPrefixes = ['900', '905', '906', '907', '908', '909', '910', '911', '912', '913', 
                         '914', '915', '916', '917', '918', '919', '920', '921', '922', '923', 
                         '924', '925', '926', '927', '928', '929', '930', '931', '932', '933', 
                         '934', '935', '936', '937', '938', '939', '940', '941', '942', '943', 
                         '944', '945', '946', '947', '948', '949', '950', '951', '953', '954', 
                         '955', '956', '957', '958', '959', '960', '961', '963', '964', '965', 
                         '966', '967', '968', '969', '970', '971', '973', '974', '975', '976', 
                         '977', '978', '979', '980', '981', '989', '991', '992', '993', '994', 
                         '995', '996', '997', '998', '999'];
  
  const prefix = cleaned.substring(0, 3);
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, formatted: '', error: 'Invalid mobile network prefix' };
  }
  
  // Format as 09XX XXX XXXX
  const formatted = `0${cleaned}`;
  return { valid: true, formatted };
}

// Create payment instructions for the customer
export function generatePaymentInstructions(payment: GCashPayment): {
  steps: string[];
  qrData?: string;
  importantNotes: string[];
} {
  return {
    steps: [
      '1. Open your GCash app',
      '2. Tap "Send Money"',
      '3. Enter the stall\'s GCash number',
      `4. Enter the exact amount: ₱${payment.amount.toFixed(2)}`,
      `5. Add this reference in the message: ${payment.referenceCode}`,
      '6. Review and confirm the payment',
      '7. Take a screenshot of the confirmation',
      '8. Enter your GCash reference number below to verify payment'
    ],
    importantNotes: [
      'Enter the EXACT amount to avoid payment issues',
      'Include the reference code in the message for faster verification',
      `Payment expires in 15 minutes`,
      'Do not close this page until payment is verified'
    ]
  };
}

// Calculate payment expiration (15 minutes from creation)
export function calculatePaymentExpiration(): Date {
  const expirationMinutes = 15;
  return new Date(Date.now() + expirationMinutes * 60 * 1000);
}

// Check if payment is expired
export function isPaymentExpired(payment: GCashPayment): boolean {
  return new Date() > new Date(payment.expiresAt);
}

// Mask GCash number for display (e.g., 0917****890)
export function maskGcashNumber(number: string): string {
  if (!number || number.length < 7) return number;
  const start = number.substring(0, 4);
  const end = number.substring(number.length - 3);
  return `${start}****${end}`;
}

// Payment verification helper
export interface VerificationResult {
  success: boolean;
  message: string;
  payment?: GCashPayment;
}

// Verify payment reference number format (GCash typically uses numeric reference)
export function validateGcashReferenceNumber(refNumber: string): boolean {
  // GCash reference numbers are typically 13-15 digits
  const cleaned = refNumber.replace(/\s/g, '');
  return /^\d{10,20}$/.test(cleaned);
}

// Calculate service fee (for platform sustainability)
export function calculateServiceFee(amount: number): number {
  // 0% service fee for students - UB campus benefit
  return 0;
}

// Format amount for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
}
