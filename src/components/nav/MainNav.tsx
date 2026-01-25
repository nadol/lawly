import type { MainNavProps } from './types';
import { UserMenu } from './UserMenu';

/**
 * Main navigation component for authenticated pages.
 * Displays logo and user menu with logout functionality.
 */
export function MainNav({ userEmail }: MainNavProps) {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
        >
          Lawly
        </a>

        <UserMenu email={userEmail} />
      </div>
    </nav>
  );
}
