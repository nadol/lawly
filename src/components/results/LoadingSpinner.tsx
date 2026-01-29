import { cn } from '@/lib/utils';
import type { LoadingSpinnerProps } from './types';

/**
 * Animated SVG spinner indicating activity.
 * Uses Tailwind's animate-spin utility.
 */
export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'size-12 md:size-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary',
        className
      )}
      role="status"
      aria-label="Ładowanie"
    />
  );
}
