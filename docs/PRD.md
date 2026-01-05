# Dokument wymagań produktu (PRD) - Lawly MVP

## 1. Przegląd produktu

### 1.1 Nazwa produktu
Lawly - System automatycznego generowania fragmentów dokumentów SOW

### 1.2 Cel produktu
Lawly to wewnętrzne narzędzie dla zespołu sprzedażowego, które automatyzuje proces przygotowania fragmentów dokumentu SOW (Statement of Work) poprzez system pytań i odpowiedzi. Aplikacja umożliwia samodzielne wygenerowanie kluczowych fragmentów dokumentu bez konieczności organizowania spotkań z zespołem legal.

### 1.3 Grupa docelowa
- Zespół sprzedażowy (1-10 użytkowników dziennie)
- Użytkownicy wewnętrzni firmy z dostępem do Google Workspace

### 1.4 Główna wartość biznesowa
- Redukcja czasu potrzebnego na przygotowanie dokumentu SOW
- Zmniejszenie obciążenia zespołu legal rutynowymi zadaniami
- Standaryzacja fragmentów dokumentów SOW
- Możliwość samodzielnego działania zespołu sprzedażowego

### 1.5 Stack technologiczny
- Frontend: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- Backend: Supabase (PostgreSQL, Authentication, BaaS)
- CI/CD: GitHub Actions (automatyczne uruchamianie testów przy każdym push)
- Hosting: Vercel (automatyczny deployment po przejściu testów)

### 1.6 Timeline
- Deadline MVP: 1 lutego 2026
- Czas realizacji: około 7 dni roboczych

## 2. Problem użytkownika

### 2.1 Kontekst problemu
Obecnie proces przygotowania dokumentu SOW wymaga koordynacji między zespołem sprzedażowym a zespołem legal. Zespół sprzedażowy musi zorganizować spotkanie, odpowiedzieć na szereg standardowych pytań, a następnie czekać aż prawnik przygotuje dokument. Jest to proces czasochłonny i nieefektywny, szczególnie gdy znaczna część pytań i odpowiedzi jest powtarzalna i można je standaryzować.

### 2.2 Ból użytkownika
- Konieczność organizowania spotkań z zespołem legal dla każdego nowego projektu
- Czas oczekiwania na przygotowanie dokumentu przez prawników
- Obciążenie zespołu legal rutynowymi, powtarzalnymi zadaniami
- Brak możliwości samodzielnego działania zespołu sprzedażowego
- Brak standaryzacji w podejściu do tworzenia dokumentów SOW

### 2.3 Obecne workaround
Zespół sprzedażowy organizuje spotkania z zespołem legal, odpowiada na pytania i czeka na przygotowanie pełnego dokumentu SOW przez prawników.

### 2.4 Oczekiwane rozwiązanie
System self-service, który pozwoli zespołowi sprzedażowemu samodzielnie przejść przez standardowy zestaw pytań i automatycznie wygenerować fragmenty dokumentu SOW gotowe do przekazania zespołowi legal do finalnej weryfikacji i kompletacji.

## 3. Wymagania funkcjonalne

### 3.1 Autentykacja i zarządzanie dostępem

3.1.1 Logowanie przez Google SSO
- Integracja z Google OAuth 2.0
- Autoryzacja użytkowników z określonej domeny firmowej
- Automatyczne tworzenie profilu użytkownika przy pierwszym logowaniu
- Zarządzanie sesją użytkownika przez Supabase Auth

3.1.2 Zarządzanie użytkownikami
- Jeden rodzaj użytkownika bez ról i uprawnień
- Każdy użytkownik ma dostęp do tych samych funkcjonalności
- Użytkownik widzi tylko własne sesje (izolacja danych przez Row Level Security)

3.1.3 Onboarding nowych użytkowników
- Welcome screen przy pierwszym logowaniu
- Krótki opis aplikacji (2-3 zdania)
- Przycisk "Rozpocznij pierwszą sesję" prowadzący do pierwszego pytania

### 3.2 Wizard pytań i odpowiedzi

3.2.1 Struktura pytań
- 5 predefiniowanych pytań w liniowej sekwencji
- Każde pytanie typu single-select (wybór jednej odpowiedzi z dostępnych opcji)
- Pytania wyświetlane sekwencyjnie, jedno po drugim
- Brak możliwości powrotu do poprzednich pytań
- Brak logiki warunkowej (wszystkie pytania zawsze wyświetlane w tej samej kolejności)

3.2.2 Walidacja odpowiedzi
- Wymuszenie wyboru odpowiedzi przed przejściem do kolejnego pytania
- Przycisk "Dalej" w stanie disabled dopóki użytkownik nie wybierze odpowiedzi
- Wizualna indykacja wybranej odpowiedzi

3.2.3 Zarządzanie stanem sesji
- Odpowiedzi zapisywane lokalnie w state aplikacji (React)
- Brak auto-save do bazy danych w trakcie wypełniania
- Sesja zapisywana do bazy dopiero po odpowiedzi na wszystkie pytania
- Zamknięcie przeglądarki = utrata postępu (brak możliwości wznowienia)

3.2.4 Nawigacja w wizardzie
- Wskaźnik postępu (np. "Pytanie 3 z 5")
- Przycisk "Dalej" po wyborze odpowiedzi
- Brak przycisku "Wstecz"
- Przekierowanie do ekranu z fragmentami po ostatnim pytaniu

### 3.3 Generowanie fragmentów SOW

3.3.1 Mapowanie odpowiedzi na fragmenty
- Relacja 1:1: każda odpowiedź ma przypisany unikalny fragment tekstu
- Fragmenty przechowywane w bazie danych jako statyczne teksty (brak interpolacji zmiennych)
- Kolejność fragmentów odpowiada kolejności udzielonych odpowiedzi

3.3.2 Proces generowania
- Automatyczne wygenerowanie fragmentów po odpowiedzi na ostatnie pytanie
- Frontend agreguje wybrane odpowiedzi i pobiera przypisane fragmenty
- Zapis sesji do bazy danych z wszystkimi odpowiedziami i wygenerowanymi fragmentami
- Ustawienie completed_at timestamp

3.3.3 Prezentacja fragmentów
- Wszystkie fragmenty wyświetlone w jednym textarea (plain text)
- Fragmenty w odpowiedniej kolejności zgodnej z kolejnością odpowiedzi
- Textarea z możliwością scrollowania
- Możliwość ręcznego zaznaczenia i skopiowania fragmentów

3.3.4 Funkcja kopiowania
- Przycisk "Kopiuj wszystko"
- Skopiowanie całej zawartości textarea do schowka
- Wizualne potwierdzenie skopiowania (toast notification lub zmiana tekstu przycisku)

### 3.4 Historia sesji

3.4.1 Lista sesji
- Wyświetlanie wszystkich ukończonych sesji zalogowanego użytkownika
- Sortowanie od najnowszej do najstarszej
- Każda pozycja pokazuje timestamp w formacie "DD MMMM YYYY, HH:MM" (np. "25 stycznia 2026, 14:30")
- Możliwość kliknięcia w sesję w celu podglądu szczegółów

3.4.2 Podgląd szczegółów sesji
- Wyświetlenie wszystkich pytań i udzielonych odpowiedzi
- Wyświetlenie wygenerowanych fragmentów SOW
- Możliwość skopiowania fragmentów z historycznej sesji
- Brak możliwości edycji lub wznowienia sesji

3.4.3 Zarządzanie historią
- Historia dostępna po zalogowaniu w dedykowanej sekcji aplikacji
- Brak możliwości usuwania sesji z historii (w MVP)
- Brak limitu liczby przechowywanych sesji

3.4.4 Rozpoczęcie kolejnej sesji
- Przycisk "Rozpocznij nową sesję" na szczycie listy sesji

### 3.5 Zarządzanie danymi

3.5.1 Struktura bazy danych
Tabele w PostgreSQL (Supabase):

users (zarządzana przez Supabase Auth)
- id: uuid (primary key)
- email: text
- created_at: timestamp

questions
- id: uuid (primary key)
- question_order: integer
- question_text: text
- options: jsonb (tablica obiektów: [{id, text, sow_fragment}])
- created_at: timestamp

sessions
- id: uuid (primary key)
- user_id: uuid (foreign key -> users.id)
- created_at: timestamp
- completed_at: timestamp (nullable)
- answers: jsonb (tablica obiektów: [{question_id, answer_id}])
- generated_fragments: text[] (tablica tekstów)

3.5.2 Row Level Security (RLS)
- Użytkownik ma dostęp tylko do własnych sesji (sessions.user_id = auth.uid())
- Wszyscy użytkownicy mają read-only dostęp do tabeli questions

3.5.3 Zarządzanie pytaniami i szablonami
- Pytania i fragmenty zarządzane przez direct database access
- Brak admin panelu w MVP
- Struktura JSON w kolumnie options umożliwia łatwe dodawanie i edycję

### 3.6 Obsługa błędów

3.6.1 Problemy z połączeniem
- Prosty error screen z komunikatem: "Nie można połączyć z serwerem. Spróbuj ponownie później."
- Przycisk "Odśwież stronę"
- Wyświetlany przy błędach Supabase (network errors, timeouts)

3.6.2 Błędy walidacji
- Disabled state przycisków przy braku wybranej odpowiedzi
- Brak możliwości przejścia dalej bez wyboru odpowiedzi

3.6.3 Monitoring
- Basic monitoring przez Vercel Analytics i Supabase
- Logi aplikacji dostępne w Vercel Dashboard
- Logi bazy danych dostępne w Supabase dashboard
- Automatyczny monitoring performance i error tracking przez Vercel

## 4. Granice produktu

### 4.1 Co NIE wchodzi w zakres MVP

4.1.1 Funkcjonalności dokumentu
- Generowanie kompletnego dokumentu SOW (aplikacja generuje tylko fragmenty)
- Edycja wygenerowanych fragmentów bezpośrednio w aplikacji
- Interpolacja zmiennych w szablonach fragmentów (tylko statyczne teksty)
- Eksport do formatów PDF lub DOCX
- Formatowanie HTML fragmentów (tylko plain text)

4.1.2 Zarządzanie pytaniami
- Interfejs administracyjny do zarządzania pytaniami i szablonami
- Wersjonowanie pytań i szablonów
- Historia zmian w pytaniach
- Logika warunkowa pytań (pytania zależne od wcześniejszych odpowiedzi)
- Pytania z możliwością wprowadzenia tekstu (tylko single-select)

4.1.3 Zarządzanie użytkownikami
- Zaawansowane zarządzanie użytkownikami (role, uprawnienia)
- Zespoły i grupy użytkowników
- System zaproszeń
- Różne poziomy dostępu
- Możliwość współdzielenia sesji między użytkownikami

4.1.4 Współpraca
- Współpraca nad tym samym dokumentem przez wielu użytkowników
- Komentarze i adnotacje
- System powiadomień
- Email notifications do zespołu legal

4.1.5 Sesje i historia
- Auto-save w trakcie wypełniania sesji
- Możliwość wznowienia przerwanych sesji
- Możliwość powrotu do poprzednich pytań
- Edycja ukończonych sesji
- Usuwanie sesji z historii
- Duplikowanie sesji

4.1.6 Integracje
- Integracje z systemami CRM (Salesforce, HubSpot)
- Integracje z narzędziami komunikacji (Slack, Teams)
- API dla zewnętrznych systemów

4.1.7 Analytics i raportowanie
- Zautomatyzowany dashboard z metrykami
- Zaawansowane analytics
- Eksport raportów
- Wizualizacje danych

4.1.8 Infrastruktura
- Środowisko staging/testowe (Vercel oferuje preview deployments, ale nie dedykowane staging)
- Advanced error handling i monitoring (podstawowe przez Vercel Analytics wystarczy)
- Automatyczne backupy (poza tymi oferowanymi przez Supabase)
- Custom logging i alerting (podstawowe logi Vercel wystarczą)

4.1.9 Personalizacja
- Zaawansowana personalizacja dokumentów
- Custom branding
- Konfiguracja UI przez użytkownika

### 4.2 Założenia i ograniczenia

4.2.1 Założenia techniczne
- Użytkownicy mają dostęp do nowoczesnej przeglądarki (Chrome, Firefox, Safari, Edge)
- Użytkownicy mają stałe połączenie internetowe
- Firma używa Google Workspace lub użytkownicy mają konta Google
- Treść pytań i fragmentów będzie dostarczona przez zespół legal przed wdrożeniem

4.2.2 Ograniczenia skali
- Maksymalnie 10 użytkowników dziennie
- Maksymalnie 10 sesji dziennie
- Jedno środowisko produkcyjne
- Testowanie tylko lokalne

4.2.3 Ograniczenia bezpieczeństwa
- Brak przechowywania danych poufnych w systemie
- Basic security przez Google SSO i Supabase RLS
- Brak advanced security features (2FA, audit logs, etc.)

## 5. Historyjki użytkowników

### 5.1 Autentykacja i onboarding

US-001: Logowanie przez Google SSO
- Tytuł: Logowanie do aplikacji przez Google
- Opis: Jako członek zespołu sprzedażowego, chcę zalogować się do aplikacji używając mojego konta Google, aby uzyskać szybki i bezpieczny dostęp do systemu bez konieczności zapamiętywania dodatkowego hasła.
- Kryteria akceptacji:
  - Strona główna aplikacji wyświetla przycisk "Zaloguj przez Google"
  - Kliknięcie przycisku przekierowuje do Google OAuth flow
  - Po udanej autoryzacji w Google, użytkownik jest przekierowywany z powrotem do aplikacji
  - Supabase Auth tworzy lub aktualizuje rekord użytkownika w bazie danych
  - Po pierwszym logowaniu użytkownik widzi welcome screen
  - Po kolejnych logowaniach użytkownik jest przekierowywany do głównego ekranu aplikacji (wyświetlającego listę sesji z przyciskiem "Rozpocznij nową sesję")
  - Sesja użytkownika jest utrzymywana przez Supabase Auth
  - W przypadku błędu autoryzacji wyświetlany jest komunikat błędu

US-002: Welcome screen dla nowych użytkowników
- Tytuł: Wprowadzenie dla nowego użytkownika
- Opis: Jako nowy użytkownik logujący się po raz pierwszy, chcę zobaczyć krótką instrukcję jak korzystać z aplikacji, aby szybko zrozumieć jej cel i móc rozpocząć pracę.
- Kryteria akceptacji:
  - Welcome screen wyświetla się tylko przy pierwszym logowaniu użytkownika
  - Ekran zawiera 2-3 zdania opisujące cel aplikacji
  - Ekran zawiera przycisk "Rozpocznij pierwszą sesję"
  - Kliknięcie przycisku przekierowuje do pierwszego pytania w wizardzie
  - Stan "czy użytkownik widział welcome screen" jest zapisany w bazie lub localStorage
  - Użytkownik może pominąć welcome screen klikając link "Przejdź do aplikacji"

US-003: Wylogowanie z aplikacji
- Tytuł: Bezpieczne wylogowanie
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć swoje konto na współdzielonym komputerze.
- Kryteria akceptacji:
  - Przycisk "Wyloguj" widoczny w nawigacji aplikacji (header)
  - Kliknięcie przycisku wylogowuje użytkownika z Supabase Auth
  - Po wylogowaniu użytkownik jest przekierowywany do strony logowania
  - Sesja użytkownika jest usuwana
  - Próba dostępu do chronionych stron po wylogowaniu przekierowuje do strony logowania

### 5.2 Rozpoczynanie nowej sesji

US-004: Rozpoczęcie nowej sesji generowania fragmentów
- Tytuł: Rozpoczęcie nowej sesji
- Opis: Jako członek zespołu sprzedażowego, chcę rozpocząć nową sesję generowania fragmentów SOW, aby przygotować materiały dla konkretnego projektu.
- Kryteria akceptacji:
  - Na głównym ekranie aplikacji widoczny jest przycisk "Rozpocznij nową sesję"
  - Kliknięcie przycisku NIE tworzy rekordu w bazie danych (sesja zapisywana dopiero po ukończeniu wszystkich pytań)
  - W state aplikacji (React) inicjalizowany jest stan nowej sesji (puste odpowiedzi, timestamp rozpoczęcia)
  - Użytkownik jest przekierowywany do pierwszego pytania
  - Wyświetlany jest wskaźnik postępu "Pytanie 1 z 5"

US-005: Wyświetlanie listy sesji
- Tytuł: Dostęp do historii sesji
- Opis: Jako użytkownik, chcę móc przejść do sekcji historii moich sesji, aby przejrzeć wcześniej wygenerowane fragmenty.
- Kryteria akceptacji:
  - Lista sesji jest wyświetlana zawsze na głównym ekranie aplikacji w sidebarze zajmującym ok. 20% szerokości ekranu
  - Jeśli użytkownik nie ma żadnych ukończonych sesji, wyświetlany jest komunikat "Nie masz jeszcze żadnych ukończonych sesji"
  - Jeśli użytkownik ma sesje, wyświetlana jest ich lista
  - Na szczycie listy zawsze wyświetlany jest przycisk "Rozpocznij nową sesję"

### 5.3 Wizard pytań i odpowiedzi

US-006: Wyświetlenie pytania z opcjami single-select
- Tytuł: Prezentacja pytania użytkownikowi
- Opis: Jako użytkownik wypełniający sesję, chcę zobaczyć pytanie z dostępnymi opcjami odpowiedzi, aby móc wybrać właściwą opcję dla mojego projektu.
- Kryteria akceptacji:
  - Pytanie wyświetlane jest w czytelnej formie
  - Pod pytaniem wyświetlana jest lista wszystkich dostępnych odpowiedzi
  - Każda odpowiedź prezentowana jako przycisk wyboru
  - Tylko jedna odpowiedź może być wybrana jednocześnie
  - Wybrana odpowiedź jest wizualnie wyróżniona
  - Wskaźnik postępu pokazuje aktualny numer pytania (np. "Pytanie 2 z 5")
  - Przycisk "Dalej" jest widoczny na ekranie

US-007: Wybór odpowiedzi na pytanie
- Tytuł: Wybór odpowiedzi
- Opis: Jako użytkownik, chcę wybrać odpowiedź na pytanie, aby móc przejść do kolejnego kroku.
- Kryteria akceptacji:
  - Kliknięcie w opcję odpowiedzi zaznacza ją jako wybraną
  - Wizualna indykacja wybranej odpowiedzi (podświetlenie, checkmark, zmiana koloru)
  - Wybór innej odpowiedzi odznacza poprzednią
  - Przycisk "Dalej" staje się aktywny (enabled) po wyborze odpowiedzi
  - Wybrana odpowiedź jest zapisywana w state aplikacji (React)

US-008: Próba przejścia dalej bez wyboru odpowiedzi
- Tytuł: Walidacja wyboru odpowiedzi
- Opis: Jako użytkownik, nie mogę przejść do kolejnego pytania bez wybrania odpowiedzi, aby zapewnić kompletność danych.
- Kryteria akceptacji:
  - Jeśli użytkownik nie wybrał odpowiedzi, przycisk "Dalej" jest w stanie disabled
  - Disabled button jest wizualnie wyróżniony (szary, cursor: not-allowed)
  - Kliknięcie w disabled button nie powoduje żadnej akcji
  - Tooltip lub hint informujący "Wybierz odpowiedź aby kontynuować"

US-009: Przejście do kolejnego pytania
- Tytuł: Nawigacja do następnego pytania
- Opis: Jako użytkownik, chcę przejść do kolejnego pytania po wybraniu odpowiedzi, aby kontynuować wypełnianie sesji.
- Kryteria akceptacji:
  - Kliknięcie przycisku "Dalej" zapisuje odpowiedź w state aplikacji
  - Aplikacja przechodzi do następnego pytania w sekwencji
  - Wyświetlane jest kolejne pytanie z jego opcjami
  - Wskaźnik postępu aktualizuje się (np. "Pytanie 3 z 5")
  - Poprzednie pytanie nie jest już widoczne
  - Brak możliwości powrotu do poprzedniego pytania (brak przycisku "Wstecz")

US-010: Odpowiedź na ostatnie pytanie
- Tytuł: Zakończenie sekwencji pytań
- Opis: Jako użytkownik, chcę odpowiedzieć na ostatnie pytanie i automatycznie zobaczyć wygenerowane fragmenty, aby zakończyć proces wypełniania.
- Kryteria akceptacji:
  - Przy ostatnim pytaniu wskaźnik pokazuje "Pytanie 5 z 5"
  - Po wybraniu odpowiedzi przycisk "Dalej" może mieć zmieniony tekst na "Zakończ"
  - Kliknięcie przycisku zapisuje ostatnią odpowiedź
  - Aplikacja automatycznie generuje fragmenty SOW na podstawie wszystkich odpowiedzi
  - Rekord sesji jest zapisywany w bazie (completed_at, answers, generated_fragments)
  - Użytkownik jest przekierowywany do ekranu z wygenerowanymi fragmentami

### 5.4 Zarządzanie sesją w trakcie wypełniania

US-011: Utrata postępu po zamknięciu przeglądarki
- Tytuł: Brak persystencji sesji w trakcie
- Opis: Jako system, nie zapisuję postępu sesji w trakcie wypełniania, aby uprościć implementację MVP.
- Kryteria akceptacji:
  - Odpowiedzi użytkownika przechowywane tylko w state aplikacji (React/pamięć)
  - Brak zapisu do localStorage lub bazy danych w trakcie wypełniania
  - Po odświeżeniu strony w trakcie sesji, postęp jest tracony
  - Po zamknięciu i ponownym otwarciu aplikacji, użytkownik zaczyna od nowa
  - Rekord sessions w bazie tworzony tylko po ukończeniu wszystkich pytań

### 5.5 Generowanie i wyświetlanie fragmentów

US-012: Automatyczne generowanie fragmentów SOW
- Tytuł: Generowanie fragmentów po ostatnim pytaniu
- Opis: Jako użytkownik, chcę aby fragmenty SOW zostały automatycznie wygenerowane po odpowiedzi na ostatnie pytanie, aby szybko uzyskać wyniki.
- Kryteria akceptacji:
  - Po odpowiedzi na pytanie nr 5 aplikacja automatycznie agreguje wszystkie odpowiedzi
  - Dla każdej odpowiedzi pobierany jest przypisany fragment SOW z bazy danych
  - Fragmenty składane są w tablicę w kolejności odpowiadającej kolejności pytań
  - Rekord sesji w bazie jest aktualizowany:
    - completed_at ustawiane na aktualny timestamp
    - answers zapisywane jako JSONB z wszystkimi pytaniami i odpowiedziami
    - generated_fragments zapisywane jako tablica tekstów
  - Proces generowania jest synchroniczny (użytkownik czeka na zakończenie)

US-014: Wyświetlenie wygenerowanych fragmentów
- Tytuł: Prezentacja fragmentów użytkownikowi
- Opis: Jako użytkownik, chcę zobaczyć wszystkie wygenerowane fragmenty SOW w jednym miejscu, aby móc je skopiować i przekazać zespołowi legal.
- Kryteria akceptacji:
  - Ekran z fragmentami wyświetla tytuł "Wygenerowane fragmenty SOW"
  - Wszystkie fragmenty wyświetlone w jednym textarea (plain text)
  - Fragmenty oddzielone pustymi liniami dla czytelności
  - Fragmenty w kolejności odpowiadającej kolejności odpowiedzi na pytania
  - Textarea ma włączone przewijanie (scrollable)
  - Textarea ma odpowiednią wysokość (minimum 300px lub dopasowaną do zawartości)
  - Tekst w textarea jest read-only (nie można edytować)
  - Przycisk "Kopiuj wszystko" widoczny nad lub pod textarea

US-015: Kopiowanie wszystkich fragmentów
- Tytuł: Skopiowanie fragmentów do schowka
- Opis: Jako użytkownik, chcę skopiować wszystkie wygenerowane fragmenty jednym kliknięciem, aby szybko przekazać je zespołowi legal przez email lub Slack.
- Kryteria akceptacji:
  - Przycisk "Kopiuj wszystko" jest aktywny i widoczny
  - Kliknięcie przycisku kopiuje całą zawartość textarea do schowka systemowego
  - Po skopiowaniu wyświetlane jest potwierdzenie (toast notification lub zmiana tekstu przycisku)
  - Komunikat potwierdzenia: "Skopiowano do schowka!" lub podobny
  - Skopiowany tekst zawiera wszystkie fragmenty w oryginalnym formacie (z pustymi liniami)
  - Użytkownik może wkleić skopiowany tekst w dowolnej aplikacji (email, Slack, edytor tekstu)
  - W przypadku błędu kopiowania wyświetlany jest komunikat błędu

US-016: Ręczne zaznaczenie i skopiowanie części tekstu
- Tytuł: Elastyczne kopiowanie fragmentów
- Opis: Jako użytkownik, chcę móc zaznaczyć i skopiować tylko część wygenerowanych fragmentów, aby przekazać wybrane sekcje.
- Kryteria akceptacji:
  - Użytkownik może zaznaczyć dowolny fragment tekstu w textarea
  - Standardowe skróty klawiszowe działają (Ctrl/Cmd+C, Ctrl/Cmd+A)
  - Menu kontekstowe przeglądarki (prawy przycisk myszy) oferuje opcję "Kopiuj"
  - Zaznaczenie jest wizualnie wyróżnione
  - Skopiowany fragment można wkleić w innych aplikacjach

### 5.6 Historia sesji

US-018: Wyświetlenie listy ukończonych sesji
- Tytuł: Przeglądanie historii sesji
- Opis: Jako użytkownik, chcę zobaczyć listę wszystkich moich ukończonych sesji, aby móc wrócić do wcześniej wygenerowanych fragmentów.
- Kryteria akceptacji:
  - Strona "Historia" wyświetla listę wszystkich ukończonych sesji użytkownika
  - Lista pobierana z bazy: SELECT * FROM sessions WHERE user_id = current_user AND completed_at IS NOT NULL
  - Sesje posortowane od najnowszej do najstarszej (ORDER BY created_at DESC)
  - Każda pozycja na liście pokazuje timestamp w formacie "DD MMMM YYYY, HH:MM" (np. "25 stycznia 2026, 14:30")
  - Lista jest responsywna i czytelna
  - Jeśli użytkownik nie ma żadnych ukończonych sesji, wyświetlany jest komunikat "Nie masz jeszcze żadnych ukończonych sesji" z przyciskiem "Rozpocznij pierwszą sesję"

US-019: Dostęp do szczegółów sesji z historii
- Tytuł: Podgląd szczegółów ukończonej sesji
- Opis: Jako użytkownik, chcę kliknąć w sesję z historii i zobaczyć wszystkie pytania, odpowiedzi i wygenerowane fragmenty, aby przypomnieć sobie szczegóły lub ponownie skopiować fragmenty.
- Kryteria akceptacji:
  - Każda pozycja na liście historii jest klikalnym linkiem lub przyciskiem
  - Kliknięcie przekierowuje do strony szczegółów sesji
  - URL zawiera session_id (np. /sessions/[session_id])
  - Strona szczegółów pobiera dane sesji z bazy danych
  - Użytkownik może zobaczyć szczegóły tylko własnych sesji (RLS enforcement)
  - Próba dostępu do sesji innego użytkownika zwraca błąd 403 lub przekierowanie

US-020: Wyświetlenie pytań i odpowiedzi z sesji
- Tytuł: Przegląd udzielonych odpowiedzi
- Opis: Jako użytkownik przeglądający szczegóły sesji, chcę zobaczyć wszystkie pytania i moje odpowiedzi, aby zrozumieć kontekst wygenerowanych fragmentów.
- Kryteria akceptacji:
  - Strona szczegółów wyświetla timestamp sesji
  - Wyświetlana jest lista wszystkich 5 pytań
  - Przy każdym pytaniu pokazana jest udzielona odpowiedź
  - Pytania i odpowiedzi w oryginalnej kolejności (1-5)
  - Format prezentacji czytelny i przejrzysty (np. karta lub sekcja dla każdego pytania)
  - Pytania i odpowiedzi pobierane z pola answers w rekordzie sesji (JSONB)

US-021: Wyświetlenie i kopiowanie fragmentów z historii
- Tytuł: Ponowne wykorzystanie fragmentów
- Opis: Jako użytkownik, chcę zobaczyć wygenerowane fragmenty SOW z historycznej sesji i móc je skopiować, aby ponownie wykorzystać je w komunikacji z zespołem legal.
- Kryteria akceptacji:
  - Pod pytaniami i odpowiedziami wyświetlona jest sekcja "Wygenerowane fragmenty SOW"
  - Fragmenty wyświetlone w textarea (plain text)
  - Fragmenty w tej samej kolejności co w oryginalnej sesji
  - Przycisk "Kopiuj wszystko" dostępny i funkcjonalny
  - Kliknięcie kopiuje fragmenty do schowka
  - Potwierdzenie skopiowania (toast lub zmiana tekstu przycisku)
  - Możliwość ręcznego zaznaczenia i skopiowania części tekstu

### 5.7 Obsługa błędów

US-023: Błąd połączenia z Supabase
- Tytuł: Obsługa problemów z serwerem
- Opis: Jako użytkownik, chcę zobaczyć czytelny komunikat błędu gdy aplikacja nie może połączyć się z serwerem, aby wiedzieć co się dzieje i jak postępować.
- Kryteria akceptacji:
  - Gdy wystąpi błąd połączenia z Supabase (network error, timeout, 500 error)
  - Wyświetlany jest error screen z komunikatem: "Nie można połączyć z serwerem. Spróbuj ponownie później."
  - Przycisk "Odśwież stronę" widoczny na ekranie błędu
  - Kliknięcie przycisku odświeża całą stronę (window.location.reload())
  - Error screen zastępuje normalny content aplikacji
  - Error screen ma przyjazny design (nie "surowy" error stack)

US-024: Błąd podczas ładowania pytań
- Tytuł: Obsługa błędu pobierania pytań
- Opis: Jako użytkownik rozpoczynający sesję, chcę zostać poinformowany jeśli pytania nie mogą być załadowane, aby wiedzieć że problem jest po stronie systemu.
- Kryteria akceptacji:
  - Gdy fetch pytań z tabeli questions kończy się błędem
  - Wyświetlany jest error screen lub komunikat błędu
  - Komunikat: "Nie można załadować pytań. Spróbuj ponownie później."
  - Przycisk "Odśwież stronę" lub "Spróbuj ponownie"
  - Błąd logowany do console dla celów debugowania

US-025: Błąd podczas zapisywania sesji
- Tytuł: Obsługa błędu zapisu sesji
- Opis: Jako użytkownik kończący sesję, chcę zostać poinformowany jeśli moje odpowiedzi nie mogą być zapisane, aby móc podjąć działanie.
- Kryteria akceptacji:
  - Gdy zapis sesji do bazy kończy się błędem (network, permissions, database error)
  - Wyświetlany jest komunikat błędu: "Nie udało się zapisać sesji. Spróbuj ponownie."
  - Przycisk "Spróbuj ponownie" umożliwia ponowną próbę zapisu
  - Odpowiedzi użytkownika pozostają w state aplikacji (nie są tracone)
  - Wygenerowane fragmenty pozostają widoczne
  - Użytkownik może skopiować fragmenty nawet jeśli zapis do bazy nie powiódł się
  - Error logowany do console

US-026: Błąd podczas ładowania historii sesji
- Tytuł: Obsługa błędu pobierania historii
- Opis: Jako użytkownik przeglądający historię, chcę zobaczyć komunikat błędu jeśli lista sesji nie może być załadowana.
- Kryteria akceptacji:
  - Gdy fetch sesji użytkownika kończy się błędem
  - Wyświetlany jest komunikat: "Nie można załadować historii sesji. Spróbuj ponownie."
  - Przycisk "Odśwież stronę" lub "Spróbuj ponownie"
  - Nawigacja aplikacji pozostaje funkcjonalna (użytkownik może przejść do głównego ekranu)

US-027: Nieautoryzowany dostęp do sesji innego użytkownika
- Tytuł: Ochrona przed dostępem do cudzych danych
- Opis: Jako system, blokuję dostęp do sesji innych użytkowników poprzez Row Level Security, aby zapewnić prywatność danych.
- Kryteria akceptacji:
  - RLS policy w Supabase sprawdza: sessions.user_id = auth.uid()
  - Próba pobrania sesji innego użytkownika zwraca pusty wynik lub błąd 403
  - Frontend obsługuje brak dostępu i wyświetla komunikat: "Nie masz dostępu do tej sesji"
  - Przekierowanie do strony głównej lub historii
  - Incident logowany dla celów security monitoring

## 6. Definition of Done - MVP

Aplikacja uznana za ukończoną gdy spełnia następujące kryteria:

Technical DoD:
- [ ] Aplikacja deployed na Vercel (produkcja)
- [ ] Google SSO działa poprawnie
- [ ] Pełny user flow działa end-to-end:
  - [ ] Logowanie przez Google
  - [ ] Przejście przez 5 pytań (wizard)
  - [ ] Generowanie fragmentów SOW
  - [ ] Kopiowanie fragmentów
  - [ ] Przeglądanie historii sesji
- [ ] Implementacja funkcji z logiką biznesową (generowanie fragmentów)
- [ ] Implementacja funkcji CRUD (zarządzanie sesjami)
- [ ] Co najmniej jeden działający test (unit lub e2e)
- [ ] Automatyczny deployment przez Vercel (każdy push do main = production deploy)
- [ ] Testy manualne przeprowadzone i udokumentowane

Quality DoD:
- [ ] Wszystkie krytyczne user stories (US-001 do US-016) zaimplementowane
- [ ] Welcome screen dla nowych użytkowników
- [ ] Row Level Security skonfigurowane w Supabase
- [ ] Brak known critical bugs

Data DoD:
- [ ] Struktura tabel w PostgreSQL utworzona
- [ ] Przykładowe 5 pytań z odpowiedziami i fragmentami w bazie
- [ ] RLS policies aktywne

Documentation DoD:
- [ ] README z instrukcją uruchomienia lokalnego
- [ ] Dokumentacja deployment na Vercel (konfiguracja environment variables)
- [ ] Dokumentacja konfiguracji Google OAuth
