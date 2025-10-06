export interface AuthError {
  message: string
  code?: string
}

export function getAuthErrorMessage(error: any): AuthError {
  if (!error) return { message: 'An unknown error occurred' }
  
  // Handle Supabase specific errors
  switch (error.message) {
    case 'Invalid login credentials':
      return { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }
    case 'Email not confirmed':
      return { message: 'Please verify your email before signing in', code: 'EMAIL_NOT_CONFIRMED' }
    case 'User already registered':
      return { message: 'An account with this email already exists', code: 'USER_ALREADY_EXISTS' }
    case 'Password should be at least 6 characters':
      return { message: 'Password must be at least 6 characters long', code: 'PASSWORD_TOO_SHORT' }
    case 'Invalid email':
      return { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
    default:
      return { message: error.message || 'An error occurred during authentication' }
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
