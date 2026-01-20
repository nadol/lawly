import { useState, useCallback } from "react";

import type { WelcomeError, UseWelcomeReturn } from "../welcome/types";

/**
 * Updates the user profile to mark welcome as seen.
 * Returns true on success, false on failure.
 */
async function updateProfile(): Promise<boolean> {
  try {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ has_seen_welcome: true }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    return true;
  } catch (error) {
    console.error("Profile update error:", error);
    return false;
  }
}

/**
 * Custom hook for managing the welcome screen flow.
 * Handles loading state, error state, profile update, and navigation.
 */
export function useWelcome(): UseWelcomeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WelcomeError | null>(null);

  const handleStartSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const success = await updateProfile();

    if (!success) {
      console.warn("Failed to update profile, proceeding with navigation");
    }

    // Navigate regardless of API result (graceful degradation)
    window.location.assign("/wizard");
  }, []);

  const handleSkip = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const success = await updateProfile();

    if (!success) {
      console.warn("Failed to update profile, proceeding with navigation");
    }

    // Navigate regardless of API result (graceful degradation)
    window.location.assign("/");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handleStartSession,
    handleSkip,
    clearError,
  };
}
