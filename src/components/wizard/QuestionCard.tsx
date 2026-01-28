import { memo } from 'react';

import type { QuestionCardProps } from './types';

/**
 * Displays the current question text in a prominent, readable format.
 */
export const QuestionCard = memo(function QuestionCard({
  questionText,
}: QuestionCardProps) {
  return (
    <div className="py-4">
      <h2 className="text-xl font-semibold leading-relaxed text-foreground">
        {questionText}
      </h2>
    </div>
  );
});
