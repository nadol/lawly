# View Implementation Plan: Dashboard (Main View)

## 1. Overview

The Dashboard is the central hub of the Lawly application, serving as the main entry point for authenticated users. It provides session management capabilities, including viewing session history, starting new sessions, and displaying a welcome screen for first-time users. The view implements a two-column layout with a sidebar containing the session list and a main content area.

Key responsibilities:
- Display session history in a paginated sidebar (20% width)
- Provide "New Session" action button prominently placed
- Show welcome screen for first-time users (based on `has_seen_welcome` flag)
- Handle logout functionality via header navigation
- Provide empty state messaging when no sessions exist

## 2. View Routing

| Attribute | Value |
|-----------|-------|
| **Path** | `/` |
| **File** | `src/pages/index.astro` |
| **Layout** | `src/layouts/AuthLayout.astro` (modified) |
| **Auth Required** | Yes (handled by middleware) |

The view will be rendered at the root path (`/`) and requires authentication. The existing middleware already handles redirects for unauthenticated users.

## 3. Component Structure

```
index.astro (Astro Page)
└── DashboardLayout.astro (New Layout)
    ├── Header (existing MainNav)
    │   ├── Logo
    │   └── UserMenu (existing)
    │       └── LogoutButton (existing)
    │
    └── DashboardContent (React, client:load)
        ├── Sidebar
        │   ├── NewSessionButton
        │   ├── SessionList
        │   │   ├── SessionListSkeleton (conditional, during loading)
        │   │   ├── SessionCard (multiple, when sessions exist)
        │   │   └── EmptyState (conditional, when no sessions)
        │   └── LoadMoreButton (conditional, when hasMore)
        │
        └── MainContent
            └── WelcomeOverlay (conditional, first-time users)
                └── WelcomeCard (existing, reused)
```

## 4. Component Details

### 4.1 DashboardLayout.astro

- **Description**: Astro layout component that wraps the dashboard page with the two-column structure. Extends the existing AuthLayout with sidebar support.
- **Main elements**: `<header>` with MainNav, `<div class="flex">` containing `<aside>` (sidebar) and `<main>` (content area)
- **Handled interactions**: None (static layout)
- **Handled validation**: Authentication check (existing from AuthLayout)
- **Types**: None
- **Props**:
  - `title?: string` - Page title (default: "Lawly")
  - `userEmail: string | null` - User email for header display

### 4.2 DashboardContent

- **Description**: Main React container component that orchestrates the dashboard state and renders Sidebar and MainContent areas. Acts as the state provider for child components.
- **Main elements**: `<div className="flex h-[calc(100vh-64px)]">` containing Sidebar and MainContent
- **Handled interactions**:
  - Initial data fetching on mount (profile and sessions)
  - Coordinates state between child components
- **Handled validation**: None (delegates to hooks)
- **Types**:
  - `ProfileResponse` (from API)
  - `SessionsListResponse` (from API)
  - `DashboardState` (internal ViewModel)
- **Props**:
  - `initialHasSeenWelcome: boolean` - Server-side fetched welcome state

### 4.3 Sidebar

- **Description**: Container component for the session list area (20% width). Contains the new session button at the top, followed by the session list with pagination.
- **Main elements**: `<aside className="w-1/5 min-w-[280px] border-r bg-muted/30 flex flex-col">` containing NewSessionButton, SessionList, and LoadMoreButton
- **Handled interactions**: None (delegates to children)
- **Handled validation**: None
- **Types**:
  - `SessionCardViewModel[]`
  - `SessionsState`
- **Props**:
  - `sessions: SessionCardViewModel[]` - Array of session view models
  - `isLoading: boolean` - Initial loading state
  - `isLoadingMore: boolean` - Pagination loading state
  - `hasMore: boolean` - Whether more sessions available
  - `error: string | null` - Error message if fetch failed
  - `onLoadMore: () => void` - Callback for pagination
  - `onRetry: () => void` - Callback for error retry

### 4.4 NewSessionButton

- **Description**: Primary action button to start a new wizard session. Navigates to `/wizard` without creating any database records.
- **Main elements**: `<Button size="lg" className="w-full">` with icon
- **Handled interactions**:
  - `onClick`: Navigate to `/wizard` via `window.location.assign('/wizard')`
- **Handled validation**: None
- **Types**: None
- **Props**:
  - `className?: string` - Optional additional CSS classes

### 4.5 SessionList

- **Description**: Renders the list of session cards or appropriate state (loading skeleton, empty state, error state).
- **Main elements**: `<div className="flex-1 overflow-y-auto">` containing `<ul role="list">` with SessionCard items
- **Handled interactions**: None (delegates to SessionCard)
- **Handled validation**: None
- **Types**:
  - `SessionCardViewModel[]`
- **Props**:
  - `sessions: SessionCardViewModel[]` - Sessions to display
  - `isLoading: boolean` - Show skeleton during initial load
  - `error: string | null` - Error message to display
  - `onRetry: () => void` - Callback for retry button

### 4.6 SessionCard

- **Description**: Individual session item displaying formatted timestamp. Clickable to navigate to session detail view.
- **Main elements**: `<li><a href="/sessions/{id}" className="block p-4 hover:bg-accent">` containing formatted date text
- **Handled interactions**:
  - `onClick` / `onKeyDown`: Navigate to `/sessions/[id]`
- **Handled validation**: None
- **Types**:
  - `SessionCardViewModel`
- **Props**:
  - `session: SessionCardViewModel` - Session data with formatted date

### 4.7 SessionListSkeleton

- **Description**: Loading placeholder shown during initial session fetch. Displays animated skeleton cards.
- **Main elements**: `<div>` containing 5 skeleton card placeholders using Shadcn Skeleton component
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**:
  - `count?: number` - Number of skeleton items (default: 5)

### 4.8 EmptyState

- **Description**: Displayed when user has no completed sessions. Shows encouraging message and CTA.
- **Main elements**: `<div className="flex flex-col items-center p-8 text-center">` with icon, heading, and description
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**:
  - `className?: string` - Optional additional CSS classes

### 4.9 LoadMoreButton

- **Description**: Pagination trigger button to load additional sessions. Shows loading state during fetch.
- **Main elements**: `<Button variant="ghost" size="sm">` with "Pokaż więcej" text
- **Handled interactions**:
  - `onClick`: Call `onLoadMore` callback
- **Handled validation**:
  - Disabled when `isLoading` is true
  - Hidden when `hasMore` is false
- **Types**: None
- **Props**:
  - `isLoading: boolean` - Show loading spinner
  - `hasMore: boolean` - Control visibility
  - `onLoadMore: () => void` - Callback for loading more

### 4.10 MainContent

- **Description**: Main content area (80% width) that displays the welcome overlay for first-time users or placeholder content.
- **Main elements**: `<main className="flex-1 relative">` with conditional WelcomeOverlay
- **Handled interactions**: None (delegates to children)
- **Handled validation**: None
- **Types**: None
- **Props**:
  - `showWelcome: boolean` - Whether to show welcome overlay
  - `onWelcomeAction: (action: 'start' | 'skip') => void` - Callback for welcome actions

### 4.11 WelcomeOverlay

- **Description**: Modal-like overlay displaying the welcome screen for first-time users. Reuses existing WelcomeCard component.
- **Main elements**: `<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">` containing WelcomeCard
- **Handled interactions**: Delegates to WelcomeCard
- **Handled validation**: None
- **Types**: None
- **Props**:
  - `onStartSession: () => void` - Callback for "Start session" action
  - `onSkip: () => void` - Callback for "Skip" action

## 5. Types

### 5.1 Existing Types (from `src/types.ts`)

```typescript
// Session summary for list items
interface SessionSummary {
  id: string;
  created_at: string;
  completed_at: string;
}

// Paginated sessions list response
interface SessionsListResponse {
  sessions: SessionSummary[];
  total: number;
  limit: number;
  offset: number;
}

// User profile with welcome flag
type ProfileResponse = Tables<'profiles'>; // includes has_seen_welcome: boolean

// Update profile command
interface UpdateProfileCommand {
  has_seen_welcome: boolean;
}

// Standard API error
interface ErrorResponse {
  error: string;
}
```

### 5.2 New ViewModel Types (create in `src/components/dashboard/types.ts`)

```typescript
/**
 * ViewModel for session display with pre-formatted date.
 * Transforms SessionSummary for UI consumption.
 */
export interface SessionCardViewModel {
  /** Session UUID */
  id: string;
  /** Formatted date string: "DD MMMM YYYY, HH:MM" in Polish locale */
  formattedDate: string;
  /** Original completion timestamp for sorting reference */
  completedAt: Date;
}

/**
 * State for the sessions list with pagination metadata.
 */
export interface SessionsState {
  /** List of session view models */
  sessions: SessionCardViewModel[];
  /** Total number of user's sessions */
  total: number;
  /** Current offset for pagination */
  offset: number;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether pagination load is in progress */
  isLoadingMore: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether more sessions are available */
  hasMore: boolean;
}

/**
 * State for the dashboard profile data.
 */
export interface ProfileState {
  /** Whether user has seen welcome screen */
  hasSeenWelcome: boolean;
  /** Whether profile is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

/**
 * Props for DashboardContent component.
 */
export interface DashboardContentProps {
  /** Server-side fetched welcome state for initial render */
  initialHasSeenWelcome: boolean;
}

/**
 * Props for Sidebar component.
 */
export interface SidebarProps {
  sessions: SessionCardViewModel[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
}

/**
 * Props for SessionList component.
 */
export interface SessionListProps {
  sessions: SessionCardViewModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * Props for SessionCard component.
 */
export interface SessionCardProps {
  session: SessionCardViewModel;
}

/**
 * Props for LoadMoreButton component.
 */
export interface LoadMoreButtonProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

/**
 * Props for MainContent component.
 */
export interface MainContentProps {
  showWelcome: boolean;
  onWelcomeAction: (action: 'start' | 'skip') => void;
}
```

### 5.3 Hook Return Types (create in `src/components/hooks/types.ts` or extend existing)

```typescript
/**
 * Return type for useSessions hook.
 */
export interface UseSessionsReturn {
  /** List of session view models */
  sessions: SessionCardViewModel[];
  /** Total number of sessions */
  total: number;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether pagination load is in progress */
  isLoadingMore: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether more sessions available */
  hasMore: boolean;
  /** Load more sessions (pagination) */
  loadMore: () => Promise<void>;
  /** Retry failed fetch */
  retry: () => Promise<void>;
  /** Refresh all sessions */
  refresh: () => Promise<void>;
}

/**
 * Return type for useProfile hook.
 */
export interface UseProfileReturn {
  /** Whether user has seen welcome */
  hasSeenWelcome: boolean;
  /** Whether profile is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Mark welcome as seen */
  markWelcomeSeen: () => Promise<boolean>;
}
```

## 6. State Management

### 6.1 Custom Hooks

#### useSessions Hook (`src/components/hooks/useSessions.ts`)

Manages session list fetching, pagination, and transformation.

**State Variables:**
- `sessions: SessionCardViewModel[]` - Transformed session list
- `total: number` - Total session count from API
- `offset: number` - Current pagination offset
- `isLoading: boolean` - Initial load state
- `isLoadingMore: boolean` - Pagination load state
- `error: string | null` - Error message

**Key Functions:**
- `fetchSessions(offset: number, append: boolean)` - Internal fetch function
- `loadMore()` - Increment offset and fetch next page
- `retry()` - Retry last failed fetch
- `refresh()` - Reset and fetch from beginning

**Date Formatting:**
```typescript
function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
```

#### useProfile Hook (`src/components/hooks/useProfile.ts`)

Manages profile fetching and welcome state updates. Can leverage existing `useWelcome` hook logic.

**State Variables:**
- `hasSeenWelcome: boolean` - Welcome screen flag
- `isLoading: boolean` - Fetch state
- `error: string | null` - Error message

**Key Functions:**
- `fetchProfile()` - Initial profile fetch
- `markWelcomeSeen()` - Call PATCH /api/profile

### 6.2 State Flow

1. **Initial Load (Astro page)**:
   - Fetch profile server-side to get `has_seen_welcome`
   - Pass as `initialHasSeenWelcome` prop to DashboardContent

2. **Client Hydration**:
   - `useSessions` fetches initial session list
   - `useProfile` syncs with server-side state

3. **User Actions**:
   - "Load More" → `useSessions.loadMore()` → append to list
   - "Start Session" (welcome) → `useProfile.markWelcomeSeen()` → navigate
   - "Skip" (welcome) → `useProfile.markWelcomeSeen()` → hide overlay

## 7. API Integration

### 7.1 GET /api/sessions

**Purpose**: Fetch paginated session list for sidebar

**Request**:
```typescript
const response = await fetch(`/api/sessions?limit=${limit}&offset=${offset}`);
```

**Parameters**:
- `limit`: Number (1-50, default 10)
- `offset`: Number (default 0)

**Response Type**: `SessionsListResponse`
```typescript
{
  sessions: SessionSummary[];
  total: number;
  limit: number;
  offset: number;
}
```

**Error Handling**:
- 400: Invalid parameters → Show validation error
- 401: Unauthorized → Redirect to login
- 500: Server error → Show generic error with retry

### 7.2 GET /api/profile

**Purpose**: Check welcome screen status on initial load

**Request**:
```typescript
const response = await fetch('/api/profile');
```

**Response Type**: `ProfileResponse`
```typescript
{
  id: string;
  user_id: string;
  has_seen_welcome: boolean;
  created_at: string;
  updated_at: string;
}
```

**Error Handling**:
- 401: Unauthorized → Redirect to login
- 404: Profile not found → Default to showing welcome
- 500: Server error → Default to showing welcome (graceful degradation)

### 7.3 PATCH /api/profile

**Purpose**: Mark welcome screen as seen

**Request**:
```typescript
const response = await fetch('/api/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ has_seen_welcome: true }),
});
```

**Request Type**: `UpdateProfileCommand`
```typescript
{ has_seen_welcome: boolean }
```

**Response Type**: `ProfileResponse`

**Error Handling**:
- Navigate regardless of API result (graceful degradation)
- Log warning on failure for debugging

## 8. User Interactions

### 8.1 Session List Interactions

| Action | Trigger | Outcome |
|--------|---------|---------|
| View session | Click SessionCard | Navigate to `/sessions/[id]` |
| Load more | Click LoadMoreButton | Fetch next page, append to list |
| Retry fetch | Click retry button | Re-fetch sessions |
| Keyboard nav | Tab + Enter on SessionCard | Navigate to session detail |

### 8.2 New Session Interactions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Start new session | Click NewSessionButton | Navigate to `/wizard` |
| Keyboard activation | Enter/Space on button | Navigate to `/wizard` |

### 8.3 Welcome Screen Interactions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Start first session | Click "Rozpocznij pierwszą sesję" | Mark welcome seen → Navigate to `/wizard` |
| Skip welcome | Click "Przejdź do aplikacji" | Mark welcome seen → Close overlay |
| Keyboard activation | Enter/Space on buttons | Same as click |

### 8.4 Header Interactions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Logout | Click LogoutButton | Sign out → Redirect to `/login` |
| Go home | Click logo | Navigate to `/` |

## 9. Conditions and Validation

### 9.1 Welcome Screen Display

**Condition**: Show welcome overlay when `profile.has_seen_welcome === false`

**Affected Components**: DashboardContent, MainContent, WelcomeOverlay

**Interface State**:
- When true: Show WelcomeOverlay with backdrop blur over main content
- When false: Show normal dashboard content
- On error: Default to showing welcome (safer UX)

### 9.2 Session List States

**Empty State Condition**: `sessions.length === 0 && !isLoading && !error`

**Affected Components**: SessionList, EmptyState

**Interface State**:
- Show EmptyState component with encouraging message
- Keep NewSessionButton visible and prominent

**Loading State Condition**: `isLoading === true`

**Affected Components**: SessionList, SessionListSkeleton

**Interface State**:
- Show skeleton loader with 5 placeholder items
- NewSessionButton remains enabled

**Error State Condition**: `error !== null`

**Affected Components**: SessionList

**Interface State**:
- Show error message with retry button
- NewSessionButton remains enabled

### 9.3 Pagination Visibility

**Condition**: Show LoadMoreButton when `hasMore === true && !isLoading`

**Calculation**: `hasMore = sessions.length < total`

**Interface State**:
- Button visible: Can load more sessions
- Button loading: `isLoadingMore === true` → show spinner, disable button
- Button hidden: No more sessions to load

### 9.4 API Parameter Validation

**Handled by API**, but frontend should:
- Always send valid `limit` (10) and `offset` (0, 10, 20, ...)
- Track offset internally in hook state

## 10. Error Handling

### 10.1 Session Fetch Errors

**Scenario**: GET /api/sessions fails (network, 500, etc.)

**Handling**:
```typescript
// In useSessions hook
catch (error) {
  setError('Nie można załadować historii sesji. Spróbuj ponownie.');
  setIsLoading(false);
  setIsLoadingMore(false);
  console.error('Sessions fetch error:', error);
}
```

**UI Display**:
- Show error message in SessionList area
- Display "Spróbuj ponownie" button
- Keep NewSessionButton functional

### 10.2 Profile Fetch Errors

**Scenario**: GET /api/profile fails

**Handling**:
```typescript
// In useProfile hook or Astro page
catch (error) {
  console.warn('Profile fetch failed, defaulting to show welcome');
  return { hasSeenWelcome: false }; // Graceful degradation
}
```

**UI Display**:
- Default to showing welcome screen
- No error message displayed (silent failure)

### 10.3 Welcome Update Errors

**Scenario**: PATCH /api/profile fails when marking welcome as seen

**Handling**:
```typescript
// In useProfile.markWelcomeSeen()
const success = await updateProfile();
if (!success) {
  console.warn('Failed to update profile, proceeding with navigation');
}
// Navigate regardless - don't block user
window.location.assign(destination);
```

**UI Display**:
- No error shown to user
- Proceed with navigation
- Welcome may show again on next visit (acceptable UX for MVP)

### 10.4 Load More Errors

**Scenario**: Pagination fetch fails

**Handling**:
```typescript
// In useSessions.loadMore()
catch (error) {
  setError('Nie można załadować więcej sesji.');
  setIsLoadingMore(false);
  // Keep existing sessions visible
}
```

**UI Display**:
- Show toast or inline error
- Existing sessions remain visible
- LoadMoreButton shows retry state

### 10.5 Unauthorized Access

**Scenario**: 401 response from any API

**Handling**:
```typescript
if (response.status === 401) {
  window.location.assign('/login');
  return;
}
```

**UI Display**:
- Redirect to login page immediately

## 11. Implementation Steps

### Step 1: Create Type Definitions

1. Create `src/components/dashboard/types.ts` with all ViewModel and Props interfaces
2. Update `src/components/hooks/types.ts` with hook return types if not already present

### Step 2: Create useSessions Hook

1. Create `src/components/hooks/useSessions.ts`
2. Implement state management for sessions, pagination, loading, and errors
3. Create date formatting utility function with Polish locale
4. Implement `fetchSessions`, `loadMore`, `retry`, and `refresh` functions
5. Test with manual API calls

### Step 3: Update useProfile Hook

1. Review existing `useWelcome` hook implementation
2. Create `src/components/hooks/useProfile.ts` or extend existing hook
3. Implement `fetchProfile` and `markWelcomeSeen` functions
4. Ensure graceful degradation on errors

### Step 4: Create Dashboard UI Components

1. Create `src/components/dashboard/` directory
2. Implement components in order:
   - `EmptyState.tsx`
   - `SessionListSkeleton.tsx`
   - `SessionCard.tsx`
   - `LoadMoreButton.tsx`
   - `SessionList.tsx`
   - `NewSessionButton.tsx`
   - `Sidebar.tsx`
   - `WelcomeOverlay.tsx`
   - `MainContent.tsx`
   - `DashboardContent.tsx`
3. Add barrel export in `src/components/dashboard/index.ts`

### Step 5: Create Dashboard Layout

1. Create `src/layouts/DashboardLayout.astro` extending AuthLayout concepts
2. Add two-column layout structure (sidebar + main)
3. Configure fixed header (64px) and scrollable areas
4. Import and render MainNav component

### Step 6: Update Index Page

1. Modify `src/pages/index.astro` to use new DashboardLayout
2. Fetch profile server-side to get initial `has_seen_welcome` state
3. Render DashboardContent with `client:load` directive
4. Pass `initialHasSeenWelcome` prop

### Step 7: Styling and Responsive Design

1. Implement Tailwind CSS classes for two-column layout
2. Add hover and focus states for interactive elements
3. Ensure proper scrolling behavior in sidebar
4. Add CSS transitions for loading states

### Step 8: Accessibility Improvements

1. Add ARIA labels to interactive elements
2. Implement keyboard navigation for session list
3. Add `role="list"` and `role="listitem"` to session list
4. Ensure focus management when loading more sessions
5. Add skip link to main content (optional)

### Step 9: Testing

1. Test session list loading and pagination
2. Test empty state display
3. Test error handling and retry functionality
4. Test welcome screen flow (first-time and returning users)
5. Test keyboard navigation
6. Test with screen reader (accessibility)

### Step 10: Integration and Polish

1. Connect all components in index.astro
2. Verify data flow from API through hooks to components
3. Test complete user flows
4. Add loading transitions and animations (if needed)
5. Final responsive design adjustments
