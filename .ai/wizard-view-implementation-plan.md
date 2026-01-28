# View Implementation Plan: Wizard View

## 1. Overview

The Wizard View is the core user-facing component of Lawly that guides users through 5 sequential questions to generate SOW (Statement of Work) fragments. It presents one question at a time with single-select answer options, validates that an answer is selected before proceeding, and upon completing the final question, submits all answers to create a session with generated SOW fragments.

Key characteristics:
- Linear progression through 5 questions (no back navigation)
- Single-select answers with visual feedback
- Progress indicator showing current question number
- State stored in React only (lost on page refresh)
- Session saved to database only after completion
- Redirect to session detail view after successful submission

## 2. View Routing

**Path:** `/wizard`

The wizard will be implemented as a new Astro page at `src/pages/wizard.astro` that renders a React island component (`WizardView`). The page requires authentication (protected by middleware).

## 3. Component Structure

```
src/pages/wizard.astro
└── WizardView (React Island)
    ├── WizardSkeleton (conditional: isLoading)
    ├── WizardError (conditional: error)
    └── WizardContent (conditional: questions loaded)
        ├── ProgressStepper
        ├── QuestionCard
        │   └── question text
        ├── AnswerOptions
        │   └── OptionCard (×n, one per option)
        └── NextButton (with Tooltip wrapper)
```

**File structure:**
```
src/
├── pages/
│   └── wizard.astro
├── components/
│   └── wizard/
│       ├── types.ts
│       ├── WizardView.tsx
│       ├── WizardContent.tsx
│       ├── WizardSkeleton.tsx
│       ├── WizardError.tsx
│       ├── ProgressStepper.tsx
│       ├── QuestionCard.tsx
│       ├── AnswerOptions.tsx
│       ├── OptionCard.tsx
│       └── NextButton.tsx
│   └── hooks/
│       └── useWizard.ts
```

## 4. Component Details

### 4.1 WizardView

- **Description:** Root container component for the wizard. Initializes the `useWizard` hook and conditionally renders loading, error, or content states.
- **Main elements:**
  - Outer `<div>` with centered flex layout
  - Conditional rendering based on `isLoading`, `error`, or `questions` availability
- **Handled interactions:** None directly (delegates to children)
- **Handled validation:** None directly
- **Types:** `UseWizardReturn`
- **Props:** None (self-contained React island)

### 4.2 WizardContent

- **Description:** Main content wrapper that orchestrates the wizard UI when questions are loaded. Arranges progress stepper, question, options, and navigation button.
- **Main elements:**
  - Container `<div>` with `max-w-2xl` centered layout
  - `ProgressStepper` at top
  - `QuestionCard` below stepper
  - `AnswerOptions` below question
  - `NextButton` at bottom (fixed positioning for consistency)
- **Handled interactions:** None directly (delegates to children)
- **Handled validation:** None directly
- **Types:** `WizardContentProps`
- **Props:**
  - `currentQuestion: QuestionResponse`
  - `currentQuestionIndex: number`
  - `totalQuestions: number`
  - `selectedAnswerId: string | null`
  - `isLastQuestion: boolean`
  - `isSubmitting: boolean`
  - `onSelectAnswer: (answerId: string) => void`
  - `onNext: () => void`

### 4.3 WizardSkeleton

- **Description:** Loading skeleton displayed during initial question fetch. Mimics the layout of the wizard content.
- **Main elements:**
  - Skeleton for progress stepper (small rectangular bar)
  - Skeleton for question text (2-3 lines)
  - Skeleton for answer options (3-4 rectangular blocks)
  - Skeleton for button (single rectangle at bottom)
- **Handled interactions:** None
- **Handled validation:** None
- **Types:** None
- **Props:** None

### 4.4 WizardError

- **Description:** Error state displayed when question fetch or session submission fails. Shows user-friendly message with retry option.
- **Main elements:**
  - Error icon
  - Error message text
  - "Spróbuj ponownie" button
- **Handled interactions:**
  - Click on retry button → calls `onRetry`
- **Handled validation:** None
- **Types:** `WizardErrorProps`
- **Props:**
  - `message: string`
  - `onRetry: () => void`

### 4.5 ProgressStepper

- **Description:** Visual indicator showing current progress through the wizard. Displays "Pytanie N z 5" text and optional step indicators.
- **Main elements:**
  - Text display: "Pytanie {currentStep} z {totalSteps}"
  - Optional: 5 step circles/dots showing completed, current, and upcoming steps
- **Handled interactions:** None
- **Handled validation:** None
- **Types:** `ProgressStepperProps`
- **Props:**
  - `currentStep: number` (1-indexed for display)
  - `totalSteps: number`

### 4.6 QuestionCard

- **Description:** Displays the current question text in a prominent, readable format.
- **Main elements:**
  - `<h2>` or `<p>` with question text
  - Appropriate font size and spacing for readability
- **Handled interactions:** None
- **Handled validation:** None
- **Types:** `QuestionCardProps`
- **Props:**
  - `questionText: string`

### 4.7 AnswerOptions

- **Description:** Container for answer options implementing RadioGroup semantics. Manages ARIA roles for accessibility.
- **Main elements:**
  - `<div role="radiogroup">` container
  - `aria-labelledby` pointing to question
  - Maps over options to render `OptionCard` components
- **Handled interactions:**
  - Keyboard navigation between options (arrow keys)
- **Handled validation:** None (single-select enforced by design)
- **Types:** `AnswerOptionsProps`
- **Props:**
  - `options: QuestionOption[]`
  - `selectedAnswerId: string | null`
  - `questionId: string` (for ARIA association)
  - `onSelectAnswer: (answerId: string) => void`

### 4.8 OptionCard

- **Description:** Individual selectable answer option with visual feedback for selected/unselected states.
- **Main elements:**
  - `<button role="radio">` with card-like styling
  - Checkmark icon or border highlight when selected
  - Option text content
  - Focus ring for keyboard navigation
- **Handled interactions:**
  - Click → calls `onSelect` with option id
  - Keyboard Enter/Space → triggers selection
- **Handled validation:** None
- **Types:** `OptionCardProps`
- **Props:**
  - `option: QuestionOption`
  - `isSelected: boolean`
  - `onSelect: (id: string) => void`

### 4.9 NextButton

- **Description:** Navigation button to proceed to next question or submit the wizard. Includes tooltip for disabled state.
- **Main elements:**
  - Shadcn `Button` component
  - Wrapped in `Tooltip` component for disabled state message
  - Text: "Dalej" for questions 1-4, "Zakończ" for question 5
  - Loading spinner when `isSubmitting` is true
- **Handled interactions:**
  - Click → calls `onNext` (when enabled)
- **Handled validation:**
  - Button disabled when `!selectedAnswerId`
  - Shows tooltip "Wybierz odpowiedź aby kontynuować" when disabled
- **Types:** `NextButtonProps`
- **Props:**
  - `isDisabled: boolean`
  - `isLastQuestion: boolean`
  - `isLoading: boolean`
  - `onNext: () => void`

## 5. Types

### 5.1 Existing Types (from `src/types.ts`)

```typescript
// Question option structure
interface QuestionOption {
  id: string;
  text: string;
  sow_fragment: string;
}

// API response for questions
interface QuestionResponse {
  id: string;
  question_order: number;
  question_text: string;
  options: QuestionOption[];
}

interface QuestionsListResponse {
  questions: QuestionResponse[];
  total: number;
}

// Answer structure for submission
interface AnswerItem {
  question_id: string;
  answer_id: string;
}

// Session creation command
interface CreateSessionCommand {
  answers: AnswerItem[];
}

// Session response after creation
interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: AnswerItem[];
  generated_fragments: string[];
}

interface ErrorResponse {
  error: string;
}
```

### 5.2 New Types (in `src/components/wizard/types.ts`)

```typescript
// =============================================================================
// ViewModel Types
// =============================================================================

/**
 * Aggregated wizard state for UI consumption.
 * Derived from useWizard hook state.
 */
interface WizardViewModel {
  /** Current question being displayed */
  currentQuestion: QuestionResponse | null;
  /** 0-indexed position in question sequence */
  currentQuestionIndex: number;
  /** Total number of questions (always 5) */
  totalQuestions: number;
  /** Currently selected answer ID for current question */
  selectedAnswerId: string | null;
  /** Whether current question is the last one */
  isLastQuestion: boolean;
  /** Whether user can proceed to next question */
  canProceed: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

interface WizardContentProps {
  currentQuestion: QuestionResponse;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswerId: string | null;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onSelectAnswer: (answerId: string) => void;
  onNext: () => void;
}

interface WizardErrorProps {
  message: string;
  onRetry: () => void;
}

interface ProgressStepperProps {
  /** Current step number (1-indexed for display) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
}

interface QuestionCardProps {
  questionText: string;
}

interface AnswerOptionsProps {
  options: QuestionOption[];
  selectedAnswerId: string | null;
  questionId: string;
  onSelectAnswer: (answerId: string) => void;
}

interface OptionCardProps {
  option: QuestionOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

interface NextButtonProps {
  isDisabled: boolean;
  isLastQuestion: boolean;
  isLoading: boolean;
  onNext: () => void;
}

// =============================================================================
// Hook Types
// =============================================================================

interface WizardState {
  /** Fetched questions from API */
  questions: QuestionResponse[];
  /** Current question index (0-4) */
  currentQuestionIndex: number;
  /** Map of question_id to answer_id */
  answers: Map<string, string>;
  /** Initial loading state */
  isLoading: boolean;
  /** Session submission loading state */
  isSubmitting: boolean;
  /** Error message if any operation failed */
  error: string | null;
}

interface UseWizardReturn {
  /** All fetched questions */
  questions: QuestionResponse[];
  /** Current question being displayed */
  currentQuestion: QuestionResponse | null;
  /** Current question index (0-indexed) */
  currentQuestionIndex: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Selected answer ID for current question */
  selectedAnswerId: string | null;
  /** Whether current question is the last */
  isLastQuestion: boolean;
  /** Whether user can proceed (has selected answer) */
  canProceed: boolean;
  /** Initial loading state */
  isLoading: boolean;
  /** Submission loading state */
  isSubmitting: boolean;
  /** Error message */
  error: string | null;
  /** Select an answer for current question */
  selectAnswer: (answerId: string) => void;
  /** Proceed to next question or submit */
  goToNext: () => Promise<void>;
  /** Retry failed operation */
  retry: () => void;
}
```

## 6. State Management

The wizard state is managed by a custom `useWizard` hook that encapsulates all wizard logic and state.

### 6.1 Hook: `useWizard`

**Location:** `src/components/hooks/useWizard.ts`

**State Variables:**
| Variable | Type | Initial Value | Purpose |
|----------|------|---------------|---------|
| `questions` | `QuestionResponse[]` | `[]` | Fetched questions from API |
| `currentQuestionIndex` | `number` | `0` | Current step in wizard (0-4) |
| `answers` | `Map<string, string>` | `new Map()` | Collected answers (question_id → answer_id) |
| `isLoading` | `boolean` | `true` | Initial fetch loading state |
| `isSubmitting` | `boolean` | `false` | Session creation loading state |
| `error` | `string | null` | `null` | Error message for display |

**Derived State:**
- `currentQuestion`: `questions[currentQuestionIndex] || null`
- `totalQuestions`: `questions.length`
- `selectedAnswerId`: `answers.get(currentQuestion?.id) || null`
- `isLastQuestion`: `currentQuestionIndex === totalQuestions - 1`
- `canProceed`: `selectedAnswerId !== null`

**Actions:**
1. `fetchQuestions()`: Called on mount, fetches from `GET /api/questions`
2. `selectAnswer(answerId)`: Updates `answers` Map with current question's answer
3. `goToNext()`: Increments `currentQuestionIndex` or calls `submitSession()` if last
4. `submitSession()`: POSTs to `/api/sessions`, redirects on success
5. `retry()`: Re-fetches questions (for fetch errors) or retries submission

**Hook Implementation Pattern:**
```typescript
export function useWizard(): UseWizardReturn {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const totalQuestions = questions.length;
  const selectedAnswerId = currentQuestion
    ? answers.get(currentQuestion.id) ?? null
    : null;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const canProceed = selectedAnswerId !== null;

  // ... implementation details
}
```

## 7. API Integration

### 7.1 Fetch Questions (on mount)

**Endpoint:** `GET /api/questions`

**Request:** No body required, authentication via cookie

**Response Types:**
- Success (200): `QuestionsListResponse`
- Unauthorized (401): `ErrorResponse` → redirect to `/login`
- Server Error (500): `ErrorResponse` → display error with retry

**Implementation:**
```typescript
const fetchQuestions = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/questions');

    if (response.status === 401) {
      window.location.assign('/login');
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const data: QuestionsListResponse = await response.json();
    setQuestions(data.questions);
  } catch (err) {
    setError('Nie można załadować pytań. Spróbuj ponownie.');
  } finally {
    setIsLoading(false);
  }
}, []);
```

### 7.2 Submit Session (on wizard completion)

**Endpoint:** `POST /api/sessions`

**Request Type:** `CreateSessionCommand`
```typescript
{
  answers: AnswerItem[]  // Array of { question_id, answer_id }
}
```

**Response Types:**
- Created (201): `SessionDetailResponse` → redirect to `/sessions/{id}`
- Bad Request (400): `ErrorResponse` → display validation error
- Unauthorized (401): `ErrorResponse` → redirect to `/login`
- Server Error (500): `ErrorResponse` → display error with retry

**Implementation:**
```typescript
const submitSession = useCallback(async () => {
  setIsSubmitting(true);
  setError(null);

  try {
    const answersArray: AnswerItem[] = Array.from(answers.entries()).map(
      ([question_id, answer_id]) => ({ question_id, answer_id })
    );

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answersArray }),
    });

    if (response.status === 401) {
      window.location.assign('/login');
      return;
    }

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error);
    }

    const session: SessionDetailResponse = await response.json();
    window.location.assign(`/sessions/${session.id}`);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Nie udało się zapisać sesji. Spróbuj ponownie.');
  } finally {
    setIsSubmitting(false);
  }
}, [answers]);
```

## 8. User Interactions

### 8.1 Answer Selection

| Trigger | Component | Action | Outcome |
|---------|-----------|--------|---------|
| Click on option | `OptionCard` | `onSelect(option.id)` | Answer stored in state, visual feedback (border/checkmark), button enabled |
| Click different option | `OptionCard` | `onSelect(newOption.id)` | Previous deselected, new selected |
| Keyboard Enter/Space on focused option | `OptionCard` | `onSelect(option.id)` | Same as click |
| Arrow key navigation | `AnswerOptions` | Focus moves between options | Visual focus indicator |

### 8.2 Navigation

| Trigger | Component | Condition | Action | Outcome |
|---------|-----------|-----------|--------|---------|
| Click "Dalej" | `NextButton` | Answer selected, not last question | `goToNext()` | Next question displayed, progress updated |
| Click "Zakończ" | `NextButton` | Answer selected, last question | `goToNext()` → `submitSession()` | Session created, redirect to results |
| Click disabled button | `NextButton` | No answer selected | None | Tooltip displayed |
| Click "Spróbuj ponownie" | `WizardError` | Error state | `retry()` | Re-fetch or re-submit |

### 8.3 Transitions

- Button enabled/disabled: 150ms transition on opacity and background color
- Question change: Optional fade transition (CSS) for smooth UX
- Focus moves to first option when new question loads

## 9. Conditions and Validation

### 9.1 UI State Conditions

| Condition | Affected Component | State Effect |
|-----------|-------------------|--------------|
| `isLoading === true` | `WizardView` | Shows `WizardSkeleton` |
| `error !== null` | `WizardView` | Shows `WizardError` |
| `selectedAnswerId === null` | `NextButton` | Disabled with tooltip |
| `selectedAnswerId !== null` | `NextButton` | Enabled |
| `isLastQuestion === true` | `NextButton` | Text shows "Zakończ" |
| `isSubmitting === true` | `NextButton` | Shows loading spinner, disabled |

### 9.2 API Validation (Server-side)

The API validates on `POST /api/sessions`:
- Exactly 5 answers required
- No duplicate `question_id` values
- All `question_id` values must exist in database
- All `answer_id` values must match valid options

**Client-side Prevention:**
- Using `Map<string, string>` for answers ensures unique `question_id` keys
- Only options from fetched questions are selectable
- Wizard enforces answering all 5 questions before submission

### 9.3 Tooltip Behavior

The "Wybierz odpowiedź aby kontynuować" tooltip appears:
- When hovering over disabled `NextButton`
- Implementation: Wrap `Button` in `Tooltip` from Shadcn/ui

Note: Tooltips on disabled buttons require wrapping the button in a `<span>` since disabled elements don't receive hover events.

## 10. Error Handling

### 10.1 Error Scenarios

| Scenario | Detection | User Message | Recovery Action |
|----------|-----------|--------------|-----------------|
| Network error on question fetch | `fetch` throws or `!response.ok` | "Nie można załadować pytań. Spróbuj ponownie." | Retry button calls `fetchQuestions()` |
| Unauthorized (401) on fetch | `response.status === 401` | N/A | Automatic redirect to `/login` |
| Network error on submission | `fetch` throws or `!response.ok` | Error message from API or "Nie udało się zapisać sesji. Spróbuj ponownie." | Retry button, answers preserved |
| Validation error (400) on submission | `response.status === 400` | API error message | Should not occur with proper UI; retry available |
| Unauthorized (401) on submission | `response.status === 401` | N/A | Automatic redirect to `/login` |

### 10.2 Error State Preservation

When submission fails:
- All answers remain in state (not lost)
- User can retry submission without re-answering
- Error message clearly indicates the issue

### 10.3 Console Logging

All errors are logged to console for debugging:
```typescript
console.error('Wizard error:', err);
```

## 11. Implementation Steps

### Phase 1: Setup and Types

1. **Create wizard directory structure**
   - Create `src/components/wizard/` directory
   - Create `src/components/wizard/types.ts` with all type definitions

2. **Install required Shadcn components**
   ```bash
   npx shadcn@latest add tooltip
   npx shadcn@latest add radio-group
   ```

### Phase 2: Core Hook Implementation

3. **Create `useWizard` hook**
   - Create `src/components/hooks/useWizard.ts`
   - Implement state management with `useState`
   - Implement `fetchQuestions()` with `useEffect` on mount
   - Implement `selectAnswer()` action
   - Implement `goToNext()` action
   - Implement `submitSession()` for final submission
   - Implement `retry()` action
   - Export all state and actions

### Phase 3: UI Components (bottom-up)

4. **Create `OptionCard` component**
   - Implement selectable card with radio button semantics
   - Add selected state styling (border color, checkmark icon)
   - Add focus state styling
   - Add 150ms transition for state changes

5. **Create `AnswerOptions` component**
   - Implement RadioGroup container with proper ARIA
   - Map options to `OptionCard` components
   - Handle keyboard navigation

6. **Create `QuestionCard` component**
   - Simple text display component
   - Appropriate typography styling

7. **Create `ProgressStepper` component**
   - Display "Pytanie N z 5" text
   - Optional: Add visual step indicators

8. **Create `NextButton` component**
   - Use Shadcn `Button` component
   - Wrap in `Tooltip` for disabled state
   - Handle "Dalej" vs "Zakończ" text
   - Add loading spinner for submission state
   - Add 150ms transition on state changes

9. **Create `WizardSkeleton` component**
   - Use Shadcn `Skeleton` component
   - Mirror layout of actual wizard content

10. **Create `WizardError` component**
    - Error message display
    - Retry button

### Phase 4: Container Components

11. **Create `WizardContent` component**
    - Compose all UI components
    - Handle layout and spacing
    - Pass props from parent

12. **Create `WizardView` component**
    - Initialize `useWizard` hook
    - Conditional rendering based on state
    - Handle focus management on question change

### Phase 5: Page Integration

13. **Create wizard Astro page**
    - Create `src/pages/wizard.astro`
    - Add `export const prerender = false;` for SSR
    - Render `WizardView` as React island with `client:load`
    - Use authenticated layout

### Phase 6: Testing and Polish

14. **Manual testing**
    - Test complete wizard flow
    - Test error states
    - Test keyboard navigation
    - Test responsive behavior
    - Verify ARIA accessibility

15. **Edge case handling**
    - Verify behavior on page refresh (state lost - expected)
    - Test rapid clicking
    - Test slow network conditions

### Phase 7: Accessibility Verification

16. **Accessibility audit**
    - Verify RadioGroup ARIA roles
    - Test screen reader announcements
    - Verify focus management
    - Check color contrast for selected/unselected states
    - Verify tooltip is accessible
