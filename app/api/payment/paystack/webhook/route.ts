import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabase-server";

// Paystack calls this directly (server-to-server) whenever a transaction
// event happens. It's the reliable backup to the browser-redirect verify
// flow above — the redirect can fail to fire (closed tab, network drop),
// but the webhook still confirms the order.
export async function POST(req: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const expectedSignature = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const tx = event.data;
    const orderId = tx.metadata?.order_id;
    if (!orderId) return NextResponse.json({ received: true });

    const supabase = supabaseServer();
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (!order || order.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    const expectedAmountKobo = Math.round(Number(order.total) * 100);
    if (tx.amount !== expectedAmountKobo) {
      await supabase
        .from("orders")
        .update({ admin_notes: "AMOUNT MISMATCH on Paystack webhook — needs manual review." })
        .eq("id", orderId);
      return NextResponse.json({ received: true });
    }

    await supabase.rpc("confirm_paystack_order", { p_order_id: orderId, p_reference: tx.reference });
  }

  return NextResponse.json({ received: true });
}
