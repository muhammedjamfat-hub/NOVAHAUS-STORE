"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabaseBrowser()
      .from("orders")
      .select("*")
      .eq("payment_method", "bank_transfer")
      .not("receipt_url", "is", null)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function viewReceipt(order: any) {
    if (receiptUrls[order.id]) return;
    const res = await fetch(`/api/admin/receipt-url?path=${encodeURIComponent(order.receipt_url)}`);
    const data = await res.json();
    if (data.url) setReceiptUrls((prev) => ({ ...prev, [order.id]: data.url }));
  }

  async function confirmPayment(order: any) {
    await supabaseBrowser()
      .from("orders")
      .update({ payment_status: "paid", order_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    load();
  }

  async function rejectPayment(order: any) {
    await supabaseBrowser()
      .from("orders")
      .update({ payment_status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    load();
  }

  return (
    <div>
      <h1 className="font-serif text-2xl mb-2">Payment Verification</h1>
      <p className="text-black/50 text-sm mb-8">
        Bank transfer orders with a receipt awaiting confirmation. A receipt upload never marks an order as
        paid automatically — confirm or reject manually below.
      </p>

      {loading ? (
        <p className="text-black/50">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-black/40">No receipts to review.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-sm border border-black/5 p-5 grid sm:grid-cols-5 gap-4 items-center">
              <div>
                <p className="font-medium">{o.order_number}</p>
                <p className="text-xs text-black/50">{o.customer_name}</p>
              </div>
              <div className="text-sm">{o.phone}</div>
              <div className="text-sm font-medium">₦{Number(o.total).toLocaleString()}</div>
              <div>
                <button onClick={() => viewReceipt(o)} className="text-nova-gold underline text-sm">
                  {receiptUrls[o.id] ? "Receipt loaded" : "View Receipt"}
                </button>
                {receiptUrls[o.id] && (
                  <a href={receiptUrls[o.id]} target="_blank" rel="noopener noreferrer" className="block text-xs text-black/50 mt-1">
                    Open in new tab
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                {o.payment_status === "verification_pending" ? (
                  <>
                    <button onClick={() => confirmPayment(o)} className="text-xs bg-green-600 text-white px-3 py-2 rounded-sm">
                      Confirm
                    </button>
                    <button onClick={() => rejectPayment(o)} className="text-xs bg-red-600 text-white px-3 py-2 rounded-sm">
                      Reject
                    </button>
                  </>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-sm capitalize ${
                    o.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {o.payment_status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
