# View Implementation Plan: Session Details View

## 1. Overview

The Session Details View (`/sessions/[id]`) displays the complete details of a past session, including all questions with their selected answers and the generated SOW fragments. This read-only view allows users to review their previous session responses and copy the generated fragments for reuse. The view is protected by authentication and Row Level Security (RLS), ensuring users can only access their own sessions.

## 2. View Routing

**Path**: `/sessions/[id]`

- Dynamic route with session UUID as path parameter
- File location: `src/pages/sessions/[id].astro`
- Requires authentication (redirect to `/login` if not authenticated)
- Invalid or unauthorized session ID redirects to error state or dashboard

## 3. Component Structure

```
sessions/[id].astro (Page)
└── AuthLayout
    └── SessionDetailsView (React, client:load)
        ├── SessionDetailsSkeleton (loading state)
        ├── SessionDetailsError (error state)
        └── SessionDetailsContent (success state)
            ├── SessionHeader
            │   ├── BackButton
            │   └── SessionTimestamp
            ├── QAAccordion
            │   └── QuestionAnswerItem[] (5 items)
            │       ├── AccordionTrigger (question text)
            │       └── AccordionContent (answer text)
            └── FragmentsSection
                ├── FragmentsSectionHeader
                ├── FragmentsTextarea (reused from results/)
                └── CopyAllButton (reused from results/)
```

## 4. Component Details

### 4.1 SessionDetailsView

- **Component description**: Root container component that orchestrates the session details view. Initializes the `useSessionDetails` hook and conditionally renders loading, error, or content states based on API response.
- **Main elements**: Wrapper div that delegates rendering to child components based on state
- **Handled interactions**: None directly (delegates to children)
- **Handled validation**: None directly (hook handles data validation)
- **Types**: `SessionDetailsViewProps`, `UseSessionDetailsReturn`
- **Props**: 
  - `sessionId: string` - Session UUID from URL parameter

### 4.2 SessionDetailsSkeleton

- **Component description**: Loading skeleton displayed while session data is being fetched. Mimics the layout of the content with animated placeholder elements.
- **Main elements**: 
  - Skeleton for header (back button + timestamp)
  - Skeleton for accordion items (5 items)
  - Skeleton for fragments section (header + textarea)
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**: None

### 4.3 SessionDetailsError

- **Component description**: Error state component displayed when session fetch fails or session is not found. Shows user-friendly error message with retry option.
- **Main elements**:
  - Error icon
  - Error message text
  - "Wróć do panelu głównego" (Back to dashboard) button
- **Handled interactions**:
  - `onNavigateBack()` - Navigates to dashboard
- **Handled validation**: None
- **Types**: `SessionDetailsErrorProps`
- **Props**:
  - `message: string` - Error message to display
  - `onNavigateBack: () => void` - Callback to navigate back

### 4.4 SessionDetailsContent

- **Component description**: Main content container rendering all session details when data is successfully loaded.
- **Main elements**:
  - `SessionHeader` component
  - `QAAccordion` component
  - `FragmentsSection` component
- **Handled interactions**: None (delegates to children)
- **Handled validation**: None
- **Types**: `SessionDetailsContentProps`
- **Props**:
  - `session: SessionDetailViewModel` - Transformed session data
  - `isCopied: boolean` - Copy state
  - `onCopy: () => void` - Copy handler

### 4.5 SessionHeader

- **Component description**: Header section displaying session metadata and navigation.
- **Main elements**:
  - Back button/link to dashboard
  - Session completion timestamp in Polish locale format
- **Handled interactions**:
  - Click on back button navigates to `/`
- **Handled validation**: None
- **Types**: `SessionHeaderProps`
- **Props**:
  - `formattedDate: string` - Formatted completion date
  - `completedAt: string` - ISO timestamp for `<time>` element

### 4.6 QAAccordion

- **Component description**: Collapsible accordion containing all 5 questions and their answers. Uses shadcn/ui Accordion component with multiple items expandable simultaneously.
- **Main elements**:
  - Section header "Pytania i odpowiedzi"
  - Accordion container with `type="multiple"`
  - `QuestionAnswerItem` for each Q&A pair
- **Handled interactions**:
  - Expand/collapse individual accordion items
  - Keyboard navigation (Enter/Space to toggle, Arrow keys)
- **Handled validation**: None
- **Types**: `QAAccordionProps`
- **Props**:
  - `items: QAItemViewModel[]` - Array of question-answer pairs

### 4.7 QuestionAnswerItem

- **Component description**: Single accordion item displaying one question with its selected answer. Question is visible in the trigger, answer revealed on expand.
- **Main elements**:
  - `AccordionItem` wrapper with unique value
  - `AccordionTrigger` containing question text with order indicator
  - `AccordionContent` containing selected answer text
- **Handled interactions**:
  - Expand/collapse on trigger click
  - Keyboard accessible (Enter/Space)
- **Handled validation**: None
- **Types**: `QuestionAnswerItemProps`
- **Props**:
  - `questionNumber: number` - Question order (1-5)
  - `questionText: string` - Full question text
  - `answerText: string` - Selected answer text
  - `value: string` - Unique accordion item identifier

### 4.8 FragmentsSection

- **Component description**: Section containing generated SOW fragments with copy functionality.
- **Main elements**:
  - Section header "Wygenerowane fragmenty SOW"
  - `FragmentsTextarea` component (reused)
  - `CopyAllButton` component (reused)
- **Handled interactions**:
  - Copy all fragments to clipboard
- **Handled validation**: None
- **Types**: `FragmentsSectionProps`
- **Props**:
  - `fragments: string[]` - Array of generated fragments
  - `isCopied: boolean` - Whether copy was successful
  - `onCopy: () => void` - Copy handler callback

## 5. Types

### 5.1 New Types for Session Details View

```typescript
// src/components/session-details/types.ts

/**
 * ViewModel for a single question-answer pair.
 * Derived by joining session answers with questions data.
 */
export interface QAItemViewModel {
  /** Question order (1-5) */
  questionNumber: number;
  /** Unique identifier for accordion item */
  questionId: string;
  /** Full question text */
  questionText: string;
  /** Selected answer text */
  answerText: string;
}

/**
 * ViewModel for the complete session detail.
 * Transformed from SessionDetailResponse + QuestionsListResponse.
 */
export interface SessionDetailViewModel {
  /** Session UUID */
  id: string;
  /** Formatted completion date: "DD MMMM YYYY, HH:MM" */
  formattedDate: string;
  /** ISO timestamp for <time> element */
  completedAt: string;
  /** Question-answer pairs in order */
  qaItems: QAItemViewModel[];
  /** Generated SOW fragments */
  fragments: string[];
}

/**
 * State machine for session details view.
 */
export type SessionDetailsState = 'loading' | 'success' | 'error' | 'not-found';

// =============================================================================
// Component Props
// =============================================================================

export interface SessionDetailsViewProps {
  sessionId: string;
}

export interface SessionDetailsContentProps {
  session: SessionDetailViewModel;
  isCopied: boolean;
  onCopy: () => void;
}

export interface SessionDetailsErrorProps {
  message: string;
  onNavigateBack: () => void;
}

export interface SessionHeaderProps {
  formattedDate: string;
  completedAt: string;
}

export interface QAAccordionProps {
  items: QAItemViewModel[];
}

export interface QuestionAnswerItemProps {
  questionNumber: number;
  questionText: string;
  answerText: string;
  value: string;
}

export interface FragmentsSectionProps {
  fragments: string[];
  isCopied: boolean;
  onCopy: () => void;
}

// =============================================================================
// Hook Types
// =============================================================================

export interface UseSessionDetailsReturn {
  /** Current view state */
  state: SessionDetailsState;
  /** Transformed session data (null if loading/error) */
  session: SessionDetailViewModel | null;
  /** Error message if state is error */
  error: string | null;
  /** Whether fragments were copied */
  isCopied: boolean;
  /** Copy all fragments to clipboard */
  copyToClipboard: () => Promise<void>;
  /** Navigate back to dashboard */
  navigateToDashboard: () => void;
}
```

### 5.2 Existing Types Used

From `src/types.ts`:
- `SessionDetailResponse` - API response with session data
- `QuestionsListResponse` - API response with questions
- `QuestionResponse` - Single question with options
- `QuestionOption` - Answer option with text and fragment
- `AnswerItem` - Question-answer ID pair
- `ErrorResponse` - API error response

## 6. State Management

### 6.1 Custom Hook: `useSessionDetails`

The view requires a custom hook to manage:
1. **Session data fetching** - Fetch session by ID from API
2. **Questions data fetching** - Fetch all questions to resolve answer texts
3. **Data transformation** - Join session answers with questions to create ViewModels
4. **Clipboard operations** - Copy fragments with success feedback
5. **Navigation** - Handle back navigation

**Hook Implementation Strategy**:
```typescript
// src/components/hooks/useSessionDetails.ts

export function useSessionDetails(sessionId: string): UseSessionDetailsReturn {
  // State
  const [state, setState] = useState<SessionDetailsState>('loading');
  const [session, setSession] = useState<SessionDetailViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch session and questions in parallel on mount
  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  // Transform API responses to ViewModel
  // Copy to clipboard with 2s feedback
  // Navigation helper
}
```

**State Flow**:
1. Initial state: `loading`
2. Parallel fetch: session + questions
3. On success: Transform data → `success`
4. On 404: → `not-found`
5. On error: → `error`

### 6.2 Local UI State

- `isCopied: boolean` - Tracks copy success state for button feedback (2s timeout)
- No accordion state management needed (shadcn Accordion handles internally)

## 7. API Integration

### 7.1 Session Detail Endpoint

**Endpoint**: `GET /api/sessions/[id]`

**Request**:
- Path parameter: `id` (UUID) - Session identifier
- Authentication: Cookie-based Supabase session

**Response (200)**:
```typescript
interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: AnswerItem[];
  generated_fragments: string[];
}
```

**Error Responses**:
- `400` - Invalid session ID format
- `401` - Not authenticated
- `404` - Session not found (or RLS blocked)
- `500` - Server error

### 7.2 Questions Endpoint

**Endpoint**: `GET /api/questions`

**Response (200)**:
```typescript
interface QuestionsListResponse {
  questions: QuestionResponse[];
  total: number;
}
```

### 7.3 Frontend Fetch Implementation

```typescript
async function fetchSessionDetails() {
  try {
    // Parallel fetch for performance
    const [sessionRes, questionsRes] = await Promise.all([
      fetch(`/api/sessions/${sessionId}`),
      fetch('/api/questions')
    ]);

    // Handle 401 - redirect to login
    if (sessionRes.status === 401 || questionsRes.status === 401) {
      window.location.assign('/login');
      return;
    }

    // Handle 404 - session not found
    if (sessionRes.status === 404) {
      setState('not-found');
      setError('Nie znaleziono sesji lub nie masz do niej dostępu.');
      return;
    }

    // Handle other errors
    if (!sessionRes.ok || !questionsRes.ok) {
      throw new Error('Failed to fetch data');
    }

    const sessionData: SessionDetailResponse = await sessionRes.json();
    const questionsData: QuestionsListResponse = await questionsRes.json();

    // Transform to ViewModel
    const viewModel = transformToViewModel(sessionData, questionsData.questions);
    setSession(viewModel);
    setState('success');
  } catch (err) {
    console.error('Session details fetch error:', err);
    setError('Nie można załadować szczegółów sesji. Spróbuj ponownie.');
    setState('error');
  }
}
```

## 8. User Interactions

| Interaction | Component | Handler | Outcome |
|-------------|-----------|---------|---------|
| Click back button | `SessionHeader` | `navigateToDashboard()` | Navigate to `/` |
| Expand accordion item | `QuestionAnswerItem` | Accordion internal | Reveal answer text |
| Collapse accordion item | `QuestionAnswerItem` | Accordion internal | Hide answer text |
| Click "Kopiuj wszystko" | `CopyAllButton` | `copyToClipboard()` | Copy fragments, show "Skopiowano!" |
| Manual text selection | `FragmentsTextarea` | Native browser | Allow partial copy |
| Keyboard accordion toggle | `QuestionAnswerItem` | Accordion internal | Toggle on Enter/Space |
| Tab through accordions | `QAAccordion` | Accordion internal | Focus moves between triggers |

## 9. Conditions and Validation

### 9.1 Authentication Validation

| Condition | Component/Layer | Validation | Effect |
|-----------|-----------------|------------|--------|
| User not authenticated | Astro page | Check `supabase.auth.getUser()` | Redirect to `/login` |
| 401 from API | `useSessionDetails` | Check response status | Redirect to `/login` |

### 9.2 Session Access Validation

| Condition | Component/Layer | Validation | Effect |
|-----------|-----------------|------------|--------|
| Invalid UUID format | API endpoint | Zod schema validation | 400 error |
| Session not found | API + RLS | Database query returns null | 404 error |
| Session belongs to other user | RLS | Supabase RLS policy | 404 error (RLS blocks access) |

### 9.3 Data Integrity Validation

| Condition | Component/Layer | Validation | Effect |
|-----------|-----------------|------------|--------|
| Missing questions data | `useSessionDetails` | Check questionsRes.ok | Error state |
| Answers don't match questions | Transform function | Filter/handle gracefully | Show available Q&As |
| Empty fragments array | `FragmentsSection` | Check length | Disable copy button |

### 9.4 Clipboard Validation

| Condition | Component/Layer | Validation | Effect |
|-----------|-----------------|------------|--------|
| Clipboard API unavailable | `copyToClipboard` | Try-catch | Log error, no feedback |
| Copy failed | `copyToClipboard` | Try-catch | Log error, no feedback |

## 10. Error Handling

### 10.1 Network/API Errors

| Error | HTTP Code | User Message | Recovery Action |
|-------|-----------|--------------|-----------------|
| Not authenticated | 401 | N/A (redirect) | Redirect to `/login` |
| Session not found | 404 | "Nie znaleziono sesji lub nie masz do niej dostępu." | Show back button |
| Invalid ID format | 400 | "Nieprawidłowy format identyfikatora sesji." | Show back button |
| Server error | 500 | "Nie można załadować szczegółów sesji. Spróbuj ponownie." | Show back button |
| Network failure | N/A | "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." | Show back button |

### 10.2 Data Transformation Errors

| Error | Handling | Fallback |
|-------|----------|----------|
| Question not found for answer | Skip that Q&A pair | Show partial list with warning |
| Answer option not found | Use "Odpowiedź niedostępna" | Graceful degradation |
| Empty fragments | Show empty textarea | Disable copy button |

### 10.3 Clipboard Errors

| Error | Handling |
|-------|----------|
| Clipboard API not supported | Log to console, no user feedback |
| Permission denied | Log to console, no user feedback |
| Copy failed | Log to console, no user feedback |

## 11. Implementation Steps

### Step 1: Create Directory Structure and Types

1. Create `src/pages/sessions/` directory
2. Create `src/components/session-details/` directory
3. Create `src/components/session-details/types.ts` with all type definitions
4. Create `src/components/session-details/index.ts` for exports

### Step 2: Install and Configure Accordion Component

1. Install shadcn/ui Accordion: `npx shadcn@latest add accordion`
2. Verify Accordion component in `src/components/ui/accordion.tsx`

### Step 3: Implement Custom Hook

1. Create `src/components/hooks/useSessionDetails.ts`
2. Implement parallel data fetching (session + questions)
3. Implement data transformation to ViewModels
4. Implement clipboard copy with feedback
5. Implement navigation helper
6. Add error handling for all scenarios

### Step 4: Implement Skeleton Component

1. Create `src/components/session-details/SessionDetailsSkeleton.tsx`
2. Use existing Skeleton component from `src/components/ui/skeleton.tsx`
3. Mirror layout of content components

### Step 5: Implement Error Component

1. Create `src/components/session-details/SessionDetailsError.tsx`
2. Include error message display
3. Include back to dashboard button
4. Style consistently with existing error components

### Step 6: Implement Header Component

1. Create `src/components/session-details/SessionHeader.tsx`
2. Add back button with arrow icon
3. Display formatted date with `<time>` element
4. Ensure proper heading hierarchy

### Step 7: Implement Accordion Components

1. Create `src/components/session-details/QAAccordion.tsx`
2. Create `src/components/session-details/QuestionAnswerItem.tsx`
3. Configure Accordion with `type="multiple"` for independent expansion
4. Style triggers and content appropriately
5. Ensure ARIA attributes are correct

### Step 8: Implement Fragments Section

1. Create `src/components/session-details/FragmentsSection.tsx`
2. Reuse `FragmentsTextarea` from `src/components/results/`
3. Reuse `CopyAllButton` from `src/components/results/`
4. Add section header

### Step 9: Implement Content Container

1. Create `src/components/session-details/SessionDetailsContent.tsx`
2. Compose Header, QAAccordion, and FragmentsSection
3. Apply proper layout and spacing

### Step 10: Implement Root View Component

1. Create `src/components/session-details/SessionDetailsView.tsx`
2. Initialize `useSessionDetails` hook
3. Implement conditional rendering for all states
4. Export from index

### Step 11: Create Astro Page

1. Create `src/pages/sessions/[id].astro`
2. Use `AuthLayout` for consistent navigation
3. Extract session ID from `Astro.params`
4. Render `SessionDetailsView` with `client:load`
5. Set appropriate page title

### Step 12: Testing and Validation

1. Test successful session load with all data
2. Test 404 for non-existent session
3. Test 404 for other user's session (RLS)
4. Test loading state display
5. Test accordion expand/collapse
6. Test keyboard navigation
7. Test copy functionality
8. Test responsive layout
9. Test error states

### Step 13: Accessibility Verification

1. Verify ARIA attributes on accordion
2. Test keyboard navigation flow
3. Verify focus management
4. Test screen reader announcements
5. Verify color contrast
6. Test reduced motion preferences

### Step 14: Code Review and Cleanup

1. Remove any TODO comments
2. Verify TypeScript types are complete
3. Check for linting errors
4. Ensure consistent code style
5. Update component index exports
