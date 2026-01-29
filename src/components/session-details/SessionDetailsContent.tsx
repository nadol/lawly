import { SessionHeader } from './SessionHeader';
import { QAAccordion } from './QAAccordion';
import { FragmentsSection } from './FragmentsSection';
import type { SessionDetailsContentProps } from './types';

/**
 * Main content container for session details view.
 * Composes header, Q&A accordion, and fragments section.
 */
export function SessionDetailsContent({
  session,
  isCopied,
  onCopy,
}: SessionDetailsContentProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <SessionHeader
        formattedDate={session.formattedDate}
        completedAt={session.completedAt}
      />
      <QAAccordion items={session.qaItems} />
      <FragmentsSection fragments={session.fragments} isCopied={isCopied} onCopy={onCopy} />
    </div>
  );
}
