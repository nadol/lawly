# API Endpoint Implementation Plan: PATCH /api/profile

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/profile` służy do aktualizacji profilu aktualnie zalogowanego użytkownika. W wersji MVP jedynym modyfikowalnym polem jest `has_seen_welcome`, które kontroluje wyświetlanie ekranu powitalnego dla nowych użytkowników.

Endpoint jest częścią flow onboardingowego - po wyświetleniu ekranu powitalnego frontend wywołuje ten endpoint, aby oznaczyć użytkownika jako "obeznany" z aplikacją.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/profile`
- **Parametry:**
  - **Wymagane:** brak (użytkownik identyfikowany przez sesję)
  - **Opcjonalne:** brak
- **Request Body:**
  ```json
  {
    "has_seen_welcome": true
  }
  ```
- **Nagłówki:**
  - `Content-Type: application/json`
  - Cookie sesji Supabase Auth (automatycznie zarządzane)

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`:

```typescript
// Command Model dla żądania
interface UpdateProfileCommand {
  has_seen_welcome: boolean;
}

// DTO odpowiedzi
type ProfileResponse = Tables<'profiles'>;
// Rozwija się do:
// {
//   id: string;
//   has_seen_welcome: boolean;
//   created_at: string;
// }

// DTO błędu
interface ErrorResponse {
  error: string;
}
```

### Nowy schemat Zod do walidacji (do utworzenia):

```typescript
// src/lib/schemas/profile.schema.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  has_seen_welcome: z.boolean({
    required_error: "has_seen_welcome is required",
    invalid_type_error: "has_seen_welcome must be a boolean"
  })
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):
```json
{
  "id": "uuid",
  "has_seen_welcome": true,
  "created_at": "2026-01-25T14:30:00Z"
}
```

### Błędy:

| Status | Treść odpowiedzi | Warunek |
|--------|------------------|---------|
| 400 | `{"error": "Invalid request body"}` | Brak body lub nieprawidłowy JSON |
| 400 | `{"error": "has_seen_welcome must be a boolean"}` | Pole ma nieprawidłowy typ |
| 401 | `{"error": "Unauthorized"}` | Brak aktywnej sesji |
| 500 | `{"error": "Internal server error"}` | Błąd bazy danych |

## 5. Przepływ danych

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Klient    │───▶│  PATCH /api/     │───▶│ profile.service │───▶│   Supabase   │
│  (Frontend) │    │     profile      │    │  .updateProfile │    │   Database   │
└─────────────┘    └──────────────────┘    └─────────────────┘    └──────────────┘
      │                    │                       │                     │
      │  1. PATCH request  │                       │                     │
      │  with JSON body    │                       │                     │
      │───────────────────▶│                       │                     │
      │                    │  2. Verify auth       │                     │
      │                    │  (getUser())          │                     │
      │                    │─────────────────────────────────────────────▶
      │                    │◀─────────────────────────────────────────────
      │                    │                       │                     │
      │                    │  3. Validate body     │                     │
      │                    │  (Zod schema)         │                     │
      │                    │                       │                     │
      │                    │  4. Call service      │                     │
      │                    │──────────────────────▶│                     │
      │                    │                       │  5. UPDATE profiles │
      │                    │                       │  SET has_seen_...   │
      │                    │                       │  WHERE id = user.id │
      │                    │                       │────────────────────▶│
      │                    │                       │◀────────────────────│
      │                    │◀──────────────────────│                     │
      │                    │                       │                     │
      │  6. Return 200     │                       │                     │
      │  ProfileResponse   │                       │                     │
      │◀───────────────────│                       │                     │
```

### Szczegółowy flow:

1. **Parsowanie żądania:** Endpoint odbiera żądanie PATCH z JSON body
2. **Uwierzytelnienie:** Weryfikacja sesji przez `supabase.auth.getUser()`
3. **Walidacja:** Schemat Zod sprawdza poprawność body (obecność i typ `has_seen_welcome`)
4. **Aktualizacja:** Wywołanie serwisu `updateProfileByUserId()` z danymi
5. **Odpowiedź:** Zwrócenie zaktualizowanego profilu lub błędu

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- Endpoint wymaga aktywnej sesji Supabase Auth
- Sesja zarządzana przez cookie (server-side)
- Brak sesji = natychmiastowy zwrot 401

### Autoryzacja
- Użytkownik może aktualizować **tylko własny** profil
- ID użytkownika pobierane z sesji, nie z request body/URL
- RLS w Supabase zapewnia dodatkową warstwę ochrony:
  ```sql
  -- Polityka RLS (powinna istnieć)
  CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  ```

### Walidacja danych wejściowych
- Zod schema zapobiega:
  - Brakującemu polu `has_seen_welcome`
  - Nieprawidłowemu typowi (np. string zamiast boolean)
  - Dodatkowym, nieoczekiwanym polom (tryb strict)
- Parsowanie JSON w try-catch obsługuje malformed JSON

### Ochrona przed atakami
- **Mass Assignment:** Tylko pole `has_seen_welcome` jest akceptowane
- **SQL Injection:** Supabase client używa parametryzowanych zapytań
- **CSRF:** Cookie sesji z odpowiednimi flagami (SameSite, HttpOnly)

## 7. Obsługa błędów

### Hierarchia sprawdzania (early returns):

```typescript
// 1. Sprawdź uwierzytelnienie (401)
if (authError || !user) {
  return Response 401 "Unauthorized"
}

// 2. Sprawdź czy body istnieje (400)
if (!request.body) {
  return Response 400 "Invalid request body"
}

// 3. Waliduj schemat Zod (400)
const result = schema.safeParse(body)
if (!result.success) {
  return Response 400 "has_seen_welcome must be a boolean"
}

// 4. Wykonaj aktualizację (może rzucić 500)
try {
  const profile = await updateProfileByUserId(...)
} catch (error) {
  console.error("Error updating profile:", error)
  return Response 500 "Internal server error"
}
```

### Logowanie błędów:
- **401:** Brak logowania (normalna sytuacja)
- **400:** Brak logowania (błąd klienta)
- **500:** Pełne logowanie błędu z `console.error()` (do diagnostyki)

## 8. Rozważania dotyczące wydajności

### Optymalizacje:
- **Pojedyncze zapytanie:** UPDATE z RETURNING eliminuje potrzebę dodatkowego SELECT
- **Brak N+1:** Endpoint operuje na pojedynczym profilu
- **RLS:** Polityka RLS dodaje minimalny narzut (sprawdzenie `auth.uid() = id`)

### Potencjalne wąskie gardła:
- **Latencja sieci do Supabase:** Minimalizowana przez edge functions / regions
- **Cold start:** Przy serverless, pierwszy request może być wolniejszy

### Metryki do monitorowania:
- Czas odpowiedzi p50, p95, p99
- Liczba błędów 4xx i 5xx
- Liczba requestów na minutę

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/profile.schema.ts`

```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  has_seen_welcome: z.boolean({
    required_error: "has_seen_welcome is required",
    invalid_type_error: "has_seen_welcome must be a boolean"
  })
}).strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

### Krok 2: Rozszerzenie serwisu profile.service.ts

**Plik:** `src/lib/services/profile.service.ts`

Dodać nową funkcję `updateProfileByUserId`:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileRow, UpdateProfileCommand } from "../../types";

/**
 * Updates a user profile by user ID.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - UUID of the user whose profile to update
 * @param data - Profile fields to update
 * @returns Updated profile data
 * @throws Error if database query fails
 */
export async function updateProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateProfileCommand
): Promise<ProfileRow> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ has_seen_welcome: data.has_seen_welcome })
    .eq("id", userId)
    .select("id, has_seen_welcome, created_at")
    .single();

  if (error) {
    throw error;
  }

  return profile;
}
```

### Krok 3: Implementacja handlera PATCH w endpoint

**Plik:** `src/pages/api/profile.ts`

Dodać eksport `PATCH` obok istniejącego `GET`:

```typescript
import type { APIRoute } from "astro";
import { updateProfileSchema } from "../../lib/schemas/profile.schema";
import { getProfileByUserId, updateProfileByUserId } from "../../lib/services/profile.service";
import type { ProfileResponse, ErrorResponse } from "../../types";

export const prerender = false;

// Istniejący GET handler...

/**
 * PATCH /api/profile
 *
 * Updates the profile of the currently authenticated user.
 * Only `has_seen_welcome` field can be updated.
 *
 * @returns 200 - ProfileResponse with updated profile data
 * @returns 400 - ErrorResponse if request body is invalid
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const PATCH: APIRoute = async ({ locals, request }) => {
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

    // 2. Parse request body
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

    // 3. Validate request body with Zod
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        error: "has_seen_welcome must be a boolean"
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Update profile
    const updatedProfile = await updateProfileByUserId(
      supabase,
      user.id,
      validationResult.data
    );

    // 5. Return updated profile
    const response: ProfileResponse = updatedProfile;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 4: Weryfikacja polityki RLS w Supabase

Upewnić się, że istnieje polityka RLS dla UPDATE na tabeli `profiles`:

```sql
-- Sprawdzić w Supabase Dashboard lub przez migrację
-- Jeśli nie istnieje, utworzyć:
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Krok 5: Testowanie manualne

1. **Test bez sesji:** Wywołać endpoint bez zalogowania → oczekiwany 401
2. **Test z pustym body:** Wysłać pusty request → oczekiwany 400
3. **Test z nieprawidłowym typem:** Wysłać `{"has_seen_welcome": "true"}` → oczekiwany 400
4. **Test sukcesu:** Wysłać `{"has_seen_welcome": true}` → oczekiwany 200 z pełnym profilem
5. **Test idempotentności:** Wysłać ten sam request dwukrotnie → oba razy 200

### Krok 6: Utworzenie katalogu schemas (jeśli nie istnieje)

```bash
mkdir -p src/lib/schemas
```

## 10. Checklist przed wdrożeniem

- [ ] Utworzony plik `src/lib/schemas/profile.schema.ts`
- [ ] Dodana funkcja `updateProfileByUserId` do `profile.service.ts`
- [ ] Dodany handler `PATCH` do `src/pages/api/profile.ts`
- [ ] Zweryfikowana polityka RLS dla UPDATE na tabeli profiles
- [ ] Przeprowadzone testy manualne wszystkich scenariuszy
- [ ] Brak błędów TypeScript (`npm run build`)
- [ ] Testy jednostkowe (jeśli dotyczy)
