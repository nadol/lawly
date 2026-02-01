# API Endpoint Implementation Plan: GET /api/questions

## 1. Przegląd punktu końcowego

Endpoint `GET /api/questions` służy do pobierania wszystkich predefiniowanych pytań kreatora SOW. Pytania są zwracane w kolejności określonej przez pole `question_order`, co umożliwia sekwencyjne wyświetlanie ich w kreatorze. Każde pytanie zawiera listę opcji odpowiedzi wraz z przypisanymi fragmentami SOW.

Endpoint jest częścią flow aplikacji Lawly, która automatyzuje generowanie fragmentów SOW poprzez kreator pytań. Wszystkie pytania są dostępne tylko do odczytu dla uwierzytelnionych użytkowników.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/questions`
- **Parametry:**
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body:** brak (GET request)
- **Nagłówki wymagane:**
  - Cookie z sesją Supabase Auth (automatycznie zarządzany)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Już zdefiniowane w src/types.ts

interface QuestionOption {
  id: string;
  text: string;
  sow_fragment: string;
}

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

interface ErrorResponse {
  error: string;
}
```

### Typy bazodanowe

```typescript
// Już zdefiniowane w src/types.ts
type QuestionRow = Tables<'questions'>;
// Zawiera: id, question_order, question_text, options (Json), created_at
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

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
        }
      ]
    }
  ],
  "total": 5
}
```

### Błędy

| Status | Body | Warunek |
|--------|------|---------|
| 401 | `{"error": "Unauthorized"}` | Brak aktywnej sesji lub błąd autoryzacji |
| 500 | `{"error": "Internal server error"}` | Błąd bazy danych lub serwera |

## 5. Przepływ danych

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client    │────>│ API Endpoint │────>│ Questions       │────>│   Supabase   │
│   Request   │     │ /api/questions│     │ Service         │     │   Database   │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                           │                      │                      │
                           │ 1. Auth check        │                      │
                           │    (getUser)         │                      │
                           │──────────────────────┼─────────────────────>│
                           │<─────────────────────┼──────────────────────│
                           │                      │                      │
                           │ 2. Fetch questions   │                      │
                           │    (if authenticated)│                      │
                           │─────────────────────>│                      │
                           │                      │ SELECT ordered       │
                           │                      │─────────────────────>│
                           │                      │<─────────────────────│
                           │                      │                      │
                           │ 3. Transform &       │                      │
                           │    Return response   │                      │
                           │<─────────────────────│                      │
└──────────────────────────┴──────────────────────┴──────────────────────┘
```

### Kroki przepływu:

1. **Weryfikacja autoryzacji** - Sprawdzenie sesji użytkownika przez `supabase.auth.getUser()`
2. **Pobranie danych** - Wywołanie serwisu `getAllQuestions()` który wykonuje zapytanie do Supabase
3. **Transformacja danych** - Mapowanie `QuestionRow` na `QuestionResponse` z typowaniem `options`
4. **Zwrócenie odpowiedzi** - Serializacja do JSON i wysłanie z odpowiednim kodem statusu

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- Endpoint wymaga aktywnej sesji Supabase Auth
- Weryfikacja przez `supabase.auth.getUser()` (nie `getSession()` - bezpieczniejsze)
- Cookie-based session management (HttpOnly, Secure)

### Autoryzacja
- Row Level Security (RLS) na poziomie bazy danych
- Polityka RLS: wszyscy uwierzytelnieni użytkownicy mają dostęp do odczytu tabeli `questions`
- Brak filtrowania po `user_id` - pytania są wspólne dla wszystkich użytkowników

### Walidacja danych
- Brak walidacji wejściowej (endpoint GET bez parametrów)
- Walidacja typów na poziomie TypeScript
- Pole `created_at` nie jest zwracane w odpowiedzi (nie wymaga walidacji)

### Ochrona przed atakami
- JSONB options parsowane bezpiecznie przez Supabase
- Brak interpolacji stringów w zapytaniach (Supabase query builder)
- Content-Type response ustawiony na `application/json`

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Brak sesji użytkownika | 401 | "Unauthorized" | Zwrot błędu bez logowania |
| Błąd autoryzacji Supabase | 401 | "Unauthorized" | Zwrot błędu bez logowania |
| Błąd połączenia z bazą | 500 | "Internal server error" | Logowanie błędu, zwrot ogólnego komunikatu |
| Błąd zapytania Supabase | 500 | "Internal server error" | Logowanie błędu, zwrot ogólnego komunikatu |
| Pusta tabela questions | 200 | `{"questions": [], "total": 0}` | Normalna odpowiedź (nie błąd) |

### Wzorzec obsługi błędów

```typescript
try {
  // 1. Auth check - return 401 on failure
  // 2. Data fetch - throw on error
  // 3. Return success response
} catch (error) {
  console.error("Error fetching questions:", error);
  return 500 with ErrorResponse
}
```

## 8. Rozważania dotyczące wydajności

### Charakterystyka zapytania
- Zapytanie pobiera maksymalnie 5 pytań (założenie MVP)
- JSONB options nie wymaga JOIN-ów
- ORDER BY `question_order` wykorzystuje indeks (domyślnie dla integer)

### Optymalizacje
- **Brak paginacji** - przy 5 pytaniach niepotrzebna
- **Explicit select** - pobieranie tylko wymaganych kolumn (bez `created_at`)
- **Brak cache** - dla MVP wystarczająca wydajność bez dodatkowego cache

### Potencjalne wąskie gardła
- Duże JSONB options (wiele opcji na pytanie) - nie dotyczy MVP (kilka opcji)
- Cold start połączenia Supabase - mitigowane przez connection pooling

## 9. Etapy wdrożenia

### Krok 1: Utworzenie serwisu questions

Utworzyć plik `src/lib/services/questions.service.ts`:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { QuestionRow, QuestionResponse, QuestionOption } from "../../types";

/**
 * Transforms database QuestionRow to API QuestionResponse.
 * Handles JSONB options field type casting.
 */
function mapQuestionRowToResponse(row: QuestionRow): QuestionResponse {
  return {
    id: row.id,
    question_order: row.question_order,
    question_text: row.question_text,
    options: row.options as QuestionOption[],
  };
}

/**
 * Fetches all questions ordered by question_order.
 *
 * @param supabase - Supabase client instance from context.locals
 * @returns Array of questions with typed options
 * @throws Error if database query fails
 */
export async function getAllQuestions(
  supabase: SupabaseClient
): Promise<QuestionResponse[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, question_order, question_text, options")
    .order("question_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapQuestionRowToResponse);
}
```

### Krok 2: Utworzenie endpointu API

Utworzyć plik `src/pages/api/questions.ts`:

```typescript
import type { APIRoute } from "astro";

import { getAllQuestions } from "../../lib/services/questions.service";
import type { QuestionsListResponse, ErrorResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/questions
 *
 * Retrieves all questions ordered by question_order for the wizard.
 * Requires an active Supabase Auth session (cookie-based).
 *
 * @returns 200 - QuestionsListResponse with questions and total count
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Verify authentication
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

    // 2. Fetch all questions
    const questions = await getAllQuestions(supabase);

    // 3. Return response
    const response: QuestionsListResponse = {
      questions,
      total: questions.length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 3: Weryfikacja polityki RLS

Upewnić się, że w Supabase istnieje polityka RLS dla tabeli `questions`:

```sql
-- Polityka SELECT dla uwierzytelnionych użytkowników
CREATE POLICY "Authenticated users can read questions"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (true);
```

### Krok 4: Testy manualne

1. **Test bez autoryzacji:**
   ```bash
   curl -X GET http://localhost:3000/api/questions
   # Oczekiwany rezultat: 401 {"error": "Unauthorized"}
   ```

2. **Test z autoryzacją:**
   - Zalogować się przez Google SSO
   - Wykonać request z cookie sesji
   - Oczekiwany rezultat: 200 z listą pytań

3. **Test pustej tabeli:**
   - Usunąć wszystkie pytania z bazy (tymczasowo)
   - Oczekiwany rezultat: 200 `{"questions": [], "total": 0}`

### Krok 5: Struktura plików po implementacji

```
src/
├── lib/
│   └── services/
│       ├── profile.service.ts  (istniejący)
│       └── questions.service.ts (nowy)
├── pages/
│   └── api/
│       ├── profile.ts (istniejący)
│       └── questions.ts (nowy)
└── types.ts (bez zmian - typy już zdefiniowane)
```
