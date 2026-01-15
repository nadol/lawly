import type { APIRoute } from "astro";

import { sessionIdParamSchema } from "../../../lib/schemas/sessions.schema";
import { getSessionById } from "../../../lib/services/sessions.service";
import type { SessionDetailResponse, ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/sessions/[id]
 *
 * Retrieves detailed information about a specific session.
 * Requires an active Supabase Auth session (cookie-based).
 * RLS ensures users can only access their own sessions.
 *
 * @param id - Session UUID from URL path
 * @returns 200 - SessionDetailResponse with full session data
 * @returns 400 - ErrorResponse if session ID format is invalid
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 404 - ErrorResponse if session not found or belongs to another user
 * @returns 500 - ErrorResponse on server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;

  try {
    // 1. Validate URL parameter
    const validationResult = sessionIdParamSchema.safeParse({ id: params.id });

    if (!validationResult.success) {
      const errorResponse: ErrorResponse = { error: "Invalid session ID format" };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: sessionId } = validationResult.data;

    // 2. Verify authentication
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

    // 3. Fetch session by ID (RLS handles authorization)
    const session = await getSessionById(supabase, sessionId);

    // 4. Handle not found (includes RLS-blocked access)
    if (!session) {
      const errorResponse: ErrorResponse = { error: "Session not found" };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response
    const response: SessionDetailResponse = session;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
