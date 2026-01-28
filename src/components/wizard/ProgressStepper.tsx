import { memo } from 'react';

import { cn } from '@/lib/utils';
import type { ProgressStepperProps } from './types';

/**
 * Visual indicator showing current progress through the wizard.
 * Displays text and step indicators.
 */
export const ProgressStepper = memo(function ProgressStepper({
  currentStep,
  totalSteps,
}: ProgressStepperProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">
        Pytanie {currentStep} z {totalSteps}
      </p>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className={cn(
                'h-2 flex-1 rounded-full transition-all duration-150',
                isCompleted && 'bg-primary',
                isCurrent && 'bg-primary/60',
                !isCompleted && !isCurrent && 'bg-muted'
              )}
              aria-label={
                isCompleted
                  ? `Pytanie ${stepNumber} ukończone`
                  : isCurrent
                    ? `Pytanie ${stepNumber} aktualne`
                    : `Pytanie ${stepNumber} oczekuje`
              }
            />
          );
        })}
      </div>
    </div>
  );
});
