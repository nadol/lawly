-- migration: seed_questions
-- description: inserts 5 predefined questions with options and sow fragments
-- affected tables: questions
-- notes:
--   - placeholder content — to be replaced with actual legal text from the legal team
--   - each question has 3-4 single-select options
--   - each option maps 1:1 to a sow fragment
--   - question_order determines wizard display sequence (1 through 5)

-- =============================================================================
-- seed: predefined questions
-- =============================================================================

insert into public.questions (question_order, question_text, options) values

-- question 1: project type
(1, 'Jaki jest typ projektu?', '[
  {
    "id": "q1_opt1",
    "text": "Aplikacja webowa",
    "sow_fragment": "Przedmiotem umowy jest zaprojektowanie, wykonanie i wdrozenie aplikacji webowej dostepnej przez przegladarke internetowa."
  },
  {
    "id": "q1_opt2",
    "text": "Aplikacja mobilna",
    "sow_fragment": "Przedmiotem umowy jest zaprojektowanie, wykonanie i wdrozenie aplikacji mobilnej na platformy iOS i Android."
  },
  {
    "id": "q1_opt3",
    "text": "System backendowy / API",
    "sow_fragment": "Przedmiotem umowy jest zaprojektowanie, wykonanie i wdrozenie systemu backendowego udostepniajacego interfejs API."
  },
  {
    "id": "q1_opt4",
    "text": "Strona internetowa",
    "sow_fragment": "Przedmiotem umowy jest zaprojektowanie, wykonanie i wdrozenie strony internetowej o charakterze informacyjno-promocyjnym."
  }
]'::jsonb),

-- question 2: project timeline
(2, 'Jaki jest planowany czas realizacji projektu?', '[
  {
    "id": "q2_opt1",
    "text": "Do 1 miesiaca",
    "sow_fragment": "Termin realizacji przedmiotu umowy wynosi do 1 miesiaca od daty podpisania umowy."
  },
  {
    "id": "q2_opt2",
    "text": "1-3 miesiace",
    "sow_fragment": "Termin realizacji przedmiotu umowy wynosi od 1 do 3 miesiecy od daty podpisania umowy, z podzialem na etapy zgodnie z harmonogramem."
  },
  {
    "id": "q2_opt3",
    "text": "3-6 miesiecy",
    "sow_fragment": "Termin realizacji przedmiotu umowy wynosi od 3 do 6 miesiecy od daty podpisania umowy, z podzialem na etapy zgodnie z harmonogramem i regularnymi przeglodami postepu prac."
  },
  {
    "id": "q2_opt4",
    "text": "Powyzej 6 miesiecy",
    "sow_fragment": "Termin realizacji przedmiotu umowy wynosi powyzej 6 miesiecy od daty podpisania umowy, z podzialem na fazy projektowe, regularnymi przeglodami postepu oraz mozliwoscia rewizji zakresu po kazdej fazie."
  }
]'::jsonb),

-- question 3: team composition
(3, 'Jaki zespol jest wymagany do realizacji?', '[
  {
    "id": "q3_opt1",
    "text": "Pojedynczy programista",
    "sow_fragment": "Wykonawca zapewni jednego dedykowanego programiste do realizacji przedmiotu umowy."
  },
  {
    "id": "q3_opt2",
    "text": "Maly zespol (2-3 osoby)",
    "sow_fragment": "Wykonawca zapewni zespol skladajacy sie z 2-3 specjalistow, w tym programiste i projektanta UX/UI."
  },
  {
    "id": "q3_opt3",
    "text": "Sredni zespol (4-6 osob)",
    "sow_fragment": "Wykonawca zapewni zespol skladajacy sie z 4-6 specjalistow, obejmujacy programistow, projektanta UX/UI, testera oraz kierownika projektu."
  }
]'::jsonb),

-- question 4: maintenance and support
(4, 'Jaki zakres wsparcia po wdrozeniu jest wymagany?', '[
  {
    "id": "q4_opt1",
    "text": "Brak wsparcia powdrozeniowego",
    "sow_fragment": "Umowa nie obejmuje wsparcia powdrozeniowego. Odpowiedzialnosc Wykonawcy konczy sie z chwila odbioru koncowego."
  },
  {
    "id": "q4_opt2",
    "text": "Gwarancja na bledy (3 miesiace)",
    "sow_fragment": "Wykonawca udziela 3-miesiecznej gwarancji na naprawe bledow krytycznych i waznych zgloszonych po odbiorze koncowym."
  },
  {
    "id": "q4_opt3",
    "text": "Wsparcie i utrzymanie (6 miesiecy)",
    "sow_fragment": "Wykonawca zapewni 6-miesieczne wsparcie techniczne i utrzymanie obejmujace naprawe bledow, drobne modyfikacje oraz monitoring dzialania systemu."
  },
  {
    "id": "q4_opt4",
    "text": "Pelne wsparcie i rozwoj (12 miesiecy)",
    "sow_fragment": "Wykonawca zapewni 12-miesieczne kompleksowe wsparcie obejmujace naprawe bledow, rozwoj funkcjonalnosci, monitoring, oraz dedykowany kanal komunikacji z gwarantowanym czasem reakcji."
  }
]'::jsonb),

-- question 5: intellectual property
(5, 'Jak maja byc uregulowane prawa autorskie?', '[
  {
    "id": "q5_opt1",
    "text": "Pelne przeniesienie praw na Zamawiajacego",
    "sow_fragment": "Wykonawca przenosi na Zamawiajacego calesc majatkowych praw autorskich do utworow powstalych w ramach realizacji przedmiotu umowy, na wszystkich znanych polach eksploatacji."
  },
  {
    "id": "q5_opt2",
    "text": "Licencja wylaczna dla Zamawiajacego",
    "sow_fragment": "Wykonawca udziela Zamawiajacemu licencji wylacznej, bezterminowej i nieodwolalnej na korzystanie z utworow powstalych w ramach realizacji przedmiotu umowy."
  },
  {
    "id": "q5_opt3",
    "text": "Licencja niewylaczna dla Zamawiajacego",
    "sow_fragment": "Wykonawca udziela Zamawiajacemu licencji niewylacznej na korzystanie z utworow powstalych w ramach realizacji przedmiotu umowy. Wykonawca zachowuje prawo do wykorzystania rozwiazan w innych projektach."
  }
]'::jsonb);
