import { LoadingSpinner } from './LoadingSpinner';
import { StatusText } from './StatusText';

/**
 * Container for loading spinner and status message.
 * Displayed during session submission or fragment generation.
 */
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner />
      <StatusText />
    </div>
  );
}
