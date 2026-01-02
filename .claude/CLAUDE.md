# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lawly is an internal tool for the sales team that automates SOW (Statement of Work) fragment generation through a question-and-answer wizard. The application allows the sales team to independently generate key document fragments without requiring meetings with the legal team.

**MVP Deadline:** February 1, 2026 (approximately 7 working days)

**Target Users:** Internal company sales team (1-10 daily users) with Google Workspace access

## Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, Authentication with Google SSO, BaaS with Row Level Security)
- **CI/CD:** GitHub Actions (automatic test execution on every push)
- **Hosting:** Vercel (automatic deployment after tests pass)
- **Node.js:** 20+

## Core Architecture

### Data Model

The application uses PostgreSQL (Supabase) with the following key tables:

**users** (managed by Supabase Auth)
- Standard Supabase Auth user table
- Authentication via Google OAuth 2.0

**questions**
- Contains 5 predefined questions in linear sequence
- Each question has single-select options
- Column `options` (JSONB): array of `[{id, text, sow_fragment}]`
- No conditional logic - all questions shown in same order

**sessions**
- `user_id` (FK to users) - isolated by RLS
- `created_at` and `completed_at` timestamps
- `answers` (JSONB): array of `[{question_id, answer_id}]`
- `generated_fragments` (text[]): array of SOW fragments
- Sessions only saved to DB after completion (no auto-save during wizard)

**events**
- Tracks `session_start` and `session_complete` events
- Used to calculate completion rate metric (target: 75-85%)

### Row Level Security (RLS)

Critical security requirement:
- Users can only access their own sessions: `sessions.user_id = auth.uid()`
- Users can only access their own events (via session_id relation)
- All users have read-only access to questions table

### Application Flow

1. **Authentication:** Google SSO → Supabase Auth manages session
2. **First-time users:** See welcome screen with 2-3 sentence description
3. **Wizard:** Linear progression through 5 questions (no back button, no conditional logic)
4. **State management:** Answers stored in React state only (no localStorage, no DB save during wizard)
5. **Fragment generation:** Automatic after answering question 5 → 1:1 mapping answer→fragment
6. **Session save:** Only after completion with `completed_at` timestamp and `session_complete` event
7. **History:** List of completed sessions with timestamp, view-only (no edit/delete/resume)

### Key Design Decisions

**Out of Scope for MVP:**
- Auto-save during wizard (closing browser = lost progress)
- Back button in wizard
- Conditional question logic
- Complete SOW document generation (only fragments)
- In-app editing of generated fragments
- Admin panel for question management (use direct DB access)
- PDF/DOCX export (text-only in textarea)
- User roles/permissions (single user type)
- Session sharing/collaboration
- CRM integrations
- Staging environment (use Vercel preview deployments)

**In Scope:**
- Copy all fragments button with visual confirmation (toast)
- Manual text selection and copy from textarea
- Session history with detail view
- Basic error handling (connection errors, validation)
- Welcome screen for new users
- Progress indicator ("Question 3 of 5")

## Commit Convention

**IMPORTANT:** This project follows Conventional Commits specification.

Structure: `<type>[optional scope]: <description>`

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

Rules:
- Type is required
- Description in imperative mood, lowercase, no period
- Use `feat!:` or `BREAKING CHANGE:` footer for breaking changes
- Reference issues with `Fixes #123` in footer
- Add `Co-authored-by:` for collaboration

Examples:
```
feat(auth): add Google OAuth integration
fix(wizard): prevent progression without answer selection
docs: update deployment instructions
```

See `.claude/rules/commit-convention.md` for full specification.

## Success Metrics

**Primary KPI:** Session Completion Rate = (session_complete events / session_start events) × 100%
- **Target:** 75-85%
- **Measurement:** Manual SQL queries to events table (weekly post-launch, then monthly)

## Definition of Done (MVP)

Technical:
- Deployed to Vercel production
- Google SSO functional
- Complete end-to-end flow: Login → 5 questions → Fragment generation → Copy → History
- At least one passing test (unit or e2e)
- Automatic deployment via Vercel (push to main = production deploy)

Quality:
- Critical user stories (US-001 to US-016) implemented
- Welcome screen for new users
- RLS configured in Supabase
- No known critical bugs

Data:
- Database schema created with all tables
- 5 sample questions with answers and fragments seeded
- RLS policies active
- Event tracking functional

## Development Notes

### Question Management

Questions and fragments are managed via direct database access (no admin UI in MVP). The `questions.options` JSONB structure allows easy addition/editing:

```json
[
  {
    "id": "answer-1",
    "text": "Option text shown to user",
    "sow_fragment": "The actual SOW fragment text for this answer"
  }
]
```

### Error Handling Pattern

Simple error screens with user-friendly messages:
- Connection errors: "Nie można połączyć z serwerem. Spróbuj ponownie później." + Refresh button
- Validation: Disabled buttons until required selections made
- Unauthorized access: "Nie masz dostępu do tej sesji" + redirect

### Monitoring & Analytics

- Vercel Analytics for basic performance tracking
- Vercel Dashboard for application logs
- Supabase Dashboard for database logs and monitoring
- Manual SQL queries for completion rate calculation

### Testing Strategy

- Manual testing documented
- At least one automated test required for MVP
- GitHub Actions runs tests on every push
- Vercel deployment only after tests pass
