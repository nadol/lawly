import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { WizardErrorProps } from './types';

/**
 * Error state displayed when question fetch or session submission fails.
 * Shows user-friendly message with retry option.
 */
export function WizardError({ message, onRetry }: WizardErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Wystapil blad
        </h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <Button onClick={onRetry}>Sprobuj ponownie</Button>
    </div>
  );
}
