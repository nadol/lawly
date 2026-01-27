import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NewSessionButtonProps } from './types';

/**
 * Primary action button to start a new wizard session.
 * Navigates to /wizard without creating database records.
 */
export function NewSessionButton({ className }: NewSessionButtonProps) {
  const handleClick = () => {
    window.location.assign('/wizard');
  };

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className={cn('w-full', className)}
      aria-label="Rozpocznij nową sesję generowania SOW"
    >
      <Plus aria-hidden="true" />
      Nowa sesja
    </Button>
  );
}
