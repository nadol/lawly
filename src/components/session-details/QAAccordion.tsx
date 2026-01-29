import { Accordion } from '@/components/ui/accordion';
import { QuestionAnswerItem } from './QuestionAnswerItem';
import type { QAAccordionProps } from './types';

/**
 * Collapsible accordion containing all questions and answers.
 * Multiple items can be expanded simultaneously.
 */
export function QAAccordion({ items }: QAAccordionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Pytania i odpowiedzi</h2>
      <Accordion type="multiple" className="w-full space-y-2">
        {items.map((item) => (
          <QuestionAnswerItem
            key={item.questionId}
            questionNumber={item.questionNumber}
            questionText={item.questionText}
            answerText={item.answerText}
            value={item.questionId}
          />
        ))}
      </Accordion>
    </div>
  );
}
