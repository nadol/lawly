import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { LoadMoreButtonProps } from './types';

/**
 * Pagination button to load additional sessions.
 * Shows loading spinner during fetch and hides when no more sessions available.
 */
export function LoadMoreButton({
  isLoading,
  hasMore,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadMore}
        disabled={isLoading}
        className="w-full"
        aria-label="Załaduj więcej sesji"
      >
        {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isLoading ? 'Ładowanie...' : 'Pokaż więcej'}
      </Button>
    </div>
  );
}
