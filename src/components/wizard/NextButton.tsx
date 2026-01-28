import { memo } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NextButtonProps } from './types';

/**
 * Navigation button to proceed to next question or submit the wizard.
 * Includes tooltip for disabled state.
 */
export const NextButton = memo(function NextButton({
  isDisabled,
  isLastQuestion,
  isLoading,
  onNext,
}: NextButtonProps) {
  const buttonText = isLastQuestion ? 'Zakończ' : 'Dalej';
  const isButtonDisabled = isDisabled || isLoading;

  const button = (
    <Button
      size="lg"
      className="w-full"
      disabled={isButtonDisabled}
      onClick={onNext}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {buttonText}
    </Button>
  );

  if (isDisabled && !isLoading) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="w-full">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Wybierz odpowiedz aby kontynuowac</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
});
