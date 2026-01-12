import type { APIRoute } from "astro";

import { updateProfileSchema } from "../../lib/schemas/profile.schema";
import { getProfileByUserId, updateProfileByUserId } from "../../lib/services/profile.service";
import type { ProfileResponse, ErrorResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/profile
 *
 * Retrieves the profile of the currently authenticated user.
 * Requires an active Supabase Auth session (cookie-based).
 *
 * @returns 200 - ProfileResponse with user profile data
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 404 - ErrorResponse if profile not found
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

    // 2. Fetch user profile
    const profile = await getProfileByUserId(supabase, user.id);

    if (!profile) {
      console.warn(`Profile not found for user: ${user.id}`);
      const errorResponse: ErrorResponse = { error: "Profile not found" };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Return profile data
    const response: ProfileResponse = profile;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/profile
 *
 * Updates the profile of the currently authenticated user.
 * Only `has_seen_welcome` field can be updated.
 *
 * @returns 200 - ProfileResponse with updated profile data
 * @returns 400 - ErrorResponse if request body is invalid
 * @returns 401 - ErrorResponse if not authenticated
 * @returns 500 - ErrorResponse on server error
 */
export const PATCH: APIRoute = async ({ locals, request }) => {
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

    // 3. Validate request body with Zod
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        error: "has_seen_welcome must be a boolean",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Update profile
    const updatedProfile = await updateProfileByUserId(supabase, user.id, validationResult.data);

    // 5. Return updated profile
    const response: ProfileResponse = updatedProfile;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
