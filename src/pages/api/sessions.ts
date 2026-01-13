import type { APIRoute } from "astro";

import {
  getSessionsQuerySchema,
  createSessionCommandSchema,
} from "../../lib/schemas/sessions.schema";
import {
  getUserSessions,
  findDuplicateQuestionId,
  validateAnswersAgainstQuestions,
  generateSowFragments,
  createSession,
} from "../../lib/services/sessions.service";
import { getAllQuestions } from "../../lib/services/questions.service";
import type { SessionsListResponse, SessionDetailResponse, ErrorResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/sessions
 *
 * Retrieves a paginated list of the current user's completed sessions.
 * Requires an active Supabase Auth session (cookie-based).
 *
 * @query limit - Number of sessions per page (1-50, default 10)
 * @query offset - Number of sessions to skip (default 0)
 * @returns 200 - SessionsListResponse with sessions and pagination metadata
 * @returns 400 - ErrorResponse if query parameters are invalid
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
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

    // 2. Parse and validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    };

    const validationResult = getSessionsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const errorResponse: ErrorResponse = { error: firstError.message };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { limit, offset } = validationResult.data;

    // 3. Fetch user sessions
    const { sessions, total } = await getUserSessions(supabase, user.id, limit, offset);

    // 4. Return response
    const response: SessionsListResponse = {
      sessions,
      total,
      limit,
      offset,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/sessions
 *
 * Creates a new completed session with answers and generated SOW fragments.
 * Requires an active Supabase Auth session (cookie-based).
 *
 * @body answers - Array of exactly 5 answer items with question_id and answer_id
 * @returns 201 - SessionDetailResponse with the created session data
 * @returns 400 - ErrorResponse if request body is invalid or validation fails
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const POST: APIRoute = async ({ locals, request }) => {
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

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponse = { error: "Invalid request body" };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Validate request body with Zod schema
    const validationResult = createSessionCommandSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const errorResponse: ErrorResponse = { error: firstError.message };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { answers } = validationResult.data;

    // 4. Check for duplicate question_id values
    const duplicateId = findDuplicateQuestionId(answers);
    if (duplicateId) {
      const errorResponse: ErrorResponse = {
        error: `Duplicate question_id: ${duplicateId}`,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Fetch questions and perform business validation
    const questions = await getAllQuestions(supabase);

    const validationError = validateAnswersAgainstQuestions(answers, questions);
    if (validationError) {
      const errorResponse: ErrorResponse = { error: validationError.error };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Generate SOW fragments from answers
    const generatedFragments = generateSowFragments(answers, questions);

    // 7. Save session to database
    const session: SessionDetailResponse = await createSession(
      supabase,
      user.id,
      answers,
      generatedFragments
    );

    // 8. Return success response
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
