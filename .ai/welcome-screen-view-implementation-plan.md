# View Implementation Plan: Welcome Screen

## 1. Overview

The Welcome Screen is a one-time onboarding view displayed to first-time users after successful Google OAuth authentication. Its purpose is to introduce new users to the Lawly application, explaining its core functionality (automated SOW fragment generation) and providing clear navigation paths to begin using the app. The view features a centered content card with a welcoming heading, brief app description, a primary call-to-action button to start the first wizard session, and a secondary skip link for users who prefer to explore the app directly.

The welcome screen is controlled by the `has_seen_welcome` flag in the user's profile. Once the user interacts with either button, the profile is updated to mark the welcome as seen, ensuring the screen is never shown again for that user.

## 2. View Routing

| Route | Purpose |
|-------|---------|
| `/welcome` | Welcome screen for first-time users |

**Routing Logic:**
- After OAuth callback (`/auth/callback`), new users with `has_seen_welcome: false` are redirected to `/welcome`
- Returning users with `has_seen_welcome: true` are redirected directly to `/` (main app)
- The `/welcome` page should check authentication status and redirect unauthenticated users to `/login`
- If an already-onboarded user manually navigates to `/welcome`, they should be redirected to `/`

## 3. Component Structure

```
/welcome (Astro Page)
└── WelcomeLayout (Astro Layout - minimal, full-page centered)
    └── WelcomeCard (React Component - client:load)
        ├── WelcomeHeading (React Component)
        ├── WelcomeDescription (React Component)
        ├── CTAButton (React Component)
        │   └── Button (Shadcn/ui)
        └── SkipLink (React Component)
```

## 4. Component Details

### 4.1 WelcomePage (`src/pages/welcome.astro`)

- **Component description**: Astro page that serves as the welcome route for first-time users. It performs server-side authentication and profile checks, redirecting users appropriately based on their authentication and onboarding status.
- **Main elements**:
  - Server-side authentication check
  - Profile status verification (`has_seen_welcome` flag)
  - `WelcomeLayout` component wrapping the page
  - `WelcomeCard` React component with `client:load` directive
- **Handled interactions**: None (static page, interactions handled by child components)
- **Handled validation**:
  - Unauthenticated users → redirect to `/login`
  - Already onboarded users (`has_seen_welcome: true`) → redirect to `/`
- **Types**: None specific
- **Props**: None

### 4.2 WelcomeLayout (`src/layouts/WelcomeLayout.astro`)

- **Component description**: Full-page Astro layout specifically for the welcome screen. Provides a centered, overlay-style layout without header or sidebar, with a subtle background gradient matching the app's branding.
- **Main elements**:
  - `<html>`, `<head>`, `<body>` structure
  - Full-viewport container with centered flexbox
  - Background styling (subtle gradient or solid neutral color)
  - `<slot />` for page content
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: `WelcomeLayoutProps`
- **Props**:
  - `title?: string` - Page title (default: "Witaj w Lawly")

### 4.3 WelcomeCard (`src/components/welcome/WelcomeCard.tsx`)

- **Component description**: Main React component containing the welcome UI. Orchestrates the onboarding flow, manages API calls to mark welcome as seen, and handles navigation. Uses a centered card design with proper focus management.
- **Main elements**:
  - Container `<div>` with card styling (white background, shadow, rounded corners, max-width)
  - `WelcomeHeading` component
  - `WelcomeDescription` component
  - `CTAButton` component
  - `SkipLink` component
  - Error message display area (conditional)
- **Handled interactions**:
  - Receives navigation triggers from `CTAButton` and `SkipLink`
  - Coordinates API calls to update profile
  - Handles loading states during profile update
- **Handled validation**: None direct (API calls handle validation)
- **Types**: `WelcomeCardProps`
- **Props**: None (uses hook for state management)

### 4.4 WelcomeHeading (`src/components/welcome/WelcomeHeading.tsx`)

- **Component description**: Primary heading component displaying "Witaj w Lawly". Uses appropriate heading level (h1) for semantic structure and accessibility.
- **Main elements**:
  - `<h1>` element with welcome text "Witaj w Lawly"
  - Styled with Tailwind for large, bold typography
  - Optional decorative icon or app logo
- **Handled interactions**: None (static component)
- **Handled validation**: None
- **Types**: None
- **Props**: None

### 4.5 WelcomeDescription (`src/components/welcome/WelcomeDescription.tsx`)

- **Component description**: Text component providing 2-3 sentences explaining the application's purpose and value proposition for the sales team.
- **Main elements**:
  - `<p>` element (or multiple `<p>` elements for separate sentences)
  - Copy explaining SOW fragment generation for sales team
  - Styled with muted color for secondary emphasis
- **Handled interactions**: None (static component)
- **Handled validation**: None
- **Types**: None
- **Props**: None

**Suggested Copy:**
> "Lawly automatycznie generuje fragmenty dokumentów SOW na podstawie Twoich odpowiedzi na kilka prostych pytań. Zaoszczędź czas i unikaj spotkań z zespołem prawnym dla rutynowych zapytań."

### 4.6 CTAButton (`src/components/welcome/CTAButton.tsx`)

- **Component description**: Primary call-to-action button that initiates the first wizard session. Triggers profile update and navigation to the wizard upon click.
- **Main elements**:
  - Shadcn `Button` component with `variant="default"` (primary styling)
  - Button text: "Rozpocznij pierwszą sesję"
  - Loading spinner when `isLoading` is true
  - Arrow icon (optional, pointing right)
- **Handled interactions**:
  - `onClick`: Calls `onStartSession` callback to trigger profile update and navigation
- **Handled validation**:
  - Button disabled when `isLoading === true`
- **Types**: `CTAButtonProps`
- **Props**:
  - `onStartSession: () => Promise<void>` - Callback to start wizard
  - `isLoading: boolean` - Loading state indicator

### 4.7 SkipLink (`src/components/welcome/SkipLink.tsx`)

- **Component description**: Secondary action link allowing users to skip the wizard and go directly to the main application (session history view).
- **Main elements**:
  - Styled `<button>` element (semantically a button for action, styled as link)
  - Text: "Przejdź do aplikacji"
  - Underline on hover
  - Muted color for secondary emphasis
- **Handled interactions**:
  - `onClick`: Calls `onSkip` callback to trigger profile update and navigation
- **Handled validation**:
  - Disabled during loading state
- **Types**: `SkipLinkProps`
- **Props**:
  - `onSkip: () => Promise<void>` - Callback to skip welcome
  - `isLoading: boolean` - Loading state indicator

## 5. Types

### 5.1 Existing Types (from `src/types.ts`)

```typescript
/**
 * Response DTO for profile endpoints.
 * Used to check has_seen_welcome status.
 */
interface ProfileResponse {
  id: string;
  has_seen_welcome: boolean;
  created_at: string;
}

/**
 * Command Model for updating profile.
 * Used to mark welcome as seen.
 */
interface UpdateProfileCommand {
  has_seen_welcome: boolean;
}

/**
 * Standard error response from API.
 */
interface ErrorResponse {
  error: string;
}
```

### 5.2 New Types for Welcome View

```typescript
// src/components/welcome/types.ts

/**
 * Props for the WelcomeLayout component
 */
export interface WelcomeLayoutProps {
  /** Page title for browser tab */
  title?: string;
}

/**
 * Props for the CTAButton component
 */
export interface CTAButtonProps {
  /** Callback to initiate first wizard session */
  onStartSession: () => Promise<void>;
  /** Whether the action is in progress */
  isLoading: boolean;
}

/**
 * Props for the SkipLink component
 */
export interface SkipLinkProps {
  /** Callback to skip welcome and go to main app */
  onSkip: () => Promise<void>;
  /** Whether the action is in progress */
  isLoading: boolean;
}

/**
 * State managed by useWelcome hook
 */
export interface WelcomeState {
  /** Whether API call is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: WelcomeError | null;
}

/**
 * Error state for welcome view
 */
export interface WelcomeError {
  /** User-friendly error message */
  message: string;
}
```

## 6. State Management

### 6.1 Custom Hook: `useWelcome`

A custom React hook will manage the welcome flow state and API interactions:

```typescript
// src/components/hooks/useWelcome.ts

interface UseWelcomeReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Current error state */
  error: WelcomeError | null;
  /** Handle "Start First Session" click - updates profile, navigates to wizard */
  handleStartSession: () => Promise<void>;
  /** Handle "Skip" click - updates profile, navigates to main app */
  handleSkip: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}
```

**State Variables:**
- `isLoading: boolean` - Tracks whether profile update API call is in progress
- `error: WelcomeError | null` - Stores API error for display

**Implementation Notes:**
- Both `handleStartSession` and `handleSkip` call `PATCH /api/profile` with `{ has_seen_welcome: true }`
- After successful API call, navigation is performed using `window.location.href`
- `handleStartSession` navigates to `/wizard` (or `/wizard/1` for first question)
- `handleSkip` navigates to `/` (main app with session history)
- If API call fails, error is displayed but navigation can still proceed (graceful degradation)
- Uses native `fetch` API for HTTP requests

### 6.2 State Flow

```
1. Initial State:
   { isLoading: false, error: null }

2. User clicks CTA or Skip:
   { isLoading: true, error: null }

3a. API Success:
   { isLoading: false, error: null }
   → Navigate to destination

3b. API Error:
   { isLoading: false, error: { message: '...' } }
   → Show error, allow retry or proceed anyway

4. User retries:
   → Go to step 2
```

### 6.3 Focus Management

- On component mount, focus should be placed on the `CTAButton` for keyboard accessibility
- Focus should be trapped within the welcome card (modal-like behavior)
- Use `autoFocus` prop on primary button

## 7. API Integration

### 7.1 Update Profile Endpoint

**Endpoint**: `PATCH /api/profile`

**Purpose**: Mark the welcome screen as seen for the authenticated user

**Request Type**: `UpdateProfileCommand`

```typescript
{
  has_seen_welcome: true
}
```

**Response Type**: `ProfileResponse` (200 OK)

```typescript
{
  id: string;
  has_seen_welcome: boolean;
  created_at: string;
}
```

**Error Response Types**:
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database or server error

**Implementation in Hook:**

```typescript
const updateProfile = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ has_seen_welcome: true }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    return true;
  } catch (error) {
    console.error('Profile update error:', error);
    return false;
  }
};
```

### 7.2 Profile Check (Server-Side)

**Endpoint**: `GET /api/profile` (or direct Supabase query)

**Purpose**: Verify user's onboarding status on page load

**Location**: `src/pages/welcome.astro` (server-side)

**Implementation:**

```typescript
// In welcome.astro frontmatter
const { data: profile, error } = await Astro.locals.supabase
  .from('profiles')
  .select('has_seen_welcome')
  .eq('id', user.id)
  .single();

if (profile?.has_seen_welcome) {
  return Astro.redirect('/');
}
```

## 8. User Interactions

### 8.1 Click "Rozpocznij pierwszą sesję" Button

**Trigger**: User clicks the primary CTA button

**Flow**:
1. Button enters loading state (spinner, disabled)
2. `useWelcome.handleStartSession()` is called
3. API call: `PATCH /api/profile` with `{ has_seen_welcome: true }`
4. On success: Navigate to `/wizard` (first question)
5. On error: Display error message, allow retry

**Visual Feedback**:
- Button shows loading spinner replacing icon
- Button becomes disabled (prevents double-click)
- Skip link also becomes disabled during loading

### 8.2 Click "Przejdź do aplikacji" Link

**Trigger**: User clicks the secondary skip link

**Flow**:
1. Both buttons enter loading state
2. `useWelcome.handleSkip()` is called
3. API call: `PATCH /api/profile` with `{ has_seen_welcome: true }`
4. On success: Navigate to `/` (main app with session history)
5. On error: Display error message, allow retry or proceed

**Visual Feedback**:
- Skip link becomes muted/disabled
- CTA button also shows loading state

### 8.3 Error State Interaction

**Trigger**: API call fails

**Flow**:
1. Error message appears below the buttons
2. Both buttons return to enabled state
3. User can retry by clicking either button
4. Optional: "Kontynuuj mimo to" link to proceed without saving

**Visual Feedback**:
- Red error message with icon
- Screen reader announces error (`role="alert"`)

## 9. Conditions and Validation

### 9.1 Authentication Check

**Location**: `src/pages/welcome.astro` (server-side)

**Condition**: User must be authenticated

**Validation Logic**:
```typescript
const { data: { user }, error } = await Astro.locals.supabase.auth.getUser();

if (!user) {
  return Astro.redirect('/login');
}
```

**Effect**: Unauthenticated users are redirected to login page

### 9.2 Onboarding Status Check

**Location**: `src/pages/welcome.astro` (server-side)

**Condition**: User must not have seen welcome (`has_seen_welcome: false`)

**Validation Logic**:
```typescript
const { data: profile } = await Astro.locals.supabase
  .from('profiles')
  .select('has_seen_welcome')
  .eq('id', user.id)
  .single();

if (profile?.has_seen_welcome) {
  return Astro.redirect('/');
}
```

**Effect**: Already onboarded users are redirected to main app

### 9.3 API Request Validation

**Location**: `PATCH /api/profile` endpoint

**Conditions** (handled by existing endpoint):
- Request body must contain `has_seen_welcome` as boolean
- User must be authenticated (cookie session)
- User can only update their own profile (RLS enforcement)

### 9.4 Button State Validation

**Location**: `CTAButton` and `SkipLink` components

**Conditions**:
- Both disabled when `isLoading === true`
- CTA button shows spinner during loading
- Prevents multiple submissions

## 10. Error Handling

### 10.1 Profile Update Errors

**Scenario**: `PATCH /api/profile` returns error

**Possible Causes**:
- Network failure
- Server error (500)
- Unauthorized (session expired)

**Handling**:
```typescript
try {
  await updateProfile();
  navigate(destination);
} catch (error) {
  setError({ message: 'Nie udało się zapisać ustawień. Spróbuj ponownie.' });
  setIsLoading(false);
}
```

**User Recovery Options**:
- Retry by clicking button again
- Proceed anyway (optional link) - navigate without saving

### 10.2 Session Expiration

**Scenario**: User's session expires while on welcome page

**Handling**:
- API returns 401 Unauthorized
- Display error: "Sesja wygasła. Zaloguj się ponownie."
- Redirect to `/login` after short delay or on button click

### 10.3 Network Errors

**Scenario**: No internet connection

**Handling**:
- Catch fetch error
- Display: "Brak połączenia z serwerem. Sprawdź połączenie internetowe."
- Allow retry

### 10.4 Graceful Degradation

**Strategy**: Allow navigation even if profile update fails

**Implementation**:
```typescript
const handleStartSession = async () => {
  setIsLoading(true);
  clearError();

  const success = await updateProfile();

  if (!success) {
    // Log warning but proceed anyway
    console.warn('Failed to update profile, proceeding with navigation');
  }

  // Navigate regardless of API result
  window.location.href = '/wizard';
};
```

**Rationale**: Better UX to let user proceed than block them due to non-critical failure. The welcome screen may show again, but that's acceptable.

### 10.5 Error Display Component

**Location**: Inside `WelcomeCard` component

**Implementation**:
- Conditional render below buttons
- Red background with error icon
- `role="alert"` for accessibility
- Auto-clear after 5 seconds (optional)

## 11. Implementation Steps

### Step 1: Create Welcome Types

1. Create `src/components/welcome/types.ts`
2. Define all TypeScript interfaces:
   - `WelcomeLayoutProps`
   - `CTAButtonProps`
   - `SkipLinkProps`
   - `WelcomeState`
   - `WelcomeError`
3. Export types for use in components

### Step 2: Create WelcomeLayout

1. Create `src/layouts/WelcomeLayout.astro`
2. Implement full-page centered layout
3. Add background styling (subtle gradient or neutral)
4. Set appropriate meta tags (title: "Witaj w Lawly")
5. Include global CSS import
6. Ensure proper `lang="pl"` attribute

### Step 3: Create WelcomeHeading Component

1. Create `src/components/welcome/WelcomeHeading.tsx`
2. Implement `<h1>` with text "Witaj w Lawly"
3. Apply styling: large text (text-3xl or text-4xl), bold, primary color
4. Ensure proper heading hierarchy

### Step 4: Create WelcomeDescription Component

1. Create `src/components/welcome/WelcomeDescription.tsx`
2. Add descriptive paragraph(s) with app explanation
3. Style with muted color (text-muted-foreground)
4. Use appropriate line height for readability

### Step 5: Create useWelcome Hook

1. Create `src/components/hooks/useWelcome.ts`
2. Implement state management (`isLoading`, `error`)
3. Create `handleStartSession` function:
   - Call `PATCH /api/profile`
   - Navigate to `/wizard`
4. Create `handleSkip` function:
   - Call `PATCH /api/profile`
   - Navigate to `/`
5. Create `clearError` helper
6. Add error handling with user-friendly messages

### Step 6: Create CTAButton Component

1. Create `src/components/welcome/CTAButton.tsx`
2. Use Shadcn `Button` with default variant
3. Add button text: "Rozpocznij pierwszą sesję"
4. Implement loading state with spinner
5. Add `autoFocus` for accessibility
6. Style as primary action (full width or prominent)

### Step 7: Create SkipLink Component

1. Create `src/components/welcome/SkipLink.tsx`
2. Implement as `<button>` styled as link
3. Add text: "Przejdź do aplikacji"
4. Style with muted color, underline on hover
5. Disable during loading state

### Step 8: Create WelcomeCard Component

1. Create `src/components/welcome/WelcomeCard.tsx`
2. Compose all child components:
   - `WelcomeHeading`
   - `WelcomeDescription`
   - `CTAButton`
   - `SkipLink`
3. Integrate `useWelcome` hook
4. Add conditional error display
5. Style with card appearance:
   - White background
   - Shadow (`shadow-lg`)
   - Rounded corners (`rounded-xl`)
   - Padding (`p-8`)
   - Max width (`max-w-md`)

### Step 9: Create Welcome Page

1. Create `src/pages/welcome.astro`
2. Add server-side authentication check:
   - Get user from Supabase auth
   - Redirect to `/login` if not authenticated
3. Add server-side profile check:
   - Query `profiles.has_seen_welcome`
   - Redirect to `/` if already onboarded
4. Use `WelcomeLayout`
5. Render `WelcomeCard` with `client:load`

### Step 10: Update Auth Callback (if needed)

1. Verify `/auth/callback.astro` redirects correctly
2. Confirm redirect logic:
   - `has_seen_welcome: false` → `/welcome`
   - `has_seen_welcome: true` → `/`
3. Handle edge cases (profile fetch failure)

### Step 11: Add Accessibility Features

1. Add `autoFocus` to CTAButton
2. Ensure `role="alert"` on error messages
3. Add `aria-live="polite"` for dynamic content
4. Test keyboard navigation (Tab, Enter, Escape)
5. Verify focus trap within card
6. Check color contrast ratios (4.5:1 minimum)

### Step 12: Create Barrel Export

1. Create `src/components/welcome/index.ts`
2. Export all welcome components:
   ```typescript
   export { WelcomeCard } from './WelcomeCard';
   export { WelcomeHeading } from './WelcomeHeading';
   export { WelcomeDescription } from './WelcomeDescription';
   export { CTAButton } from './CTAButton';
   export { SkipLink } from './SkipLink';
   export * from './types';
   ```

### Step 13: Testing

1. **Happy Path Tests**:
   - New user sees welcome screen after login
   - Clicking CTA navigates to wizard
   - Clicking skip navigates to main app
   - Profile updated correctly in database

2. **Edge Cases**:
   - Already onboarded user redirected from `/welcome`
   - Unauthenticated access redirected to login
   - Direct URL access to `/welcome`

3. **Error Scenarios**:
   - API failure during profile update
   - Network timeout
   - Session expiration

4. **Accessibility Tests**:
   - Keyboard navigation works
   - Screen reader announces content correctly
   - Focus management is appropriate

### Step 14: Final Cleanup

1. Remove or update placeholder `Welcome.astro` in components folder
2. Update `src/pages/index.astro` to show main app (not placeholder)
3. Ensure consistent styling with login page
4. Verify mobile responsiveness
5. Test in multiple browsers (Chrome, Firefox, Safari)
