import { createServerClient } from '@supabase/ssr';
import { defineMiddleware } from 'astro:middleware';

import type { Database } from '../db/database.types';

export const onRequest = defineMiddleware((context, next) => {
  // Create a Supabase client for each request with cookie access
  context.locals.supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  return next();
});
