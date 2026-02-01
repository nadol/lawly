# Tech Stack - Lawly MVP

## Frontend
- **Astro 5** - Static site generator z obsługą React islands
- **React 19** - UI components (tylko tam gdzie potrzebne)
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Component library

## Backend
- **Supabase**
  - PostgreSQL - Relacyjna baza danych
  - Authentication - Google SSO + session management
  - BaaS (Backend as a Service) - Row Level Security, API auto-generated

## Testing

### Unit Tests
- **Vitest** - Fast unit test framework z Vite
  - Testy schematów walidacji Zod
  - Testy funkcji serwisowych
  - Testy custom hooks React
- **Testing Library** - Testy komponentów React
  - `@testing-library/react` - Renderowanie i testowanie komponentów
  - `@testing-library/user-event` - Symulacja interakcji użytkownika

### Integration Tests
- **Vitest** - Framework dla testów integracyjnych
- **MSW (Mock Service Worker)** - Mockowanie API endpoints
  - Testy API routes (`/api/profile`, `/api/questions`, `/api/sessions`)
  - Weryfikacja integracji z Supabase
  - Testy Row Level Security (RLS) policies

### E2E Tests
- **Playwright** - Cross-browser end-to-end testing
  - Testy pełnych user flows (logowanie, wizard, historia)
  - Testy bezpieczeństwa i autoryzacji
  - Visual regression testing (screenshots)
- **axe-core** - Automatyczne testy dostępności (WCAG 2.1 AA)

### Coverage
- **Vitest Coverage (c8/istanbul)** - Raporty pokrycia kodu
  - Cel: ≥80% dla kodu biznesowego
  - Cel: ≥70% dla API endpoints

## CI/CD
- **GitHub Actions** - Automatyczne uruchamianie testów przy każdym push
  - Unit tests (Vitest)
  - Integration tests (Vitest + MSW)
  - E2E tests (Playwright) - tylko na PR
  - TypeScript compilation check
  - Linting (ESLint)

## Hosting & Deployment
- **Vercel** - Automatyczny deployment po przejściu testów
  - Zero-config deployment
  - Preview deployments dla PR-ów
  - Automatic HTTPS/SSL
  - Edge CDN
  - Built-in analytics

## Development Tools
- **Node.js 20+** - Runtime environment
- **npm/pnpm** - Package manager
- **Git + GitHub** - Version control
