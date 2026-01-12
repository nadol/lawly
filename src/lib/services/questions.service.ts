import type { SupabaseClient } from "../../db/supabase.client";
import type { QuestionResponse, QuestionOption } from "../../types";

/** Partial question row returned from the select query (without created_at) */
interface QuestionSelectResult {
  id: string;
  question_order: number;
  question_text: string;
  options: unknown;
}

/**
 * Transforms database question row to API QuestionResponse.
 * Handles JSONB options field type casting.
 */
function mapQuestionRowToResponse(row: QuestionSelectResult): QuestionResponse {
  return {
    id: row.id,
    question_order: row.question_order,
    question_text: row.question_text,
    options: row.options as QuestionOption[],
  };
}

/**
 * Fetches all questions ordered by question_order.
 *
 * @param supabase - Supabase client instance from context.locals
 * @returns Array of questions with typed options
 * @throws Error if database query fails
 */
export async function getAllQuestions(supabase: SupabaseClient): Promise<QuestionResponse[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, question_order, question_text, options")
    .order("question_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapQuestionRowToResponse);
}
