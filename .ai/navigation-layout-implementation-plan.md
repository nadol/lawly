# Navigation and AuthLayout Implementation Plan

## 1. Overview

This plan covers the implementation of the main navigation system and authenticated layout for Lawly MVP. The implementation integrates the existing `LogoutButton` component into a cohesive navigation experience.

**Components to create:**
- `MainNav` - Header navigation with logo and user menu
- `UserMenu` - User info display with logout functionality (imports existing LogoutButton)
- `AuthLayout.astro` - Wrapper layout for all protected pages

**Design principles:**
- Keep components simple and focused (MVP scope)
- Import and reuse existing LogoutButton (do not recreate)
- Follow established patterns from LoginLayout/WelcomeLayout
- Prepare structure for future sidebar integration (per PRD US-005)

## 2. Existing Patterns Analysis

### Layout Patterns (LoginLayout.astro, WelcomeLayout.astro)

| Pattern | Implementation |
|---------|----------------|
| Language | `lang="pl"` (Polish) |
| CSS import | `import "../styles/global.css"` |
| Props interface | `interface Props { title?: string }` |
| Meta description | `"Lawly - Automatyczne generowanie fragmentów SOW"` |
| Structure | `<html>` → `<head>` → `<body>` → `<main>` → `<slot />` |

### React Component Patterns (WelcomeCard.tsx)

| Pattern | Implementation |
|---------|----------------|
| Hook usage | Import and call hook at component top |
| Props destructuring | Direct in function parameters |
| Error display | Conditional render with `role="alert"` |
| Styling | Tailwind classes with Card-like container |

### LogoutButton Integration Points

The existing `LogoutButton` at `src/components/nav/LogoutButton.tsx`:
- Accepts props: `{ className?: string, disabled?: boolean }`
- Is self-contained (uses `useLogout` internally)
- Displays its own error state inline
- Uses `Button` variant="ghost" size="sm"

## 3. Integration with Implemented Components

### LogoutButton Import Strategy

```typescript
// In UserMenu.tsx
import { LogoutButton } from './LogoutButton';
```

### Props Flow

```
AuthLayout.astro (server)
    │
    │ userEmail: string | null
    ▼
MainNav.tsx (client:load)
    │
    │ userEmail: string | null
    ▼
UserMenu.tsx
    │
    │ (no props needed for LogoutButton)
    ▼
LogoutButton.tsx (existing)
```

## 4. Component Hierarchy

```
AuthLayout.astro
├── <header>
│   └── MainNav (React, client:load)
│       ├── Logo (inline, text-based)
│       └── UserMenu
│           ├── UserEmail display
│           └── LogoutButton (imported from ./LogoutButton)
├── <div class="flex">
│   ├── <aside> (placeholder for future sidebar - US-005)
│   └── <main>
│       └── <slot /> (page content)
└── </div>
```

## 5. Type Definitions

**File:** `src/components/nav/types.ts`

```typescript
/**
 * Type definitions for navigation components.
 */

/**
 * Props for MainNav component
 */
export interface MainNavProps {
  /** User's email to display in navigation (null if not available) */
  userEmail: string | null;
}

/**
 * Props for UserMenu component
 */
export interface UserMenuProps {
  /** User's email to display (null to hide email display) */
  email: string | null;
}
```

**Note:** `LogoutButtonProps` already exists in `src/components/auth/types.ts` and will be reused.

## 6. MainNav Component Specification

**File:** `src/components/nav/MainNav.tsx`

### Props Interface

```typescript
interface MainNavProps {
  userEmail: string | null;
}
```

### Structure

```tsx
<nav className="border-b bg-background">
  <div className="container flex h-14 items-center justify-between">
    {/* Logo */}
    <a href="/" className="...">
      Lawly
    </a>

    {/* User Menu */}
    <UserMenu email={userEmail} />
  </div>
</nav>
```

### Implementation Details

1. **Logo**: Simple text link to `/` (matching TextLogo style from auth components)
2. **Container**: Uses standard Tailwind container with flex layout
3. **Height**: Fixed `h-14` (56px) for consistent header height
4. **Border**: Bottom border to separate from content

### Full Implementation

```typescript
import type { MainNavProps } from './types';
import { UserMenu } from './UserMenu';

/**
 * Main navigation component for authenticated pages.
 * Displays logo and user menu with logout functionality.
 */
export function MainNav({ userEmail }: MainNavProps) {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
        >
          Lawly
        </a>

        <UserMenu email={userEmail} />
      </div>
    </nav>
  );
}
```

## 7. UserMenu Component Specification

**File:** `src/components/nav/UserMenu.tsx`

### Props Interface

```typescript
interface UserMenuProps {
  email: string | null;
}
```

### Design Decision: Inline vs Dropdown

For MVP simplicity, use **inline layout** (no dropdown):
- Email displayed as text
- LogoutButton displayed next to email
- Reduces complexity, no additional Shadcn components needed

### Structure

```tsx
<div className="flex items-center gap-4">
  {email && (
    <span className="text-sm text-muted-foreground">
      {email}
    </span>
  )}
  <LogoutButton />
</div>
```

### Full Implementation

```typescript
import { LogoutButton } from './LogoutButton';
import type { UserMenuProps } from './types';

/**
 * User menu component displaying email and logout button.
 * Imports and uses the existing LogoutButton component.
 */
export function UserMenu({ email }: UserMenuProps) {
  return (
    <div className="flex items-center gap-4">
      {email && (
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {email}
        </span>
      )}
      <LogoutButton />
    </div>
  );
}
```

### Responsive Behavior

- Email hidden on mobile (`hidden sm:inline`)
- LogoutButton always visible
- Keeps navigation clean on small screens

## 8. AuthLayout Specification

**File:** `src/layouts/AuthLayout.astro`

### Props Interface

```typescript
interface Props {
  title?: string;
}
```

### Server-Side Logic

1. Get user from Supabase Auth
2. Redirect to `/login` if not authenticated
3. Extract user email for MainNav
4. Render layout with navigation

### Structure

```astro
---
import "../styles/global.css";
import { MainNav } from "../components/nav";

interface Props {
  title?: string;
}

const { title = "Lawly" } = Astro.props;

// Auth check
const { data: { user }, error: authError } =
  await Astro.locals.supabase.auth.getUser();

if (authError || !user) {
  return Astro.redirect('/login');
}

const userEmail = user.email ?? null;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Lawly - Automatyczne generowanie fragmentów SOW" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-background">
    <header>
      <MainNav client:load userEmail={userEmail} />
    </header>

    <div class="flex">
      <!-- Sidebar placeholder for future US-005 implementation -->
      <!-- <aside class="w-64 border-r bg-muted/30">Sidebar</aside> -->

      <main class="flex-1">
        <slot />
      </main>
    </div>
  </body>
</html>
```

### Key Decisions

1. **client:load**: MainNav needs interactivity for logout (React hydration)
2. **Sidebar placeholder**: Commented out, ready for US-005 implementation
3. **Auth redirect**: Server-side redirect to `/login` if not authenticated
4. **Flexible main**: Uses `flex-1` to take remaining space when sidebar is added

## 9. Data Flow

### Server to Client Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ AuthLayout.astro (Server-Side)                                      │
│                                                                     │
│  1. Astro.locals.supabase.auth.getUser()                           │
│     └─► { user: { email: "user@example.com", id: "..." } }         │
│                                                                     │
│  2. Extract email: const userEmail = user.email ?? null;           │
│                                                                     │
│  3. Pass to React: <MainNav client:load userEmail={userEmail} />   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MainNav.tsx (Client-Side, Hydrated)                                │
│                                                                     │
│  Props: { userEmail: string | null }                               │
│                                                                     │
│  Renders: <UserMenu email={userEmail} />                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ UserMenu.tsx (Client-Side)                                         │
│                                                                     │
│  Props: { email: string | null }                                   │
│                                                                     │
│  Renders: {email && <span>{email}</span>}                          │
│           <LogoutButton />  ◄── Imported from ./LogoutButton       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LogoutButton.tsx (Existing, Self-Contained)                        │
│                                                                     │
│  Uses: useLogout() hook internally                                 │
│  Handles: Loading state, error display, redirect                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Approach

1. **Minimal props**: Only pass what's needed (email string)
2. **Server-side auth**: Supabase check happens on server (secure)
3. **Encapsulated logout**: LogoutButton handles its own Supabase client
4. **No prop drilling**: User data doesn't need to go deep

## 10. Implementation Steps

### Step 1: Create Type Definitions

**File:** `src/components/nav/types.ts`

Create the navigation-specific types for `MainNavProps` and `UserMenuProps`.

### Step 2: Create UserMenu Component

**File:** `src/components/nav/UserMenu.tsx`

Create UserMenu that:
- Imports existing `LogoutButton` from `./LogoutButton`
- Displays email conditionally
- Uses responsive hiding for email on mobile

### Step 3: Create MainNav Component

**File:** `src/components/nav/MainNav.tsx`

Create MainNav that:
- Imports and uses `UserMenu`
- Displays logo as link to `/`
- Uses container layout with proper spacing

### Step 4: Update Index Exports

**File:** `src/components/nav/index.ts`

Update to export all navigation components:

```typescript
export { LogoutButton } from './LogoutButton';
export { MainNav } from './MainNav';
export { UserMenu } from './UserMenu';
export type { MainNavProps, UserMenuProps } from './types';
```

### Step 5: Create AuthLayout

**File:** `src/layouts/AuthLayout.astro`

Create the layout that:
- Performs server-side auth check
- Redirects to `/login` if not authenticated
- Renders MainNav with user email
- Provides slot for page content
- Includes sidebar placeholder (commented)

### Step 6: Manual Testing

1. Navigate to a protected page (e.g., `/`)
2. Verify MainNav displays with logo and user email
3. Verify logout button appears and functions correctly
4. Verify redirect to `/login` when not authenticated
5. Verify responsive behavior (email hidden on mobile)

## 11. File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/nav/types.ts` | **Create** | Navigation component types (MainNavProps, UserMenuProps) |
| `src/components/nav/UserMenu.tsx` | **Create** | User menu with email display and LogoutButton import |
| `src/components/nav/MainNav.tsx` | **Create** | Main navigation with logo and UserMenu |
| `src/components/nav/index.ts` | **Modify** | Add exports for MainNav, UserMenu, and types |
| `src/layouts/AuthLayout.astro` | **Create** | Authenticated layout with auth check and MainNav |
| `src/components/nav/LogoutButton.tsx` | Reference | Existing - imported by UserMenu |
| `src/components/hooks/useLogout.ts` | Reference | Existing - used internally by LogoutButton |
| `src/components/auth/types.ts` | Reference | Existing - contains LogoutButtonProps |

## Dependencies

All dependencies are already available:
- `@supabase/supabase-js` (existing)
- `lucide-react` (existing - used by LogoutButton)
- `@/components/ui/button` (existing shadcn component)

## Notes for Future Integration

### Sidebar (US-005)

The AuthLayout includes a commented placeholder for the sidebar:

```astro
<!-- Sidebar placeholder for future US-005 implementation -->
<!-- <aside class="w-64 border-r bg-muted/30">Sidebar</aside> -->
```

When implementing US-005:
1. Uncomment the `<aside>` element
2. Create `SessionSidebar` component
3. Import and render in AuthLayout
4. The `flex` container and `flex-1` on main are already set up

### Navigation Links

Per auth-spec.md, NavLinks are optional. If needed later:
1. Add to MainNav between Logo and UserMenu
2. Create `NavLinks` component
3. Update types with `NavLinksProps` if needed
