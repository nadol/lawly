import { LogoutButton } from './LogoutButton';
import type { UserMenuProps } from './types';

/**
 * User menu component displaying email and logout button.
 * Imports and uses the existing LogoutButton component.
 */
export function UserMenu({ email }: UserMenuProps) {
  return (
    <div className="flex items-center gap-4">
      {email && (
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {email}
        </span>
      )}
      <LogoutButton />
    </div>
  );
}
