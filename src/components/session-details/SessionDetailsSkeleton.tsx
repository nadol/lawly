import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for session details view.
 * Mimics the layout of the content with animated placeholder elements.
 */
export function SessionDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Q&A Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

      {/* Fragments Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
