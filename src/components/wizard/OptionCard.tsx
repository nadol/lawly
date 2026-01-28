import { useCallback, memo } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { OptionCardProps } from './types';

/**
 * Individual selectable answer option with visual feedback.
 * Uses button semantics with radio role for accessibility.
 */
export const OptionCard = memo(function OptionCard({
  option,
  isSelected,
  onSelect,
}: OptionCardProps) {
  const handleClick = useCallback(() => {
    onSelect(option.id);
  }, [onSelect, option.id]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(option.id);
      }
    },
    [onSelect, option.id]
  );

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full rounded-lg border-2 p-4 text-left transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground'
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
        <span className="text-sm font-medium">{option.text}</span>
      </div>
    </button>
  );
});
