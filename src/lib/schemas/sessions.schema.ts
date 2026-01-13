import { z } from "zod";

/**
 * Zod schema for validating GET /api/sessions query parameters.
 * Uses coerce to handle string-to-number conversion from URL params.
 */
export const getSessionsQuerySchema = z.object({
  limit: z.coerce
    .number({
      invalid_type_error: "Invalid limit parameter",
    })
    .int({ message: "Invalid limit parameter" })
    .min(1, { message: "Invalid limit parameter" })
    .max(50, { message: "Invalid limit parameter" })
    .default(10),
  offset: z.coerce
    .number({
      invalid_type_error: "Invalid offset parameter",
    })
    .int({ message: "Invalid offset parameter" })
    .min(0, { message: "Invalid offset parameter" })
    .default(0),
});

export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;

// =============================================================================
// POST /api/sessions schemas
// =============================================================================

/**
 * Schema for a single answer item in the session.
 * question_id must be a valid UUID, answer_id must be non-empty.
 */
const answerItemSchema = z.object({
  question_id: z.string().uuid({ message: "Invalid answer structure" }),
  answer_id: z.string().min(1, { message: "Invalid answer structure" }),
});

/**
 * Zod schema for validating POST /api/sessions request body.
 * Requires exactly 5 answers to match the wizard's 5 questions.
 */
export const createSessionCommandSchema = z.object({
  answers: z
    .array(answerItemSchema, {
      invalid_type_error: "answers must be an array",
    })
    .length(5, { message: "Exactly 5 answers are required" }),
});

export type CreateSessionCommandSchema = z.infer<typeof createSessionCommandSchema>;
