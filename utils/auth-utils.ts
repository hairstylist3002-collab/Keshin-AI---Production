export interface AuthError {
  message: string
  code?: string
  type?: 'auth' | 'validation' | 'network' | 'server' | 'client'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  recoverable?: boolean
  retryable?: boolean
}

export type ErrorCategory =
  | 'AUTHENTICATION'
  | 'VALIDATION'
  | 'NETWORK'
  | 'SERVER'
  | 'CLIENT'
  | 'PROCESSING'
  | 'CREDIT'
  | 'FILE_UPLOAD'
  | 'UNKNOWN'

export interface AppError {
  category: ErrorCategory
  message: string
  userMessage: string
  code?: string
  type?: 'error' | 'warning' | 'info'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  recoverable?: boolean
  retryable?: boolean
  metadata?: Record<string, any>
}

export function getAuthErrorMessage(error: any): AuthError {
  if (!error) return { message: 'An unknown error occurred', type: 'auth', severity: 'medium' }

  // Handle Supabase specific errors
  switch (error.message) {
    case 'Invalid login credentials':
      return {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        type: 'auth',
        severity: 'medium',
        recoverable: true
      }
    case 'Email not confirmed':
      return {
        message: 'Please verify your email before signing in',
        code: 'EMAIL_NOT_CONFIRMED',
        type: 'auth',
        severity: 'medium',
        recoverable: true
      }
    case 'User already registered':
      return {
        message: 'This user already exists',
        code: 'USER_ALREADY_EXISTS',
        type: 'validation',
        severity: 'low',
        recoverable: true
      }
    case 'Password should be at least 6 characters':
      return {
        message: 'Password must be at least 6 characters long',
        code: 'PASSWORD_TOO_SHORT',
        type: 'validation',
        severity: 'low',
        recoverable: true
      }
    case 'Invalid email':
      return {
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
        type: 'validation',
        severity: 'low',
        recoverable: true
      }
    case 'Network request failed':
      return {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
        type: 'network',
        severity: 'high',
        recoverable: true,
        retryable: true
      }
    case 'Failed to fetch':
      return {
        message: 'Unable to connect to server',
        code: 'CONNECTION_ERROR',
        type: 'network',
        severity: 'high',
        recoverable: true,
        retryable: true
      }
    default:
      // Handle other potential Supabase errors
      if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        return {
          message: 'Connection error. Please check your internet and try again.',
          code: 'NETWORK_ERROR',
          type: 'network',
          severity: 'high',
          recoverable: true,
          retryable: true
        }
      }

      return {
        message: error.message || 'An error occurred during authentication',
        type: 'auth',
        severity: 'medium',
        recoverable: true
      }
  }
}

export function categorizeError(error: any): AppError {
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch') || error.message?.includes('Network request failed')) {
    return {
      category: 'NETWORK',
      message: error.message,
      userMessage: 'Connection error. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      type: 'error',
      severity: 'high',
      recoverable: true,
      retryable: true
    }
  }

  // File upload errors
  if (error.message?.includes('File too large') || error.message?.includes('Invalid file type')) {
    return {
      category: 'FILE_UPLOAD',
      message: error.message,
      userMessage: error.message.includes('File too large')
        ? 'File size exceeds the maximum limit. Please choose a smaller file.'
        : 'Invalid file type. Please upload a valid image file.',
      code: 'FILE_ERROR',
      type: 'error',
      severity: 'medium',
      recoverable: true
    }
  }

  // Processing errors
  if (error.message?.includes('processing') || error.message?.includes('generate')) {
    return {
      category: 'PROCESSING',
      message: error.message,
      userMessage: 'Unable to process your request. Please try again.',
      code: 'PROCESSING_ERROR',
      type: 'error',
      severity: 'medium',
      recoverable: true,
      retryable: true
    }
  }

  // Credit errors
  if (error.message?.includes('credit') || error.message?.includes('Insufficient')) {
    return {
      category: 'CREDIT',
      message: error.message,
      userMessage: 'Insufficient credits. Please purchase more credits to continue.',
      code: 'INSUFFICIENT_CREDITS',
      type: 'warning',
      severity: 'medium',
      recoverable: true
    }
  }

  // Authentication errors (use existing handler)
  if (error.message?.includes('Invalid login') || error.message?.includes('Email not confirmed') ||
      error.message?.includes('User already') || error.message?.includes('Password') ||
      error.message?.includes('email')) {
    const authError = getAuthErrorMessage(error)
    return {
      category: 'AUTHENTICATION',
      message: authError.message,
      userMessage: authError.message,
      code: authError.code,
      type: 'error',
      severity: authError.severity,
      recoverable: authError.recoverable
    }
  }

  // Server errors
  if (error.status >= 500 || error.message?.includes('Internal server error')) {
    return {
      category: 'SERVER',
      message: error.message,
      userMessage: 'Server error occurred. Please try again later.',
      code: 'SERVER_ERROR',
      type: 'error',
      severity: 'high',
      recoverable: true,
      retryable: true
    }
  }

  // Default unknown error
  return {
    category: 'UNKNOWN',
    message: error.message || 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.',
    code: 'UNKNOWN_ERROR',
    type: 'error',
    severity: 'medium',
    recoverable: true,
    retryable: true
  }
}

export function getErrorIcon(category: ErrorCategory): string {
  switch (category) {
    case 'AUTHENTICATION':
      return '🔐'
    case 'VALIDATION':
      return '⚠️'
    case 'NETWORK':
      return '🌐'
    case 'SERVER':
      return '🖥️'
    case 'CLIENT':
      return '💻'
    case 'PROCESSING':
      return '⚙️'
    case 'CREDIT':
      return '💳'
    case 'FILE_UPLOAD':
      return '📁'
    default:
      return '❓'
  }
}

export function getErrorColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    case 'medium':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'high':
      return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'critical':
      return 'text-red-500 bg-red-600/10 border-red-600/20'
    default:
      return 'text-red-400 bg-red-500/10 border-red-500/20'
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password should contain both uppercase and lowercase letters' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password should contain at least one number' }
  }
  
  return { isValid: true }
}

export function validateName(name: string): { isValid: boolean; message?: string } {
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' }
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return { isValid: false, message: 'Name should only contain letters and spaces' }
  }
  
  return { isValid: true }
}
