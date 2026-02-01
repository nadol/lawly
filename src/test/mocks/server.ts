import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server for integration tests
 * Use this in your test files to mock API calls
 */
export const server = setupServer(...handlers);
