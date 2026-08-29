"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenue: 0,
    products: 0,
    lowStock: 0,
  });
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function load() {
      const [{ data: orders }, { data: products }] = await Promise.all([
        supabase.from("orders").select("order_status, payment_status, total"),
        supabase.from("products").select("id, name, stock_quantity").eq("active", true),
      ]);

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o) => o.order_status === "pending").length || 0;
      const completedOrders = orders?.filter((o) => o.order_status === "delivered").length || 0;
      const revenue = orders
        ?.filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const lowStock = products?.filter((p) => p.stock_quantity <= 5) || [];

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        revenue,
        products: products?.length || 0,
        lowStock: lowStock.length,
      });
      setLowStockList(lowStock);
      setLoading(false);
    }

    load();
  }, []);

  const cards = [
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Completed Orders", value: stats.completedOrders },
    { label: "Revenue (Paid)", value: `₦${stats.revenue.toLocaleString()}` },
    { label: "Active Products", value: stats.products },
    { label: "Low Stock Products", value: stats.lowStock },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl mb-8">Overview</h1>

      {loading ? (
        <p className="text-black/50">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-sm p-5 border border-black/5">
                <p className="text-xs text-black/50">{c.label}</p>
                <p className="text-2xl font-semibold mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          {lowStockList.length > 0 && (
            <div className="bg-white rounded-sm p-5 border border-black/5">
              <h2 className="font-medium mb-3">Low Stock Products</h2>
              <ul className="text-sm space-y-2">
                {lowStockList.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-red-600">{p.stock_quantity} left</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
