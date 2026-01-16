# API Endpoint Implementation Plan: GET /api/profile

## 1. Przegląd punktu końcowego

Endpoint `GET /api/profile` służy do pobierania profilu aktualnie zalogowanego użytkownika. Profil zawiera podstawowe informacje o użytkowniku, w tym flagę `has_seen_welcome` używaną do kontroli wyświetlania ekranu powitalnego dla nowych użytkowników.

Endpoint jest chroniony uwierzytelnianiem - wymaga aktywnej sesji Supabase Auth. Profil użytkownika jest tworzony automatycznie przez trigger bazodanowy przy rejestracji, więc każdy zalogowany użytkownik powinien mieć istniejący profil.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/profile`
- **Parametry:**
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body:** Nie dotyczy (metoda GET)
- **Nagłówki wymagane:**
  - Cookie z sesją Supabase Auth (automatycznie zarządzane przez Supabase)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Już zdefiniowane w src/types.ts

/**
 * Response DTO dla endpointów profilu.
 * Bezpośrednie mapowanie na tabelę `profiles`.
 */
export type ProfileResponse = Tables<'profiles'>;
// Struktura:
// {
//   id: string;           // UUID użytkownika
//   has_seen_welcome: boolean;
//   created_at: string;   // ISO 8601 timestamp
// }

/**
 * Standardowy DTO dla odpowiedzi błędów.
 */
export interface ErrorResponse {
  error: string;
}
```

### Utility Types

```typescript
// Już zdefiniowane w src/types.ts

/**
 * Typ wiersza bazy danych dla tabeli profiles.
 * Używany wewnętrznie w service.
 */
export type ProfileRow = Tables<'profiles'>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "has_seen_welcome": false,
  "created_at": "2026-01-25T14:30:00Z"
}
```

### Błędy

| Status | Typ odpowiedzi | Przykład |
|--------|----------------|----------|
| 401 | ErrorResponse | `{ "error": "Unauthorized" }` |
| 404 | ErrorResponse | `{ "error": "Profile not found" }` |
| 500 | ErrorResponse | `{ "error": "Internal server error" }` |

## 5. Przepływ danych

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Klient    │────▶│  Middleware  │────▶│  API Endpoint   │────▶│   Service    │
│  (Browser)  │     │  (Supabase)  │     │ /api/profile    │     │   Profile    │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                           │                      │                      │
                           │                      │                      ▼
                           │                      │              ┌──────────────┐
                           │                      │              │   Supabase   │
                           │                      │              │   Database   │
                           │                      │              │  (profiles)  │
                           │                      │              └──────────────┘
                           │                      │                      │
                           │                      ◀──────────────────────┘
                           │                      │
                           ◀──────────────────────┘
```

### Szczegółowy przepływ:

1. **Klient** wysyła żądanie GET do `/api/profile` z cookie sesji
2. **Middleware** (już skonfigurowany) dodaje klienta Supabase do `context.locals`
3. **API Endpoint**:
   - Pobiera klienta Supabase z `context.locals.supabase`
   - Sprawdza sesję użytkownika przez `supabase.auth.getUser()`
   - Jeśli brak sesji → zwraca 401
   - Wywołuje `ProfileService.getProfileByUserId()`
4. **ProfileService**:
   - Wykonuje zapytanie do tabeli `profiles` z filtrem `id = userId`
   - RLS automatycznie weryfikuje uprawnienia
   - Zwraca profil lub null
5. **API Endpoint**:
   - Jeśli profil null → zwraca 404
   - Jeśli błąd DB → zwraca 500
   - Jeśli sukces → zwraca 200 z danymi profilu

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- Endpoint wymaga aktywnej sesji Supabase Auth
- Weryfikacja sesji przez `supabase.auth.getUser()` (bezpieczniejsze niż `getSession()`)
- Brak sesji = natychmiastowy zwrot 401

### Autoryzacja
- Row Level Security (RLS) na tabeli `profiles` zapewnia, że użytkownik może odczytać tylko własny profil
- Polityka RLS: `profiles.id = auth.uid()`

### Walidacja danych
- Brak danych wejściowych do walidacji (GET bez parametrów)
- UUID użytkownika pochodzi z zweryfikowanej sesji, nie od klienta

### Ochrona przed atakami
- Nie ujawniać szczegółów technicznych w komunikatach błędów
- Używać generycznych komunikatów dla błędów 500
- Logować szczegóły błędów po stronie serwera

## 7. Obsługa błędów

### Tabela scenariuszy błędów

| Scenariusz | Wykrycie | Status | Komunikat | Logowanie |
|------------|----------|--------|-----------|-----------|
| Brak cookie sesji | `getUser()` zwraca null | 401 | "Unauthorized" | Nie |
| Sesja wygasła | `getUser()` zwraca error | 401 | "Unauthorized" | Nie |
| Profil nie istnieje | Zapytanie zwraca null | 404 | "Profile not found" | Tak (warning) |
| Błąd połączenia z DB | Exception z Supabase | 500 | "Internal server error" | Tak (error) |
| Błąd RLS | Supabase error | 500 | "Internal server error" | Tak (error) |

### Implementacja obsługi błędów

```typescript
// Pseudokod struktury obsługi błędów
try {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const profile = await profileService.getProfileByUserId(supabase, user.id);

  if (!profile) {
    console.warn(`Profile not found for user: ${user.id}`);
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(profile), { status: 200 });

} catch (error) {
  console.error("Error fetching profile:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
}
```

## 8. Rozważania dotyczące wydajności

### Charakterystyka endpointu
- **Operacja:** Pojedynczy odczyt z bazy danych
- **Złożoność:** O(1) - odczyt po kluczu głównym
- **Rozmiar odpowiedzi:** ~100-200 bajtów

### Optymalizacje
- **Indeks:** Klucz główny `id` jest automatycznie indeksowany
- **RLS:** Polityka używa `auth.uid()` - zoptymalizowana funkcja Supabase
- **Brak JOIN-ów:** Zapytanie dotyczy pojedynczej tabeli

### Potencjalne wąskie gardła
- Brak w MVP - endpoint jest bardzo lekki
- Przy skalowaniu rozważyć cache na poziomie CDN (Vercel Edge)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie serwisu ProfileService

**Plik:** `src/lib/services/profile.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { ProfileRow } from '../../types';

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, has_seen_welcome, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    // PGRST116 = no rows found (nie jest błędem krytycznym)
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}
```

### Krok 2: Utworzenie endpointu API

**Plik:** `src/pages/api/profile.ts`

```typescript
import type { APIRoute } from 'astro';
import { getProfileByUserId } from '../../lib/services/profile.service';
import type { ProfileResponse, ErrorResponse } from '../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Weryfikacja uwierzytelnienia
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Pobranie profilu
    const profile = await getProfileByUserId(supabase, user.id);

    if (!profile) {
      console.warn(`Profile not found for user: ${user.id}`);
      const errorResponse: ErrorResponse = { error: 'Profile not found' };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Zwrócenie profilu
    const response: ProfileResponse = profile;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

### Krok 3: Weryfikacja typów

Upewnić się, że typy w `src/types.ts` są zgodne ze specyfikacją:
- `ProfileResponse` mapuje się na strukturę odpowiedzi
- `ErrorResponse` jest używany dla wszystkich błędów

### Krok 4: Testowanie manualne

1. **Test bez uwierzytelnienia:**
   - Wyczyść cookies/sesję
   - Wywołaj GET /api/profile
   - Oczekiwany wynik: 401 Unauthorized

2. **Test z uwierzytelnieniem:**
   - Zaloguj się przez Google SSO
   - Wywołaj GET /api/profile
   - Oczekiwany wynik: 200 OK z danymi profilu

3. **Test błędu 404 (edge case):**
   - Wymaga ręcznego usunięcia profilu z DB
   - Wywołaj GET /api/profile
   - Oczekiwany wynik: 404 Profile not found

### Krok 5: Utworzenie struktury katalogów (jeśli nie istnieje)

```
src/
├── lib/
│   └── services/
│       └── profile.service.ts  (nowy)
└── pages/
    └── api/
        └── profile.ts          (nowy)
```

## 10. Checklist wdrożenia

- [ ] Utworzyć katalog `src/lib/services/` (jeśli nie istnieje)
- [ ] Utworzyć `src/lib/services/profile.service.ts`
- [ ] Utworzyć katalog `src/pages/api/` (jeśli nie istnieje)
- [ ] Utworzyć `src/pages/api/profile.ts`
- [ ] Zweryfikować typy w `src/types.ts`
- [ ] Przetestować endpoint bez uwierzytelnienia (401)
- [ ] Przetestować endpoint z uwierzytelnieniem (200)
- [ ] Sprawdzić logi błędów w konsoli
- [ ] Zweryfikować nagłówki Content-Type w odpowiedziach
