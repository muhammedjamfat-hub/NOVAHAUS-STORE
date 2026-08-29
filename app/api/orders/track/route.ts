import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { normalizePhone } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, phone } = await req.json();

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: "Enter your order number and phone number." }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber.trim().toUpperCase())
      .single();

    // Deliberately generic message either way — do not reveal whether the
    // order number exists if the phone doesn't match, so numbers can't be
    // brute-forced to confirm which ones are real.
    if (error || !order) {
      return NextResponse.json(
        { error: "We couldn't find an order matching those details." },
        { status: 404 }
      );
    }

    const providedDigits = normalizePhone(phone);
    const storedDigits = normalizePhone(order.phone);
    const storedWhatsapp = order.whatsapp ? normalizePhone(order.whatsapp) : null;

    if (providedDigits !== storedDigits && providedDigits !== storedWhatsapp) {
      return NextResponse.json(
        { error: "We couldn't find an order matching those details." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
