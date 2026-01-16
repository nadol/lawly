# API Endpoint Implementation Plan: GET /api/sessions/[id]

## 1. Przegląd punktu końcowego

Endpoint `GET /api/sessions/[id]` służy do pobierania szczegółowych informacji o konkretnej sesji użytkownika. Zwraca pełne dane sesji, w tym odpowiedzi użytkownika na pytania oraz wygenerowane fragmenty SOW (Statement of Work).

**Kluczowe cechy:**
- Wymaga uwierzytelnienia (Supabase Auth session via cookies)
- Autoryzacja na poziomie bazy danych (RLS - Row Level Security)
- Zwraca dane tylko dla sesji należącej do zalogowanego użytkownika
- Sesje są niemutowalne (read-only)

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/sessions/[id]`
- **Lokalizacja pliku:** `src/pages/api/sessions/[id].ts`

### Parametry

| Typ | Nazwa | Format | Wymagany | Opis |
|-----|-------|--------|----------|------|
| URL Path | `id` | UUID (v4) | Tak | Identyfikator sesji |

### Request Body

Brak — endpoint nie przyjmuje ciała żądania.

### Headers

| Header | Wartość | Opis |
|--------|---------|------|
| `Cookie` | `sb-*` | Ciasteczka sesji Supabase Auth (automatycznie zarządzane) |

## 3. Wykorzystywane typy

### Istniejące typy (z `src/types.ts`)

```typescript
// Response DTO - już zdefiniowany
interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: AnswerItem[];
  generated_fragments: string[];
}

// Już zdefiniowany
interface AnswerItem {
  question_id: string;
  answer_id: string;
}

// Już zdefiniowany
interface ErrorResponse {
  error: string;
}
```

### Nowy schemat walidacji (do dodania w `src/lib/schemas/sessions.schema.ts`)

```typescript
// Schema walidacji parametru ID z URL
export const sessionIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid session ID format" }),
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "created_at": "2026-01-25T14:30:00Z",
  "completed_at": "2026-01-25T14:35:00Z",
  "answers": [
    {
      "question_id": "770e8400-e29b-41d4-a716-446655440002",
      "answer_id": "option-1"
    }
  ],
  "generated_fragments": [
    "This Statement of Work covers a small-scale project...",
    "The payment terms are net 30 days..."
  ]
}
```

### Błędy

| Status | Body | Warunek |
|--------|------|---------|
| 400 | `{ "error": "Invalid session ID format" }` | Parametr `id` nie jest poprawnym UUID |
| 401 | `{ "error": "Unauthorized" }` | Brak ważnej sesji uwierzytelnienia |
| 404 | `{ "error": "Session not found" }` | Sesja nie istnieje lub należy do innego użytkownika (RLS) |
| 500 | `{ "error": "Internal server error" }` | Błąd bazy danych lub serwera |

> **Uwaga:** Status 403 (Forbidden) ze specyfikacji jest obsługiwany jako 404 z powodu działania RLS. Supabase RLS zwraca pusty wynik zamiast błędu autoryzacji, co uniemożliwia rozróżnienie między "sesja nie istnieje" a "sesja należy do innego użytkownika". Jest to zamierzone zachowanie ze względów bezpieczeństwa (nie ujawniamy czy zasób istnieje).

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REQUEST FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Request: GET /api/sessions/[id]                                         │
│         │                                                                    │
│         ▼                                                                    │
│  2. Middleware (src/middleware/index.ts)                                    │
│     └── Tworzy Supabase client z cookies → context.locals.supabase          │
│         │                                                                    │
│         ▼                                                                    │
│  3. API Route Handler (src/pages/api/sessions/[id].ts)                      │
│     │                                                                        │
│     ├── 3a. Walidacja parametru ID (Zod schema)                             │
│     │       └── Błąd → 400 Bad Request                                      │
│     │                                                                        │
│     ├── 3b. Weryfikacja uwierzytelnienia (supabase.auth.getUser())          │
│     │       └── Błąd → 401 Unauthorized                                     │
│     │                                                                        │
│     └── 3c. Pobranie sesji przez Service                                    │
│             │                                                                │
│             ▼                                                                │
│  4. Service Layer (src/lib/services/sessions.service.ts)                    │
│     └── getSessionById(supabase, sessionId)                                 │
│         │                                                                    │
│         ▼                                                                    │
│  5. Supabase Query                                                          │
│     └── SELECT * FROM sessions WHERE id = $1                                │
│         └── RLS automatycznie dodaje: AND user_id = auth.uid()              │
│         │                                                                    │
│         ▼                                                                    │
│  6. Response                                                                 │
│     ├── data = null → 404 Not Found                                         │
│     ├── error → 500 Internal Server Error                                   │
│     └── data → 200 OK + SessionDetailResponse                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interakcja z bazą danych

**Tabela:** `public.sessions`

**Query:**
```sql
SELECT id, user_id, created_at, completed_at, answers, generated_fragments
FROM sessions
WHERE id = $1
-- RLS automatycznie: AND user_id = auth.uid()
```

**RLS Policy (istniejąca):**
```sql
CREATE POLICY "Users can only access their own sessions"
ON sessions FOR SELECT
USING (user_id = auth.uid());
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- **Mechanizm:** Supabase Auth z sesjami opartymi na cookies
- **Weryfikacja:** `supabase.auth.getUser()` sprawdza ważność tokenu
- **Middleware:** Automatycznie tworzy klienta Supabase z dostępem do cookies

### Autoryzacja

- **Mechanizm:** Row Level Security (RLS) na poziomie PostgreSQL
- **Policy:** Użytkownik może odczytywać tylko sesje gdzie `user_id = auth.uid()`
- **Zachowanie:** Zapytanie o cudzą sesję zwraca `null` (nie błąd), co jest mapowane na 404

### Walidacja danych wejściowych

| Dane | Walidacja | Cel |
|------|-----------|-----|
| `id` (URL param) | UUID v4 format (Zod) | Zapobiega SQL injection, nieprawidłowym zapytaniom |

### Potencjalne zagrożenia i mitigacje

| Zagrożenie | Mitigacja |
|------------|-----------|
| Nieautoryzowany dostęp | Weryfikacja sesji auth przed każdym zapytaniem |
| Dostęp do cudzych sesji | RLS na poziomie bazy danych |
| SQL Injection | Parametryzowane zapytania (Supabase client) |
| UUID enumeration | Brak rozróżnienia między 403 a 404 |
| Brute force | Rate limiting (do zaimplementowania na poziomie Vercel/middleware) |

## 7. Obsługa błędów

### Tabela scenariuszy błędów

| Scenariusz | Wykrycie | Status | Wiadomość | Logowanie |
|------------|----------|--------|-----------|-----------|
| Nieprawidłowy format UUID | Zod validation | 400 | "Invalid session ID format" | Nie |
| Brak ciasteczek sesji | `getUser()` zwraca null | 401 | "Unauthorized" | Nie |
| Token wygasł/nieprawidłowy | `getUser()` zwraca error | 401 | "Unauthorized" | Nie |
| Sesja nie istnieje | Query zwraca null | 404 | "Session not found" | Nie |
| Sesja należy do innego użytkownika | RLS blokuje, query zwraca null | 404 | "Session not found" | Nie |
| Błąd połączenia z bazą | Supabase error | 500 | "Internal server error" | Tak (console.error) |
| Nieoczekiwany wyjątek | try/catch | 500 | "Internal server error" | Tak (console.error) |

### Wzorzec implementacji obsługi błędów

```typescript
// Early returns pattern
if (!validationResult.success) {
  return new Response(JSON.stringify({ error: "Invalid session ID format" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

if (!session) {
  return new Response(JSON.stringify({ error: "Session not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 8. Rozważania dotyczące wydajności

### Charakterystyka zapytania

- **Typ:** Pojedyncze zapytanie po kluczu głównym (UUID)
- **Złożoność:** O(1) - indeks na kolumnie `id` (PRIMARY KEY)
- **Rozmiar odpowiedzi:** ~1-5 KB (zależnie od liczby fragmentów)

### Optymalizacje

| Aspekt | Status | Uwagi |
|--------|--------|-------|
| Indeks na `id` | ✅ Automatyczny | PRIMARY KEY tworzy indeks B-tree |
| Indeks na `user_id` | ✅ Zalecany | Przyspiesza RLS filter |
| Projekcja kolumn | ✅ Zaimplementowany | SELECT tylko potrzebnych kolumn |
| Connection pooling | ✅ Supabase | Zarządzane przez Supabase |
| Caching | ❌ Nie wymagane | Dane rzadko odpytywane, niski traffic |

### Szacowane czasy odpowiedzi

| Scenariusz | Oczekiwany czas |
|------------|-----------------|
| Cache hit (Supabase connection pool) | < 50ms |
| Cold query | < 100ms |
| Z opóźnieniem sieci (EU → Supabase) | < 200ms |

### Potencjalne wąskie gardła

1. **Brak indeksu na `user_id`** - może spowolnić RLS filter przy dużej liczbie sesji
2. **Duży rozmiar `generated_fragments`** - jeśli fragmenty będą bardzo długie

## 9. Etapy wdrożenia

### Krok 1: Dodanie schematu walidacji

**Plik:** `src/lib/schemas/sessions.schema.ts`

```typescript
// Dodać na końcu pliku:

/**
 * Schema walidacji parametru ID sesji z URL.
 * Używane przez GET /api/sessions/[id]
 */
export const sessionIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid session ID format" }),
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
```

### Krok 2: Dodanie funkcji serwisowej

**Plik:** `src/lib/services/sessions.service.ts`

```typescript
// Dodać nową funkcję:

/**
 * Fetches a single session by ID.
 * RLS ensures the user can only access their own sessions.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param sessionId - UUID of the session to fetch
 * @returns SessionDetailResponse if found, null otherwise
 * @throws Error if database query fails
 */
export async function getSessionById(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SessionDetailResponse | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, user_id, created_at, completed_at, answers, generated_fragments")
    .eq("id", sessionId)
    .single();

  if (error) {
    // PGRST116 = no rows returned (not an error, just not found)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
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

### Krok 3: Utworzenie pliku endpointu

**Plik:** `src/pages/api/sessions/[id].ts`

```typescript
import type { APIRoute } from "astro";

import { sessionIdParamSchema } from "../../../lib/schemas/sessions.schema";
import { getSessionById } from "../../../lib/services/sessions.service";
import type { SessionDetailResponse, ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/sessions/[id]
 *
 * Retrieves detailed information about a specific session.
 * Requires an active Supabase Auth session (cookie-based).
 * RLS ensures users can only access their own sessions.
 *
 * @param id - Session UUID from URL path
 * @returns 200 - SessionDetailResponse with full session data
 * @returns 400 - ErrorResponse if session ID format is invalid
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 404 - ErrorResponse if session not found or belongs to another user
 * @returns 500 - ErrorResponse on server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;

  try {
    // 1. Validate URL parameter
    const validationResult = sessionIdParamSchema.safeParse({ id: params.id });

    if (!validationResult.success) {
      const errorResponse: ErrorResponse = { error: "Invalid session ID format" };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: sessionId } = validationResult.data;

    // 2. Verify authentication
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

    // 3. Fetch session by ID (RLS handles authorization)
    const session = await getSessionById(supabase, sessionId);

    // 4. Handle not found (includes RLS-blocked access)
    if (!session) {
      const errorResponse: ErrorResponse = { error: "Session not found" };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response
    const response: SessionDetailResponse = session;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 4: Weryfikacja struktury katalogów

Upewnić się, że istnieje katalog `src/pages/api/sessions/` dla pliku `[id].ts`.

### Krok 5: Testowanie manualne

| Scenariusz | Metoda testowania |
|------------|-------------------|
| Poprawne żądanie | `curl -b cookies.txt http://localhost:4321/api/sessions/{valid-uuid}` |
| Nieprawidłowy UUID | `curl http://localhost:4321/api/sessions/invalid-id` → 400 |
| Brak autoryzacji | `curl http://localhost:4321/api/sessions/{uuid}` (bez cookies) → 401 |
| Nieistniejąca sesja | `curl -b cookies.txt http://localhost:4321/api/sessions/{random-uuid}` → 404 |
| Cudza sesja | Zaloguj jako user A, odpytaj sesję user B → 404 (RLS) |

### Krok 6: Aktualizacja eksportów (opcjonalnie)

Jeśli projekt używa barrel exports, dodać eksport nowej funkcji w odpowiednim pliku index.

---

## Checklist przed wdrożeniem

- [ ] Schemat Zod dodany do `sessions.schema.ts`
- [ ] Funkcja `getSessionById` dodana do `sessions.service.ts`
- [ ] Plik `[id].ts` utworzony w `src/pages/api/sessions/`
- [ ] `export const prerender = false` ustawiony
- [ ] Wszystkie typy zaimportowane poprawnie
- [ ] Testy manualne wykonane dla wszystkich scenariuszy
- [ ] Brak błędów linter/TypeScript
- [ ] Kod zgodny z wzorcami z istniejących endpointów
