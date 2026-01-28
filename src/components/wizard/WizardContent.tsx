import type { WizardContentProps } from './types';
import { ProgressStepper } from './ProgressStepper';
import { QuestionCard } from './QuestionCard';
import { AnswerOptions } from './AnswerOptions';
import { NextButton } from './NextButton';

/**
 * Main content wrapper that orchestrates the wizard UI when questions are loaded.
 * Arranges progress stepper, question, options, and navigation button.
 */
export function WizardContent({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswerId,
  isLastQuestion,
  isSubmitting,
  onSelectAnswer,
  onNext,
}: WizardContentProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <ProgressStepper
        currentStep={currentQuestionIndex + 1}
        totalSteps={totalQuestions}
      />

      <div id={`question-${currentQuestion.id}`}>
        <QuestionCard questionText={currentQuestion.question_text} />
      </div>

      <AnswerOptions
        options={currentQuestion.options}
        selectedAnswerId={selectedAnswerId}
        questionId={currentQuestion.id}
        onSelectAnswer={onSelectAnswer}
      />

      <div className="mt-4">
        <NextButton
          isDisabled={selectedAnswerId === null}
          isLastQuestion={isLastQuestion}
          isLoading={isSubmitting}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
