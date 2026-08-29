import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { normalizePhone } from "@/lib/validation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const orderNumber = String(formData.get("orderNumber") || "").trim().toUpperCase();
    const phone = String(formData.get("phone") || "");
    const file = formData.get("file") as File | null;

    if (!orderNumber || !phone || !file) {
      return NextResponse.json({ error: "Order number, phone, and receipt file are required." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP, or PDF file." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File is too large. Max size is 8MB." }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Ownership check — same rule as order tracking: order number + matching phone.
    const { data: order } = await supabase.from("orders").select("*").eq("order_number", orderNumber).single();

    if (!order) {
      return NextResponse.json({ error: "We couldn't find an order matching those details." }, { status: 404 });
    }
    const providedDigits = normalizePhone(phone);
    if (providedDigits !== normalizePhone(order.phone) && providedDigits !== normalizePhone(order.whatsapp || "")) {
      return NextResponse.json({ error: "We couldn't find an order matching those details." }, { status: 404 });
    }
    if (order.payment_method !== "bank_transfer") {
      return NextResponse.json({ error: "This order is not set up for bank transfer payment." }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const path = `${order.order_number}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ error: "We couldn't upload your receipt. Please try again." }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ receipt_url: path, payment_status: "verification_pending", updated_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "We couldn't save your receipt. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment receipt submitted. Your payment is being verified.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
