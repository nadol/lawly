import { z } from "zod";

/**
 * Zod schema for validating PATCH /api/profile request body.
 * Only allows updating the `has_seen_welcome` field.
 * Uses strict mode to reject any additional properties.
 */
export const updateProfileSchema = z
  .object({
    has_seen_welcome: z.boolean({
      required_error: "has_seen_welcome is required",
      invalid_type_error: "has_seen_welcome must be a boolean",
    }),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
