/**
 * Security utilities for input sanitization and validation
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks using DOMPurify
 * @param input - The user input to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input);
};

/**
 * Validates email format with stricter rules
 * @param email - Email to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates phone number format
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validates password strength with enhanced security requirements
 * @param password - Password to validate
 * @returns Object with validation results
 */
export const validatePasswordStrength = (password: string) => {
  const result = {
    isValid: true,
    errors: [] as string[],
    score: 0
  };

  // Enhanced minimum length requirement
  if (password.length < 14) {
    result.isValid = false;
    result.errors.push('Password must be at least 14 characters long');
  } else {
    result.score += 1;
  }

  // Check for common passwords (basic list)
  const commonPasswords = [
    'password', '123456', '123456789', '12345678', '12345', '1234567', '1234', '1234567890',
    'qwerty', 'password123', 'iloveyou', 'admin', 'administrator', 'welcome', 'test',
    'secret', 'root', '111111', 'p@ssword'
  ];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    result.isValid = false;
    result.errors.push('Password contains common patterns');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  } else {
    result.score += 1;
  }

  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  } else {
    result.score += 1;
  }

  if (!/[!@#$%^&*()+=\[\]{}|;:,.<>?]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one symbol');
  } else {
    result.score += 1;
  }

  return result;
};

/**
 * Enhanced rate limiting utility with stricter controls and progressive delays
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private lockouts: Map<string, number> = new Map();
  
  constructor(
    private maxAttempts: number = 3, // Reduced from 5 to 3
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private progressiveDelayBase: number = 1000 // 1 second base delay
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    
    // Check if user is currently locked out
    const lockoutUntil = this.lockouts.get(identifier);
    if (lockoutUntil && now < lockoutUntil) {
      return false;
    }
    
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Clean old attempts
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      // Progressive lockout duration based on attempt count
      const lockoutDuration = this.progressiveDelayBase * Math.pow(2, recentAttempts.length - this.maxAttempts);
      this.lockouts.set(identifier, now + lockoutDuration);
      return false;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  getRemainingTime(identifier: string): number {
    const lockoutUntil = this.lockouts.get(identifier);
    if (lockoutUntil) {
      const timeRemaining = lockoutUntil - Date.now();
      if (timeRemaining > 0) {
        return timeRemaining;
      }
    }
    
    const attempts = this.attempts.get(identifier) || [];
    if (attempts.length < this.maxAttempts) {
      return 0;
    }
    
    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, timeUntilReset);
  }

  /**
   * Gets progressive delay in milliseconds for failed attempts
   */
  getProgressiveDelay(attemptCount: number): number {
    return this.progressiveDelayBase * Math.pow(2, attemptCount - 1);
  }
}

/**
 * Secure UUID validation
 * @param uuid - UUID string to validate
 * @returns True if valid UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};