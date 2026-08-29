import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");
    const orderId = req.nextUrl.searchParams.get("orderId");
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!reference || !orderId) {
      return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
    }
    if (!secretKey) {
      return NextResponse.json({ error: "Payment verification isn't configured." }, { status: 503 });
    }

    const supabase = supabaseServer();
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Already verified (e.g. webhook beat us to it) — idempotent success.
    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, order });
    }

    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const psData = await psRes.json();

    if (!psRes.ok || !psData.status) {
      return NextResponse.json({ error: "We couldn't verify this payment." }, { status: 502 });
    }

    const tx = psData.data;
    const expectedAmountKobo = Math.round(Number(order.total) * 100);

    if (tx.status !== "success") {
      await supabase
        .from("orders")
        .update({ payment_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", order.id);
      return NextResponse.json({ error: "Payment was not completed." }, { status: 402 });
    }

    if (tx.amount !== expectedAmountKobo) {
      // Amount mismatch — never trust it. Flag for manual review instead of
      // silently marking as paid.
      await supabase
        .from("orders")
        .update({
          admin_notes: "AMOUNT MISMATCH on Paystack verification — needs manual review.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      return NextResponse.json({ error: "Payment amount does not match your order." }, { status: 409 });
    }

    const { data: confirmResult, error: confirmError } = await supabase.rpc("confirm_paystack_order", {
      p_order_id: order.id,
      p_reference: reference,
    });

    if (confirmError) {
      console.error(confirmError);
      return NextResponse.json({ error: "Payment succeeded but we couldn't finalize your order. Contact support." }, { status: 500 });
    }

    const { data: updatedOrder } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order.id)
      .single();

    return NextResponse.json({ success: true, order: updatedOrder, oversold: confirmResult?.oversold });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "We couldn't verify this payment." }, { status: 500 });
  }
}
