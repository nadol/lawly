# API Endpoint Implementation Plan: GET /api/sessions

## 1. Przegląd punktu końcowego

Endpoint `GET /api/sessions` służy do pobierania paginowanej listy ukończonych sesji bieżącego użytkownika. Zwraca podstawowe informacje o sesjach (id, data utworzenia, data ukończenia) wraz z metadanymi paginacji (total, limit, offset). Endpoint wymaga autoryzacji - użytkownik musi być zalogowany przez Supabase Auth. Dane są automatycznie filtrowane przez RLS (Row Level Security) do sesji należących do zalogowanego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/sessions`
- **Parametry:**
  - **Wymagane:** brak
  - **Opcjonalne:**
    | Parametr | Typ | Domyślnie | Opis |
    |----------|-----|-----------|------|
    | `limit` | integer | 10 | Liczba sesji na stronę (min 1, max 50) |
    | `offset` | integer | 0 | Liczba sesji do pominięcia |
- **Request Body:** brak (GET request)

## 3. Wykorzystywane typy

### Istniejące typy (src/types.ts)

```typescript
/**
 * Summary DTO for session list items (GET /api/sessions).
 * Contains minimal session data for history display.
 */
export interface SessionSummary {
  id: string;
  created_at: string;
  completed_at: string;
}

/**
 * Response DTO for the sessions list endpoint (GET /api/sessions).
 * Contains paginated session summaries.
 */
export interface SessionsListResponse {
  sessions: SessionSummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Standard error response DTO for all API endpoints.
 */
export interface ErrorResponse {
  error: string;
}
```

### Nowy schemat walidacji (src/lib/schemas/sessions.schema.ts)

```typescript
import { z } from "zod";

/**
 * Zod schema for validating GET /api/sessions query parameters.
 * Uses coerce to handle string-to-number conversion from URL params.
 */
export const getSessionsQuerySchema = z.object({
  limit: z
    .coerce
    .number({
      invalid_type_error: "Invalid limit parameter",
    })
    .int({ message: "Invalid limit parameter" })
    .min(1, { message: "Invalid limit parameter" })
    .max(50, { message: "Invalid limit parameter" })
    .default(10),
  offset: z
    .coerce
    .number({
      invalid_type_error: "Invalid offset parameter",
    })
    .int({ message: "Invalid offset parameter" })
    .min(0, { message: "Invalid offset parameter" })
    .default(0),
});

export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

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

### Błędy

| Status | Body | Warunek |
|--------|------|---------|
| 400 | `{ "error": "Invalid limit parameter" }` | limit < 1, limit > 50, lub nie jest liczbą całkowitą |
| 400 | `{ "error": "Invalid offset parameter" }` | offset < 0 lub nie jest liczbą całkowitą |
| 401 | `{ "error": "Unauthorized" }` | Brak aktywnej sesji auth |
| 500 | `{ "error": "Internal server error" }` | Błąd bazy danych |

## 5. Przepływ danych

```
┌─────────────────┐
│  HTTP Request   │
│ GET /api/sessions?limit=10&offset=0
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Astro Route    │
│  Handler (GET)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get Supabase    │
│ from locals     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Auth     │◄──── 401 Unauthorized
│ (getUser())     │
└────────┬────────┘
         │ ✓ authenticated
         ▼
┌─────────────────┐
│ Parse & Validate│◄──── 400 Bad Request
│ Query Params    │      (Zod validation)
│ (Zod schema)    │
└────────┬────────┘
         │ ✓ valid
         ▼
┌─────────────────┐
│ Sessions Service│
│ getUserSessions │──────► Supabase DB Query
│ (with RLS)      │◄────── (sessions table)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Map to DTO      │
│ SessionSummary[]│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Response │
│ 200 OK + JSON   │
└─────────────────┘
```

### Interakcje z bazą danych

1. **Zapytanie o sesje użytkownika:**
   ```sql
   SELECT id, created_at, completed_at
   FROM sessions
   WHERE user_id = $1
   ORDER BY created_at DESC
   LIMIT $2
   OFFSET $3
   ```

2. **Zapytanie o łączną liczbę sesji:**
   ```sql
   SELECT COUNT(*)
   FROM sessions
   WHERE user_id = $1
   ```

**Uwaga:** RLS automatycznie filtruje sesje do `user_id = auth.uid()`, ale dla bezpieczeństwa i wydajności przekazujemy `userId` jawnie do serwisu.

## 6. Względy bezpieczeństwa

### Autoryzacja

- Endpoint wymaga aktywnej sesji Supabase Auth (cookie-based)
- Weryfikacja przez `supabase.auth.getUser()` na początku handlera
- Brak dostępu dla niezalogowanych użytkowników (401 Unauthorized)

### Row Level Security (RLS)

- Tabela `sessions` ma włączone RLS
- Policy: `sessions.user_id = auth.uid()`
- Użytkownik może widzieć tylko własne sesje
- Nawet przy próbie manipulacji parametrami, RLS zapobiega dostępowi do cudzych danych

### Walidacja danych wejściowych

- Parametry `limit` i `offset` walidowane przez Zod
- `limit` ograniczony do zakresu 1-50 (zapobiega DoS przez masowe zapytania)
- `offset` musi być >= 0
- Niewłaściwe typy (np. string zamiast liczby) są odrzucane

### Zapobieganie atakom

- **SQL Injection:** Supabase SDK używa parametryzowanych zapytań
- **DoS:** Limit max 50 rekordów na zapytanie
- **Enumeration:** RLS zapobiega wyliczaniu cudzych sesji

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi

| Scenariusz | Kod statusu | Komunikat | Działanie |
|------------|-------------|-----------|-----------|
| Brak sesji auth | 401 | "Unauthorized" | Zwróć błąd, nie loguj |
| limit < 1 | 400 | "Invalid limit parameter" | Zwróć błąd z Zod |
| limit > 50 | 400 | "Invalid limit parameter" | Zwróć błąd z Zod |
| limit nie jest liczbą | 400 | "Invalid limit parameter" | Zwróć błąd z Zod |
| offset < 0 | 400 | "Invalid offset parameter" | Zwróć błąd z Zod |
| offset nie jest liczbą | 400 | "Invalid offset parameter" | Zwróć błąd z Zod |
| Błąd bazy danych | 500 | "Internal server error" | Zaloguj błąd, zwróć generyczny komunikat |
| Brak sesji (pusta lista) | 200 | - | Zwróć pustą tablicę sessions: [] |

### Logowanie błędów

- Błędy 500 (bazy danych) logowane przez `console.error()` z pełnym kontekstem
- Błędy 401/400 nie są logowane (normalne scenariusze użycia)
- Format logowania zgodny z innymi endpointami w projekcie

## 8. Rozważania dotyczące wydajności

### Optymalizacje

1. **Paginacja:** Limit 50 rekordów zapobiega pobieraniu zbyt dużych zbiorów danych
2. **Indeks na user_id:** Tabela `sessions` ma FK na `user_id`, co zapewnia indeks dla zapytań filtrujących po użytkowniku
3. **Minimalna projekcja:** Pobierane tylko niezbędne kolumny (id, created_at, completed_at)
4. **Sortowanie:** ORDER BY created_at DESC używa indeksu (jeśli istnieje composite index)

### Potencjalne wąskie gardła

1. **COUNT(*):** Zapytanie o total może być wolne przy dużej liczbie sesji
   - Mitygacja: W MVP oczekiwana liczba sesji na użytkownika jest niska (dziesiątki)
   - Przyszłość: Rozważyć cached count lub estimated count

2. **Offset-based pagination:** Przy dużych offsetach wydajność spada
   - Mitygacja: W MVP nie oczekuje się setek sesji na użytkownika
   - Przyszłość: Rozważyć cursor-based pagination

### Rekomendowany indeks (jeśli nie istnieje)

```sql
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);
```

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji

Utworzyć plik `src/lib/schemas/sessions.schema.ts` z schematem Zod dla parametrów zapytania.

```typescript
// src/lib/schemas/sessions.schema.ts
import { z } from "zod";

export const getSessionsQuerySchema = z.object({
  limit: z
    .coerce
    .number({ invalid_type_error: "Invalid limit parameter" })
    .int({ message: "Invalid limit parameter" })
    .min(1, { message: "Invalid limit parameter" })
    .max(50, { message: "Invalid limit parameter" })
    .default(10),
  offset: z
    .coerce
    .number({ invalid_type_error: "Invalid offset parameter" })
    .int({ message: "Invalid offset parameter" })
    .min(0, { message: "Invalid offset parameter" })
    .default(0),
});

export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;
```

### Krok 2: Utworzenie serwisu sessions

Utworzyć plik `src/lib/services/sessions.service.ts` z funkcjami do pobierania sesji.

```typescript
// src/lib/services/sessions.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { SessionSummary } from "../../types";

interface SessionSelectResult {
  id: string;
  created_at: string;
  completed_at: string | null;
}

interface GetSessionsResult {
  sessions: SessionSummary[];
  total: number;
}

/**
 * Fetches paginated list of user's completed sessions.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - UUID of the user whose sessions to fetch
 * @param limit - Number of sessions to return (1-50)
 * @param offset - Number of sessions to skip
 * @returns Object with sessions array and total count
 * @throws Error if database query fails
 */
export async function getUserSessions(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  offset: number
): Promise<GetSessionsResult> {
  // Query for sessions with pagination
  const { data, error, count } = await supabase
    .from("sessions")
    .select("id, created_at, completed_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const sessions: SessionSummary[] = (data ?? []).map((row: SessionSelectResult) => ({
    id: row.id,
    created_at: row.created_at,
    completed_at: row.completed_at ?? row.created_at, // fallback for null
  }));

  return {
    sessions,
    total: count ?? 0,
  };
}
```

### Krok 3: Utworzenie handlera API

Utworzyć plik `src/pages/api/sessions.ts` z handlerem GET.

```typescript
// src/pages/api/sessions.ts
import type { APIRoute } from "astro";

import { getSessionsQuerySchema } from "../../lib/schemas/sessions.schema";
import { getUserSessions } from "../../lib/services/sessions.service";
import type { SessionsListResponse, ErrorResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/sessions
 *
 * Retrieves a paginated list of the current user's completed sessions.
 * Requires an active Supabase Auth session (cookie-based).
 *
 * @query limit - Number of sessions per page (1-50, default 10)
 * @query offset - Number of sessions to skip (default 0)
 * @returns 200 - SessionsListResponse with sessions and pagination metadata
 * @returns 400 - ErrorResponse if query parameters are invalid
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
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

    // 2. Parse and validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    };

    const validationResult = getSessionsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const errorResponse: ErrorResponse = { error: firstError.message };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { limit, offset } = validationResult.data;

    // 3. Fetch user sessions
    const { sessions, total } = await getUserSessions(supabase, user.id, limit, offset);

    // 4. Return response
    const response: SessionsListResponse = {
      sessions,
      total,
      limit,
      offset,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 4: Weryfikacja typów i linting

1. Uruchomić `npm run lint` aby sprawdzić błędy lintingu
2. Uruchomić `npm run typecheck` (lub `npx tsc --noEmit`) aby sprawdzić typy TypeScript
3. Naprawić ewentualne błędy

### Krok 5: Testy manualne

Przetestować endpoint za pomocą narzędzia HTTP (curl, Postman, lub przeglądarka):

```bash
# Test bez autoryzacji (oczekiwany 401)
curl -X GET http://localhost:3000/api/sessions

# Test z autoryzacją (po zalogowaniu się w aplikacji)
# - domyślne parametry
curl -X GET http://localhost:3000/api/sessions --cookie "..." 

# - z limit i offset
curl -X GET "http://localhost:3000/api/sessions?limit=5&offset=0" --cookie "..."

# - nieprawidłowy limit (oczekiwany 400)
curl -X GET "http://localhost:3000/api/sessions?limit=100" --cookie "..."

# - nieprawidłowy offset (oczekiwany 400)
curl -X GET "http://localhost:3000/api/sessions?offset=-1" --cookie "..."
```

### Krok 6: Dokumentacja

Zaktualizować dokumentację API (jeśli istnieje) o nowy endpoint.

---

## Podsumowanie plików do utworzenia/modyfikacji

| Plik | Akcja | Opis |
|------|-------|------|
| `src/lib/schemas/sessions.schema.ts` | Utwórz | Schemat Zod dla parametrów zapytania |
| `src/lib/services/sessions.service.ts` | Utwórz | Serwis do pobierania sesji z bazy danych |
| `src/pages/api/sessions.ts` | Utwórz | Handler API endpoint |

## Zależności

- Brak nowych zależności npm (Zod już zainstalowany)
- Wykorzystuje istniejące typy z `src/types.ts`
- Wykorzystuje istniejący klient Supabase z middleware
