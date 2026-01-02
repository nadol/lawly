# Lawly - Koncepcja MVP

## Główny problem
Manualne przygotowanie dokumentu SOW (Statement of Work) wymaga spotkania zespołu sprzedażowego z zespołem legal, odpowiedzi na pytania i przygotowania dokumentu przez prawników. Ten proces jest czasochłonny i obciąża zespół legal. Część tej pracy może być zautomatyzowana poprzez system pytań i odpowiedzi, który pozwoli zespołowi sprzedażowemu samodzielnie wygenerować fragmenty dokumentu SOW do przekazania zespołowi legal.

## Najmniejszy zestaw funkcjonalności
- System pytań i odpowiedzi (predefiniowane pytania single-select)
- Mapowanie każdej pary pytanie-odpowiedź na odpowiedni fragment dokumentu SOW
- Generowanie fragmentów dokumentu SOW na podstawie udzielonych odpowiedzi
- Wyświetlanie listy wygenerowanych fragmentów z możliwością kopiowania każdego z osobna
- Prosty system kont użytkowników (logowanie bez zaawansowanego zarządzania)
- Historia sesji i wygenerowanych dokumentów dla zalogowanego użytkownika

## Co NIE wchodzi w zakres MVP
- Generowanie kompletnego dokumentu SOW (aplikacja generuje tylko fragmenty do przekazania zespołowi legal)
- Edycja wygenerowanych dokumentów bezpośrednio w aplikacji
- Zaawansowane zarządzanie użytkownikami (role, uprawnienia, zespoły, zaproszenia)
- Interfejs do zarządzania pytaniami i szablonami przez zespół legal
- Wersjonowanie szablonów i historia zmian w pytaniach
- Integracje z systemami CRM (Salesforce, HubSpot)
- Eksport do formatów PDF lub DOCX (na początek tylko podgląd w przeglądarce)
- Współpraca między użytkownikami nad tym samym dokumentem
- Zaawansowana personalizacja dokumentów

## Kryteria sukcesu
- 75-85% sesji kończy się wygenerowaniem wszystkich fragmentów SOW (użytkownik odpowiada na wszystkie pytania i generuje fragmenty)
