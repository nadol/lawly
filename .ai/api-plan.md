# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Profile | `public.profiles` | Current user's profile data (onboarding state) |
| Questions | `public.questions` | Predefined wizard questions with options |
| Sessions | `public.sessions` | Completed user sessions with answers and fragments |

## 2. Endpoints

### 2.1 Profile Endpoints

#### GET /api/profile

Retrieves the current authenticated user's profile.

**Authentication:** Required (Supabase Auth session)

**Request:** No body required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "has_seen_welcome": false,
  "created_at": "2026-01-25T14:30:00Z"
}
```

**Error Responses:**
| Status | Message | Condition |
|--------|---------|-----------|
| 401 | "Unauthorized" | No valid session |
| 404 | "Profile not found" | Profile doesn't exist (should not happen due to trigger) |
| 500 | "Internal server error" | Database error |

---

#### PATCH /api/profile

Updates the current user's profile. Only `has_seen_welcome` can be updated.

**Authentication:** Required (Supabase Auth session)

**Request Body:**
```json
{
  "has_seen_welcome": true
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "has_seen_welcome": true,
  "created_at": "2026-01-25T14:30:00Z"
}
```

**Error Responses:**
| Status | Message | Condition |
|--------|---------|-----------|
| 400 | "Invalid request body" | Missing or invalid fields |
| 400 | "has_seen_welcome must be a boolean" | Invalid type |
| 401 | "Unauthorized" | No valid session |
| 500 | "Internal server error" | Database error |

---

### 2.2 Questions Endpoints

#### GET /api/questions

Retrieves all questions ordered by `question_order` for the wizard.

**Authentication:** Required (Supabase Auth session)

**Request:** No body required

**Response (200 OK):**
```json
{
  "questions": [
    {
      "id": "uuid",
      "question_order": 1,
      "question_text": "What is the project scope?",
      "options": [
        {
          "id": "option-1",
          "text": "Small project (up to 2 weeks)",
          "sow_fragment": "This Statement of Work covers a small-scale project..."
        },
        {
          "id": "option-2",
          "text": "Medium project (2-8 weeks)",
          "sow_fragment": "This Statement of Work covers a medium-scale project..."
        }
      ]
    }
  ],
  "total": 5
}
```

**Error Responses:**
| Status | Message | Condition |
|--------|---------|-----------|
| 401 | "Unauthorized" | No valid session |
| 500 | "Internal server error" | Database error |

---

### 2.3 Sessions Endpoints

#### GET /api/sessions

Retrieves a paginated list of the current user's completed sessions.

**Authentication:** Required (Supabase Auth session)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of sessions per page (max 50) |
| `offset` | integer | 0 | Number of sessions to skip |

**Request:** No body required

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "created_at": "2026-01-25T14:30:00Z",
      "completed_at": "2026-01-25T14:35:00Z"
    }
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

**Error Responses:**
| Status | Message | Condition |
|--------|---------|-----------|
| 400 | "Invalid limit parameter" | limit < 1 or limit > 50 |
| 400 | "Invalid offset parameter" | offset < 0 |
| 401 | "Unauthorized" | No valid session |
| 500 | "Internal server error" | Database error |

---

#### POST /api/sessions

Creates a new completed session with answers and generated fragments.

**Authentication:** Required (Supabase Auth session)

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "answer_id": "option-1"
    },
    {
      "question_id": "uuid",
      "answer_id": "option-2"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "2026-01-25T14:30:00Z",
  "completed_at": "2026-01-25T14:35:00Z",
  "answers": [
    {
      "question_id": "uuid",
      "answer_id": "option-1"
    }
  ],
  "generated_fragments": [
    "This Statement of Work covers a small-scale project...",
    "The payment terms are net 30 days..."
  ]
}
```

**Error Responses:**
| Status | Message | Condition |
|--------|---------|-----------|
| 400 | "Invalid request body" | Missing or malformed body |
| 400 | "answers must be an array" | answers is not an array |
| 400 | "Exactly 5 answers are required" | answers.length !== 5 |
| 400 | "Invalid answer structure" | answer missing question_id or answer_id |
| 400 | "Invalid question_id: {id}" | question_id doesn't exist |
| 400 | "Invalid answer_id: {id} for question: {id}" | answer_id not in question options |
| 400 | "Duplicate question_id: {id}" | Same question answered twice |
| 401 | "Unauthorized" | No valid session |
| 500 | "Internal server error" | Database error |

---

#### GET /api/sessions/[id]

Retrieves detailed information about a specific session.

**Authentication:** Required (Supabase Auth session)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID |

**Request:** No body required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "2026-01-25T14:30:00Z",
  "completed_at": "2026-01-25T14:35:00Z",
  "answers": [
    {
      "question_id": "uuid",
      "answer_id": "option-1"
    }
  ],
  "generated_fragments": [
    "This Statement of Work covers a small-scale project...",
    "The payment terms are net 30 days..."
  ]
}
```

**Error Responses:**
| Status | Message | Condition |
|--------|---------|-----------|
| 400 | "Invalid session ID format" | ID is not a valid UUID |
| 401 | "Unauthorized" | No valid session |
| 403 | "Forbidden" | Session belongs to different user (RLS) |
| 404 | "Session not found" | Session doesn't exist |
| 500 | "Internal server error" | Database error |

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Type:** Supabase Auth with Google OAuth 2.0

**Implementation:**
1. Frontend initiates Google OAuth flow via Supabase Auth
2. Supabase handles OAuth callback and creates session
3. Session token stored in cookies (managed by Supabase)
4. API endpoints extract user from `context.locals.supabase.auth.getUser()`

**Session Management:**
- Sessions managed by Supabase Auth
- Automatic session refresh
- Server-side session validation on each API request

### 3.2 Authorization

**Row Level Security (RLS):**
- All authorization enforced at database level via RLS policies
- API endpoints use authenticated Supabase client

**RLS Policies:**

| Table | Operation | Policy |
|-------|-----------|--------|
| `profiles` | SELECT | `id = auth.uid()` |
| `profiles` | UPDATE | `id = auth.uid()` |
| `questions` | SELECT | `true` (all authenticated) |
| `sessions` | SELECT | `user_id = auth.uid()` |
| `sessions` | INSERT | `user_id = auth.uid()` |

### 3.3 API Middleware Pattern

```typescript
// Pseudocode for API authentication
export async function GET({ locals }) {
  const { data: { user }, error } = await locals.supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // User is authenticated, proceed with request
}
```

---

## 4. Validation and Business Logic

### 4.1 Profile Validation

| Field | Validation Rules |
|-------|------------------|
| `has_seen_welcome` | Must be boolean |

**Business Logic:**
- Profile created automatically via database trigger on user registration
- Only `has_seen_welcome` can be updated by user
- Used to control welcome screen display

### 4.2 Questions Validation

**No user input validation required** - questions are read-only for users.

**Business Logic:**
- Questions always returned ordered by `question_order`
- All questions returned in single request (no pagination needed for 5 questions)
- Options include `sow_fragment` for client-side fragment preview (optional)

### 4.3 Sessions Validation

#### POST /api/sessions Validation

| Field | Validation Rules |
|-------|------------------|
| `answers` | Required, must be array |
| `answers.length` | Must equal 5 |
| `answers[].question_id` | Required, must be valid UUID, must exist in questions table |
| `answers[].answer_id` | Required, must be string, must exist in corresponding question's options |
| Unique question_ids | No duplicate question_ids allowed |

**Business Logic:**

1. **Answer Validation:**
   - Validate all 5 questions are answered
   - Validate each question_id exists in database
   - Validate each answer_id exists in the corresponding question's options array

2. **Fragment Generation:**
   - For each answer, extract `sow_fragment` from the matched option
   - Order fragments by `question_order`
   - Store as `text[]` in `generated_fragments`

3. **Session Creation:**
   - Set `user_id` from authenticated user
   - Set `created_at` to current timestamp
   - Set `completed_at` to current timestamp
   - Store validated `answers` as JSONB
   - Store generated `fragments` as text array

4. **Immutability:**
   - Sessions are write-once (no UPDATE/DELETE endpoints)
   - Once created, sessions cannot be modified

### 4.4 Fragment Generation Algorithm

```
1. Fetch all questions from database (ordered by question_order)
2. Create a map: question_id -> question
3. For each answer in request:
   a. Find question by question_id
   b. Find option in question.options where option.id === answer.answer_id
   c. Extract option.sow_fragment
4. Return fragments array in question_order sequence
```

### 4.5 Error Handling Strategy

**Standard Error Response Format:**
```json
{
  "error": "Human-readable error message"
}
```

**Error Categories:**

| Category | HTTP Status | Example |
|----------|-------------|---------|
| Authentication | 401 | Missing or invalid session |
| Authorization | 403 | Accessing another user's session |
| Validation | 400 | Invalid request body |
| Not Found | 404 | Resource doesn't exist |
| Server Error | 500 | Database connection failure |

### 4.6 API Response Headers

All API responses include:
- `Content-Type: application/json`

### 4.7 Request Size Limits

- Maximum request body size: 10KB (sufficient for session creation)
- No file uploads supported

---

## 5. API Endpoint Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile` | Get current user's profile | Required |
| PATCH | `/api/profile` | Update profile (welcome screen) | Required |
| GET | `/api/questions` | Get all wizard questions | Required |
| GET | `/api/sessions` | List user's sessions | Required |
| POST | `/api/sessions` | Create completed session | Required |
| GET | `/api/sessions/[id]` | Get session details | Required |

---

## 6. Data Transfer Objects (DTOs)

### 6.1 Command Models

```typescript
// PATCH /api/profile
interface UpdateProfileCommand {
  has_seen_welcome: boolean;
}

// POST /api/sessions
interface CreateSessionCommand {
  answers: Array<{
    question_id: string;
    answer_id: string;
  }>;
}
```

### 6.2 Response DTOs

```typescript
// Profile response
interface ProfileResponse {
  id: string;
  has_seen_welcome: boolean;
  created_at: string;
}

// Question option
interface QuestionOption {
  id: string;
  text: string;
  sow_fragment: string;
}

// Question response
interface QuestionResponse {
  id: string;
  question_order: number;
  question_text: string;
  options: QuestionOption[];
}

// Questions list response
interface QuestionsListResponse {
  questions: QuestionResponse[];
  total: number;
}

// Session summary (for list)
interface SessionSummary {
  id: string;
  created_at: string;
  completed_at: string;
}

// Sessions list response
interface SessionsListResponse {
  sessions: SessionSummary[];
  total: number;
  limit: number;
  offset: number;
}

// Session detail response
interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: Array<{
    question_id: string;
    answer_id: string;
  }>;
  generated_fragments: string[];
}

// Error response
interface ErrorResponse {
  error: string;
}
```
