import { useState, useEffect } from 'react';
import { useSessions } from '../hooks/useSessions';
import { NewSessionButton } from './NewSessionButton';
import { SessionList } from './SessionList';
import { LoadMoreButton } from './LoadMoreButton';

/**
 * Standalone sidebar component with its own session data fetching.
 * Can be used across different pages while maintaining independent state.
 * Highlights the currently active session when viewing session details.
 */
export function SessionsSidebar() {
  const {
    sessions,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    retry,
  } = useSessions();

  // Track current session ID from URL
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Extract session ID from URL path like /sessions/[id]
    const pathMatch = window.location.pathname.match(/^\/sessions\/([^/]+)$/);
    setActiveSessionId(pathMatch ? pathMatch[1] : null);
  }, []);

  return (
    <aside
      className="w-1/5 min-w-[280px] border-r bg-muted/30 flex flex-col h-[calc(100vh-64px)]"
      aria-label="Historia sesji"
    >
      <div className="p-4 border-b">
        <NewSessionButton />
      </div>

      <nav
        className="flex-1 overflow-y-auto"
        aria-label="Lista ukończonych sesji"
      >
        <SessionList
          sessions={sessions}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          activeSessionId={activeSessionId}
        />
      </nav>

      <LoadMoreButton
        isLoading={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </aside>
  );
}
