import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Access is gated by knowing the order's UUID (oid) — a value only ever
// returned once, directly to the customer who placed the order, at
// creation time. It is not guessable the way a sequential order number is.
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  const oid = req.nextUrl.searchParams.get("oid");

  if (!orderNumber || !oid) {
    return NextResponse.json({ error: "Missing order reference." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .eq("id", oid)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
