import { Skeleton } from '@/components/ui/skeleton';
import type { SessionListSkeletonProps } from './types';

/**
 * Loading skeleton for the session list.
 * Displays animated placeholder cards during initial data fetch.
 */
export function SessionListSkeleton({ count = 5 }: SessionListSkeletonProps) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 rounded-md">
          <Skeleton className="h-5 w-3/4" />
        </div>
      ))}
    </div>
  );
}
