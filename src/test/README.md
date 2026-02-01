# Test Setup Documentation

## Overview

This project uses two testing frameworks:
- **Vitest** - for unit and integration tests
- **Playwright** - for end-to-end (E2E) tests

## Directory Structure

```
src/
  test/
    e2e/          # Playwright E2E tests
    mocks/        # MSW handlers for API mocking
    utils/        # Test utilities and helpers
    setup.ts      # Vitest setup file
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run all tests (unit + e2e)
npm run test:all
```

## Writing Tests

### Unit Tests

Unit tests should be placed next to the files they test, with `.test.ts` or `.spec.ts` extension.

Example:
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './utils';

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Component Tests

For React components, use `@testing-library/react`:

```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '../../test/utils/test-utils';
import { Button } from './button';

describe('Button', () => {
  it('should render', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### E2E Tests

E2E tests go in `src/test/e2e/`:

```typescript
// src/test/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Utilities

### Custom Render

Use the custom render from `src/test/utils/test-utils.tsx` for React components:

```typescript
import { render } from '@/test/utils/test-utils';
```

### MSW for API Mocking

For integration tests that need to mock API calls:

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// In your test
server.use(
  http.get('/api/profile', () => {
    return HttpResponse.json({ id: '123', name: 'Test' });
  })
);
```

## Configuration

- **Vitest**: `vitest.config.ts`
- **Playwright**: `playwright.config.ts`

Both configurations are already set up with sensible defaults. Modify them as needed for your project.

## Coverage Goals

- ≥80% coverage for business logic
- ≥70% coverage for API endpoints

Run `npm run test:coverage` to check current coverage.
