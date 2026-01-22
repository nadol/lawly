# Middleware Route Protection Implementation Plan

## 1. Overview

This plan describes the extension of the existing Astro middleware to implement route protection for the Lawly application. The middleware will verify user authentication using Supabase Auth and redirect unauthenticated users to the login page when accessing protected routes.

**Key objectives:**
- Protect application routes requiring authentication
- Allow public access to login and OAuth callback routes
- Prevent redirect loops for authenticated users
- Attach user information to request context for downstream use
- Fix cookie handling to comply with `@supabase/ssr` best practices

---

## 2. Current Implementation Analysis

### Existing Code (`src/middleware/index.ts`)

```typescript
export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key) { return context.cookies.get(key)?.value; },
        set(key, value, options) { context.cookies.set(key, value, options); },
        remove(key, options) { context.cookies.delete(key, options); },
      },
    }
  );
  return next();
});
```

### Issues Identified

1. **Cookie Handling Violation**: Uses individual `get`, `set`, `remove` methods instead of required `getAll`/`setAll` pattern
2. **No Route Protection**: All routes are accessible without authentication
3. **Synchronous Execution**: Middleware is not `async`, but `getUser()` requires async
4. **Missing User Context**: User object not attached to `context.locals`

### Extension Points

- Convert to `async` middleware
- Add route classification logic before Supabase client creation
- Implement authentication check after client initialization
- Attach user to `context.locals` for protected routes

---

## 3. Route Classification

### Public Paths (No Authentication Required)

| Path | Purpose |
|------|---------|
| `/login` | Login page with Google OAuth button |
| `/auth/callback` | OAuth callback handler from Google |

### Protected Paths (Authentication Required)

| Path | Purpose | Additional Logic |
|------|---------|------------------|
| `/` | Main page with session list | None |
| `/welcome` | Welcome screen for new users | Page-level check for `has_seen_welcome` |
| `/wizard` | Question wizard | None |
| `/sessions/*` | Session details | RLS handles data isolation |

### API Routes Classification

| Pattern | Protection | Notes |
|---------|------------|-------|
| `/api/profile` | Protected | Already checks auth in endpoint |
| `/api/sessions` | Protected | Already checks auth in endpoint |
| `/api/sessions/*` | Protected | Already checks auth in endpoint |

**Decision**: API routes will be protected by middleware for consistent security. Individual endpoints may perform additional checks.

### Special Cases

1. **Logged-in user accessing `/login`**: Redirect to `/` to prevent confusion
2. **`/auth/callback`**: Always accessible (handles OAuth flow)
3. **Static assets**: Excluded from middleware (Astro handles automatically)

---

## 4. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIDDLEWARE AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

[Request] ──▶ [Middleware]
                   │
                   ▼
         ┌─────────────────┐
         │ Is /auth/callback│──── YES ──▶ [Create Supabase Client] ──▶ [next()]
         │     path?        │
         └─────────────────┘
                   │ NO
                   ▼
         [Create Supabase Client with getAll/setAll]
                   │
                   ▼
         [await supabase.auth.getUser()]
                   │
                   ▼
         ┌─────────────────┐
         │   User exists?  │
         └─────────────────┘
              │         │
            YES         NO
              │         │
              ▼         ▼
    ┌──────────────┐  ┌──────────────────┐
    │ Is /login    │  │ Is protected     │
    │ path?        │  │ path?            │
    └──────────────┘  └──────────────────┘
         │    │            │         │
       YES    NO         YES        NO
         │    │            │         │
         ▼    ▼            ▼         ▼
    [Redirect  [Attach   [Redirect  [next()]
     to /]     user to   to /login]
               locals]
                   │
                   ▼
              [next()]
```

### Flow Steps

1. **Callback Exemption**: `/auth/callback` always proceeds (OAuth flow requires unauthenticated access to set cookies)
2. **Client Creation**: Create Supabase server client with proper cookie handling
3. **User Verification**: Call `supabase.auth.getUser()` to verify session
4. **Authenticated User on Login Page**: Redirect to `/` to prevent confusion
5. **Unauthenticated on Protected Route**: Redirect to `/login`
6. **Attach User**: For authenticated requests, attach user to `context.locals.user`

---

## 5. Type Definitions Updates

### Changes to `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User;  // <-- ADD: Optional user from auth.getUser()
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Type Details

- `user?: User` - Optional because unauthenticated requests on public routes won't have a user
- Using `User` type from `@supabase/supabase-js` for full user object access
- Downstream code can check `Astro.locals.user` for authentication status

---

## 6. Error Handling

### Error Scenarios and Handling

| Scenario | Detection | Handling |
|----------|-----------|----------|
| Expired Session | `getUser()` returns `{ user: null }` | Redirect to `/login` |
| Invalid Token | `getUser()` returns `{ user: null, error }` | Redirect to `/login` |
| Network Error | `getUser()` throws or returns error | Redirect to `/login` |
| Missing Supabase Env Vars | Client creation fails | Application fails to start (expected) |

### Error Handling Strategy

```typescript
const { data: { user }, error } = await supabase.auth.getUser();

// Both error and missing user treated as unauthenticated
if (error || !user) {
  if (isProtectedPath(pathname)) {
    return context.redirect('/login');
  }
}
```

### Logging Considerations

For MVP, no explicit error logging is implemented. Errors are handled gracefully by redirecting to login. Future enhancement could add:
- Console logging in development
- Structured logging for production debugging

---

## 7. Security Considerations

### Cookie Security

The implementation must use secure cookie options:

```typescript
const cookieOptions = {
  path: '/',
  secure: true,      // HTTPS only
  httpOnly: true,    // Not accessible via JavaScript
  sameSite: 'lax',   // CSRF protection
};
```

### Session Validation

- **Use `getUser()` not `getSession()`**: `getUser()` validates the JWT with Supabase servers, while `getSession()` only reads from cookies without validation
- **Server-side verification**: All authentication checks happen server-side before rendering

### Redirect Security

- Redirect URLs are hardcoded (`/login`, `/`) to prevent open redirect vulnerabilities
- No user-supplied redirect parameters are used

### Protected by Default

The middleware implements a "protected by default" approach:
- Explicitly list public paths
- All other paths require authentication
- API routes included in protection

---

## 8. Implementation Steps

### Step 1: Update Cookie Handling in Supabase Client Creation

Refactor cookie handling to use `getAll`/`setAll` pattern as required by `@supabase/ssr`:

```typescript
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

const cookieOptions = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax' as const,
};

context.locals.supabase = createServerClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY,
  {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options)
        );
      },
    },
  }
);
```

### Step 2: Define Route Classification

```typescript
// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/auth/callback'];

// Helper to check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
}
```

### Step 3: Convert to Async Middleware

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // ... implementation
});
```

### Step 4: Implement Authentication Check

```typescript
// Skip auth for callback (needs to set cookies)
if (context.url.pathname === '/auth/callback') {
  // Still create client for cookie handling
  context.locals.supabase = createServerClient<Database>(...);
  return next();
}

// Create Supabase client
context.locals.supabase = createServerClient<Database>(...);

// Get user from session
const { data: { user }, error } = await context.locals.supabase.auth.getUser();

if (user) {
  // Authenticated user on login page -> redirect to home
  if (context.url.pathname === '/login') {
    return context.redirect('/');
  }

  // Attach user to context
  context.locals.user = user;
} else {
  // Unauthenticated user on protected route -> redirect to login
  if (!isPublicPath(context.url.pathname)) {
    return context.redirect('/login');
  }
}

return next();
```

### Step 5: Update Type Definitions

Add `user?: User` to `App.Locals` in `src/env.d.ts` as described in Section 5.

### Step 6: Update Existing Pages

Remove redundant auth checks from pages that are now protected by middleware:
- Pages can trust `Astro.locals.user` exists on protected routes
- Keep auth checks only for pages with additional logic (e.g., `/welcome` checks `has_seen_welcome`)

### Step 7: Testing Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| Unauthenticated user visits `/` | Redirected to `/login` |
| Unauthenticated user visits `/login` | Page renders |
| Authenticated user visits `/login` | Redirected to `/` |
| Authenticated user visits `/` | Page renders, `locals.user` available |
| OAuth callback with code | Session established, redirect works |
| Expired session on protected route | Redirected to `/login` |
| API request without auth | Returns 401 (endpoint handles) |

---

## Complete Implementation Code

### `src/middleware/index.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { defineMiddleware } from 'astro:middleware';

import type { Database } from '../db/database.types';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/auth/callback'];

// Cookie options for Supabase auth
const cookieOptions: CookieOptions = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

// Parse cookie header into array format required by getAll
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name: name || '', value: rest.join('=') };
  }).filter(cookie => cookie.name);
}

// Check if path is public (no auth required)
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Create Supabase client with proper cookie handling
  context.locals.supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always allow auth callback (it needs to process the OAuth code)
  if (pathname === '/auth/callback') {
    return next();
  }

  // Get authenticated user
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();

  if (user) {
    // Authenticated user trying to access login page -> redirect to home
    if (pathname === '/login') {
      return context.redirect('/');
    }

    // Attach user to context for downstream use
    context.locals.user = user;
  } else {
    // Unauthenticated user on protected route -> redirect to login
    if (!isPublicPath(pathname)) {
      return context.redirect('/login');
    }
  }

  return next();
});
```

---

## Notes for Implementation

1. **Test OAuth Flow**: After implementing, test the complete OAuth flow to ensure cookies are set correctly during callback
2. **Session Refresh**: Supabase handles token refresh automatically through the cookie mechanism
3. **Performance**: The `getUser()` call adds latency, but is acceptable for 1-10 users per day
4. **API Routes**: Consider whether API routes should return 401 JSON response instead of redirect (current implementation redirects, endpoints handle their own auth)
