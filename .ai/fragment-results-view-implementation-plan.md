# View Implementation Plan: Fragment Results View

## 1. Overview

The Fragment Results View is an inline view that appears after the wizard's final question is answered. It consists of two states:

1. **Loading State** - Displayed during the `POST /api/sessions` API call with an animated spinner and status message
2. **Results State** - Displays generated SOW fragments in a read-only textarea with copy functionality

The view replaces the wizard content and allows users to copy all fragments to clipboard or manually select portions. After reviewing results, users can navigate back to the dashboard.

This view addresses user stories US-012 (auto-generate fragments), US-014 (display fragments), US-015 (copy all), and US-016 (manual selection).

## 2. View Routing

This view is **inline** and does not have its own route. It appears within the wizard page (`/wizard`) after the user answers the final question. The view states are managed via React state, not URL changes.

**Flow:**
```
/wizard (Question 5) → [Submit] → /wizard (Loading State) → /wizard (Results State) → [Return] → / (Dashboard)
```

## 3. Component Structure

```
FragmentResultsView
├── [state: 'loading']
│   └── LoadingState
│       ├── LoadingSpinner
│       └── StatusText
│
├── [state: 'error' | 'timeout']
│   └── ResultsError
│       ├── ErrorIcon
│       ├── ErrorMessage
│       └── RetryButton
│
└── [state: 'success']
    └── ResultsContent
        ├── ResultsHeader
        ├── ActionBar
        │   └── CopyAllButton
        ├── FragmentsTextarea
        └── ReturnButton
```

## 4. Component Details

### FragmentResultsView

- **Component description**: Root container component that manages the view state machine. Orchestrates transitions between loading, error, and success states based on API response.
- **Main elements**: Conditional rendering based on `state` variable; wraps child components in a centered container
- **Handled interactions**: None directly (delegated to children)
- **Handled validation**: Validates that session data exists before showing success state
- **Types**: `FragmentResultsState`, `FragmentResultsViewModel`, `SessionDetailResponse`
- **Props**: `answers: AnswerItem[]` (received from wizard to submit session)

### LoadingState

- **Component description**: Container for loading spinner and status message. Displayed during `POST /api/sessions` call.
- **Main elements**: 
  - `<div>` centered container with flex layout
  - `LoadingSpinner` child component
  - `StatusText` child component
- **Handled interactions**: None (passive display)
- **Handled validation**: None
- **Types**: None specific
- **Props**: None

### LoadingSpinner

- **Component description**: Animated SVG spinner indicating activity. Uses Tailwind's `animate-spin` utility.
- **Main elements**: 
  - `<svg>` or `<div>` with CSS animation
  - Size: 48x48px (desktop), 40x40px (mobile)
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**: `className?: string` (optional styling override)

### StatusText

- **Component description**: Displays "Generowanie fragmentów..." message below the spinner.
- **Main elements**: 
  - `<p>` with text-lg font, muted color
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**: `message?: string` (defaults to "Generowanie fragmentów...")

### ResultsError

- **Component description**: Error state display with retry functionality. Shows error message and action button.
- **Main elements**:
  - `<div>` container with centered layout
  - Error icon (warning/alert SVG)
  - `<p>` error message text
  - `RetryButton` component
- **Handled interactions**: 
  - `onRetry` callback when retry button clicked
- **Handled validation**: None
- **Types**: `ResultsErrorProps`
- **Props**: 
  - `message: string` - Error message to display
  - `onRetry: () => void` - Callback for retry action
  - `showFragments?: boolean` - Whether to show fragments below error (for save-failed-but-fragments-ready scenario)
  - `fragments?: string[]` - Fragments to display if available

### ResultsContent

- **Component description**: Success state container showing fragments and actions. Main content area after successful session creation.
- **Main elements**:
  - `<div>` card container with padding and rounded corners
  - `ResultsHeader` component
  - `ActionBar` with `CopyAllButton`
  - `FragmentsTextarea` component
  - `ReturnButton` component
- **Handled interactions**: Receives callbacks from children
- **Handled validation**: Ensures fragments array is not empty
- **Types**: `ResultsContentProps`, `SessionDetailResponse`
- **Props**:
  - `session: SessionDetailResponse`
  - `fragments: string[]`
  - `onCopy: () => void`
  - `isCopied: boolean`

### ResultsHeader

- **Component description**: Success header with title "Wygenerowane fragmenty SOW" and optional success icon.
- **Main elements**:
  - `<div>` flex container
  - Success checkmark icon (optional)
  - `<h1>` with title text
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**: None

### CopyAllButton

- **Component description**: Button to copy all fragments to clipboard. Changes text to "Skopiowano!" for 2 seconds after successful copy.
- **Main elements**:
  - `<Button>` from shadcn/ui
  - Copy icon (clipboard SVG)
  - Dynamic text: "Kopiuj wszystko" or "Skopiowano!"
- **Handled interactions**:
  - `onClick` - Triggers clipboard write and state update
- **Handled validation**: Disabled if fragments array is empty
- **Types**: `CopyAllButtonProps`
- **Props**:
  - `fragments: string[]` - Fragments to copy
  - `isCopied: boolean` - Current copied state
  - `onCopy: () => void` - Callback after copy
  - `disabled?: boolean` - Disable button

### FragmentsTextarea

- **Component description**: Read-only textarea displaying all SOW fragments separated by blank lines. Scrollable with minimum height.
- **Main elements**:
  - `<label>` for accessibility (visually hidden or above textarea)
  - `<textarea>` with:
    - `readOnly` attribute
    - `value` set to joined fragments
    - Minimum height: 400px (desktop), 300px (mobile)
    - Scrollable (`overflow-y: auto`)
    - Full width
    - Monospace or readable font
- **Handled interactions**:
  - Text selection (native browser behavior)
  - Keyboard shortcuts (Ctrl/Cmd+C, Ctrl/Cmd+A)
  - Right-click context menu
- **Handled validation**: None (read-only)
- **Types**: `FragmentsTextareaProps`
- **Props**:
  - `fragments: string[]` - Array of fragment strings
  - `className?: string` - Optional styling

### ReturnButton

- **Component description**: Navigation button to return to dashboard. Styled as secondary/outline button.
- **Main elements**:
  - `<Button>` from shadcn/ui (variant="outline")
  - Arrow left icon (optional)
  - Text: "Wróć do panelu"
- **Handled interactions**:
  - `onClick` - Navigate to dashboard (`/`)
- **Handled validation**: None
- **Types**: None
- **Props**: None

## 5. Types

### New Types (add to `src/components/results/types.ts`)

```typescript
/**
 * State machine for the Fragment Results View.
 */
export type FragmentResultsState = 'loading' | 'success' | 'error' | 'timeout';

/**
 * ViewModel for the entire results view.
 * Aggregates all state needed for rendering.
 */
export interface FragmentResultsViewModel {
  state: FragmentResultsState;
  session: SessionDetailResponse | null;
  fragments: string[];
  error: string | null;
  isCopied: boolean;
  isSaving: boolean;
}

/**
 * Props for FragmentResultsView component.
 */
export interface FragmentResultsViewProps {
  answers: AnswerItem[];
}

/**
 * Props for ResultsContent component.
 */
export interface ResultsContentProps {
  session: SessionDetailResponse;
  fragments: string[];
  isCopied: boolean;
  onCopy: () => void;
}

/**
 * Props for ResultsError component.
 */
export interface ResultsErrorProps {
  message: string;
  onRetry: () => void;
  showFragments?: boolean;
  fragments?: string[];
}

/**
 * Props for FragmentsTextarea component.
 */
export interface FragmentsTextareaProps {
  fragments: string[];
  className?: string;
}

/**
 * Props for CopyAllButton component.
 */
export interface CopyAllButtonProps {
  fragments: string[];
  isCopied: boolean;
  onCopy: () => void;
  disabled?: boolean;
}

/**
 * Return type for useFragmentResults hook.
 */
export interface UseFragmentResultsReturn {
  state: FragmentResultsState;
  session: SessionDetailResponse | null;
  fragments: string[];
  error: string | null;
  isCopied: boolean;
  submitSession: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
  retry: () => void;
  navigateToDashboard: () => void;
}
```

### Existing Types Used (from `src/types.ts`)

```typescript
// Used for API request
interface AnswerItem {
  question_id: string;
  answer_id: string;
}

// Used for API request body
interface CreateSessionCommand {
  answers: AnswerItem[];
}

// Used for API response
interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: AnswerItem[];
  generated_fragments: string[];
}

// Used for error handling
interface ErrorResponse {
  error: string;
}
```

## 6. State Management

### Custom Hook: `useFragmentResults`

Create a new hook at `src/components/hooks/useFragmentResults.ts` to manage:

1. **Submission state** - Track API call progress
2. **Session data** - Store response from successful submission
3. **Error state** - Capture and display errors
4. **Clipboard state** - Track "copied" visual feedback
5. **Timeout handling** - Abort after 10 seconds

**State Variables:**

| Variable | Type | Initial Value | Purpose |
|----------|------|---------------|---------|
| `state` | `FragmentResultsState` | `'loading'` | Current view state |
| `session` | `SessionDetailResponse \| null` | `null` | Session data from API |
| `error` | `string \| null` | `null` | Error message |
| `isCopied` | `boolean` | `false` | Clipboard feedback |

**Key Functions:**

- `submitSession(answers)` - POST to `/api/sessions` with timeout handling
- `copyToClipboard()` - Write fragments to clipboard, set isCopied for 2s
- `retry()` - Reset error state and retry submission
- `navigateToDashboard()` - Navigate to `/`

**Hook Implementation Outline:**

```typescript
export function useFragmentResults(answers: AnswerItem[]): UseFragmentResultsReturn {
  const [state, setState] = useState<FragmentResultsState>('loading');
  const [session, setSession] = useState<SessionDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Submit on mount
  useEffect(() => {
    submitSession();
  }, []);

  // 10-second timeout with AbortController
  // Clipboard API with fallback
  // Error handling for all scenarios
}
```

### Integration with Wizard

The current `useWizard` hook redirects to `/sessions/${session.id}` after submission. To implement inline results:

**Option 1 (Recommended)**: Modify `useWizard` to expose a `completedSession` state instead of redirecting:

```typescript
// In useWizard
const [completedSession, setCompletedSession] = useState<SessionDetailResponse | null>(null);

// After successful submission:
setCompletedSession(session);
// Remove: window.location.assign(`/sessions/${session.id}`);
```

Then in `WizardView`:

```typescript
if (completedSession) {
  return <FragmentResultsView session={completedSession} />;
}
```

**Option 2**: Pass answers to `FragmentResultsView` and let it handle submission (as designed above).

## 7. API Integration

### Endpoint: POST /api/sessions

**Request:**
```typescript
const response = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers } as CreateSessionCommand),
  signal: abortController.signal, // For timeout
});
```

**Response Handling:**

| Status | Action |
|--------|--------|
| 201 | Parse `SessionDetailResponse`, set state to 'success', extract fragments |
| 400 | Parse `ErrorResponse`, set state to 'error' with message |
| 401 | Redirect to `/login` |
| 500 | Set state to 'error' with generic message |
| Timeout | Set state to 'timeout' |

**Timeout Implementation:**

```typescript
const abortController = new AbortController();
const timeoutId = setTimeout(() => abortController.abort(), 10000);

try {
  const response = await fetch('/api/sessions', {
    // ...
    signal: abortController.signal,
  });
  clearTimeout(timeoutId);
  // Handle response
} catch (err) {
  clearTimeout(timeoutId);
  if (err.name === 'AbortError') {
    setState('timeout');
    setError('Przekroczono limit czasu. Spróbuj ponownie.');
  }
}
```

## 8. User Interactions

| Interaction | Component | Handler | Outcome |
|-------------|-----------|---------|---------|
| Complete last wizard question | `WizardView` | `goToNext()` | Transitions to `FragmentResultsView` with loading state |
| Wait for loading | `LoadingState` | N/A (passive) | Spinner animates, status text displays |
| Click "Kopiuj wszystko" | `CopyAllButton` | `copyToClipboard()` | Fragments copied to clipboard, button text changes to "Skopiowano!" for 2 seconds, toast notification appears |
| Select text manually | `FragmentsTextarea` | Native browser | Text highlighted, clipboard shortcuts work (Ctrl/Cmd+C) |
| Right-click in textarea | `FragmentsTextarea` | Native browser | Context menu with "Copy" option |
| Click "Wróć do panelu" | `ReturnButton` | `navigateToDashboard()` | Navigate to `/` (dashboard) |
| Click "Spróbuj ponownie" (error) | `ResultsError` | `retry()` | Reset to loading state, retry API call |

## 9. Conditions and Validation

### Pre-submission Validation (handled by wizard)

| Condition | Verification | Effect |
|-----------|--------------|--------|
| All 5 questions answered | `answers.length === 5` in useWizard | Cannot reach results view without completing wizard |
| Valid answer IDs | Wizard only allows selecting from provided options | Guaranteed valid at client level |

### API Response Validation

| Condition | Verification | Effect |
|-----------|--------------|--------|
| Authenticated user | 401 response | Redirect to `/login` |
| Valid session data | Response has required fields | Set state to 'success' |
| Server error | 500 response | Set state to 'error' |
| Timeout | No response in 10s | Set state to 'timeout' |

### Component-Level Validation

| Component | Condition | Effect |
|-----------|-----------|--------|
| `CopyAllButton` | `fragments.length > 0` | Button enabled/disabled |
| `FragmentsTextarea` | `fragments.length > 0` | Display content or empty state |
| `ResultsContent` | `session !== null` | Render content or nothing |

## 10. Error Handling

### Error States

| Error Type | Message (Polish) | User Action |
|------------|------------------|-------------|
| Network timeout | "Przekroczono limit czasu. Spróbuj ponownie." | Click "Spróbuj ponownie" |
| Server error (500) | "Nie udało się zapisać sesji. Spróbuj ponownie." | Click "Spróbuj ponownie" |
| Validation error (400) | Display error from API | Click "Spróbuj ponownie" |
| Clipboard write failure | "Nie udało się skopiować do schowka." | Try manual selection |

### Error Recovery Strategy

1. **Preserve local state**: If fragments were generated locally (optimistic UI), show them even if save fails
2. **Retry mechanism**: All errors except 401 show a retry button
3. **Graceful degradation**: If clipboard API fails, textarea allows manual selection
4. **Console logging**: Log all errors for debugging

### Clipboard Error Handling

```typescript
async function copyToClipboard() {
  try {
    const text = fragments.join('\n\n');
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    // Show success toast
  } catch (err) {
    console.error('Clipboard error:', err);
    // Show error toast: "Nie udało się skopiować do schowka."
  }
}
```

## 11. Implementation Steps

### Step 1: Create Type Definitions

Create `src/components/results/types.ts` with all type definitions from Section 5.

### Step 2: Create useFragmentResults Hook

Create `src/components/hooks/useFragmentResults.ts`:

1. Import required types from `../../types` and `../results/types`
2. Implement state management with useState
3. Implement `submitSession` with fetch, AbortController, and timeout
4. Implement `copyToClipboard` with navigator.clipboard API
5. Implement `retry` and `navigateToDashboard` functions
6. Add useEffect to trigger submission on mount

### Step 3: Create Atomic Components

Create in `src/components/results/`:

1. `LoadingSpinner.tsx` - Animated spinner with Tailwind
2. `StatusText.tsx` - Simple text component
3. `ResultsHeader.tsx` - Title with optional success icon

### Step 4: Create FragmentsTextarea Component

Create `src/components/results/FragmentsTextarea.tsx`:

1. Accept `fragments` prop
2. Join fragments with `\n\n` for display
3. Set `readOnly` attribute
4. Apply responsive min-height (400px desktop, 300px mobile)
5. Add proper label for accessibility

### Step 5: Create CopyAllButton Component

Create `src/components/results/CopyAllButton.tsx`:

1. Import Button from shadcn/ui
2. Accept props: fragments, isCopied, onCopy, disabled
3. Render dynamic text based on `isCopied`
4. Add clipboard icon

### Step 6: Create Composite Components

Create:

1. `LoadingState.tsx` - Combines LoadingSpinner + StatusText
2. `ResultsError.tsx` - Error message with retry button
3. `ResultsContent.tsx` - Combines header, textarea, buttons

### Step 7: Create FragmentResultsView Component

Create `src/components/results/FragmentResultsView.tsx`:

1. Initialize `useFragmentResults` hook
2. Conditional rendering based on state
3. Handle all view states: loading, success, error, timeout

### Step 8: Create Index Barrel Export

Create `src/components/results/index.ts`:

```typescript
export { FragmentResultsView } from './FragmentResultsView';
export * from './types';
```

### Step 9: Modify useWizard Hook

Update `src/components/hooks/useWizard.ts`:

1. Add `completedSession` state variable
2. Modify `submitSession` to set `completedSession` instead of redirecting
3. Expose `completedSession` in return object

### Step 10: Modify WizardView Component

Update `src/components/wizard/WizardView.tsx`:

1. Import `FragmentResultsView`
2. Add conditional rendering for `completedSession`:
   ```typescript
   if (completedSession) {
     return <FragmentResultsView session={completedSession} />;
   }
   ```

### Step 11: Add Toast Notification (Optional)

If not already available, add a simple toast system:

1. Create `src/components/ui/toast.tsx` using shadcn/ui toast
2. Integrate with `CopyAllButton` for copy confirmation

### Step 12: Test and Verify

1. Complete wizard flow end-to-end
2. Verify loading spinner displays during submission
3. Verify fragments display correctly (separated by blank lines)
4. Test "Kopiuj wszystko" button and feedback
5. Test manual text selection and copying
6. Test error scenarios (disable network, mock errors)
7. Test 10-second timeout behavior
8. Test "Wróć do panelu" navigation
9. Verify accessibility (screen reader, keyboard navigation)

### Step 13: Responsive Design Adjustments

Ensure all components work on mobile:

1. Textarea min-height: 300px on mobile, 400px on desktop
2. Buttons full-width on mobile
3. Proper spacing and padding adjustments
