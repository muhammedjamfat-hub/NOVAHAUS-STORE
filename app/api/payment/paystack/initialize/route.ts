import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderNumber } = await req.json();
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "Online payment isn't configured yet. Please choose Bank Transfer or Pay on Delivery, or contact us on WhatsApp.",
        },
        { status: 503 }
      );
    }

    const supabase = supabaseServer();
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("order_number", orderNumber)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.payment_method !== "paystack") {
      return NextResponse.json({ error: "This order isn't set up for online payment." }, { status: 400 });
    }
    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "This order has already been paid for." }, { status: 400 });
    }

    // Amount comes from the trusted order row in our own database — never
    // from the browser — and Paystack expects kobo (₦1 = 100 kobo).
    const amountKobo = Math.round(Number(order.total) * 100);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: order.email || "guest@novahaus.store",
        amount: amountKobo,
        reference: `${order.order_number}-${Date.now()}`,
        callback_url: `${appUrl}/payment/callback?orderId=${order.id}&orderNumber=${order.order_number}`,
        metadata: { order_id: order.id, order_number: order.order_number },
      }),
    });

    const psData = await psRes.json();

    if (!psRes.ok || !psData.status) {
      console.error("Paystack init failed", psData);
      return NextResponse.json(
        { error: "We couldn't start your payment. Please try another payment method." },
        { status: 502 }
      );
    }

    await supabase
      .from("orders")
      .update({ paystack_reference: psData.data.reference })
      .eq("id", order.id);

    return NextResponse.json({ authorizationUrl: psData.data.authorization_url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "We couldn't start your payment. Please try again." }, { status: 500 });
  }
}
