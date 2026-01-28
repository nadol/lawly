import { useId, memo } from 'react';

import type { AnswerOptionsProps } from './types';
import { OptionCard } from './OptionCard';

/**
 * Container for answer options implementing RadioGroup semantics.
 * Manages ARIA roles for accessibility.
 */
export const AnswerOptions = memo(function AnswerOptions({
  options,
  selectedAnswerId,
  questionId,
  onSelectAnswer,
}: AnswerOptionsProps) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-labelledby={`question-${questionId}`}
      id={groupId}
      className="flex flex-col gap-3"
    >
      {options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          isSelected={selectedAnswerId === option.id}
          onSelect={onSelectAnswer}
        />
      ))}
    </div>
  );
});
