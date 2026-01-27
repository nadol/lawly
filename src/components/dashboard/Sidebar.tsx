import { NewSessionButton } from './NewSessionButton';
import { SessionList } from './SessionList';
import { LoadMoreButton } from './LoadMoreButton';
import type { SidebarProps } from './types';

/**
 * Sidebar component for the dashboard.
 * Contains new session button, session list, and pagination controls.
 */
export function Sidebar({
  sessions,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry,
}: SidebarProps) {
  return (
    <aside
      className="w-1/5 min-w-[280px] border-r bg-muted/30 flex flex-col"
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
          onRetry={onRetry}
        />
      </nav>

      <LoadMoreButton
        isLoading={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
    </aside>
  );
}
