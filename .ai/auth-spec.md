# Specyfikacja Architektury Autentykacji - Lawly MVP

## Spis treści

1. [Podsumowanie](#1-podsumowanie)
   - 1.1 Zakres MVP
   - 1.2 Ograniczenia MVP
   - 1.3 Założenia
   - 1.4 Uwagi do schematu bazy danych
2. [Architektura Interfejsu Użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika Backendowa i Integracja Supabase](#3-logika-backendowa-i-integracja-supabase)
4. [Row Level Security i Izolacja Danych](#4-row-level-security-i-izolacja-danych)
5. [Welcome Screen i Onboarding](#5-welcome-screen-i-onboarding)
6. [Wylogowanie](#6-wylogowanie)
7. [Obsługa Błędów](#7-obsługa-błędów)
8. [Diagramy Przepływów](#8-diagramy-przepływów)
9. [Kontrakty Typów TypeScript](#9-kontrakty-typów-typescript)
10. [Struktura Plików](#10-struktura-plików)
11. [Załączniki](#załącznik-a-checklist-implementacji)

---

## 1. Podsumowanie

### 1.1 Zakres MVP

Autentykacja w Lawly MVP obejmuje:

- **Logowanie**: Wyłącznie przez Google SSO (OAuth 2.0)
- **Rejestracja**: Automatyczna przy pierwszym logowaniu (brak osobnej funkcji)
- **Onboarding**: Welcome screen dla nowych użytkowników
- **Sesja**: Zarządzana przez Supabase Auth (cookies)
- **Wylogowanie**: Czyszczenie sesji i przekierowanie

### 1.2 Ograniczenia MVP

Poza zakresem MVP:
- Logowanie email/password
- Inni providerzy OAuth (GitHub, Facebook, itp.)
- Odzyskiwanie hasła
- Role i uprawnienia użytkowników
- System zaproszeń
- Dwuskładnikowa autentykacja (2FA)

> **Zmiana względem PRD:** PRD (3.1.1) wspominał o "autoryzacji użytkowników z określonej domeny firmowej". Wymaganie to zostało usunięte - każdy użytkownik z kontem Google może się zalogować.

### 1.3 Założenia

- Użytkownicy posiadają konta Google (dowolne konto Google, nie tylko firmowe)
- Aplikacja działa jako wewnętrzne narzędzie (1-10 użytkowników dziennie)
- Supabase Auth zarządza tokenami i sesją (brak custom logic)
- Brak ograniczeń domenowych - każdy z kontem Google może się zalogować

### 1.4 Uwagi do schematu bazy danych

**Różnica względem PRD:** PRD (sekcja 3.5.1) opisuje tabelę `users` z kolumnami `id, email, created_at`. W rzeczywistej implementacji:

- Tabela `auth.users` jest zarządzana wewnętrznie przez Supabase Auth i zawiera dane użytkownika (w tym email)
- Tabela `profiles` (publiczna) rozszerza dane użytkownika o pola aplikacyjne (`has_seen_welcome`)
- Relacja: `profiles.id` → `auth.users.id` (1:1, cascade delete)
- Relacja: `sessions.user_id` → `profiles.id` (nie bezpośrednio do `auth.users`)

Jest to standardowy wzorzec "profiles extension" dla Supabase Auth, pozwalający na:
- Dodawanie własnych pól bez modyfikacji `auth.users`
- Pełną kontrolę RLS na własnej tabeli
- Automatyczne tworzenie profilu przez trigger

---

## 2. Architektura Interfejsu Użytkownika

### 2.1 Podział Stron - Publiczne vs. Chronione

#### Strony Publiczne (bez autentykacji)

| Ścieżka | Plik | Opis |
|---------|------|------|
| `/login` | `src/pages/login.astro` | Strona logowania z przyciskiem Google SSO |
| `/auth/callback` | `src/pages/auth/callback.astro` | Handler OAuth callback |

#### Strony Chronione (wymagają autentykacji)

| Ścieżka | Plik | Opis | Status |
|---------|------|------|--------|
| `/` | `src/pages/index.astro` | Główna strona z listą sesji | ⚠️ Placeholder (wymaga implementacji zgodnej z US-005) |
| `/welcome` | `src/pages/welcome.astro` | Ekran powitalny (tylko dla nowych użytkowników) | ✅ Zaimplementowane |
| `/wizard` | `src/pages/wizard.astro` | Wizard pytań | ❌ Do implementacji |
| `/sessions/[id]` | `src/pages/sessions/[id].astro` | Szczegóły sesji | ❌ Do implementacji |

**Uwaga:** Ochrona tras (redirect do `/login` dla nieautoryzowanych) NIE jest jeszcze zaimplementowana w middleware.

### 2.2 Podział Odpowiedzialności

#### Server-Side (Astro Pages/Layouts)

- **Weryfikacja sesji**: Sprawdzenie `supabase.auth.getUser()` w frontmatter
- **Przekierowania**: Redirect do `/login` dla nieautoryzowanych
- **Pobieranie danych profilu**: Sprawdzenie `has_seen_welcome` server-side
- **Budowanie OAuth URL**: Generowanie callback URL

#### Client-Side (React Components)

- **Interakcja użytkownika**: Obsługa kliknięć (login, logout)
- **Stan UI**: Loading states, error messages
- **OAuth flow inicjacja**: `supabase.auth.signInWithOAuth()`
- **Wywołania API**: Aktualizacja profilu (`PATCH /api/profile`)

### 2.3 Przepływ Użytkownika

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRZEPŁYW AUTENTYKACJI                             │
└─────────────────────────────────────────────────────────────────────────────┘

[Użytkownik] ──▶ [/login]
                    │
                    ▼
              ┌─────────────┐
              │ Czy ma sesję│──── TAK ──▶ [Redirect do /]
              │  Supabase?  │
              └─────────────┘
                    │ NIE
                    ▼
              [Wyświetl LoginCard]
                    │
                    ▼
              [Klik "Zaloguj przez Google"]
                    │
                    ▼
              [supabase.auth.signInWithOAuth()]
                    │
                    ▼
              [Redirect do Google]
                    │
                    ▼
              [Autoryzacja Google]
                    │
                    ▼
              [/auth/callback?code=...]
                    │
                    ▼
              [exchangeCodeForSession()]
                    │
                    ▼
              ┌─────────────────┐
              │ Czy profil ma   │──── TAK ──▶ [Redirect do /]
              │ has_seen_welcome│
              │      = true?    │
              └─────────────────┘
                    │ NIE
                    ▼
              [Redirect do /welcome]
                    │
                    ▼
              [Wyświetl WelcomeCard]
                    │
                    ▼
      ┌─────────────┴─────────────┐
      ▼                           ▼
[Klik "Rozpocznij          [Klik "Przejdź
 pierwszą sesję"]           do aplikacji"]
      │                           │
      ▼                           ▼
[PATCH /api/profile]       [PATCH /api/profile]
{has_seen_welcome: true}   {has_seen_welcome: true}
      │                           │
      ▼                           ▼
[Redirect do /wizard]      [Redirect do /]
```

### 2.4 Komponenty UI

#### 2.4.1 Strona Logowania (`/login`)

**Lokalizacja**: `src/pages/login.astro`
**Layout**: `src/layouts/LoginLayout.astro`

**Struktura strony**:
```
LoginLayout
└── LoginCard (React, client:load)
    ├── TextLogo
    ├── Tagline
    ├── GoogleLoginButton
    └── ErrorAlert (warunkowo)
```

**Odpowiedzialności**:
- Astro page sprawdza sesję server-side → redirect do `/` jeśli zalogowany
- Przekazuje `redirectUrl` i `errorCode` do React component
- LoginCard zarządza stanem i wywołuje OAuth

#### 2.4.2 Przycisk Logowania Google

**Lokalizacja**: `src/components/auth/GoogleLoginButton.tsx`

**Props**:
```typescript
interface GoogleLoginButtonProps {
  onLogin: () => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}
```

**Zachowanie**:
- Disabled podczas ładowania
- Pokazuje spinner gdy `isLoading = true`
- Wywołuje `onLogin` (hook `useLogin`)

#### 2.4.3 Przycisk Wylogowania w Nawigacji

**Lokalizacja**: `src/components/nav/LogoutButton.tsx` (do implementacji)

**Props**:
```typescript
interface LogoutButtonProps {
  className?: string;
}
```

**Zachowanie**:
- Widoczny tylko dla zalogowanych użytkowników
- Po kliknięciu wywołuje `supabase.auth.signOut()`
- Redirect do `/login` po wylogowaniu

#### 2.4.4 Nawigacja Główna

**Lokalizacja**: `src/components/nav/MainNav.tsx` (do implementacji)

**Struktura**:
```
MainNav
├── Logo
├── NavLinks (opcjonalne)
└── UserMenu
    ├── UserEmail (opcjonalne)
    └── LogoutButton
```

### 2.5 Welcome Screen

**Lokalizacja**: `src/pages/welcome.astro`
**Layout**: `src/layouts/WelcomeLayout.astro`

**Struktura**:
```
WelcomeLayout
└── WelcomeCard (React, client:load)
    ├── WelcomeHeading
    ├── WelcomeDescription
    ├── CTAButton ("Rozpocznij pierwszą sesję")
    ├── SkipLink ("Przejdź do aplikacji")
    └── ErrorAlert (warunkowo)
```

**Logika wyświetlania**:
1. Astro page sprawdza autentykację → redirect do `/login` jeśli niezalogowany
2. Pobiera profil i sprawdza `has_seen_welcome`
3. Jeśli `true` → redirect do `/`
4. Jeśli `false` → renderuje WelcomeCard

---

## 3. Logika Backendowa i Integracja Supabase

### 3.1 Konfiguracja Supabase Auth

#### Environment Variables

```env
# Server-side (Astro)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<anon-key>

# Client-side (React)
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
PUBLIC_SUPABASE_KEY=<anon-key>
```

#### Konfiguracja Google OAuth w Supabase Dashboard

1. **Authentication → Providers → Google**
   - Włączyć provider
   - Skonfigurować Client ID i Client Secret z Google Cloud Console
   - Dodać Redirect URL: `https://<app-domain>/auth/callback`

2. **Authentication → URL Configuration**
   - Site URL: `https://<app-domain>`
   - Redirect URLs: `https://<app-domain>/auth/callback`

### 3.2 Middleware

**Lokalizacja**: `src/middleware/index.ts`

**Obecna implementacja** (już zaimplementowana):
```typescript
import { createServerClient } from '@supabase/ssr';
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key) { return context.cookies.get(key)?.value; },
        set(key, value, options) { context.cookies.set(key, value, options); },
        remove(key, options) { context.cookies.delete(key, options); },
      },
    }
  );
  return next();
});
```

**Rozszerzenie o ochronę routes** (⚠️ NIE ZAIMPLEMENTOWANE - wymagane przed produkcją):

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Inicjalizacja Supabase client (jak obecnie)
  context.locals.supabase = createServerClient<Database>(...);

  // 2. Definicja chronionych ścieżek
  const protectedPaths = ['/', '/welcome', '/wizard', '/sessions'];
  const publicPaths = ['/login', '/auth/callback'];

  const pathname = context.url.pathname;

  // 3. Sprawdzenie czy ścieżka wymaga autoryzacji
  const isProtected = protectedPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtected) {
    const { data: { user }, error } = await context.locals.supabase.auth.getUser();

    if (error || !user) {
      return context.redirect('/login');
    }

    // Opcjonalnie: zapisz user do context.locals
    context.locals.user = user;
  }

  return next();
});
```

### 3.3 Automatyczne Tworzenie Profilu

**Mechanizm**: Trigger PostgreSQL na tabeli `auth.users`

**Lokalizacja**: `supabase/migrations/20260127120000_create_schema.sql`

**Już zaimplementowane**:
```sql
-- Funkcja wywoływana przy rejestracji nowego użytkownika
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, has_seen_welcome, created_at)
  values (new.id, false, now());
  return new;
end;
$$;

-- Trigger uruchamiany po INSERT do auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

**Konsekwencje**:
- Profil tworzony synchronicznie podczas rejestracji
- `has_seen_welcome` domyślnie `false`
- Brak potrzeby ręcznego tworzenia profilu w aplikacji

### 3.4 Weryfikacja Sesji Server-Side

**Pattern dla chronionych stron Astro**:

```astro
---
// src/pages/protected-page.astro

// 1. Pobierz użytkownika z sesji
const { data: { user }, error: authError } =
  await Astro.locals.supabase.auth.getUser();

// 2. Sprawdź autoryzację
if (authError || !user) {
  return Astro.redirect('/login');
}

// 3. Opcjonalnie: pobierz dodatkowe dane użytkownika
const { data: profile } = await Astro.locals.supabase
  .from('profiles')
  .select('has_seen_welcome')
  .eq('id', user.id)
  .single();

// 4. Logika specyficzna dla strony...
---
```

### 3.5 OAuth Callback Handler

**Lokalizacja**: `src/pages/auth/callback.astro`

**Już zaimplementowany przepływ**:

1. Odczytaj `code` z query params
2. Obsłuż błędy od providera (`error` param)
3. Wymień kod na sesję: `exchangeCodeForSession(code)`
4. Pobierz profil i sprawdź `has_seen_welcome`
5. Redirect do `/welcome` lub `/` w zależności od stanu

**Obsługa błędów**:
- `error` z Google → redirect do `/login?error=<kod>`
- Brak `code` → redirect do `/login?error=missing_code`
- Błąd wymiany kodu → redirect do `/login?error=auth_failed`

### 3.6 API Endpoints

#### GET /api/profile

**Lokalizacja**: `src/pages/api/profile.ts`

**Już zaimplementowany**:
- Pobiera profil zalogowanego użytkownika
- Zwraca 401 jeśli niezalogowany
- Zwraca 404 jeśli profil nie istnieje

#### PATCH /api/profile

**Lokalizacja**: `src/pages/api/profile.ts`

**Już zaimplementowany**:
- Aktualizuje `has_seen_welcome` dla zalogowanego użytkownika
- Walidacja przez Zod schema
- Zwraca zaktualizowany profil

---

## 4. Row Level Security i Izolacja Danych

### 4.1 Polityki RLS

#### Tabela `profiles`

| Polityka | Operacja | Rola | Warunek |
|----------|----------|------|---------|
| `profiles_select_own` | SELECT | authenticated | `id = auth.uid()` |
| `profiles_update_own` | UPDATE | authenticated | `id = auth.uid()` |

**Brak polityki INSERT** - profil tworzony przez trigger z `SECURITY DEFINER`.

#### Tabela `questions`

| Polityka | Operacja | Rola | Warunek |
|----------|----------|------|---------|
| `questions_select_authenticated` | SELECT | authenticated | `true` (wszyscy widzą wszystkie) |

**Brak INSERT/UPDATE/DELETE** - zarządzane przez service role key.

#### Tabela `sessions`

| Polityka | Operacja | Rola | Warunek |
|----------|----------|------|---------|
| `sessions_select_own` | SELECT | authenticated | `user_id = auth.uid()` |
| `sessions_insert_own` | INSERT | authenticated | `user_id = auth.uid()` |

**Brak UPDATE/DELETE** - sesje są immutable (write-once).

### 4.2 Integracja auth.uid() z RLS

**Mechanizm**:
1. Supabase Auth ustawia `auth.uid()` na podstawie JWT tokena
2. Token przesyłany w cookie (`sb-<project>-auth-token`)
3. Middleware tworzy Supabase client z dostępem do cookies
4. Client automatycznie dołącza token do zapytań
5. RLS używa `auth.uid()` do weryfikacji

**Przykład**:
```typescript
// Ten query zwróci TYLKO sesje zalogowanego użytkownika
const { data: sessions } = await supabase
  .from('sessions')
  .select('*');
// SQL wykonany: SELECT * FROM sessions WHERE user_id = auth.uid()
```

### 4.3 Weryfikacja Bezpieczeństwa

**Checklist RLS**:
- [x] Użytkownicy widzą tylko swoje sesje
- [x] Użytkownicy mogą tworzyć sesje tylko dla siebie
- [x] Użytkownicy mogą aktualizować tylko swój profil
- [x] Wszyscy użytkownicy mają read-only do pytań
- [x] Brak możliwości usunięcia własnego profilu przez użytkownika
- [x] Brak możliwości edycji/usunięcia sesji przez użytkownika

---

## 5. Welcome Screen i Onboarding

### 5.1 Mechanizm Wykrywania Nowego Użytkownika

**Źródło danych**: Kolumna `profiles.has_seen_welcome` (boolean)

**Inicjalizacja**: `false` (ustawiane przez trigger przy tworzeniu profilu)

**Aktualizacja**: Przez `PATCH /api/profile` po akcji użytkownika

### 5.2 Logika Wyświetlania Welcome Screen

**Sprawdzenie w `/auth/callback.astro`**:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('has_seen_welcome')
  .eq('id', user.id)
  .single();

if (profile?.has_seen_welcome) {
  return Astro.redirect('/');
} else {
  return Astro.redirect('/welcome');
}
```

**Sprawdzenie w `/welcome.astro`** (guard):
```typescript
// Jeśli użytkownik wejdzie bezpośrednio na /welcome
if (profile?.has_seen_welcome) {
  return Astro.redirect('/');
}
```

### 5.3 Akcje na Welcome Screen

| Akcja | Endpoint | Redirect |
|-------|----------|----------|
| "Rozpocznij pierwszą sesję" | PATCH /api/profile | /wizard |
| "Przejdź do aplikacji" | PATCH /api/profile | / |

**Payload**: `{ "has_seen_welcome": true }`

### 5.4 Graceful Degradation

**Hook `useWelcome`** implementuje graceful degradation:
- Nawigacja następuje niezależnie od wyniku API
- Jeśli API zwróci błąd, użytkownik wciąż przechodzi dalej
- Przy kolejnym logowaniu może ponownie zobaczyć welcome (akceptowalny edge case)

### 5.5 Decyzja: Baza danych zamiast localStorage

PRD (US-002) dopuszczał zapis stanu `has_seen_welcome` w bazie danych LUB localStorage. Wybrano bazę danych ponieważ:

- Stan persystuje między urządzeniami/przeglądarkami
- Nie jest tracony przy czyszczeniu danych przeglądarki
- Umożliwia prostą analitykę (zapytanie SQL)

---

## 6. Wylogowanie

### 6.1 Implementacja Wylogowania

**Hook**: `src/components/hooks/useLogout.ts` (do implementacji)

```typescript
interface UseLogoutReturn {
  isLoading: boolean;
  error: Error | null;
  handleLogout: () => Promise<void>;
}
```

**Implementacja**:
```typescript
const handleLogout = useCallback(async () => {
  setIsLoading(true);

  const supabase = createClient(url, key);
  const { error } = await supabase.auth.signOut();

  if (error) {
    setError(error);
    setIsLoading(false);
    return;
  }

  // Redirect do strony logowania
  window.location.assign('/login');
}, []);
```

### 6.2 Czyszczenie Sesji

**Co robi `supabase.auth.signOut()`**:
1. Usuwa tokeny z cookies (`sb-<project>-auth-token`)
2. Invaliduje refresh token na serwerze
3. Czyści stan w kliencie Supabase

### 6.3 Przekierowanie po Wylogowaniu

**Redirect**: `/login`

**Uwaga**: Używamy `window.location.assign()` zamiast client-side routing, aby:
- Wymusić przeładowanie strony
- Wyczyścić stan React
- Zapewnić świeży start dla nowej sesji

### 6.4 Ochrona Stron po Wylogowaniu

**Middleware** sprawdza każde żądanie do chronionych stron:
- Brak ważnej sesji → redirect do `/login`
- Cookies automatycznie wygasają po wylogowaniu

**React components** polegają na server-side check:
- Nie muszą sprawdzać autentykacji client-side
- Strona nie zostanie wyrenderowana jeśli użytkownik niezalogowany

### 6.5 Obsługa Błędów Wylogowania

**Scenariusze**:
1. **Network error**: Wyświetl komunikat, pozwól retry
2. **Invalid session**: Traktuj jako sukces (już wylogowany)
3. **Server error**: Wyświetl komunikat, pozwól retry

**UI**: Toast notification lub inline error w menu użytkownika

---

## 7. Obsługa Błędów

### 7.1 Błędy Autoryzacji Google

| Kod błędu | Przyczyna | Komunikat dla użytkownika |
|-----------|-----------|---------------------------|
| `access_denied` | Użytkownik anulował | "Logowanie zostało anulowane." |
| `auth_failed` | Błąd wymiany tokena | "Nie udało się zalogować. Spróbuj ponownie." |
| `missing_code` | Brak kodu w callback | "Błąd autoryzacji. Spróbuj ponownie." |
| (inny) | Nieznany błąd | "Wystąpił błąd podczas logowania." |

### 7.2 Błędy Połączenia z Supabase

**Scenariusze**:
- Timeout
- Network error
- 5xx od Supabase

**Komunikat**: "Nie można połączyć z serwerem. Spróbuj ponownie później."

**Akcja**: Przycisk "Odśwież stronę" (`window.location.reload()`)

### 7.3 Timeouty i Network Errors

**Implementacja w hookach React**:
```typescript
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error();
} catch (err) {
  if (err.name === 'AbortError' || !navigator.onLine) {
    setError({ message: 'Brak połączenia z internetem.' });
  } else {
    setError({ message: 'Nie można połączyć z serwerem.' });
  }
}
```

### 7.4 Komunikaty Błędów (zgodne z PRD 3.6)

**Format komunikatów**:
- Język: polski
- Ton: przyjazny, bez technicznego żargonu
- Akcja: zawsze podana (refresh, retry, contact support)

**Przykłady**:
- "Nie można połączyć z serwerem. Spróbuj ponownie później."
- "Logowanie zostało anulowane."
- "Nie udało się zalogować. Spróbuj ponownie."
- "Nie masz dostępu do tej sesji."

---

## 8. Diagramy Przepływów

### 8.1 Sekwencja Logowania

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│Browser │     │ /login │     │ Google │     │Callback│     │Supabase│
└───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘
    │              │              │              │              │
    │ GET /login   │              │              │              │
    │─────────────▶│              │              │              │
    │              │              │              │              │
    │   HTML page  │              │              │              │
    │◀─────────────│              │              │              │
    │              │              │              │              │
    │ Click login  │              │              │              │
    │─────────────▶│              │              │              │
    │              │ signInWithOAuth()           │              │
    │              │─────────────────────────────────────────────▶
    │              │              │              │   Auth URL   │
    │              │◀─────────────────────────────────────────────
    │              │              │              │              │
    │  Redirect to Google         │              │              │
    │◀─────────────│              │              │              │
    │              │              │              │              │
    │ Login with Google           │              │              │
    │────────────────────────────▶│              │              │
    │              │              │              │              │
    │ Consent     │              │              │              │
    │◀────────────────────────────│              │              │
    │              │              │              │              │
    │ Approve     │              │              │              │
    │────────────────────────────▶│              │              │
    │              │              │              │              │
    │ Redirect to callback?code=  │              │              │
    │◀────────────────────────────│              │              │
    │              │              │              │              │
    │ GET /auth/callback?code=    │              │              │
    │───────────────────────────────────────────▶│              │
    │              │              │              │ exchangeCode │
    │              │              │              │─────────────▶│
    │              │              │              │   Session    │
    │              │              │              │◀─────────────│
    │              │              │              │              │
    │              │              │              │ Get profile  │
    │              │              │              │─────────────▶│
    │              │              │              │   Profile    │
    │              │              │              │◀─────────────│
    │              │              │              │              │
    │ Redirect to / or /welcome   │              │              │
    │◀──────────────────────────────────────────│              │
    │              │              │              │              │
```

### 8.2 Sekwencja Wylogowania

```
┌────────┐     ┌──────────┐     ┌────────┐
│Browser │     │LogoutBtn │     │Supabase│
└───┬────┘     └────┬─────┘     └───┬────┘
    │               │               │
    │ Click logout  │               │
    │──────────────▶│               │
    │               │               │
    │               │  signOut()    │
    │               │──────────────▶│
    │               │               │
    │               │   Success     │
    │               │◀──────────────│
    │               │               │
    │ Redirect to /login            │
    │◀──────────────│               │
    │               │               │
```

---

## 9. Kontrakty Typów TypeScript

### 9.1 Typy Auth (istniejące)

**Lokalizacja**: `src/components/auth/types.ts`

```typescript
// Props dla LoginCard
interface LoginCardProps {
  redirectUrl: string;
  errorCode?: string;
}

// Error state
interface AuthError {
  message: string;
  code?: string;
}

// Hook options i return
interface UseLoginOptions {
  redirectUrl: string;
}

interface UseLoginReturn {
  isLoading: boolean;
  error: AuthError | null;
  handleGoogleLogin: () => Promise<void>;
  clearError: () => void;
}
```

### 9.2 Typy Logout (do implementacji)

**Lokalizacja**: `src/components/auth/types.ts`

```typescript
interface LogoutError {
  message: string;
  code?: string;
}

interface UseLogoutReturn {
  isLoading: boolean;
  error: LogoutError | null;
  handleLogout: () => Promise<void>;
}
```

### 9.3 Typy Welcome (istniejące)

**Lokalizacja**: `src/components/welcome/types.ts`

```typescript
interface WelcomeError {
  message: string;
  code?: string;
}

interface UseWelcomeReturn {
  isLoading: boolean;
  error: WelcomeError | null;
  handleStartSession: () => Promise<void>;
  handleSkip: () => Promise<void>;
  clearError: () => void;
}
```

### 9.4 Typy Profilu (istniejące)

**Lokalizacja**: `src/types.ts`

```typescript
// Response z API
type ProfileResponse = {
  id: string;
  has_seen_welcome: boolean;
  created_at: string;
};

// Command do aktualizacji
interface UpdateProfileCommand {
  has_seen_welcome: boolean;
}
```

### 9.5 Rozszerzenie Astro Locals

**Lokalizacja**: `src/env.d.ts`

```typescript
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User; // Opcjonalnie dodane przez middleware
    }
  }
}
```

---

## 10. Struktura Plików

### 10.1 Istniejące Pliki

```
src/
├── components/
│   ├── auth/
│   │   ├── index.ts              # Re-exports
│   │   ├── types.ts              # Typy auth
│   │   ├── LoginCard.tsx         # Główny komponent logowania
│   │   ├── GoogleLoginButton.tsx # Przycisk Google
│   │   ├── TextLogo.tsx          # Logo tekstowe
│   │   └── Tagline.tsx           # Podtytuł
│   ├── welcome/
│   │   ├── index.ts              # Re-exports
│   │   ├── types.ts              # Typy welcome
│   │   ├── WelcomeCard.tsx       # Główny komponent
│   │   ├── WelcomeHeading.tsx    # Nagłówek
│   │   ├── WelcomeDescription.tsx# Opis
│   │   ├── CTAButton.tsx         # Przycisk akcji
│   │   └── SkipLink.tsx          # Link "pomiń"
│   └── hooks/
│       ├── useLogin.ts           # Hook logowania
│       └── useWelcome.ts         # Hook welcome
├── layouts/
│   ├── Layout.astro              # Podstawowy layout
│   ├── LoginLayout.astro         # Layout strony logowania
│   └── WelcomeLayout.astro       # Layout welcome screen
├── pages/
│   ├── index.astro               # Strona główna (chroniona)
│   ├── login.astro               # Strona logowania
│   ├── welcome.astro             # Welcome screen
│   ├── auth/
│   │   └── callback.astro        # OAuth callback
│   └── api/
│       └── profile.ts            # API profilu
├── lib/
│   ├── services/
│   │   └── profile.service.ts    # Operacje na profilu
│   └── schemas/
│       └── profile.schema.ts     # Walidacja Zod
├── middleware/
│   └── index.ts                  # Middleware Supabase
├── db/
│   ├── database.types.ts         # Typy z Supabase
│   └── supabase.client.ts        # Klient (legacy)
├── types.ts                      # Współdzielone typy
└── env.d.ts                      # Deklaracje TypeScript
```

### 10.2 Pliki Do Implementacji

```
src/
├── components/
│   ├── nav/
│   │   ├── index.ts              # Re-exports
│   │   ├── types.ts              # Typy nawigacji
│   │   ├── MainNav.tsx           # Nawigacja główna
│   │   ├── LogoutButton.tsx      # Przycisk wylogowania
│   │   └── UserMenu.tsx          # Menu użytkownika
│   └── hooks/
│       └── useLogout.ts          # Hook wylogowania
├── layouts/
│   └── AuthLayout.astro          # Layout dla chronionych stron
└── pages/
    ├── wizard.astro              # Wizard pytań (chroniona)
    └── sessions/
        └── [id].astro            # Szczegóły sesji (chroniona)
```

### 10.3 Migracje Bazy Danych (istniejące)

```
supabase/migrations/
├── 20260127120000_create_schema.sql       # Schemat + RLS + trigger
├── 20260127120001_seed_questions.sql      # Dane pytań
└── 20260130222354_update_profiles_rls_policy.sql # Aktualizacja RLS
```

---

## Załącznik A: Checklist Implementacji

### A.1 Ukończone (✅)

- [x] Strona logowania `/login`
- [x] OAuth callback `/auth/callback`
- [x] Welcome screen `/welcome`
- [x] Middleware z Supabase client
- [x] Trigger tworzenia profilu
- [x] RLS policies dla wszystkich tabel
- [x] API `/api/profile` (GET, PATCH)
- [x] Hook `useLogin`
- [x] Hook `useWelcome`
- [x] Komponenty LoginCard, WelcomeCard
- [x] Typy TypeScript dla auth i welcome

### A.2 Do Implementacji

**Blokery dla US-003 (Wylogowanie):**
- [ ] Hook `useLogout`
- [ ] Komponent `LogoutButton`
- [ ] Komponent `MainNav` z przyciskiem wylogowania

**Ochrona tras (wymagane przed produkcją):**
- [ ] Rozszerzenie middleware o ochronę routes (obecnie middleware tylko inicjalizuje klienta Supabase, nie chroni tras)
- [ ] Layout `AuthLayout` dla chronionych stron

**Strony aplikacji (poza zakresem auth-spec, ale wymagane dla MVP):**
- [ ] Strona główna z listą sesji `/` (obecna `index.astro` to placeholder)
- [ ] Strona wizard `/wizard`
- [ ] Strona szczegółów sesji `/sessions/[id]`

### A.3 Do Weryfikacji (przed produkcją)

- [ ] Redirect loop protection (zalogowany → /login → /)
- [ ] Obsługa wygaśnięcia sesji
- [ ] Obsługa równoczesnych sesji w wielu tabkach
- [ ] Testowanie RLS policies

### A.4 Mapowanie User Stories → Implementacja

| User Story | Opis | Status | Zależności |
|------------|------|--------|------------|
| US-001 | Logowanie przez Google SSO | ✅ | - |
| US-002 | Welcome screen dla nowych użytkowników | ✅ | - |
| US-003 | Wylogowanie z aplikacji | ⚠️ Częściowe | useLogout, LogoutButton, MainNav |
| US-023 | Błąd połączenia z Supabase | ✅ | Komunikaty błędów zaimplementowane |
| US-027 | Nieautoryzowany dostęp | ⚠️ | Wymaga implementacji ochrony tras w middleware |

---

## Załącznik B: Zmienne Środowiskowe

### B.1 Wymagane

```env
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon-key>
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_KEY=<anon-key>
```

### B.2 Konfiguracja Google OAuth (w Supabase Dashboard)

- Google Client ID
- Google Client Secret
- Authorized redirect URIs: `https://<app-domain>/auth/callback`

---

## Załącznik C: Referencje

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR with Astro](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=astro)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Astro Middleware](https://docs.astro.build/en/guides/middleware/)
- [PRD Lawly MVP](../docs/PRD.md)
- [Tech Stack](../docs/TECH_STACK.md)
