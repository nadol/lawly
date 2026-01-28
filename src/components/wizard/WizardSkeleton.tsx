import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton displayed during initial question fetch.
 * Mimics the layout of the wizard content.
 */
export function WizardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      {/* Progress stepper skeleton */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-2 flex-1 rounded-full" />
          ))}
        </div>
      </div>

      {/* Question text skeleton */}
      <div className="py-4">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="mt-2 h-7 w-3/4" />
      </div>

      {/* Answer options skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>

      {/* Button skeleton */}
      <div className="mt-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
