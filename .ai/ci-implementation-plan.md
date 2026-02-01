# CI/CD Implementation Plan

## Task

Create a GitHub Actions CI pipeline for this Astro/React project.

## Workflow Requirements

- **Trigger:** Run on Pull Requests targeting the `main` branch only
- **Node version:** Use Node.js 22.14.0 (as specified in `.nvmrc`)
- **Jobs:**
  1. **Build** - Run `npm run build` to verify the Astro project compiles successfully
  2. **Test** - Run `npm run test` (Vitest unit tests only, no E2E)

## Configuration Details

- **File location:** `.github/workflows/ci.yml`
- **Environment variables:** None required (tests are fully mocked)
- **Secrets:** None required
- **Caching:** Not needed (keep it simple)
- **Deployment:** None

## Expected Outcome

- PR checks must pass before merging (for branch protection)
- The workflow should fail if build fails OR if any unit test fails
- Keep the workflow minimal and straightforward

## Existing npm Scripts to Use

| Script | Description |
|--------|-------------|
| `npm run build` | Astro production build |
| `npm run test` | Vitest unit tests (11 test files, all mocked, no Supabase dependency) |

## Technical Context

### Test Setup Analysis

The current unit tests:
- Use `vi.fn()` to mock `fetch` globally
- Don't make real API calls to Supabase
- Run in jsdom environment
- Are fully self-contained with no external dependencies

### Test Files (11 total)

**TypeScript tests (`.test.ts`):**
- `src/components/hooks/useWizard.test.ts`
- `src/lib/schemas/profile.schema.test.ts`
- `src/lib/utils.test.ts`

**React component tests (`.test.tsx`):**
- `src/components/wizard/WizardContent.test.tsx`
- `src/components/wizard/QuestionCard.test.tsx`
- `src/components/wizard/OptionCard.test.tsx`
- `src/components/wizard/AnswerOptions.test.tsx`
- `src/components/wizard/NextButton.test.tsx`
- `src/components/wizard/ProgressStepper.test.tsx`
- `src/components/wizard/WizardView.test.tsx`
- `src/components/ui/button.test.tsx`

## Post-Implementation

After the workflow is created:
1. Create a test PR to verify the workflow runs correctly
2. Configure branch protection rules on GitHub:
   - Require status checks to pass before merging
   - Select the CI workflow as a required check
3. Update the following documentation to mark CI/CD as complete:
   - `docs/PRD.md` - Definition of Done section
   - `README.md` - Project Status section
