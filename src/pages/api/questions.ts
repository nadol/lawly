import type { APIRoute } from "astro";

import { getAllQuestions } from "../../lib/services/questions.service";
import type { QuestionsListResponse, ErrorResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/questions
 *
 * Retrieves all questions ordered by question_order for the wizard.
 * Requires an active Supabase Auth session (cookie-based).
 *
 * @returns 200 - QuestionsListResponse with questions and total count
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = { error: "Unauthorized" };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch all questions
    const questions = await getAllQuestions(supabase);

    // 3. Return response
    const response: QuestionsListResponse = {
      questions,
      total: questions.length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
