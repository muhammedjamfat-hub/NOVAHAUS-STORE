"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "verification_pending", "paid", "failed", "rejected"];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const { data } = await supabaseBrowser()
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", params.id)
      .single();
    setOrder(data);
    setNotes(data?.admin_notes || "");
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function updateField(field: string, value: string) {
    setSaving(true);
    await supabaseBrowser()
      .from("orders")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    await load();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function saveNotes() {
    setSaving(true);
    await supabaseBrowser()
      .from("orders")
      .update({ admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!order) return <p className="text-black/50">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push("/admin/orders")} className="text-sm text-black/50 mb-4">
        ← Back to Orders
      </button>
      <h1 className="font-serif text-2xl mb-6">{order.order_number}</h1>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-sm border border-black/5 p-5">
          <h2 className="font-medium mb-3">Customer</h2>
          <p className="text-sm">{order.customer_name}</p>
          <p className="text-sm">{order.phone}</p>
          {order.whatsapp && <p className="text-sm">WhatsApp: {order.whatsapp}</p>}
          {order.email && <p className="text-sm">{order.email}</p>}
          <p className="text-sm mt-2">{order.address}, {order.city}, {order.state}</p>
          {order.delivery_instructions && (
            <p className="text-sm text-black/50 mt-1">Note: {order.delivery_instructions}</p>
          )}
        </div>

        <div className="bg-white rounded-sm border border-black/5 p-5">
          <h2 className="font-medium mb-3">Update Status</h2>
          <label className="text-xs text-black/50">Order Status</label>
          <select
            value={order.order_status}
            onChange={(e) => updateField("order_status", e.target.value)}
            className="border border-black/15 rounded-sm p-2 text-sm w-full mt-1 mb-3 capitalize"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <label className="text-xs text-black/50">Payment Status</label>
          <select
            value={order.payment_status}
            onChange={(e) => updateField("payment_status", e.target.value)}
            className="border border-black/15 rounded-sm p-2 text-sm w-full mt-1 capitalize"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {saved && <p className="text-green-700 text-xs mt-2">Saved ✓</p>}
        </div>
      </div>

      <div className="bg-white rounded-sm border border-black/5 p-5 mb-8">
        <h2 className="font-medium mb-3">Items</h2>
        <div className="space-y-2">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product_name}
                {item.variation_name ? ` (${item.variation_name})` : ""} × {item.quantity}
              </span>
              <span>₦{Number(item.total_price).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-black/10 mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>₦{Number(order.subtotal).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Delivery Fee</span><span>₦{Number(order.delivery_fee).toLocaleString()}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>₦{Number(order.total).toLocaleString()}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-black/5 p-5">
        <h2 className="font-medium mb-3">Internal Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border border-black/15 rounded-sm p-3 text-sm w-full"
        />
        <button onClick={saveNotes} disabled={saving} className="btn-primary mt-3 text-sm">
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
