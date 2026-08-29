import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Verifies the request is from a logged-in admin, using the session cookie
// (not a header the client could fake). Use inside API routes that must
// enforce admin-only access beyond what table-level RLS already covers
// (e.g. generating a signed URL for a private storage object).
export async function requireAdmin() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;

  return user;
}
