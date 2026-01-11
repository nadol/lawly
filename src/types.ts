/**
 * DTO (Data Transfer Object) and Command Model type definitions for Lawly API.
 * These types are derived from the database schema and define the API contract.
 */

import type { Tables } from './db/database.types';

// =============================================================================
// Base Types (derived from database Json fields)
// =============================================================================

/**
 * Represents a single answer option within a question.
 * Stored as part of the `questions.options` JSONB field in the database.
 */
export interface QuestionOption {
  id: string;
  text: string;
  sow_fragment: string;
}

/**
 * Represents a single answer in a session.
 * Stored as part of the `sessions.answers` JSONB field in the database.
 */
export interface AnswerItem {
  question_id: string;
  answer_id: string;
}

// =============================================================================
// Profile DTOs
// =============================================================================

/**
 * Response DTO for profile endpoints (GET /api/profile, PATCH /api/profile).
 * Directly maps to the `profiles` table Row type.
 */
export type ProfileResponse = Tables<'profiles'>;

/**
 * Command Model for updating a profile (PATCH /api/profile).
 * Only `has_seen_welcome` can be updated by the user.
 */
export interface UpdateProfileCommand {
  has_seen_welcome: boolean;
}

// =============================================================================
// Question DTOs
// =============================================================================

/**
 * Response DTO for a single question with typed options.
 * Derived from `questions` table Row, with `options` typed as QuestionOption[].
 */
export interface QuestionResponse {
  id: string;
  question_order: number;
  question_text: string;
  options: QuestionOption[];
}

/**
 * Response DTO for the questions list endpoint (GET /api/questions).
 * Contains all wizard questions ordered by `question_order`.
 */
export interface QuestionsListResponse {
  questions: QuestionResponse[];
  total: number;
}

// =============================================================================
// Session DTOs
// =============================================================================

/**
 * Summary DTO for session list items (GET /api/sessions).
 * Contains minimal session data for history display.
 */
export interface SessionSummary {
  id: string;
  created_at: string;
  completed_at: string;
}

/**
 * Response DTO for the sessions list endpoint (GET /api/sessions).
 * Contains paginated session summaries.
 */
export interface SessionsListResponse {
  sessions: SessionSummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for session detail (GET /api/sessions/[id], POST /api/sessions).
 * Contains full session data including answers and generated fragments.
 */
export interface SessionDetailResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  answers: AnswerItem[];
  generated_fragments: string[];
}

/**
 * Command Model for creating a new session (POST /api/sessions).
 * Contains the array of answers to all 5 wizard questions.
 */
export interface CreateSessionCommand {
  answers: AnswerItem[];
}

// =============================================================================
// Error Response
// =============================================================================

/**
 * Standard error response DTO for all API endpoints.
 */
export interface ErrorResponse {
  error: string;
}

// =============================================================================
// Utility Types (for internal use)
// =============================================================================

/**
 * Database row type for profiles table.
 * Used internally for type-safe database operations.
 */
export type ProfileRow = Tables<'profiles'>;

/**
 * Database row type for questions table.
 * Note: The `options` field is typed as Json in the database.
 */
export type QuestionRow = Tables<'questions'>;

/**
 * Database row type for sessions table.
 * Note: The `answers` field is typed as Json in the database.
 */
export type SessionRow = Tables<'sessions'>;
