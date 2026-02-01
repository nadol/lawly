import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from './profile.schema';

describe('updateProfileSchema', () => {
  it('should validate valid profile update data', () => {
    const validData = { has_seen_welcome: true };
    const result = updateProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should reject missing has_seen_welcome field', () => {
    const invalidData = {};
    const result = updateProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('invalid_type');
    }
  });

  it('should reject non-boolean has_seen_welcome value', () => {
    const invalidData = { has_seen_welcome: 'true' };
    const result = updateProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('invalid_type');
    }
  });

  it('should reject additional properties (strict mode)', () => {
    const invalidData = {
      has_seen_welcome: true,
      extra_field: 'should not be allowed',
    };
    const result = updateProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('unrecognized_keys');
    }
  });

  it('should accept false value', () => {
    const validData = { has_seen_welcome: false };
    const result = updateProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.has_seen_welcome).toBe(false);
    }
  });
});
