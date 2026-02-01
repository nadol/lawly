## TESTING

### Guidelines for E2E Testing

#### PLAYWRIGHT

When writing end-to-end tests with Playwright, follow these practices:

- **Initialize configuration only with Chromium/Desktop Chrome browser** - Use Chromium as the primary browser for E2E tests to ensure consistent behavior and faster execution.

- **Use browser contexts for isolating test environments** - Create separate browser contexts for each test to ensure test isolation and prevent state leakage between tests.

- **Implement the Page Object Model for maintainable tests** - Encapsulate page interactions in reusable page object classes to reduce duplication and improve maintainability.

- **Use locators for resilient element selection** - Prefer Playwright's locator API over direct selectors for more reliable element selection that handles dynamic content and timing issues.

- **Leverage API testing for backend validation** - Use Playwright's API request context to test backend endpoints directly, complementing UI tests with faster API-level validation.

- **Implement visual comparison with `expect(page).toHaveScreenshot()`** - Use screenshot comparisons to catch visual regressions and ensure UI consistency across changes.

- **Use the codegen tool for test recording** - Leverage `playwright codegen` to quickly generate test code by recording user interactions, then refine the generated code.

- **Leverage trace viewer for debugging test failures** - Enable tracing in test configuration and use `playwright show-trace` to debug test failures by replaying test execution step-by-step.

- **Implement test hooks for setup and teardown** - Use `beforeEach`, `afterEach`, `beforeAll`, and `afterAll` hooks to manage test state, database seeding, and cleanup operations.

- **Use expect assertions with specific matchers** - Prefer specific matchers like `toBeVisible()`, `toHaveText()`, `toHaveAttribute()` over generic assertions for clearer test intent and better error messages.

- **Leverage parallel execution for faster test runs** - Configure Playwright to run tests in parallel across multiple workers to reduce overall test execution time.
