import type { QuestionAnswerItemProps } from './types';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

/**
 * Single accordion item displaying one question-answer pair.
 * Question is visible in trigger, answer revealed on expand.
 */
export function QuestionAnswerItem({
  questionNumber,
  questionText,
  answerText,
  value,
}: QuestionAnswerItemProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex gap-3">
          <span className="font-semibold text-muted-foreground shrink-0">
            {questionNumber}.
          </span>
          <span className="font-medium">{questionText}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-8 pt-2 text-muted-foreground">{answerText}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
