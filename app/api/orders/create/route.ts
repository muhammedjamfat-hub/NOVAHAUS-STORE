import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { isValidEmail, isValidNigerianPhone } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, paymentMethod } = body;

    if (!customer?.fullName || !customer?.phone || !customer?.state || !customer?.city || !customer?.address) {
      return NextResponse.json({ error: "Please fill in all required delivery details." }, { status: 400 });
    }
    if (!isValidNigerianPhone(customer.phone)) {
      return NextResponse.json({ error: "Please enter a valid Nigerian phone number." }, { status: 400 });
    }
    if (customer.email && !isValidEmail(customer.email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    if (paymentMethod !== "bank_transfer") {
      return NextResponse.json(
        { error: "NOVAHAUS currently accepts payment by bank transfer only." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Stock is only reserved immediately for methods that don't need an
    // external payment confirmation first.
    const reserveStock = paymentMethod !== "paystack";

    const { data, error } = await supabase.rpc("create_order", {
      p_customer_name: customer.fullName,
      p_phone: customer.phone,
      p_whatsapp: customer.whatsapp || customer.phone,
      p_email: customer.email || null,
      p_state: customer.state,
      p_city: customer.city,
      p_address: customer.address,
      p_delivery_instructions: customer.deliveryInstructions || null,
      p_payment_method: paymentMethod,
      p_reserve_stock: reserveStock,
      p_items: items.map((i: any) => ({
        product_id: i.productId,
        variation_id: i.variationId || null,
        quantity: i.quantity,
      })),
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("INSUFFICIENT_STOCK")) {
        return NextResponse.json(
          { error: `Sorry, one of your items no longer has enough stock: ${msg.split(":")[1] || ""}` },
          { status: 409 }
        );
      }
      if (msg.includes("PRODUCT_UNAVAILABLE") || msg.includes("VARIATION_UNAVAILABLE")) {
        return NextResponse.json(
          { error: "One or more items in your cart are no longer available." },
          { status: 409 }
        );
      }
      console.error("create_order error", error);
      return NextResponse.json(
        { error: "We couldn't place your order. Please check your details and try again." },
        { status: 500 }
      );
    }

    // Fetch the order id (also included in the RPC result) to build a
    // private access token for the success page.
    const orderId = data.order_id;

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: data.order_number,
      subtotal: data.subtotal,
      deliveryFee: data.delivery_fee,
      total: data.total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "We couldn't place your order. Please check your details and try again." },
      { status: 500 }
    );
  }
}
