# User Data Storage System

## Overview

This system stores user information and credits in Supabase separately from the authentication process. It handles both email/password and Google OAuth authentication methods.

## Architecture

### Files

1. **`lib/userService.ts`** - Core user data management
2. **`lib/authHandler.ts`** - Authentication handlers with data storage
3. **`supabase/migrations/20241002_create_user_profiles.sql`** - Database schema

### Database Schema

The `user_profiles` table stores:
- `id` - UUID (references auth.users)
- `name` - User's full name
- `email` - User's email (unique)
- `credits` - Number of credits (default: 1)
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Features

### 1. Automatic User Profile Creation
- When a new user signs up, a profile is automatically created
- Trigger-based system ensures data consistency
- Default credit value of 1 is assigned

### 2. Email/Password Authentication
- Stores name, email, and credits
- Handles validation and error states
- Automatic redirect to AI hairstylist after success

### 3. Google OAuth Authentication
- Extracts user data from Google profile
- Stores name, email, and credits
- Handles OAuth callback and data storage
- Automatic redirect to AI hairstylist after success

### 4. Credit Management
- Default 1 credit for new users
- Functions to update credits
- Credit tracking and validation

## API Reference

### UserService Functions

```typescript
// Create or update user profile
createOrUpdateUserProfile(userData: CreateUserData)

// Get user profile
getUserProfile(userId: string)

// Update user credits
updateUserCredits(userId: string, credits: number)

// Extract Google user data
extractGoogleUserData(googleUser: any)

// Handle user auth data storage
handleUserAuthData(userId: string, name?: string, email?: string, isGoogleAuth?: boolean)
```

### AuthHandler Functions

```typescript
// Handle email/password signup
handleEmailSignup(email: string, password: string, name: string)

// Handle email/password signin
handleEmailSignin(email: string, password: string)

// Handle Google OAuth signin
handleGoogleSignin()

// Handle OAuth callback
handleOAuthCallback()
```

## Usage Examples

### Email/Password Signup
```typescript
const result = await handleEmailSignup('user@example.com', 'password123', 'John Doe');
if (result.success) {
  // User created and profile stored with 1 credit
  // Redirect to AI hairstylist
}
```

### Google OAuth Signin
```typescript
const result = await handleGoogleSignin();
if (result.success) {
  // OAuth initiated, user will be redirected
  // Profile will be created automatically after callback
}
```

### Get User Credits
```typescript
const profile = await getUserProfile(userId);
if (profile.success) {
  const credits = profile.data?.credits || 0;
}
```

## Security Features

1. **Row Level Security (RLS)** enabled on user_profiles table
2. **Policies** ensure users can only access their own data
3. **Automatic triggers** handle profile creation
4. **Data validation** on all inputs
5. **Error handling** with user-friendly messages

## Database Setup

1. Run the migration in Supabase SQL editor
2. Ensure Google OAuth is configured in Supabase Auth
3. Set up proper redirect URLs
4. Test both authentication methods

## Integration

The system is integrated into:
- `LandingPageNew.tsx` - Authentication forms
- `auth/callback/page.tsx` - OAuth callback handling
- `page.tsx` - Auto-redirect for authenticated users

## Error Handling

All functions return structured results:
```typescript
{
  success: boolean,
  error?: string,
  data?: any
}
```

Errors are logged and handled gracefully without breaking the authentication flow.
