import { FragmentsTextarea } from '@/components/results/FragmentsTextarea';
import { CopyAllButton } from '@/components/results/CopyAllButton';
import type { FragmentsSectionProps } from './types';

/**
 * Section displaying generated SOW fragments with copy functionality.
 * Reuses components from results view.
 */
export function FragmentsSection({ fragments, isCopied, onCopy }: FragmentsSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Wygenerowane fragmenty SOW</h2>
      <FragmentsTextarea fragments={fragments} />
      <div className="flex justify-end">
        <CopyAllButton fragments={fragments} isCopied={isCopied} onCopy={onCopy} />
      </div>
    </div>
  );
}
