import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileRow, UpdateProfileCommand } from "../../types";

/**
 * Fetches a user profile by user ID.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - UUID of the user whose profile to fetch
 * @returns Profile data or null if not found
 * @throws Error if database query fails (except for "not found" case)
 */
export async function getProfileByUserId(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, has_seen_welcome, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    // PGRST116 = no rows found - this is not a critical error
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Updates a user profile by user ID.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - UUID of the user whose profile to update
 * @param data - Profile fields to update
 * @returns Updated profile data
 * @throws Error if database query fails
 */
export async function updateProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateProfileCommand
): Promise<ProfileRow> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ has_seen_welcome: data.has_seen_welcome })
    .eq("id", userId)
    .select("id, has_seen_welcome, created_at")
    .single();

  if (error) {
    throw error;
  }

  return profile;
}
