import { FileText } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { EmptyStateProps } from './types';

/**
 * Empty state component displayed when user has no completed sessions.
 * Shows an encouraging message and icon.
 */
export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <FileText className="size-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold mb-2">Brak ukończonych sesji</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Rozpocznij swoją pierwszą sesję, aby automatycznie wygenerować fragmenty
        dokumentu SOW.
      </p>
    </div>
  );
}
