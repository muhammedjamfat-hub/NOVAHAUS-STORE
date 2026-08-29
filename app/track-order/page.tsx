"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

const STEPS = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
const STEP_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    const res = await fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "We couldn't find that order.");
      return;
    }
    setOrder(data.order);
  }

  const cancelled = order?.order_status === "cancelled";
  const currentStepIndex = STEPS.indexOf(order?.order_status);

  return (
    <div className="container-nova py-16 max-w-2xl">
      <h1 className="font-serif text-3xl mb-2">Track Your Order</h1>
      <p className="text-black/60 mb-8">Enter your order number and the phone number used at checkout.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input
          required
          placeholder="Order number (e.g. NH-2026-00001)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="border border-black/15 rounded-sm p-3 text-sm flex-1"
        />
        <input
          required
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-black/15 rounded-sm p-3 text-sm flex-1"
        />
        <button type="submit" disabled={loading} className="btn-gold whitespace-nowrap">
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-8">{error}</p>}

      {order && (
        <div>
          {cancelled ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-sm p-4 mb-8 text-sm">
              This order has been cancelled.
            </div>
          ) : (
            <div className="flex justify-between mb-10 overflow-x-auto">
              {STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center flex-1 min-w-[80px]">
                  {i <= currentStepIndex ? (
                    <CheckCircle2 className="w-6 h-6 text-nova-gold" />
                  ) : (
                    <Circle className="w-6 h-6 text-black/20" />
                  )}
                  <span className="text-[11px] text-center mt-2 text-black/60">{STEP_LABELS[step]}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-nova-cream rounded-sm p-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Order Number</span>
              <strong>{order.order_number}</strong>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Status</span>
              <span className="capitalize">{order.payment_status.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span>Delivery Address</span>
              <span className="text-right">{order.address}, {order.city}, {order.state}</span>
            </div>
            <div className="border-t border-black/10 pt-4 space-y-2">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product_name}
                    {item.variation_name ? ` (${item.variation_name})` : ""} × {item.quantity}
                  </span>
                  <span>₦{Number(item.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold border-t border-black/10 pt-3 mt-3">
              <span>Total</span>
              <span>₦{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
