"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    supabaseBrowser()
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = filter ? orders.filter((o) => o.order_status === filter) : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-black/15 rounded-sm p-2 text-sm"
        >
          <option value="">All Statuses</option>
          {["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"].map(
            (s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            )
          )}
        </select>
      </div>

      {loading ? (
        <p className="text-black/50">Loading...</p>
      ) : (
        <div className="bg-white rounded-sm border border-black/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-nova-cream text-left">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-black/5">
                  <td className="p-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-nova-gold underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.phone}</td>
                  <td className="p-3">₦{Number(o.total).toLocaleString()}</td>
                  <td className="p-3 capitalize">{o.payment_status.replace(/_/g, " ")}</td>
                  <td className="p-3 capitalize">{o.order_status.replace(/_/g, " ")}</td>
                  <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-black/40">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
