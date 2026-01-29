import type { StatusTextProps } from './types';

/**
 * Displays status message below the spinner.
 */
export function StatusText({ message = 'Generowanie fragmentów...' }: StatusTextProps) {
  return (
    <p className="text-lg text-muted-foreground mt-4">
      {message}
    </p>
  );
}
