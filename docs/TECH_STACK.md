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

## CI/CD
- **GitHub Actions** - Automatyczne uruchamianie testów przy każdym push
  - Testy unit/integration/e2e
  - TypeScript compilation check
  - Linting

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
