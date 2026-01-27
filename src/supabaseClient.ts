/**
 * Supabase client initialization for a Vite frontend.
 *
 * - Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from import.meta.env.
 * - Throws a clear error at startup when either is missing (avoids obscure runtime failures).
 * - Never logs or prints the anon key. In development we only log the URL (no secrets).
 * - IMPORTANT: Do NOT put a service_role or any admin key here — only the ANON/public key.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Missing environment variable VITE_SUPABASE_URL. Set it in your .env or in your hosting provider and rebuild the app.'
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing environment variable VITE_SUPABASE_ANON_KEY. Set it in your .env or in your hosting provider and rebuild the app.'
  );
}

// Optional: log only the project URL in development (never log keys)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.debug('Supabase project URL:', SUPABASE_URL);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
