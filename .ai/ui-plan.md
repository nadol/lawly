# UI Architecture for Lawly

## 1. UI Structure Overview

Lawly is an internal sales tool that automates SOW (Statement of Work) fragment generation through a 5-question wizard. The UI architecture follows a desktop-first approach with responsive adaptations for tablet and mobile devices.

### Core Architecture Principles

- **Astro 5 + React Islands**: Static shell rendered by Astro with React components for interactive elements (wizard, forms, copy functionality)
- **Component Library**: Shadcn/ui for consistent, accessible component foundation
- **State Management**: React useState for wizard answers (no persistence until completion)
- **Authentication**: Supabase Auth with Google OAuth 2.0
- **Styling**: Tailwind CSS 4 with neutral color palette and blue (#2563eb) accent

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (fixed, 64px desktop / 56px mobile)                  │
│ ┌─────────┐                              ┌────────────────┐ │
│ │  Logo   │                              │ User Dropdown  │ │
│ └─────────┘                              └────────────────┘ │
├──────────────┬──────────────────────────────────────────────┤
│   Sidebar    │                                              │
│    (20%)     │              Main Content                    │
│              │                 (80%)                        │
│ ┌──────────┐ │                                              │
│ │New Sesja │ │                                              │
│ └──────────┘ │                                              │
│              │                                              │
│ Historia (N) │                                              │
│ ┌──────────┐ │                                              │
│ │ Session  │ │                                              │
│ │ Session  │ │                                              │
│ │ Session  │ │                                              │
│ └──────────┘ │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## 2. View List

### 2.1 Login Page

| Attribute | Value |
|-----------|-------|
| **Path** | `/login` |
| **Purpose** | Authenticate users via Google SSO |
| **API Endpoints** | None (Supabase Auth handles OAuth) |

**Key Information to Display:**
- Application logo (text-based, 32px, blue)
- Tagline describing the app purpose
- Google login button

**Key View Components:**
- `TextLogo` - Application name in brand typography
- `Tagline` - Brief app description
- `GoogleLoginButton` - Supabase Auth trigger

**Layout:**
- Full-page centered layout
- No header or sidebar
- Minimal design focused on single action

**UX Considerations:**
- Single clear call-to-action
- Loading state on button during OAuth flow
- Error message display for failed authentication

**Accessibility:**
- Focus automatically on login button
- High contrast button design (4.5:1 ratio)
- Screen reader announcement for errors

**Security:**
- HTTPS enforced
- No sensitive data stored client-side
- OAuth state parameter for CSRF protection

---

### 2.2 Welcome Screen

| Attribute | Value |
|-----------|-------|
| **Path** | `/` (conditional, first-time users only) |
| **Purpose** | Onboard new users and explain app functionality |
| **API Endpoints** | `GET /api/profile`, `PATCH /api/profile` |

**Key Information to Display:**
- Welcome heading ("Witaj w Lawly")
- 2-3 sentence description of the application
- Call-to-action button

**Key View Components:**
- `WelcomeHeading` - Primary heading
- `WelcomeDescription` - App purpose explanation
- `CTAButton` - "Rozpocznij pierwszą sesję"
- `SkipLink` - "Przejdź do aplikacji" (secondary action)

**Layout:**
- Full-page overlay/modal style
- Centered content card
- No sidebar visible

**UX Considerations:**
- Only shown once (controlled by `has_seen_welcome` flag)
- Clear, concise copy
- Single primary action emphasized

**Accessibility:**
- Focus trapped within welcome content
- Semantic heading structure
- Button with clear action text

**Security:**
- Profile state verified server-side
- RLS ensures user can only update own profile

---

### 2.3 Dashboard (Main View)

| Attribute | Value |
|-----------|-------|
| **Path** | `/` |
| **Purpose** | Central hub for session management and history |
| **API Endpoints** | `GET /api/sessions?limit=10&offset=N` |

**Key Information to Display:**
- Session history list with timestamps
- Session count
- New session action
- Empty state for new users

**Key View Components:**
- `MainLayout` - Header + Sidebar + Content wrapper
- `Header` - Logo, user dropdown
- `Sidebar` - Session list and new session button
- `NewSessionButton` - Primary action button
- `SessionList` - Paginated list of completed sessions
- `SessionCard` - Individual session with timestamp
- `EmptyState` - Message when no sessions exist
- `LoadMoreButton` - Pagination trigger

**Layout:**
- Two-column layout (sidebar 20%, content 80%)
- Fixed header (64px)
- Scrollable sidebar and content areas

**UX Considerations:**
- Sessions sorted by date (newest first)
- Timestamp format: "DD MMMM YYYY, HH:MM" (e.g., "25 stycznia 2026, 14:30")
- Skeleton loaders during data fetch
- Infinite scroll or "Pokaż więcej" button for pagination

**Accessibility:**
- Semantic list structure for sessions
- Keyboard navigable session items
- ARIA labels for interactive elements

**Security:**
- RLS enforces user can only see own sessions
- Session IDs not predictable (UUIDs)

---

### 2.4 Wizard View

| Attribute | Value |
|-----------|-------|
| **Path** | `/wizard` or inline in main content area |
| **Purpose** | Guide user through 5 questions to generate SOW fragments |
| **API Endpoints** | `GET /api/questions` |

**Key Information to Display:**
- Current question text
- Answer options (single-select)
- Progress indicator
- Navigation button

**Key View Components:**
- `ProgressStepper` - Visual 5-step indicator with "Pytanie N z 5" text
- `QuestionCard` - Current question display
- `AnswerOptions` - RadioGroup with option cards
- `OptionCard` - Selectable answer with visual feedback
- `NextButton` - Proceed to next question (disabled until selection)
- `SkeletonLoader` - During question fetch

**Layout:**
- Centered content within main area
- Question at top, answers below, button at bottom
- Fixed position for navigation button

**UX Considerations:**
- Clear visual indication of selected answer (border color, checkmark)
- Disabled "Dalej" button with tooltip until answer selected
- Last question shows "Zakończ" instead of "Dalej"
- No back button (linear progression only)
- State stored in React only (lost on refresh)
- 150ms transition on button state change

**Accessibility:**
- RadioGroup with proper ARIA roles
- Focus management between questions
- Visible focus states on all interactive elements
- Tooltip on disabled button: "Wybierz odpowiedź aby kontynuować"

**Security:**
- Questions fetched from authenticated endpoint
- Answer validation happens server-side on submission

---

### 2.5 Loading State (Fragment Generation)

| Attribute | Value |
|-----------|-------|
| **Path** | Inline (post-wizard, pre-results) |
| **Purpose** | Indicate fragment generation in progress |
| **API Endpoints** | `POST /api/sessions` (in progress) |

**Key Information to Display:**
- Loading spinner
- Status message

**Key View Components:**
- `LoadingSpinner` - Animated indicator
- `StatusText` - "Generowanie fragmentów..."

**Layout:**
- Centered in main content area
- Replaces wizard content

**UX Considerations:**
- Displayed during POST /api/sessions call
- Optimistic UI: Show fragments immediately from local state
- Background confirmation of DB save
- Timeout after 10 seconds → error state

---

### 2.6 Fragment Results View

| Attribute | Value |
|-----------|-------|
| **Path** | Inline (post-wizard) |
| **Purpose** | Display generated SOW fragments for copying |
| **API Endpoints** | `POST /api/sessions` (just completed) |

**Key Information to Display:**
- All generated fragments
- Copy functionality
- Success confirmation
- Navigation to dashboard

**Key View Components:**
- `ResultsHeader` - Success message
- `FragmentsTextarea` - Read-only textarea with all fragments
- `CopyAllButton` - Copy to clipboard action
- `Toast` - Copy confirmation notification
- `ReturnButton` - Navigate back to dashboard

**Layout:**
- Centered content card
- Textarea with minimum height (400px desktop, 300px mobile)
- Button bar above or below textarea

**UX Considerations:**
- Fragments separated by blank lines for readability
- Read-only textarea (no editing)
- Manual text selection enabled
- Copy button text changes to "Skopiowano!" for 2 seconds
- Toast notification: "Skopiowano do schowka!"
- Fragments persist in view even if save fails (retry option)

**Accessibility:**
- Textarea with proper label
- Copy button has descriptive text
- Toast announcements for screen readers

**Security:**
- Fragments generated server-side
- Session saved with RLS protection

---

### 2.7 Session Detail View

| Attribute | Value |
|-----------|-------|
| **Path** | `/sessions/[id]` |
| **Purpose** | View past session questions, answers, and fragments |
| **API Endpoints** | `GET /api/sessions/[id]` |

**Key Information to Display:**
- Session timestamp
- All 5 questions with selected answers
- Generated fragments
- Copy functionality

**Key View Components:**
- `SessionHeader` - Timestamp and copy button
- `QAAccordion` - Collapsible Q&A list (5 items)
- `QuestionAnswerItem` - Question text with answer display
- `FragmentsSection` - Header and textarea
- `FragmentsTextarea` - Read-only with fragments
- `CopyAllButton` - Copy to clipboard

**Layout:**
- Single column within main content area
- Header at top with metadata
- Accordion for Q&A (collapsed by default)
- Fragments textarea below

**UX Considerations:**
- Accordion saves vertical space
- All Q&A can be expanded simultaneously
- Same copy functionality as results view
- Read-only (no edit/delete capabilities)
- Loading skeleton during data fetch

**Accessibility:**
- Accordion with proper ARIA attributes
- Expandable sections keyboard accessible
- Focus management on expand/collapse

**Security:**
- RLS enforces access to own sessions only
- Invalid/unauthorized session ID → error page

---

### 2.8 Error Pages

#### 2.8.1 Connection Error

| Attribute | Value |
|-----------|-------|
| **Path** | Inline or `/error` |
| **Purpose** | Handle network/server errors |

**Key Components:**
- `ErrorIcon` - Visual indicator
- `ErrorMessage` - "Nie można połączyć z serwerem. Spróbuj ponownie później."
- `RefreshButton` - "Odśwież stronę"

#### 2.8.2 Authorization Error (403)

| Attribute | Value |
|-----------|-------|
| **Path** | `/sessions/[id]` (when unauthorized) |
| **Purpose** | Handle access to other user's sessions |

**Key Components:**
- `LockIcon` - Visual indicator
- `ErrorMessage` - "Nie masz dostępu do tej sesji"
- `HomeLink` - Return to dashboard

#### 2.8.3 Not Found Error (404)

| Attribute | Value |
|-----------|-------|
| **Path** | Any invalid route |
| **Purpose** | Handle non-existent pages/sessions |

**Key Components:**
- `NotFoundIcon` - Visual indicator
- `ErrorMessage` - "Strona nie została znaleziona"
- `HomeLink` - Return to dashboard

**Common Error Page Considerations:**

**UX:**
- Friendly, non-technical language
- Clear recovery action
- Consistent error page design

**Accessibility:**
- Semantic error messaging
- Focus on primary action button
- Screen reader announcements

---

## 3. User Journey Map

### 3.1 First-Time User Journey

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Visit /   │────▶│   /login    │────▶│   Google    │
│  (redirect) │     │   (Login)   │     │    OAuth    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
       ┌───────────────────────────────────────┘
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Welcome   │────▶│   Wizard    │────▶│   Wizard    │
│   Screen    │ CTA │  Question 1 │     │  Question 2 │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
       ┌───────────────────────────────────────┘
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wizard    │────▶│   Wizard    │────▶│   Wizard    │
│  Question 3 │     │  Question 4 │     │  Question 5 │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
       ┌───────────────────────────────────────┘
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Loading   │────▶│  Fragment   │────▶│  Dashboard  │
│   State     │     │   Results   │Copy │  (History)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 3.2 Returning User Journey

```
┌─────────────┐     ┌─────────────┐
│   Visit /   │────▶│  Dashboard  │
│ (logged in) │     │  (History)  │
└─────────────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐     ┌─────────────┐   ┌─────────────┐
│ New Session │     │   Session   │   │   Logout    │
│   Button    │     │    Click    │   │             │
└─────────────┘     └─────────────┘   └─────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐     ┌─────────────┐   ┌─────────────┐
│   Wizard    │     │   Session   │   │   /login    │
│  Question 1 │     │   Detail    │   │             │
└─────────────┘     └─────────────┘   └─────────────┘
         │                 │
         ▼                 ▼
   (continue         ┌─────────────┐
    wizard)          │    Copy     │
                     │  Fragments  │
                     └─────────────┘
```

### 3.3 Error Recovery Flows

**Session Expired During Wizard:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wizard    │────▶│Auth Expired │────▶│  Option A:  │
│  (working)  │     │   Modal     │     │  New Tab    │
└─────────────┘     └─────────────┘     │   Login     │
                           │            └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Option B:  │
                    │  /login     │
                    │(lose state) │
                    └─────────────┘
```

**Network Error on Save:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wizard    │────▶│   Error     │────▶│   Retry     │
│  Complete   │     │   Toast     │     │   Button    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Fragments  │     │   Success   │
                    │  Visible    │     │   (saved)   │
                    │  (copy OK)  │     └─────────────┘
                    └─────────────┘
```

---

## 4. Layout and Navigation Structure

### 4.1 Global Layout Components

#### Header (Fixed)
- **Height**: 64px (desktop), 56px (mobile)
- **Contents**:
  - Logo (left) - links to dashboard
  - Hamburger menu (mobile only)
  - Page title (mobile only, centered)
  - User dropdown (right)

#### Sidebar (Desktop)
- **Width**: 20% of viewport (min 240px, max 320px)
- **Position**: Fixed left
- **Contents**:
  - "Rozpocznij nową sesję" button (always visible at top)
  - "Historia (N)" header with session count
  - Scrollable session list
  - "Pokaż więcej" pagination button

#### Mobile Drawer
- **Trigger**: Hamburger menu in header
- **Behavior**: Slide-out from left, overlay
- **Contents**: Same as desktop sidebar

### 4.2 Responsive Behavior

| Breakpoint | Sidebar | Header | Content Width |
|------------|---------|--------|---------------|
| Desktop (>1024px) | Fixed, 20% width | 64px height | 80% width |
| Tablet (768-1024px) | Collapsible toggle | 64px height | Full when collapsed |
| Mobile (<768px) | Slide-out drawer | 56px height | Full width |

### 4.3 Navigation Patterns

**Primary Navigation:**
- Logo click → Dashboard (`/`)
- Session card click → Session Detail (`/sessions/[id]`)
- "Rozpocznij nową sesję" → Wizard (`/wizard`)

**Secondary Navigation:**
- User dropdown → Logout (redirect to `/login`)
- "Pokaż więcej" → Load additional sessions (pagination)

**Wizard Navigation:**
- Linear progression only (no back)
- "Dalej" → Next question
- "Zakończ" → Submit and generate

**Error Recovery:**
- Error page buttons → Dashboard or refresh

### 4.4 URL Structure

| Route | View | Protected |
|-------|------|-----------|
| `/login` | Login Page | No |
| `/` | Dashboard (or Welcome Screen if first visit) | Yes |
| `/wizard` | Wizard View | Yes |
| `/sessions/[id]` | Session Detail | Yes |

### 4.5 Route Protection

Protected routes are handled via Astro middleware:
1. Check Supabase Auth session
2. If no session → redirect to `/login?redirect={originalPath}`
3. On successful login → redirect to original path
4. First visit check → show Welcome Screen before Dashboard

---

## 5. Key Components

### 5.1 Authentication Components

#### GoogleLoginButton
- Triggers Supabase Auth OAuth flow
- States: default, loading, error
- Full-width on mobile, fixed width on desktop

#### UserDropdown
- Displays user email
- Contains logout action
- Positioned in header (right side)

### 5.2 Navigation Components

#### TextLogo
- Application name in brand typography
- Two sizes: 32px (login), 20px (header)
- Color: Blue (#2563eb)
- Clickable (links to dashboard)

#### Sidebar
- Contains NewSessionButton, SessionList
- Sticky positioning
- Scrollable content area

#### MobileDrawer
- Shadcn Sheet component
- Triggered by hamburger icon
- Contains same content as Sidebar

### 5.3 Session Components

#### SessionCard
- Displays session timestamp
- Clickable (navigates to detail)
- Hover/focus states
- Format: "DD MMMM YYYY, HH:MM"

#### SessionList
- Ordered list of SessionCards
- Loading skeletons during fetch
- Empty state when no sessions
- Pagination support

#### NewSessionButton
- Primary action button
- Fixed at top of sidebar
- Full width within container

### 5.4 Wizard Components

#### ProgressStepper
- Visual 5-step indicator
- Text: "Pytanie N z 5"
- Current step highlighted
- Completed steps marked

#### QuestionCard
- Question text display
- Card-style container
- Typography optimized for readability

#### OptionCard
- Single answer option
- States: default, selected, hover
- Selected: border color change, checkmark icon
- Part of RadioGroup

#### NextButton
- States: disabled (gray, tooltip), enabled (blue)
- Text: "Dalej" (1-4), "Zakończ" (5)
- 150ms transition between states
- Tooltip on disabled: "Wybierz odpowiedź aby kontynuować"

### 5.5 Fragment Components

#### FragmentsTextarea
- Read-only textarea
- Minimum height: 400px (desktop), 300px (mobile)
- Scrollable when content exceeds height
- Manual text selection enabled

#### CopyAllButton
- Copies textarea content to clipboard
- States: default, copying, copied
- Text change: "Kopiuj wszystko" → "Skopiowano!"
- Triggers toast notification

### 5.6 Feedback Components

#### Toast (Sonner)
- Position: bottom-right (desktop), bottom-center (mobile)
- Types: success (3s, auto-dismiss), error (5s, manual dismiss)
- Copy confirmation: "Skopiowano do schowka!"

#### LoadingSpinner
- Animated indicator
- Used during API calls
- Centered in container

#### SkeletonLoader
- Placeholder during data fetch
- Matches final component dimensions
- Subtle animation

### 5.7 Error Components

#### ErrorBanner
- Inline error display
- Contains message and action button
- Used for recoverable errors

#### ErrorPage
- Full-page error display
- Icon, message, and navigation link
- Used for 403, 404, connection errors

### 5.8 Layout Components

#### MainLayout
- Wraps Header + Sidebar + Content
- Handles responsive behavior
- Manages sidebar state (open/closed)

#### ContentArea
- Main content container
- Centered content with max-width
- Padding and spacing consistent

### 5.9 Accordion Components

#### QAAccordion
- Expandable Q&A sections
- 5 items (one per question)
- Collapsed by default
- Multiple can be open simultaneously

---

## 6. API Integration Points

| Component | API Endpoint | Trigger | Error Handling |
|-----------|--------------|---------|----------------|
| App root | `GET /api/profile` | Page load | Redirect to login |
| WelcomeScreen | `PATCH /api/profile` | CTA click | Toast error, retry |
| Wizard | `GET /api/questions` | Wizard start | Error page, retry |
| SessionList | `GET /api/sessions` | Dashboard load | Skeleton → Error banner |
| FragmentResults | `POST /api/sessions` | Wizard complete | Keep fragments, retry button |
| SessionDetail | `GET /api/sessions/[id]` | Page load | 403/404 error page |

---

## 7. State Management

### 7.1 Client-Side State (React)

| State | Scope | Persistence | Notes |
|-------|-------|-------------|-------|
| Wizard answers | Wizard component | None (memory only) | Lost on refresh |
| Current question | Wizard component | None | Reset on wizard start |
| Generated fragments | Results component | None | Displayed from local state |
| Sidebar open/closed | Layout component | None | Resets on navigation |
| Toast queue | Global | None | Auto-managed by Sonner |

### 7.2 Server-Side State (Supabase)

| Data | Table | Access |
|------|-------|--------|
| User profile | `profiles` | RLS: own profile only |
| Questions | `questions` | Read-only for all authenticated |
| Sessions | `sessions` | RLS: own sessions only |

### 7.3 Loading States

- **10-second timeout**: API calls timeout after 10s → error state
- **Skeleton loaders**: Used for session list, question loading
- **Spinner**: Used for fragment generation
- **Optimistic UI**: Fragments shown immediately from local state

---

## 8. User Story Coverage

| User Story | UI Element(s) |
|------------|---------------|
| US-001: Google SSO | LoginPage, GoogleLoginButton |
| US-002: Welcome screen | WelcomeScreen, CTAButton |
| US-003: Logout | UserDropdown, LogoutButton |
| US-004: Start session | NewSessionButton |
| US-005: Session list | Sidebar, SessionList |
| US-006: Question display | QuestionCard, OptionCard |
| US-007: Answer selection | OptionCard (selected state) |
| US-008: Validation | NextButton (disabled state) |
| US-009: Next question | NextButton, ProgressStepper |
| US-010: Last question | NextButton ("Zakończ") |
| US-011: Lost progress | React state only (no persistence) |
| US-012: Auto-generate | Loading state → FragmentResults |
| US-014: Fragment display | FragmentsTextarea |
| US-015: Copy all | CopyAllButton, Toast |
| US-016: Manual copy | Textarea selection enabled |
| US-018: Session history | SessionList |
| US-019: Session detail | SessionDetail view |
| US-020: Q&A display | QAAccordion |
| US-021: Copy from history | CopyAllButton in SessionDetail |
| US-023: Connection error | ConnectionError page |
| US-024: Question load error | Error banner with retry |
| US-025: Save error | Toast error, retry option |
| US-026: History load error | Error banner in sidebar |
| US-027: Unauthorized access | AuthorizationError page |
