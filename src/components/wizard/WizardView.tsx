import { useWizard } from '../hooks/useWizard';
import { WizardSkeleton } from './WizardSkeleton';
import { WizardError } from './WizardError';
import { WizardContent } from './WizardContent';

/**
 * Root container component for the wizard.
 * Initializes the useWizard hook and conditionally renders loading, error, or content states.
 */
export function WizardView() {
  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswerId,
    isLastQuestion,
    isLoading,
    isSubmitting,
    error,
    selectAnswer,
    goToNext,
    retry,
  } = useWizard();

  if (isLoading) {
    return <WizardSkeleton />;
  }

  if (error) {
    return <WizardError message={error} onRetry={retry} />;
  }

  if (!currentQuestion) {
    return (
      <WizardError
        message="Nie znaleziono pytan. Sprobuj ponownie pozniej."
        onRetry={retry}
      />
    );
  }

  return (
    <WizardContent
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      selectedAnswerId={selectedAnswerId}
      isLastQuestion={isLastQuestion}
      isSubmitting={isSubmitting}
      onSelectAnswer={selectAnswer}
      onNext={goToNext}
    />
  );
}
