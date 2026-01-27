import { useState, useCallback } from 'react';

import type { ProfileResponse } from '../../types';
import type { UseProfileReturn } from '../dashboard/types';

/**
 * Fetches the user profile from the API.
 * Returns the profile data or null on failure.
 */
async function fetchProfile(): Promise<ProfileResponse | null> {
  try {
    const response = await fetch('/api/profile');

    if (response.status === 401) {
      window.location.assign('/login');
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data: ProfileResponse = await response.json();
    return data;
  } catch (error) {
    console.warn('Profile fetch failed, defaulting to show welcome:', error);
    return null;
  }
}

/**
 * Updates the user profile to mark welcome as seen.
 * Returns true on success, false on failure.
 */
async function updateProfile(): Promise<boolean> {
  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ has_seen_welcome: true }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    return true;
  } catch (error) {
    console.error('Profile update error:', error);
    return false;
  }
}

/**
 * Custom hook for managing user profile state.
 * Handles profile fetching and welcome state updates with graceful degradation.
 *
 * @param initialHasSeenWelcome - Server-side fetched initial state
 * @returns Profile state and control functions
 */
export function useProfile(initialHasSeenWelcome: boolean): UseProfileReturn {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(initialHasSeenWelcome);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Marks the welcome screen as seen.
   * Implements graceful degradation - returns success even if API call fails.
   */
  const markWelcomeSeen = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const success = await updateProfile();

    if (success) {
      setHasSeenWelcome(true);
    } else {
      console.warn('Failed to update profile, but proceeding gracefully');
      // Still update local state for better UX, even if API failed
      setHasSeenWelcome(true);
    }

    setIsLoading(false);
    return success;
  }, []);

  return {
    hasSeenWelcome,
    isLoading,
    error,
    markWelcomeSeen,
  };
}
