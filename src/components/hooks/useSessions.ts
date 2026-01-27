import { useState, useEffect, useCallback } from 'react';

import type { SessionsListResponse } from '../../types';
import type { SessionCardViewModel, UseSessionsReturn } from '../dashboard/types';

/**
 * Default pagination limit for session fetches.
 */
const DEFAULT_LIMIT = 10;

/**
 * Formats a session completion date to Polish locale display format.
 * Format: "DD MMMM YYYY, HH:MM"
 *
 * @param dateString - ISO 8601 date string from the database
 * @returns Formatted date string in Polish locale
 */
function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Transforms SessionSummary from API to SessionCardViewModel for UI consumption.
 *
 * @param session - Raw session data from API
 * @returns Session view model with formatted date
 */
function transformSession(session: SessionsListResponse['sessions'][0]): SessionCardViewModel {
  return {
    id: session.id,
    formattedDate: formatSessionDate(session.completed_at),
    completedAt: new Date(session.completed_at),
  };
}

/**
 * Custom hook for managing session list fetching and pagination.
 * Handles initial load, pagination, error states, and retry logic.
 *
 * @returns Session list state and control functions
 */
export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionCardViewModel[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches sessions from the API.
   *
   * @param fetchOffset - Pagination offset
   * @param append - Whether to append results to existing sessions or replace
   */
  const fetchSessions = useCallback(async (fetchOffset: number, append: boolean) => {
    try {
      const response = await fetch(
        `/api/sessions?limit=${DEFAULT_LIMIT}&offset=${fetchOffset}`
      );

      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data: SessionsListResponse = await response.json();
      const transformedSessions = data.sessions.map(transformSession);

      if (append) {
        setSessions((prev) => [...prev, ...transformedSessions]);
      } else {
        setSessions(transformedSessions);
      }

      setTotal(data.total);
      setOffset(fetchOffset);
      setError(null);
    } catch (err) {
      console.error('Sessions fetch error:', err);
      setError('Nie można załadować historii sesji. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  /**
   * Loads the next page of sessions.
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading) {
      return;
    }

    setIsLoadingMore(true);
    const nextOffset = offset + DEFAULT_LIMIT;
    await fetchSessions(nextOffset, true);
  }, [fetchSessions, offset, isLoading, isLoadingMore]);

  /**
   * Retries the last failed fetch.
   */
  const retry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await fetchSessions(offset, false);
  }, [fetchSessions, offset]);

  /**
   * Refreshes the session list from the beginning.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOffset(0);
    await fetchSessions(0, false);
  }, [fetchSessions]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSessions(0, false);
  }, [fetchSessions]);

  const hasMore = sessions.length < total;

  return {
    sessions,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    refresh,
  };
}
