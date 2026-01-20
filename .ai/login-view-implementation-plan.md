# View Implementation Plan: Login Page

## 1. Overview

The Login Page is the entry point for user authentication in the Lawly application. It provides a minimal, focused interface for Google SSO authentication using Supabase Auth. The page displays the application branding (logo and tagline) and a single call-to-action button for Google login. After successful authentication, users are redirected based on their profile status: first-time users see the welcome screen, while returning users go directly to the main application.

## 2. View Routing

| Route | Purpose |
|-------|---------|
| `/login` | Main login page with Google SSO button |
| `/auth/callback` | OAuth callback handler that processes the authentication result and redirects appropriately |

## 3. Component Structure

```
/login (Astro Page)
└── LoginLayout (Astro Layout - minimal, no header/sidebar)
    └── LoginCard (React Component - client:load)
        ├── TextLogo (React Component)
        ├── Tagline (React Component)
        └── GoogleLoginButton (React Component)
            └── Button (Shadcn/ui)

/auth/callback (Astro Page)
└── Server-side logic only (no UI components)
```

## 4. Component Details

### 4.1 LoginPage (`src/pages/login.astro`)

- **Component description**: Astro page that serves as the login route. It checks if the user is already authenticated and redirects to the main app if so. Otherwise, it renders the login UI using a minimal layout.
- **Main elements**:
  - `LoginLayout` component wrapping the page
  - `LoginCard` React component with `client:load` directive
- **Handled interactions**: None (static page, interactions handled by child components)
- **Handled validation**: Server-side check for existing authentication session
- **Types**: None specific
- **Props**: None

### 4.2 LoginLayout (`src/layouts/LoginLayout.astro`)

- **Component description**: Minimal Astro layout specifically for the login page. Provides full-page centered layout without header or sidebar, with appropriate meta tags and styling.
- **Main elements**:
  - `<html>`, `<head>`, `<body>` structure
  - Centered container with flexbox
  - Background styling (optional subtle gradient or solid color)
  - `<slot />` for page content
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: `LoginLayoutProps`
- **Props**:
  - `title?: string` - Page title (default: "Zaloguj się - Lawly")

### 4.3 LoginCard (`src/components/auth/LoginCard.tsx`)

- **Component description**: Main React component containing the login UI. Manages authentication state and orchestrates the login flow. Uses Supabase client for OAuth initiation.
- **Main elements**:
  - Container `<div>` with card styling (white background, shadow, rounded corners)
  - `TextLogo` component
  - `Tagline` component
  - `GoogleLoginButton` component
  - Error message display area (conditional)
- **Handled interactions**:
  - Receives login initiation from `GoogleLoginButton`
  - Handles authentication errors
- **Handled validation**: None direct (delegated to Supabase Auth)
- **Types**: `LoginCardProps`, `AuthError`
- **Props**:
  - `redirectUrl: string` - OAuth callback URL

### 4.4 TextLogo (`src/components/auth/TextLogo.tsx`)

- **Component description**: Application logo displayed as styled text. Uses brand typography (32px, blue color as specified in view description).
- **Main elements**:
  - `<h1>` element with brand name "Lawly"
  - Styled with Tailwind classes for size (text-3xl/32px) and color (blue-600)
- **Handled interactions**: None (static component)
- **Handled validation**: None
- **Types**: None
- **Props**: None

### 4.5 Tagline (`src/components/auth/Tagline.tsx`)

- **Component description**: Brief description of the application purpose displayed below the logo.
- **Main elements**:
  - `<p>` element with descriptive text
  - Text: "Automatyczne generowanie fragmentów SOW dla zespołu sprzedażowego"
- **Handled interactions**: None (static component)
- **Handled validation**: None
- **Types**: None
- **Props**: None

### 4.6 GoogleLoginButton (`src/components/auth/GoogleLoginButton.tsx`)

- **Component description**: Interactive button that triggers Google OAuth flow via Supabase Auth. Manages loading state during authentication and displays appropriate visual feedback.
- **Main elements**:
  - Shadcn `Button` component with Google icon
  - Google icon (SVG or from icon library)
  - Button text: "Zaloguj przez Google"
  - Loading spinner (when `isLoading` is true)
- **Handled interactions**:
  - `onClick`: Initiates Supabase OAuth flow with Google provider
- **Handled validation**: None
- **Types**: `GoogleLoginButtonProps`
- **Props**:
  - `onLogin: () => Promise<void>` - Callback to initiate login
  - `isLoading: boolean` - Loading state indicator
  - `disabled?: boolean` - Disabled state

### 4.7 AuthCallbackPage (`src/pages/auth/callback.astro`)

- **Component description**: Server-side page that handles the OAuth callback from Google. Exchanges the auth code for a session, checks user profile status, and redirects appropriately.
- **Main elements**: None (server-side only)
- **Handled interactions**: None (automatic redirect)
- **Handled validation**:
  - Validates presence of auth code in URL
  - Validates successful session exchange
- **Types**: None
- **Props**: None

## 5. Types

### 5.1 Existing Types (from `src/types.ts`)

```typescript
// Used after authentication to check user status
interface ProfileResponse {
  id: string;
  user_id: string;
  has_seen_welcome: boolean;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: string;
}
```

### 5.2 New Types for Login View

```typescript
// src/components/auth/types.ts

/**
 * Props for the LoginLayout component
 */
interface LoginLayoutProps {
  title?: string;
}

/**
 * Props for the LoginCard component
 */
interface LoginCardProps {
  /** Full URL for OAuth callback redirect */
  redirectUrl: string;
}

/**
 * Props for the GoogleLoginButton component
 */
interface GoogleLoginButtonProps {
  /** Callback function to initiate login flow */
  onLogin: () => Promise<void>;
  /** Whether the login process is in progress */
  isLoading: boolean;
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Authentication error state for display
 */
interface AuthError {
  /** Error message to display to user */
  message: string;
  /** Original error code from Supabase (for logging) */
  code?: string;
}

/**
 * Login state managed by useLogin hook
 */
interface LoginState {
  /** Whether OAuth flow is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: AuthError | null;
}
```

## 6. State Management

### 6.1 Custom Hook: `useLogin`

A custom React hook will manage the login flow state:

```typescript
// src/components/hooks/useLogin.ts

interface UseLoginOptions {
  redirectUrl: string;
}

interface UseLoginReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Current error state */
  error: AuthError | null;
  /** Function to initiate Google OAuth login */
  handleGoogleLogin: () => Promise<void>;
  /** Function to clear error state */
  clearError: () => void;
}
```

**State Variables:**
- `isLoading: boolean` - Tracks whether OAuth flow is in progress. Set to `true` when user clicks login button, reset on error (success redirects away).
- `error: AuthError | null` - Stores authentication error for display. Set when OAuth initiation fails or returns error.

**Implementation Notes:**
- Uses `@supabase/supabase-js` client for OAuth initiation
- Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
- Error handling wraps Supabase errors in user-friendly messages

### 6.2 State Flow

1. **Initial State**: `{ isLoading: false, error: null }`
2. **User clicks login**: `{ isLoading: true, error: null }`
3. **OAuth error**: `{ isLoading: false, error: { message: '...' } }`
4. **OAuth success**: User is redirected (state doesn't matter)

## 7. API Integration

### 7.1 Supabase Auth - OAuth Initiation

**Location**: `LoginCard` component via `useLogin` hook

**Method**: `supabase.auth.signInWithOAuth()`

**Request Configuration**:
```typescript
{
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
}
```

**Response**: Redirects to Google OAuth consent screen (no direct response handling)

**Error Response**: `AuthError` object with `message` and `code` properties

### 7.2 Auth Callback - Session Exchange

**Location**: `src/pages/auth/callback.astro` (server-side)

**Method**: `supabase.auth.exchangeCodeForSession(code)`

**Request**: Auth code from URL query parameter

**Response**: Session object with user data

### 7.3 Profile Check - Post-Authentication

**Location**: `src/pages/auth/callback.astro` (server-side)

**Endpoint**: `GET /api/profile`

**Request Type**: None (uses session cookie)

**Response Type**: `ProfileResponse`

**Response Fields Used**:
- `has_seen_welcome: boolean` - Determines redirect destination

## 8. User Interactions

### 8.1 Click "Zaloguj przez Google" Button

**Trigger**: User clicks the Google login button

**Flow**:
1. Button enters loading state (spinner, disabled)
2. `useLogin.handleGoogleLogin()` is called
3. Supabase OAuth initiates, redirecting to Google
4. User completes Google authentication
5. Google redirects to `/auth/callback`

**Visual Feedback**:
- Button shows loading spinner
- Button text changes to "Logowanie..."
- Button becomes disabled

### 8.2 OAuth Callback Processing

**Trigger**: Redirect from Google OAuth

**Flow**:
1. Server extracts auth code from URL
2. Server exchanges code for session via Supabase
3. Server fetches user profile to check `has_seen_welcome`
4. Server redirects based on profile status:
   - `has_seen_welcome === false` → `/welcome`
   - `has_seen_welcome === true` → `/` (main app)

### 8.3 Error Display Interaction

**Trigger**: OAuth flow fails or returns error

**Flow**:
1. Error is caught in `useLogin` hook
2. Error state is set with user-friendly message
3. Error message appears below login button
4. User can retry by clicking button again

**Visual Feedback**:
- Red error message displayed
- Button returns to normal state (enabled)
- Screen reader announces error

## 9. Conditions and Validation

### 9.1 Pre-Authentication Check

**Location**: `src/pages/login.astro` (server-side)

**Condition**: Check if user already has valid session

**Validation Logic**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  return Astro.redirect('/');
}
```

**Effect**: Authenticated users are immediately redirected to main app

### 9.2 OAuth Callback Validation

**Location**: `src/pages/auth/callback.astro`

**Conditions**:

1. **Auth code presence**:
   - Validation: `code` query parameter must exist
   - Effect: Missing code redirects to `/login?error=missing_code`

2. **Session exchange success**:
   - Validation: `exchangeCodeForSession` must not return error
   - Effect: Error redirects to `/login?error=auth_failed`

3. **Profile existence**:
   - Validation: Profile API must return valid profile
   - Effect: Missing profile might indicate new user (profile should be auto-created via Supabase trigger)

### 9.3 Button State Validation

**Location**: `GoogleLoginButton` component

**Conditions**:
- Button disabled when `isLoading === true`
- Button shows spinner when `isLoading === true`
- Button text changes during loading state

## 10. Error Handling

### 10.1 OAuth Initiation Errors

**Scenario**: Supabase OAuth call fails before redirect

**Handling**:
- Catch error in `useLogin` hook
- Set error state with message: "Nie można rozpocząć logowania. Spróbuj ponownie."
- Log original error to console for debugging
- Reset loading state to allow retry

### 10.2 OAuth Callback Errors

**Scenario**: OAuth returns error (user cancelled, provider error)

**Handling**:
- Check for `error` query parameter in callback URL
- Redirect to `/login?error=<error_code>`
- Login page reads error and displays appropriate message

**Error Messages**:
- `access_denied`: "Logowanie zostało anulowane."
- `auth_failed`: "Nie udało się zalogować. Spróbuj ponownie."
- `missing_code`: "Błąd autoryzacji. Spróbuj ponownie."
- Default: "Wystąpił błąd podczas logowania."

### 10.3 Network Errors

**Scenario**: Network failure during OAuth or API calls

**Handling**:
- Display generic error: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."
- Allow retry via button click

### 10.4 Profile API Errors

**Scenario**: Profile fetch fails after successful authentication

**Handling**:
- Log error for debugging
- Default to redirecting to welcome screen (safe fallback)
- Profile will be created/checked on welcome screen

### 10.5 Error Display Component

**Location**: Inside `LoginCard` component

**Implementation**:
- Conditional render below `GoogleLoginButton`
- Red text color for visibility
- `role="alert"` for screen reader announcement
- Clear error when user initiates new login attempt

## 11. Implementation Steps

### Step 1: Create Auth Types

1. Create `src/components/auth/types.ts`
2. Define all TypeScript interfaces for the login view
3. Export types for use in components

### Step 2: Create LoginLayout

1. Create `src/layouts/LoginLayout.astro`
2. Implement minimal layout with centered content
3. Add appropriate meta tags (title, viewport)
4. Style with Tailwind for full-page centered layout
5. Ensure proper lang attribute for accessibility

### Step 3: Create TextLogo Component

1. Create `src/components/auth/TextLogo.tsx`
2. Implement styled `<h1>` with "Lawly" text
3. Apply brand styling (32px, blue color)
4. Ensure proper heading hierarchy

### Step 4: Create Tagline Component

1. Create `src/components/auth/Tagline.tsx`
2. Add descriptive paragraph text
3. Style with muted color for secondary emphasis

### Step 5: Create useLogin Hook

1. Create `src/components/hooks/useLogin.ts`
2. Implement state management for loading and error
3. Create `handleGoogleLogin` function using Supabase client
4. Create `clearError` helper function
5. Add proper error handling and user-friendly messages

### Step 6: Create GoogleLoginButton Component

1. Create `src/components/auth/GoogleLoginButton.tsx`
2. Use Shadcn `Button` component as base
3. Add Google icon (inline SVG)
4. Implement loading state with spinner
5. Add `autoFocus` for accessibility
6. Ensure high contrast (4.5:1 ratio)

### Step 7: Create LoginCard Component

1. Create `src/components/auth/LoginCard.tsx`
2. Compose `TextLogo`, `Tagline`, and `GoogleLoginButton`
3. Integrate `useLogin` hook
4. Add conditional error display
5. Style with card appearance (shadow, padding, rounded corners)

### Step 8: Create Login Page

1. Create `src/pages/login.astro`
2. Add server-side authentication check (redirect if logged in)
3. Use `LoginLayout`
4. Render `LoginCard` with `client:load`
5. Pass correct `redirectUrl` prop
6. Handle URL error parameters for display

### Step 9: Create Auth Callback Page

1. Create `src/pages/auth/callback.astro`
2. Implement server-side code extraction from URL
3. Exchange code for session using Supabase
4. Fetch user profile via API
5. Implement redirect logic based on `has_seen_welcome`
6. Add error handling with redirect to login

### Step 10: Add Error Query Parameter Handling

1. Update `LoginCard` to read error from URL
2. Map error codes to user-friendly messages
3. Display error on page load if present
4. Clear error on new login attempt

### Step 11: Accessibility Improvements

1. Add `autoFocus` to login button
2. Ensure proper `aria-label` on button
3. Add `role="alert"` to error messages
4. Test keyboard navigation
5. Verify color contrast ratios

### Step 12: Testing

1. Test happy path: login → callback → redirect
2. Test error scenarios: cancelled OAuth, network errors
3. Test already-authenticated redirect
4. Test first-time vs returning user routing
5. Test accessibility with screen reader
6. Test loading states and visual feedback

### Step 13: Export Barrel File

1. Create `src/components/auth/index.ts`
2. Export all auth components for clean imports
