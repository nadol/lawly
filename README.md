# Lawly

> Automated SOW Fragment Generation System for Sales Teams

An internal tool that streamlines the Statement of Work (SOW) preparation process by enabling sales teams to independently generate standardized document fragments through an intuitive question-and-answer wizard.

[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)](https://github.com)
[![Node](https://img.shields.io/badge/node-22.14.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [Documentation](#documentation)
- [License](#license)

## Overview

### The Problem

Currently, preparing SOW documents requires coordination between sales and legal teams through time-consuming meetings. Sales teams must answer standardized questions, then wait for lawyers to prepare documents. This process is inefficient, especially when many questions and answers are repetitive.

### The Solution

Lawly enables sales teams to:
- Answer 5 predefined questions through a self-service wizard
- Automatically generate standardized SOW fragments
- Copy generated fragments to share with the legal team
- Access history of all completed sessions

### Key Features

- **Google SSO Authentication** - Secure login using company Google Workspace accounts
- **Linear Question Wizard** - 5 single-select questions in sequential order
- **Automatic Fragment Generation** - 1:1 mapping of answers to SOW fragments
- **Copy to Clipboard** - One-click copying of generated fragments
- **Session History** - View all previously completed sessions
- **Row Level Security** - User data isolation through Supabase RLS
- **Responsive Design** - Built with Tailwind CSS and Shadcn/ui components

### Target Users

- Internal company sales team
- 1-10 daily active users
- Users with Google Workspace access

## Tech Stack

### Frontend
- **[Astro 5](https://astro.build/)** - Modern web framework with partial hydration
- **[React 19](https://react.dev/)** - UI library for interactive components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library

### Backend
- **[Supabase](https://supabase.com/)**
  - PostgreSQL - Relational database
  - Authentication - Google SSO with session management
  - BaaS - Backend as a Service with auto-generated APIs
  - Row Level Security - Data isolation per user

### CI/CD & Deployment
- **[GitHub Actions](https://github.com/features/actions)** - Automated testing on every push
- **[Vercel](https://vercel.com/)** - Zero-config deployment with preview environments
- **[Vercel Analytics](https://vercel.com/analytics)** - Built-in performance monitoring

### Development Tools
- **Node.js 22.14.0** - JavaScript runtime
- **npm** - Package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for code quality

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 22.14.0** (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- **npm** (comes with Node.js)
- **Git** for version control

You'll also need:
- A **Supabase account** and project
- **Google OAuth 2.0 credentials** for authentication
- Access to the company's **Google Workspace**

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lawly
```

### 2. Install Node.js Version

This project uses Node.js 22.14.0. If you use nvm:

```bash
nvm use
```

Or install the specified version:

```bash
nvm install 22.14.0
nvm use 22.14.0
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Google OAuth (optional for local development)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> **Note:** See documentation for detailed setup instructions for Supabase and Google OAuth.

### 5. Database Setup

1. Create the database schema using Supabase migrations (see `docs/PRD.md` for schema details)
2. Enable Row Level Security policies
3. Seed the database with 5 sample questions

### 6. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### 7. Build for Production

```bash
npm run build
npm run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Astro development server with hot reload |
| `npm run build` | Build the project for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run astro` | Run Astro CLI commands |

## Project Scope

### ✅ Included in MVP

**Authentication & User Management**
- Google SSO login
- Welcome screen for first-time users
- Logout functionality

**Question Wizard**
- 5 predefined questions in linear sequence
- Single-select answers
- Progress indicator ("Question 3 of 5")
- Validation (no progression without answer)
- No back button (forward-only navigation)

**Fragment Generation**
- Automatic generation after last question
- 1:1 answer-to-fragment mapping
- Plain text output in textarea
- Copy all fragments to clipboard
- Manual text selection and copy

**Session History**
- List of completed sessions
- Session detail view with Q&A and fragments
- Timestamp display
- Copy functionality from history
- View-only (no editing or deletion)

**Data & Security**
- PostgreSQL database via Supabase
- Row Level Security (RLS) for user isolation
- Basic error handling

### ❌ Not Included in MVP

**Document Features**
- Complete SOW document generation (only fragments)
- In-app editing of fragments
- PDF or DOCX export
- HTML formatting
- Variable interpolation in templates

**Question Management**
- Admin panel for managing questions
- Conditional logic between questions
- Question versioning
- Text input questions (only single-select)

**User Management**
- Roles and permissions
- Teams and groups
- User invitations
- Session sharing between users

**Session Features**
- Auto-save during wizard
- Resume interrupted sessions
- Back button in wizard
- Edit completed sessions
- Delete sessions from history

**Integrations**
- CRM systems (Salesforce, HubSpot)
- Communication tools (Slack, Teams)
- External APIs

**Advanced Features**
- Automated reporting dashboard
- Advanced analytics
- Custom branding
- Staging environment (use Vercel preview deployments)

## Project Status

**Current Status:** MVP in Active Development

**MVP Deadline:** February 1, 2026 (approximately 7 working days)

### Definition of Done

The MVP is considered complete when:

**Technical Requirements:**
- ✅ Deployed to Vercel production
- ✅ Google SSO functional
- ✅ End-to-end flow works (Login → Wizard → Generation → Copy → History)
- ✅ At least one passing test
- ✅ Automatic deployment via Vercel

**Quality Requirements:**
- ✅ Critical user stories (US-001 to US-016) implemented
- ✅ Welcome screen for new users
- ✅ Row Level Security configured
- ✅ No known critical bugs

**Data Requirements:**
- ✅ Database schema created
- ✅ 5 sample questions with answers and fragments seeded
- ✅ RLS policies active

## Documentation

Additional documentation is available in the `docs/` directory:

- **[MVP Concept](docs/MVP_CONCEPT.md)** - Core problem definition and MVP scope
- **[Product Requirements Document](docs/PRD.md)** - Complete PRD with 27 user stories
- **[Tech Stack Details](docs/TECH_STACK.md)** - Technology stack overview

### Project Memory

For AI-assisted development, see the Claude Code memory files:
- `.claude/CLAUDE.md` - Main project context and guidelines
- `.claude/rules/` - Modular development rules

## Contributing

This is an internal project. Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commits.

Commit format: `<type>[optional scope]: <description>`

Examples:
```bash
feat(auth): add Google OAuth integration
fix(wizard): prevent progression without answer selection
docs: update deployment instructions
```

See `.claude/rules/commit-convention.md` for detailed guidelines.

## License

MIT

---

**Built with ❤️ for the Sales Team**
