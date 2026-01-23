# Logout Implementation Plan

## 1. Overview

This plan covers the implementation of logout functionality for Lawly MVP (US-003). The implementation includes:

- A `useLogout` hook for managing logout state and Supabase signOut
- A `LogoutButton` React component for the UI
- Type definitions following existing patterns
- Error handling with user-friendly Polish messages

The logout flow: User clicks button → Show loading state → Call `supabase.auth.signOut()` → Redirect to `/login` using `window.location.assign()`.

## 2. Existing Patterns Analysis

### useLogin Hook Patterns to Follow

| Pattern | Implementation in useLogout |
|---------|----------------------------|
| State management | `useState` for `isLoading` and `error` |
| Action function | `useCallback` for `handleLogout` |
| Supabase client | Create inline with `createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY)` |
| Loading state | Set `true` at start, `false` on error (redirect handles success) |
| Error clearing | `setError(null)` at action start |
| Error format | `{ message: string, code?: string }` |
| Return value | Object with state + action functions |

### GoogleLoginButton Patterns to Follow

| Pattern | Implementation in LogoutButton |
|---------|-------------------------------|
| Props | `onLogout`, `isLoading`, `disabled?`, `className?` |
| Button component | Use `Button` from `@/components/ui/button` |
| Loading state | Show spinner + "Wylogowywanie..." text |
| Disabled logic | `disabled={isLoading \|\| disabled}` |
| Accessibility | `aria-label` attribute |
| Click handler | Async function calling `onLogout()` |

## 3. Type Definitions

**File:** `src/components/auth/types.ts`

Add the following types at the end of the existing file:

```typescript
/**
 * Error state for logout operations
 */
export interface LogoutError {
  /** Error message to display to user */
  message: string;
  /** Original error code from Supabase (for logging) */
  code?: string;
}

/**
 * Return type for useLogout hook
 */
export interface UseLogoutReturn {
  /** Whether logout is in progress */
  isLoading: boolean;
  /** Current error state */
  error: LogoutError | null;
  /** Function to initiate logout */
  handleLogout: () => Promise<void>;
}

/**
 * Props for LogoutButton component
 */
export interface LogoutButtonProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional disabled state */
  disabled?: boolean;
}
```

**Note:** `LogoutError` is intentionally separate from `AuthError` for semantic clarity, though they have the same structure. This allows future divergence if needed.

## 4. useLogout Hook Specification

**File:** `src/components/hooks/useLogout.ts`

### Interface

```typescript
function useLogout(): UseLogoutReturn
```

### Implementation Details

1. **State Variables:**
   - `isLoading: boolean` - initialized to `false`
   - `error: LogoutError | null` - initialized to `null`

2. **handleLogout Function:**
   - Wrapped in `useCallback` with empty dependency array
   - Sets `isLoading(true)` and `setError(null)` at start
   - Creates Supabase client using public env vars
   - Calls `supabase.auth.signOut()`
   - On error: logs to console, sets error state, sets `isLoading(false)`
   - On success: calls `window.location.assign('/login')`
   - Note: `isLoading` stays `true` on success (page redirects)

3. **Return Value:**
   ```typescript
   {
     isLoading,
     error,
     handleLogout,
   }
   ```

### Full Implementation

```typescript
import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

import type { LogoutError, UseLogoutReturn } from '../auth/types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

/**
 * Custom hook for managing the logout flow.
 * Handles loading state, error state, and Supabase signOut.
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LogoutError | null>(null);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Logout error:', signOutError);
        setError({
          message: 'Nie udało się wylogować. Spróbuj ponownie.',
          code: signOutError.code,
        });
        setIsLoading(false);
        return;
      }

      // Redirect to login page (full page reload to clear React state)
      window.location.assign('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError({
        message: 'Nie można połączyć z serwerem. Sprawdź połączenie internetowe.',
      });
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    handleLogout,
  };
}
```

## 5. LogoutButton Component Specification

**File:** `src/components/nav/LogoutButton.tsx`

### Props Interface

```typescript
interface LogoutButtonProps {
  className?: string;
  disabled?: boolean;
}
```

### UI States

| State | Visual |
|-------|--------|
| Default | Icon (LogOut) + "Wyloguj" text |
| Loading | Spinner + "Wylogowywanie..." text |
| Disabled | Grayed out, non-interactive |
| Error | Button returns to default, error shown by parent |

### Implementation Details

1. **Uses** `useLogout` hook internally for self-contained logic
2. **Button variant:** `ghost` (subtle, for navigation context)
3. **Icon:** Use `LogOut` from `lucide-react` (already available with shadcn)
4. **Loading spinner:** Reuse pattern from `GoogleLoginButton`
5. **Error display:** Component exposes error via hook, parent decides display

### Full Implementation

```typescript
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLogout } from '../hooks/useLogout';
import type { LogoutButtonProps } from '../auth/types';

/**
 * Loading spinner component (consistent with GoogleLoginButton)
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Logout button component for navigation.
 * Self-contained with internal state management via useLogout hook.
 */
export function LogoutButton({ className, disabled = false }: LogoutButtonProps) {
  const { isLoading, error, handleLogout } = useLogout();

  const handleClick = async () => {
    await handleLogout();
  };

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isLoading || disabled}
        aria-label={isLoading ? 'Wylogowywanie w toku' : 'Wyloguj z aplikacji'}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2 size-4" />
            <span>Wylogowywanie...</span>
          </>
        ) : (
          <>
            <LogOut className="mr-2 size-4" />
            <span>Wyloguj</span>
          </>
        )}
      </Button>
      {error && (
        <div
          role="alert"
          className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive"
        >
          {error.message}
        </div>
      )}
    </div>
  );
}
```

### Index Export File

**File:** `src/components/nav/index.ts`

```typescript
export { LogoutButton } from './LogoutButton';
```

## 6. Error Handling

### Error Scenarios

| Scenario | Detection | User Message |
|----------|-----------|--------------|
| Network error | `catch` block | "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." |
| Supabase error | `signOutError` truthy | "Nie udało się wylogować. Spróbuj ponownie." |
| Already logged out | `signOutError` with specific code | Treat as success (redirect anyway) |

### Error Display

- Error is displayed inline below the button
- Uses `role="alert"` for accessibility
- Styled with `bg-destructive/10` and `text-destructive`
- Automatically cleared when user retries (via `setError(null)` at action start)

### Graceful Degradation

If the signOut API call fails but cookies are cleared locally:
- User may see the error message briefly
- On page refresh or navigation, middleware will detect no session and redirect to login
- This is acceptable for MVP scope

## 7. Implementation Steps

### Step 1: Add Type Definitions

**File:** `src/components/auth/types.ts`

Add `LogoutError`, `UseLogoutReturn`, and `LogoutButtonProps` interfaces at the end of the file.

### Step 2: Create useLogout Hook

**File:** `src/components/hooks/useLogout.ts`

Create the hook following the implementation in section 4.

### Step 3: Create nav Directory and LogoutButton

**Files:**
- `src/components/nav/LogoutButton.tsx`
- `src/components/nav/index.ts`

Create the directory and component following section 5.

### Step 4: Verify lucide-react Availability

Check if `lucide-react` is installed. If not:

```bash
npm install lucide-react
```

Note: `lucide-react` is typically installed with shadcn/ui, so it should already be available.

### Step 5: Manual Testing

1. Navigate to any protected page
2. Click the logout button
3. Verify loading state appears
4. Verify redirect to `/login` occurs
5. Verify session is cleared (try accessing protected page → should redirect to login)

### Step 6: Test Error Handling

1. Disconnect network
2. Click logout button
3. Verify error message appears
4. Reconnect network
5. Click logout again
6. Verify successful logout

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/auth/types.ts` | Modify | Add logout-related types |
| `src/components/hooks/useLogout.ts` | Create | Logout hook with state management |
| `src/components/nav/LogoutButton.tsx` | Create | Logout button component |
| `src/components/nav/index.ts` | Create | Re-exports for nav components |

## Dependencies

- `@supabase/supabase-js` (existing)
- `lucide-react` (should be installed with shadcn/ui)
- `@/components/ui/button` (existing shadcn component)

## Notes for Integration

The `LogoutButton` component is designed to be self-contained and can be placed:
- In a navigation header (`MainNav` component - to be implemented separately)
- In a user dropdown menu
- As a standalone button on any protected page

The component manages its own state and error display, making it easy to drop into any layout without additional wiring.
