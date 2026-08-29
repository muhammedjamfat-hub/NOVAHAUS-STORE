"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client — safe to use in the browser.
// Only the anon key is ever exposed here; RLS policies protect the data.
// Uses cookie-based sessions (not localStorage) so the middleware and
// server components can also read the session for admin route protection.
export function supabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
