# Schemat bazy danych - Lawly MVP

## 1. Tabele

### 1.1 `public.profiles`

Tabela profili uzytkownikow, tworzona automatycznie przez trigger po rejestracji w `auth.users`.

| Kolumna            | Typ danych                  | Ograniczenia                                         |
| ------------------ | --------------------------- | ---------------------------------------------------- |
| `id`               | `uuid`                      | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `has_seen_welcome` | `boolean`                   | `NOT NULL DEFAULT false`                             |
| `created_at`       | `timestamptz`               | `NOT NULL DEFAULT now()`                             |

Uwagi:
- Klucz glowny `id` jest jednoczesnie kluczem obcym do `auth.users(id)` — relacja 1:1.
- Rekord tworzony automatycznie przez funkcje trigger `handle_new_user()` po `INSERT` na `auth.users`.
- Brak dodatkowych pol profilowych w MVP — tabela sluzy glownie do przechowywania stanu onboardingu i jako punkt referencyjny FK dla `sessions`.

### 1.2 `public.questions`

Tabela predefiniowanych pytan z opcjami odpowiedzi i przypisanymi fragmentami SOW.

| Kolumna          | Typ danych    | Ograniczenia                          |
| ---------------- | ------------- | ------------------------------------- |
| `id`             | `uuid`        | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `question_order` | `integer`     | `NOT NULL`                            |
| `question_text`  | `text`        | `NOT NULL`                            |
| `options`        | `jsonb`       | `NOT NULL`                            |
| `created_at`     | `timestamptz` | `NOT NULL DEFAULT now()`              |

Uwagi:
- Kolumna `options` przechowuje tablice obiektow JSON o strukturze:
  ```json
  [
    {
      "id": "uuid-or-string-identifier",
      "text": "Tekst opcji wyswietlany uzytkownikowi",
      "sow_fragment": "Tekst fragmentu SOW przypisany do tej odpowiedzi"
    }
  ]
  ```
- Brak walidacji CHECK na JSONB w MVP — struktura dokumentowana komentarzem w schemacie.
- Brak pola `is_active` ani wersjonowania — poza zakresem MVP.
- Pytania zarzadzane przez bezposredni dostep do bazy danych (brak panelu admina).

### 1.3 `public.sessions`

Tabela ukoczonych sesji uzytkownikow z odpowiedziami i wygenerowanymi fragmentami.

| Kolumna               | Typ danych    | Ograniczenia                                             |
| --------------------- | ------------- | -------------------------------------------------------- |
| `id`                  | `uuid`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                  |
| `user_id`             | `uuid`        | `NOT NULL`, `REFERENCES profiles(id) ON DELETE CASCADE`  |
| `created_at`          | `timestamptz` | `NOT NULL DEFAULT now()`                                 |
| `completed_at`        | `timestamptz` | `NULL` (nullable, ale w MVP zawsze ustawiane przy insercie) |
| `answers`             | `jsonb`       | `NOT NULL`                                               |
| `generated_fragments` | `text[]`      | `NOT NULL`                                               |

Uwagi:
- Kolumna `answers` przechowuje tablice obiektow JSON o strukturze:
  ```json
  [
    {
      "question_id": "uuid-pytania",
      "answer_id": "id-wybranej-opcji"
    }
  ]
  ```
- Kolejnosc elementow w tablicy `answers` odpowiada kolejnosci pytan (zachowuje insertion order).
- `generated_fragments` to natywna tablica PostgreSQL `text[]` — zachowuje granice i kolejnosc fragmentow.
- `completed_at` jest nullable dla przyszlej elastycznosci, ale w MVP aplikacja zawsze ustawia wartosc przy tworzeniu rekordu.
- Sesje sa niemutowalne (write-once) — brak UPDATE/DELETE przez aplikacje.
- Rekordy tworzone tylko po ukonczeniu calego wizarda (brak auto-save).

## 2. Relacje miedzy tabelami

```
auth.users (Supabase-managed)
    │
    │  1:1 (ON DELETE CASCADE)
    ▼
public.profiles
    │
    │  1:N (ON DELETE CASCADE)
    ▼
public.sessions

public.questions (tabela niezalezna, brak FK)
```

### Szczegoly relacji

| Relacja                      | Kardynalnosc | Klucz obcy                                | Cascade            |
| ---------------------------- | ------------ | ----------------------------------------- | ------------------ |
| `auth.users` → `profiles`   | 1:1          | `profiles.id` → `auth.users(id)`         | `ON DELETE CASCADE` |
| `profiles` → `sessions`     | 1:N          | `sessions.user_id` → `profiles(id)`      | `ON DELETE CASCADE` |

- **`auth.users` → `profiles`**: Kazdy uzytkownik Supabase Auth ma dokladnie jeden profil. Profil tworzony automatycznie przez trigger.
- **`profiles` → `sessions`**: Jeden uzytkownik moze miec wiele ukonczonych sesji. Usuniecue profilu kaskadowo usuwa wszystkie sesje.
- **`questions`**: Tabela niezalezna — brak relacji FK. Polaczenie z sesjami odbywa sie logicznie przez `question_id` w JSONB kolumny `sessions.answers`, bez fizycznego FK.

## 3. Indeksy

| Tabela      | Kolumny                       | Typ indeksu | Uzasadnienie                                                       |
| ----------- | ----------------------------- | ----------- | ------------------------------------------------------------------ |
| `sessions`  | `(user_id, created_at DESC)`  | B-tree      | Glowny wzorzec zapytan: historia sesji uzytkownika posortowana od najnowszej |
| `questions` | `(question_order)`            | B-tree      | Pobieranie pytan w okreslonej kolejnosci                           |

Uwagi:
- Indeksy na kluczach glownych (`id`) sa tworzone automatycznie przez PostgreSQL.
- Przy skali MVP (max 10 uzytkownikow, 10 sesji dziennie) indeksy nie sa krytyczne dla wydajnosci, ale sa dobra praktyka.

## 4. Polityki Row Level Security (RLS)

RLS jest wlaczone na wszystkich tabelach w schemacie `public`.

### 4.1 `public.profiles`

| Polityka                          | Operacja | Rola            | Warunek                  | Opis                                          |
| --------------------------------- | -------- | --------------- | ------------------------ | --------------------------------------------- |
| `profiles_select_own`             | `SELECT` | `authenticated` | `id = auth.uid()`       | Uzytkownik widzi tylko wlasny profil          |
| `profiles_update_own`             | `UPDATE` | `authenticated` | `id = auth.uid()`       | Uzytkownik aktualizuje tylko wlasny profil    |

Uwagi:
- Brak polityki `INSERT` — wstawianie obsluzone przez trigger dzialajaxy z uprawnieniami `SECURITY DEFINER`.
- Brak polityki `DELETE` — uzytkownicy nie moga usuwac swoich profili w MVP.

### 4.2 `public.questions`

| Polityka                          | Operacja | Rola            | Warunek | Opis                                                  |
| --------------------------------- | -------- | --------------- | ------- | ----------------------------------------------------- |
| `questions_select_authenticated`  | `SELECT` | `authenticated` | `true`  | Wszyscy zalogowani uzytkownicy moga czytac pytania    |

Uwagi:
- Brak polityk `INSERT`/`UPDATE`/`DELETE` — zarzadzanie pytaniami odbywa sie przez bezposredni dostep do bazy (service role).
- Polityka `SELECT` zwraca `true` — wszystkie pytania sa dostepne dla kazdego zalogowanego uzytkownika.

### 4.3 `public.sessions`

| Polityka                          | Operacja | Rola            | Warunek                      | Opis                                              |
| --------------------------------- | -------- | --------------- | ---------------------------- | ------------------------------------------------- |
| `sessions_select_own`             | `SELECT` | `authenticated` | `user_id = auth.uid()`       | Uzytkownik widzi tylko wlasne sesje               |
| `sessions_insert_own`             | `INSERT` | `authenticated` | `user_id = auth.uid()`       | Uzytkownik moze tworzyc sesje tylko dla siebie    |

Uwagi:
- Brak polityk `UPDATE`/`DELETE` — sesje sa niemutowalne po utworzeniu (write-once).
- Polityka `INSERT` wymaga, aby `user_id` w nowym rekordzie odpowiadal `auth.uid()` — zapobiega tworzeniu sesji w imieniu innego uzytkownika.

## 5. Funkcje i triggery

### 5.1 Funkcja `handle_new_user()`

```sql
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
```

### 5.2 Trigger `on_auth_user_created`

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

Uwagi:
- Funkcja dziala z `SECURITY DEFINER` — omija RLS i dziala z pelnimi uprawnieniami.
- `set search_path = ''` — najlepsza praktyka bezpieczenstwa dla funkcji `SECURITY DEFINER` w Supabase.
- Trigger uruchamiany `AFTER INSERT` — profil tworzony synchronicznie w tej samej transakcji co rejestracja uzytkownika.

## 6. Rozszerzenia (extensions)

| Rozszerzenie | Cel                                                                 |
| ------------ | ------------------------------------------------------------------- |
| `uuid-ossp`  | Kompatybilnosc wsteczna dla generowania UUID. Faktycznie uzywamy `gen_random_uuid()` (wbudowane w PostgreSQL 14+), ale rozszerzenie daje dodatkowe zabezpieczenie. |

## 7. Strategia migracji

Migracje realizowane za pomoca Supabase CLI w folderze `supabase/migrations/`:

1. **Migracja schematu** (`YYYYMMDDHHMMSS_create_schema.sql`):
   - Wlaczenie rozszerzenia `uuid-ossp`
   - Utworzenie tabel: `profiles`, `questions`, `sessions`
   - Utworzenie indeksow
   - Wlaczenie RLS na wszystkich tabelach
   - Utworzenie polityk RLS
   - Utworzenie funkcji `handle_new_user()` i triggera `on_auth_user_created`

2. **Migracja danych seed** (`YYYYMMDDHHMMSS_seed_questions.sql`):
   - Wstawienie 5 predefiniowanych pytan z opcjami i fragmentami SOW
   - Dane placeholderowe do czasu dostarczenia tresci przez zespol legal

## 8. Dodatkowe uwagi i decyzje projektowe

1. **Brak normalizacji opcji odpowiedzi**: Opcje przechowywane jako JSONB w tabeli `questions` zamiast w osobnej tabeli. Akceptowane ryzyko: brak FK enforcement na `answer_id` w `sessions.answers`.

2. **Brak denormalizacji tekstu w sesjach**: `sessions.answers` przechowuje tylko ID (question_id, answer_id), nie pelny tekst. Akceptowane ryzyko: zmiana pytan po ukonczeniu sesji wplywa na wyswietlanie historycznych danych.

3. **Write-once sessions**: Sesje sa niemutowalne — brak mozliwosci edycji, usuwania ani wznawiania. Rekord tworzony tylko po ukonczeniu calego wizarda (5 pytan).

4. **Brak auto-save**: Stan sesji w trakcie wypelniania przechowywany wylacznie w React state. Zamkniecie przegladarki = utrata postepu.

5. **Typy danych**: Wszystkie kolumny tekstowe uzywaja typu `text` (bez ograniczen `varchar(n)`). Wszystkie timestampy uzywaja `timestamptz` z domyslna wartoscia `now()`.

6. **Lancuch kaskadowego usuwania**: `auth.users` → `profiles` → `sessions`. Usuniecie uzytkownika z Supabase Auth automatycznie usuwa profil i wszystkie sesje.

7. **Nierozwiazane kwestie**:
   - Tresc pytan i fragmentow SOW — wymaga dostarczenia przez zespol legal (placeholdery w seed migration).
   - Wymuszenie `completed_at` — na poziomie aplikacji, nie bazy danych (zachowanie elastycznosci nullable).

   > **Uwaga:** Brak restrykcji domenowej — kazdy uzytkownik z kontem Google moze sie zalogowac (zmiana wzgledem PRD 3.1.1).
