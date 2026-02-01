import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for API mocking in integration tests
 * Add your API endpoint mocks here
 */

export const handlers = [
  // Example: Mock profile endpoint
  // http.get('/api/profile', () => {
  //   return HttpResponse.json({
  //     id: '123',
  //     email: 'test@example.com',
  //     name: 'Test User',
  //   });
  // }),

  // Example: Mock sessions endpoint
  // http.get('/api/sessions', () => {
  //   return HttpResponse.json({
  //     sessions: [],
  //   });
  // }),
];
