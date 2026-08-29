import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY client using the service role key.
// NEVER import this file from a "use client" component or expose it to the browser.
// Used in API routes for trusted operations: order creation, stock checks,
// payment verification, order tracking lookups, admin actions.
export function supabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your environment variables (server-side only)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
