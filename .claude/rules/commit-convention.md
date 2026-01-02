# Konwencja Commitów - Conventional Commits

Źródło: https://www.conventionalcommits.org/en/v1.0.0/

## Struktura Commita

Każdy commit powinien mieć następującą strukturę:

```
<typ>[opcjonalny zakres]: <opis>

[opcjonalne ciało]

[opcjonalne stopki]
```

### Podstawowe Typy

- **feat**: Nowa funkcjonalność dla użytkownika
- **fix**: Naprawa błędu
- **docs**: Zmiany w dokumentacji
- **style**: Formatowanie, brakujące średniki, itp.; brak zmian w kodzie
- **refactor**: Refaktoryzacja kodu produkcyjnego (bez zmian funkcjonalności)
- **test**: Dodanie testów, refaktoryzacja testów; brak zmian w kodzie produkcyjnym
- **chore**: Aktualizacja zadań buildowych, konfiguracji, itp.; brak zmian w kodzie produkcyjnym
- **perf**: Zmiany poprawiające wydajność
- **ci**: Zmiany w konfiguracji CI/CD
- **build**: Zmiany wpływające na system budowania lub zależności zewnętrzne
- **revert**: Cofnięcie poprzedniego commita

## Zasady

1. **Typ** jest wymagany i musi być jednym z powyższych
2. **Zakres** jest opcjonalny i określa część aplikacji, której dotyczy zmiana (np. `feat(auth):`, `fix(api):`)
3. **Opis** musi być w trybie rozkazującym, małymi literami, bez kropki na końcu
4. **Ciało** jest opcjonalne i powinno zawierać motywację dla zmiany i porównanie z poprzednim zachowaniem
5. **Stopki** są opcjonalne i mogą zawierać informacje o breaking changes lub referencje do issues

### Breaking Changes

Commity wprowadzające breaking changes muszą być oznaczone jednym z poniższych sposobów:

1. Wykrzyknik po typie/zakresie: `feat!:` lub `feat(api)!:`
2. Stopka `BREAKING CHANGE:` w ciele commita

## Przykłady

### Nowa funkcjonalność

```
feat(auth): add OAuth2 authentication

Implement OAuth2 flow with Google and GitHub providers.
Support for token refresh and automatic re-authentication.
```

### Naprawa błędu

```
fix(api): prevent race condition in user registration

Add mutex lock to ensure atomic user creation process.

Fixes #123
```

### Breaking Change

```
feat(api)!: change user endpoint response format

BREAKING CHANGE: The /api/users endpoint now returns an object with
a 'data' property containing the user array, instead of returning
the array directly.

Migration guide:
- Old: response → users array
- New: response.data → users array
```

### Commit z zakresem

```
fix(parser): handle malformed JSON gracefully

Previously the parser would throw an error on invalid JSON.
Now it returns a parse error object for better error handling.
```

### Revert Commit

```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

### Commit bez ciała

```
docs: fix typo in README
```

### Commit z wieloma stopkami

```
fix(auth): correct token validation logic

The token expiration check was using wrong timezone.
This caused tokens to expire prematurely in some regions.

Fixes #234
Reviewed-by: John Doe
```

## Korzyści z Conventional Commits

1. **Automatyczne generowanie CHANGELOG** - na podstawie typów commitów
2. **Automatyczne wersjonowanie SemVer** - feat = MINOR, fix = PATCH, BREAKING CHANGE = MAJOR
3. **Lepsza komunikacja** - jasna struktura ułatwia zrozumienie historii zmian
4. **Łatwiejsze code review** - typ commita od razu wskazuje charakter zmian
5. **Możliwość automatyzacji** - triggery CI/CD mogą reagować na typy commitów

## Narzędzia

- **commitlint** - weryfikacja czy commity spełniają konwencję
- **commitizen** - interaktywne tworzenie commitów zgodnych z konwencją
- **standard-version** - automatyczne wersjonowanie i generowanie CHANGELOG
- **semantic-release** - automatyczne publikowanie nowych wersji

## Dobre Praktyki

1. Używaj trybu rozkazującego: "add feature" zamiast "added feature"
2. Opis powinien być zwięzły (max 72 znaki)
3. Ciało commita używaj do wyjaśnienia "dlaczego", nie "co"
4. Jeden commit = jedna logiczna zmiana
5. Nie commituj niedokończonej pracy
6. Commituj często, ale każdy commit powinien być kompletny
7. Testuj przed commitem

## Co-authored-by

Przy współpracy wiele osób może dodać stopkę:

```
feat: implement new dashboard layout

Co-authored-by: Jane Smith <jane@example.com>
Co-authored-by: Bob Wilson <bob@example.com>
```
