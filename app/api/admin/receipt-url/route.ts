import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing receipt path." }, { status: 400 });

  const supabase = supabaseServer();
  const { data, error } = await supabase.storage.from("payment-receipts").createSignedUrl(path, 300);

  if (error || !data) {
    return NextResponse.json({ error: "Could not load receipt." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
