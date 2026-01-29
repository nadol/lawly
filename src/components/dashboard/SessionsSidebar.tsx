import { useSessions } from '../hooks/useSessions';
import { NewSessionButton } from './NewSessionButton';
import { SessionList } from './SessionList';
import { LoadMoreButton } from './LoadMoreButton';

/**
 * Standalone sidebar component with its own session data fetching.
 * Can be used across different pages while maintaining independent state.
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
