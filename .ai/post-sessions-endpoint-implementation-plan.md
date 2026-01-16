# API Endpoint Implementation Plan: POST /api/sessions

## 1. Przegląd punktu końcowego

Endpoint `POST /api/sessions` służy do tworzenia nowej ukończonej sesji wizarda z odpowiedziami użytkownika i automatycznie wygenerowanymi fragmentami SOW (Statement of Work). 

Główne funkcje:
- Przyjmuje tablicę 5 odpowiedzi na pytania wizarda
- Waliduje poprawność odpowiedzi względem pytań w bazie danych
- Generuje fragmenty SOW na podstawie wybranych opcji (mapowanie 1:1 answer → sow_fragment)
- Zapisuje sesję z odpowiedziami i fragmentami do bazy danych
- Zwraca pełne dane utworzonej sesji

Sesje są niemutowalne (write-once) — po utworzeniu nie można ich edytować ani usuwać przez aplikację.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **URL:** `/api/sessions`
- **Content-Type:** `application/json`
- **Uwierzytelnienie:** Wymagane (Supabase Auth cookie-based session)

### Parametry

- **Wymagane:** Brak parametrów URL
- **Opcjonalne:** Brak

### Request Body

```typescript
interface CreateSessionCommand {
  answers: AnswerItem[];
}

interface AnswerItem {
  question_id: string;  // UUID pytania z tabeli questions
  answer_id: string;    // ID wybranej opcji z questions.options[].id
}
```

**Przykład:**

```json
{
  "answers": [
    { "question_id": "uuid-1", "answer_id": "option-1" },
    { "question_id": "uuid-2", "answer_id": "option-2" },
    { "question_id": "uuid-3", "answer_id": "option-1" },
    { "question_id": "uuid-4", "answer_id": "option-3" },
    { "question_id": "uuid-5", "answer_id": "option-2" }
  ]
}
```

## 3. Wykorzystywane typy

### Istniejące typy (src/types.ts)

```typescript
// Command Model - dane wejściowe
interface CreateSessionCommand {
  answers: AnswerItem[];
}

// Struktura pojedynczej odpowiedzi
interface AnswerItem {
  question_id: string;
  answer_id: string;
}

// Response DTO - dane wyjściowe
interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: AnswerItem[];
  generated_fragments: string[];
}

// Standardowy błąd
interface ErrorResponse {
  error: string;
}

// Opcja pytania (do walidacji)
interface QuestionOption {
  id: string;
  text: string;
  sow_fragment: string;
}
```

### Nowe typy do dodania (src/lib/schemas/sessions.schema.ts)

```typescript
// Zod schema dla walidacji request body
const answerItemSchema = z.object({
  question_id: z.string().uuid({ message: "Invalid answer structure" }),
  answer_id: z.string().min(1, { message: "Invalid answer structure" }),
});

const createSessionCommandSchema = z.object({
  answers: z
    .array(answerItemSchema, { 
      invalid_type_error: "answers must be an array" 
    })
    .length(5, { message: "Exactly 5 answers are required" }),
});
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "2026-01-25T14:30:00Z",
  "completed_at": "2026-01-25T14:35:00Z",
  "answers": [
    { "question_id": "uuid-1", "answer_id": "option-1" },
    { "question_id": "uuid-2", "answer_id": "option-2" }
  ],
  "generated_fragments": [
    "This Statement of Work covers a small-scale project...",
    "The payment terms are net 30 days..."
  ]
}
```

### Błędy

| Status | Komunikat | Warunek |
|--------|-----------|---------|
| 400 | `"Invalid request body"` | Brak ciała lub niepoprawny JSON |
| 400 | `"answers must be an array"` | `answers` nie jest tablicą |
| 400 | `"Exactly 5 answers are required"` | `answers.length !== 5` |
| 400 | `"Invalid answer structure"` | Brak `question_id` lub `answer_id` w elemencie |
| 400 | `"Invalid question_id: {id}"` | `question_id` nie istnieje w bazie |
| 400 | `"Invalid answer_id: {id} for question: {id}"` | `answer_id` nie jest opcją dla pytania |
| 400 | `"Duplicate question_id: {id}"` | To samo pytanie odpowiedziane dwa razy |
| 401 | `"Unauthorized"` | Brak ważnej sesji auth |
| 500 | `"Internal server error"` | Błąd bazy danych |

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              POST /api/sessions                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. WERYFIKACJA AUTENTYKACJI                                                 │
│    - supabase.auth.getUser()                                                │
│    - Jeśli brak sesji → 401 Unauthorized                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PARSOWANIE REQUEST BODY                                                  │
│    - request.json()                                                         │
│    - Jeśli błąd JSON → 400 Invalid request body                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. WALIDACJA SCHEMATU (Zod)                                                 │
│    - Sprawdzenie czy answers jest tablicą                                   │
│    - Sprawdzenie czy answers.length === 5                                   │
│    - Sprawdzenie struktury każdego elementu (question_id, answer_id)        │
│    - Sprawdzenie duplikatów question_id                                     │
│    - Jeśli błąd → 400 z odpowiednim komunikatem                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. WALIDACJA BIZNESOWA (z bazą danych)                                      │
│    - Pobranie wszystkich pytań z tabeli questions                           │
│    - Sprawdzenie czy każdy question_id istnieje                             │
│    - Sprawdzenie czy każdy answer_id jest prawidłową opcją dla pytania      │
│    - Jeśli błąd → 400 z odpowiednim komunikatem                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. GENEROWANIE FRAGMENTÓW SOW                                               │
│    - Dla każdej odpowiedzi: znajdź opcję → weź sow_fragment                │
│    - Zachowaj kolejność zgodną z question_order                             │
│    - Wynik: string[] z 5 fragmentami                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. ZAPIS DO BAZY DANYCH                                                     │
│    - INSERT INTO sessions (user_id, answers, generated_fragments,           │
│      completed_at)                                                          │
│    - Jeśli błąd → 500 Internal server error                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. ZWRÓCENIE ODPOWIEDZI                                                     │
│    - Status 201 Created                                                     │
│    - Body: SessionDetailResponse                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interakcje z bazą danych

1. **Odczyt:** Tabela `questions` (wszystkie pytania z opcjami)
2. **Zapis:** Tabela `sessions` (nowa sesja)

### Zależności między komponentami

```
src/pages/api/sessions.ts (POST handler)
    │
    ├── src/lib/schemas/sessions.schema.ts
    │   └── createSessionCommandSchema (Zod validation)
    │
    ├── src/lib/services/sessions.service.ts
    │   ├── validateAnswersAgainstQuestions()
    │   ├── generateSowFragments()
    │   └── createSession()
    │
    └── src/lib/services/questions.service.ts
        └── getAllQuestions() (istniejąca funkcja)
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Wymagana ważna sesja Supabase Auth (cookie-based)
- Weryfikacja przez `supabase.auth.getUser()` przed jakąkolwiek operacją
- Brak dostępu dla niezalogowanych użytkowników (401)

### Autoryzacja

- Użytkownik może tworzyć sesje tylko dla siebie (`user_id` pochodzi z sesji auth, nie z request body)
- RLS w Supabase zapewnia izolację danych na poziomie bazy danych
- Polityka RLS: `sessions.user_id = auth.uid()` dla INSERT

### Walidacja danych wejściowych

| Pole | Walidacja |
|------|-----------|
| `answers` | Musi być tablicą, dokładnie 5 elementów |
| `question_id` | Musi być prawidłowym UUID, musi istnieć w tabeli questions |
| `answer_id` | Musi być niepustym stringiem, musi być prawidłową opcją dla pytania |

### Ochrona przed atakami

- **SQL Injection:** Minimalne ryzyko dzięki Supabase query builder (parametryzowane zapytania)
- **Mass Assignment:** Kontrolowane przez ścisłe typowanie TypeScript i Zod
- **Data Tampering:** `user_id` pochodzi z sesji auth, nie z request body
- **Invalid Data Injection:** Pełna walidacja `answer_id` względem `questions.options`

### Uwagi dotyczące bezpieczeństwa MVP

- Brak rate limiting (akceptowalne dla 1-10 użytkowników wewnętrznych)
- Brak ochrony przed replay attacks (użytkownik może tworzyć wiele identycznych sesji)
- Sesje są niemutowalne — brak ryzyka nieautoryzowanej modyfikacji

## 7. Obsługa błędów

### Strategia obsługi błędów

1. **Early returns** dla warunków błędów (zgodnie z wytycznymi projektu)
2. **Guard clauses** dla walidacji na początku funkcji
3. **Logowanie błędów** przez `console.error()` dla błędów 500
4. **Przyjazne dla użytkownika** komunikaty błędów w formacie `ErrorResponse`

### Mapowanie błędów

```typescript
// Błędy walidacji schematu (Zod)
if (!validationResult.success) {
  const error = validationResult.error.errors[0];
  return Response(400, { error: error.message });
}

// Błędy walidacji biznesowej
if (!questionExists) {
  return Response(400, { error: `Invalid question_id: ${questionId}` });
}

if (!answerOptionExists) {
  return Response(400, { error: `Invalid answer_id: ${answerId} for question: ${questionId}` });
}

if (duplicateQuestionId) {
  return Response(400, { error: `Duplicate question_id: ${questionId}` });
}

// Błędy bazy danych
if (dbError) {
  console.error("Error creating session:", dbError);
  return Response(500, { error: "Internal server error" });
}
```

### Kolejność walidacji

1. Autentykacja (401)
2. Parsowanie JSON (400 - Invalid request body)
3. Walidacja schematu Zod (400 - różne komunikaty)
4. Sprawdzenie duplikatów question_id (400)
5. Walidacja question_id w bazie (400)
6. Walidacja answer_id dla każdego pytania (400)
7. Operacje bazodanowe (500)

## 8. Rozważania dotyczące wydajności

### Obecne podejście (MVP)

- Pojedyncze zapytanie do pobrania wszystkich pytań (5 rekordów)
- Pojedyncze zapytanie INSERT dla nowej sesji
- Całkowita liczba zapytań: 2

### Potencjalne optymalizacje (poza zakresem MVP)

1. **Cache pytań:** Pytania są statyczne, można je cache'ować w pamięci lub Redis
2. **Batch validation:** Obecna implementacja już waliduje wszystkie odpowiedzi w jednym przebiegu
3. **Prepared statements:** Automatycznie obsługiwane przez Supabase

### Rozmiar payloadu

- Request: ~500 bajtów (5 odpowiedzi)
- Response: ~2-5 KB (w zależności od długości fragmentów SOW)
- Akceptowalne dla MVP

### Skalowalność

- Obecna architektura obsłuży 1-10 równoczesnych użytkowników bez problemów
- Dla większej skali: rozważyć connection pooling i indeksy na `user_id`

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/sessions.schema.ts`

```typescript
import { z } from "zod";

// Istniejący schemat getSessionsQuerySchema...

/**
 * Schema dla pojedynczego elementu odpowiedzi
 */
const answerItemSchema = z.object({
  question_id: z.string().uuid({ message: "Invalid answer structure" }),
  answer_id: z.string().min(1, { message: "Invalid answer structure" }),
});

/**
 * Schema dla POST /api/sessions request body
 */
export const createSessionCommandSchema = z.object({
  answers: z
    .array(answerItemSchema, {
      invalid_type_error: "answers must be an array",
    })
    .length(5, { message: "Exactly 5 answers are required" }),
});

export type CreateSessionCommandSchema = z.infer<typeof createSessionCommandSchema>;
```

### Krok 2: Dodanie funkcji walidacji biznesowej

**Plik:** `src/lib/services/sessions.service.ts`

```typescript
import type { QuestionResponse, AnswerItem } from "../../types";

/**
 * Sprawdza duplikaty question_id w tablicy odpowiedzi.
 * @returns question_id duplikatu lub null jeśli brak duplikatów
 */
export function findDuplicateQuestionId(answers: AnswerItem[]): string | null {
  const seen = new Set<string>();
  for (const answer of answers) {
    if (seen.has(answer.question_id)) {
      return answer.question_id;
    }
    seen.add(answer.question_id);
  }
  return null;
}

/**
 * Waliduje odpowiedzi względem pytań z bazy danych.
 * @returns Obiekt z błędem lub null jeśli walidacja przeszła
 */
export function validateAnswersAgainstQuestions(
  answers: AnswerItem[],
  questions: QuestionResponse[]
): { error: string } | null {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  for (const answer of answers) {
    const question = questionMap.get(answer.question_id);
    
    if (!question) {
      return { error: `Invalid question_id: ${answer.question_id}` };
    }

    const validOption = question.options.find((opt) => opt.id === answer.answer_id);
    
    if (!validOption) {
      return { 
        error: `Invalid answer_id: ${answer.answer_id} for question: ${answer.question_id}` 
      };
    }
  }

  return null;
}
```

### Krok 3: Dodanie funkcji generowania fragmentów SOW

**Plik:** `src/lib/services/sessions.service.ts`

```typescript
/**
 * Generuje fragmenty SOW na podstawie odpowiedzi.
 * Fragmenty są sortowane według question_order.
 */
export function generateSowFragments(
  answers: AnswerItem[],
  questions: QuestionResponse[]
): string[] {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  
  // Sortuj odpowiedzi według question_order
  const sortedAnswers = [...answers].sort((a, b) => {
    const qA = questionMap.get(a.question_id)!;
    const qB = questionMap.get(b.question_id)!;
    return qA.question_order - qB.question_order;
  });

  return sortedAnswers.map((answer) => {
    const question = questionMap.get(answer.question_id)!;
    const option = question.options.find((opt) => opt.id === answer.answer_id)!;
    return option.sow_fragment;
  });
}
```

### Krok 4: Dodanie funkcji tworzenia sesji

**Plik:** `src/lib/services/sessions.service.ts`

```typescript
import type { SessionDetailResponse } from "../../types";

/**
 * Tworzy nową sesję w bazie danych.
 */
export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  answers: AnswerItem[],
  generatedFragments: string[]
): Promise<SessionDetailResponse> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      answers: answers,
      generated_fragments: generatedFragments,
      completed_at: now,
    })
    .select("id, user_id, created_at, completed_at, answers, generated_fragments")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    created_at: data.created_at,
    completed_at: data.completed_at ?? data.created_at,
    answers: data.answers as AnswerItem[],
    generated_fragments: data.generated_fragments,
  };
}
```

### Krok 5: Implementacja handlera POST w API endpoint

**Plik:** `src/pages/api/sessions.ts`

```typescript
import type { APIRoute } from "astro";

import { 
  getSessionsQuerySchema, 
  createSessionCommandSchema 
} from "../../lib/schemas/sessions.schema";
import { 
  getUserSessions,
  findDuplicateQuestionId,
  validateAnswersAgainstQuestions,
  generateSowFragments,
  createSession,
} from "../../lib/services/sessions.service";
import { getAllQuestions } from "../../lib/services/questions.service";
import type { 
  SessionsListResponse, 
  SessionDetailResponse, 
  ErrorResponse 
} from "../../types";

export const prerender = false;

// Istniejący GET handler...

/**
 * POST /api/sessions
 *
 * Creates a new completed session with answers and generated fragments.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  try {
    // 1. Weryfikacja autentykacji
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = { error: "Unauthorized" };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parsowanie request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponse = { error: "Invalid request body" };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Walidacja schematu Zod
    const validationResult = createSessionCommandSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const errorResponse: ErrorResponse = { error: firstError.message };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { answers } = validationResult.data;

    // 4. Sprawdzenie duplikatów question_id
    const duplicateId = findDuplicateQuestionId(answers);
    if (duplicateId) {
      const errorResponse: ErrorResponse = { 
        error: `Duplicate question_id: ${duplicateId}` 
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Pobranie pytań i walidacja biznesowa
    const questions = await getAllQuestions(supabase);
    
    const validationError = validateAnswersAgainstQuestions(answers, questions);
    if (validationError) {
      const errorResponse: ErrorResponse = { error: validationError.error };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Generowanie fragmentów SOW
    const generatedFragments = generateSowFragments(answers, questions);

    // 7. Zapis sesji do bazy danych
    const session = await createSession(
      supabase, 
      user.id, 
      answers, 
      generatedFragments
    );

    // 8. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 6: Testy

**Scenariusze do przetestowania:**

1. **Happy path:** Poprawne 5 odpowiedzi → 201 z SessionDetailResponse
2. **Brak autentykacji:** Bez sesji → 401 Unauthorized
3. **Pusty body:** `{}` → 400 answers must be an array
4. **Nieprawidłowa liczba odpowiedzi:** 4 lub 6 odpowiedzi → 400 Exactly 5 answers are required
5. **Brak question_id:** `{ answer_id: "x" }` → 400 Invalid answer structure
6. **Nieistniejące question_id:** UUID spoza tabeli → 400 Invalid question_id
7. **Nieprawidłowy answer_id:** ID nieistniejące w opcjach → 400 Invalid answer_id
8. **Zduplikowany question_id:** To samo pytanie 2x → 400 Duplicate question_id

### Krok 7: Dokumentacja

- Zaktualizować README z informacją o nowym endpoincie
- Dodać przykłady użycia w dokumentacji API (jeśli istnieje)

## 10. Podsumowanie zmian w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/lib/schemas/sessions.schema.ts` | Modyfikacja | Dodanie `createSessionCommandSchema` |
| `src/lib/services/sessions.service.ts` | Modyfikacja | Dodanie funkcji walidacji i tworzenia sesji |
| `src/pages/api/sessions.ts` | Modyfikacja | Dodanie handlera POST |
