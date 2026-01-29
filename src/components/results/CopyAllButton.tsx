import { Button } from '@/components/ui/button';
import type { CopyAllButtonProps } from './types';

/**
 * Button to copy all fragments to clipboard.
 * Changes text to "Skopiowano!" for 2 seconds after successful copy.
 */
export function CopyAllButton({
  fragments,
  isCopied,
  onCopy,
  disabled = false,
}: CopyAllButtonProps) {
  const isDisabled = disabled || fragments.length === 0;

  return (
    <Button
      onClick={onCopy}
      disabled={isDisabled}
      variant="default"
      className="w-full md:w-auto"
    >
      <svg
        className="size-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {isCopied ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        )}
      </svg>
      {isCopied ? 'Skopiowano!' : 'Kopiuj wszystko'}
    </Button>
  );
}
