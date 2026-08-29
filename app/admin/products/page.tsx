"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Product } from "@/lib/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabaseBrowser().from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p: Product) {
    await supabaseBrowser().from("products").update({ active: !p.active }).eq("id", p.id);
    load();
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await supabaseBrowser().from("products").delete().eq("id", p.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl">Products</h1>
        <Link href="/admin/products/new" className="btn-gold flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-black/50">Loading...</p>
      ) : (
        <div className="bg-white rounded-sm border border-black/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-nova-cream text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tags</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-black/5">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">₦{p.price.toLocaleString()}</td>
                  <td className={`p-3 ${p.stock_quantity <= 5 ? "text-red-600" : ""}`}>{p.stock_quantity}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-xs px-2 py-1 rounded-sm ${
                        p.active ? "bg-green-100 text-green-700" : "bg-black/10 text-black/50"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 text-xs text-black/50">
                    {[p.featured && "Featured", p.bestseller && "Bestseller", p.new_arrival && "New"]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/admin/products/${p.id}`} className="text-black/60 hover:text-nova-gold">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteProduct(p)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-black/40">
                    No products yet.
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
