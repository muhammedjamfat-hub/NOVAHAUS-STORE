"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@/lib/types";
import { useState } from "react";
import { Search } from "lucide-react";

export default function ShopFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between border-b border-black/10 pb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", q || null);
        }}
        className="relative w-full md:w-72"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search watches..."
          className="w-full border border-black/15 rounded-sm py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-nova-gold"
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-black/40" />
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParam("category", null)}
          className={`text-xs px-3 py-2 rounded-sm border ${
            !searchParams.get("category") ? "bg-nova-black text-white" : "border-black/15"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => updateParam("category", c.slug)}
            className={`text-xs px-3 py-2 rounded-sm border ${
              searchParams.get("category") === c.slug ? "bg-nova-black text-white" : "border-black/15"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          placeholder="Min ₦"
          defaultValue={searchParams.get("minPrice") || ""}
          onBlur={(e) => updateParam("minPrice", e.target.value || null)}
          className="w-24 border border-black/15 rounded-sm py-2.5 px-2 text-sm focus:outline-none focus:border-nova-gold"
        />
        <span className="text-black/30 text-sm">–</span>
        <input
          type="number"
          placeholder="Max ₦"
          defaultValue={searchParams.get("maxPrice") || ""}
          onBlur={(e) => updateParam("maxPrice", e.target.value || null)}
          className="w-24 border border-black/15 rounded-sm py-2.5 px-2 text-sm focus:outline-none focus:border-nova-gold"
        />
      </div>

      <select
        value={searchParams.get("sort") || ""}
        onChange={(e) => updateParam("sort", e.target.value || null)}
        className="border border-black/15 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-nova-gold"
      >
        <option value="">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="bestselling">Best Selling</option>
      </select>
    </div>
  );
}
