import { Button } from '@/components/ui/button';
import { ResultsHeader } from './ResultsHeader';
import { CopyAllButton } from './CopyAllButton';
import { FragmentsTextarea } from './FragmentsTextarea';
import type { ResultsContentProps } from './types';

/**
 * Success state container showing fragments and actions.
 * Main content area after successful session creation.
 */
export function ResultsContent({
  session,
  fragments,
  isCopied,
  onCopy,
}: ResultsContentProps) {
  const handleReturn = () => {
    window.location.assign('/');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <ResultsHeader />
      
      <div className="flex justify-end mb-4">
        <CopyAllButton
          fragments={fragments}
          isCopied={isCopied}
          onCopy={onCopy}
        />
      </div>

      <FragmentsTextarea fragments={fragments} />

      <div className="flex justify-center pt-4">
        <Button onClick={handleReturn} variant="outline">
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Wróć do panelu
        </Button>
      </div>
    </div>
  );
}
