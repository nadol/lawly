/**
 * Type definitions for navigation components.
 */

/**
 * Props for MainNav component
 */
export interface MainNavProps {
  /** User's email to display in navigation (null if not available) */
  userEmail: string | null;
}

/**
 * Props for UserMenu component
 */
export interface UserMenuProps {
  /** User's email to display (null to hide email display) */
  email: string | null;
}
