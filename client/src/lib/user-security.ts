import { auth } from './firebase';
import { validateUserInput, emailSchema, passwordSchema, nameSchema } from './security';
import { logUserActivity } from './auth-guard';

// Password strength validation
export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');

  if (password.length >= 12) score++;

  // Check character types
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Include special characters');

  // Check for common patterns
  if (!/(.)\1{2,}/.test(password)) score++;
  else feedback.push('Avoid repeating characters');

  const isValid = score >= 4;

  return {
    score: Math.min(score, 5),
    feedback,
    isValid
  };
}

// Secure password change
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate new password strength
    const strength = checkPasswordStrength(newPassword);
    if (!strength.isValid) {
      return { success: false, error: `Password too weak: ${strength.feedback.join(', ')}` };
    }

    // Validate with schema
    const validation = validateUserInput({ password: newPassword }, passwordSchema);
    if (!validation.success) {
      return { success: false, error: validation.errors?.join(', ') };
    }

    // Re-authenticate user first
    const email = auth.currentUser.email;
    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    const { signInWithEmailAndPassword, updatePassword } = await import('firebase/auth');
    
    try {
      await signInWithEmailAndPassword(auth, email, currentPassword);
    } catch (authError: any) {
      logUserActivity('password_change_failed', { reason: 'authentication_failed' });
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    await updatePassword(auth.currentUser, newPassword);
    
    logUserActivity('password_changed');
    return { success: true };

  } catch (error: any) {
    console.error('Password change error:', error);
    logUserActivity('password_change_failed', { error: error.message });
    return { success: false, error: 'Failed to change password' };
  }
}

// Profile update with validation
export interface ProfileUpdateData {
  fullName?: string;
  phoneNumber?: string;
  studentId?: string;
}

export async function updateProfile(updates: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate each field
    if (updates.fullName) {
      const nameValidation = validateUserInput({ name: updates.fullName }, nameSchema);
      if (!nameValidation.success) {
        return { success: false, error: `Invalid name: ${nameValidation.errors?.join(', ')}` };
      }
    }

    // Log the update attempt
    logUserActivity('profile_update_attempt', { fields: Object.keys(updates) });

    // Update Firebase Auth profile if needed
    const { updateProfile: firebaseUpdateProfile } = await import('firebase/auth');
    
    if (updates.fullName) {
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: updates.fullName
      });
    }

    logUserActivity('profile_updated', { fields: Object.keys(updates) });
    return { success: true };

  } catch (error: any) {
    console.error('Profile update error:', error);
    logUserActivity('profile_update_failed', { error: error.message });
    return { success: false, error: 'Failed to update profile' };
  }
}

// Two-factor authentication setup
export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export async function setupTwoFactor(): Promise<{ success: boolean; data?: TwoFactorSetup; error?: string }> {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Generate TOTP secret (simplified version)
    const secret = generateTOTPSecret();
    const qrCode = generateQRCode(auth.currentUser.email!, secret);
    const backupCodes = generateBackupCodes();

    logUserActivity('2fa_setup_initiated');

    return {
      success: true,
      data: {
        qrCode,
        secret,
        backupCodes
      }
    };

  } catch (error: any) {
    console.error('2FA setup error:', error);
    logUserActivity('2fa_setup_failed', { error: error.message });
    return { success: false, error: 'Failed to setup two-factor authentication' };
  }
}

function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

function generateQRCode(email: string, secret: string): string {
  // This would normally generate a proper TOTP QR code
  // For now, return a placeholder that could be used with QR code generator
  const issuer = 'UB FoodHub';
  const label = `${issuer}:${email}`;
  const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return otpauth;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += Math.floor(Math.random() * 10);
    }
    codes.push(code);
  }
  return codes;
}

// Account security monitoring
export interface SecurityEvent {
  type: 'login' | 'failed_login' | 'password_change' | 'profile_update' | 'suspicious_activity';
  timestamp: number;
  ip?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  details?: any;
}

const SECURITY_EVENTS_KEY = 'security_events';

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent' | 'ip'>): void {
  try {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    const events = getSecurityEvents();
    events.unshift(securityEvent);

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(100);
    }

    localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(events));

    // Also log to user activity
    logUserActivity('security_event', securityEvent);

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

export function getSecurityEvents(): SecurityEvent[] {
  try {
    return JSON.parse(localStorage.getItem(SECURITY_EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

// Security alert system
export function checkForSecurityAlerts(): { hasAlerts: boolean; alerts: string[] } {
  const alerts: string[] = [];
  const events = getSecurityEvents();
  const recentEvents = events.filter(event => Date.now() - event.timestamp < 24 * 60 * 60 * 1000);

  // Check for multiple failed logins
  const failedLogins = recentEvents.filter(event => event.type === 'failed_login');
  if (failedLogins.length >= 5) {
    alerts.push('Multiple failed login attempts detected in the last 24 hours');
  }

  // Check for login from new devices
  const logins = recentEvents.filter(event => event.type === 'login' && event.success);
  const uniqueUserAgents = new Set(logins.map(login => login.userAgent));
  if (uniqueUserAgents.size > 3) {
    alerts.push('Logins detected from multiple devices');
  }

  // Check for suspicious activity
  const suspiciousEvents = recentEvents.filter(event => event.type === 'suspicious_activity');
  if (suspiciousEvents.length > 0) {
    alerts.push('Suspicious account activity detected');
  }

  return {
    hasAlerts: alerts.length > 0,
    alerts
  };
}

// Data export for account portability
export async function exportUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const userData = {
      profile: {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        emailVerified: auth.currentUser.emailVerified,
        createdAt: auth.currentUser.metadata.creationTime,
        lastSignIn: auth.currentUser.metadata.lastSignInTime
      },
      securityEvents: getSecurityEvents(),
      activityLogs: getUserActivityLogs(),
      exportedAt: new Date().toISOString()
    };

    logUserActivity('data_exported');

    return { success: true, data: userData };

  } catch (error: any) {
    console.error('Data export error:', error);
    logUserActivity('data_export_failed', { error: error.message });
    return { success: false, error: 'Failed to export user data' };
  }
}

// Import function for getUserActivityLogs (should be in auth-guard.ts)
function getUserActivityLogs(): any[] {
  try {
    return JSON.parse(localStorage.getItem('user_activity_log') || '[]');
  } catch {
    return [];
  }
}

// Account deletion
export async function deleteAccount(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Re-authenticate before deletion
    const email = auth.currentUser.email;
    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    const { signInWithEmailAndPassword, deleteUser } = await import('firebase/auth');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (authError) {
      logSecurityEvent({ type: 'failed_login', success: false, details: { reason: 'account_deletion_auth_failed' } });
      return { success: false, error: 'Password incorrect' };
    }

    // Log before deletion
    logSecurityEvent({ type: 'suspicious_activity', success: true, details: { action: 'account_deletion' } });

    // Delete the user account
    await deleteUser(auth.currentUser);

    // Clear local data
    localStorage.clear();
    sessionStorage.clear();

    return { success: true };

  } catch (error: any) {
    console.error('Account deletion error:', error);
    logSecurityEvent({ type: 'suspicious_activity', success: false, details: { action: 'account_deletion_failed', error: error.message } });
    return { success: false, error: 'Failed to delete account' };
  }
}