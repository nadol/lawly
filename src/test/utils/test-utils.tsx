import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function that wraps components with providers
 * Use this instead of the default render from @testing-library/react
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };
