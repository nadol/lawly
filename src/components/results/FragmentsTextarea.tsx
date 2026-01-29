import { cn } from '@/lib/utils';
import type { FragmentsTextareaProps } from './types';

/**
 * Read-only textarea displaying all SOW fragments separated by blank lines.
 * Scrollable with minimum height.
 */
export function FragmentsTextarea({ fragments, className }: FragmentsTextareaProps) {
  const value = fragments.join('\n\n');

  return (
    <div className="space-y-2">
      <label htmlFor="fragments-textarea" className="sr-only">
        Wygenerowane fragmenty SOW
      </label>
      <textarea
        id="fragments-textarea"
        readOnly
        value={value}
        className={cn(
          'w-full min-h-[300px] md:min-h-[400px] p-4 rounded-md border border-input',
          'bg-background text-foreground font-mono text-sm',
          'resize-none overflow-y-auto',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          className
        )}
        aria-label="Wygenerowane fragmenty SOW"
      />
    </div>
  );
}
