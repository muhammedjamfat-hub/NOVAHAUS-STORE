"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Category, Product, ProductVariation } from "@/lib/types";
import { Trash2, Plus, X } from "lucide-react";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product;

  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<Partial<ProductVariation>[]>([]);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    category_id: product?.category_id || "",
    sku: product?.sku || "",
    stock_quantity: product?.stock_quantity?.toString() || "0",
    featured: product?.featured || false,
    bestseller: product?.bestseller || false,
    new_arrival: product?.new_arrival || false,
    active: product?.active ?? true,
  });

  useEffect(() => {
    supabaseBrowser()
      .from("categories")
      .select("*")
      .then(({ data }) => setCategories((data as Category[]) || []));

    if (isEdit) {
      supabaseBrowser()
        .from("product_variations")
        .select("*")
        .eq("product_id", product!.id)
        .then(({ data }) => setVariations((data as ProductVariation[]) || []));
    }
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = supabaseBrowser();
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  function addVariation() {
    setVariations((v) => [...v, { variation_name: "", sku: "", price: null, stock_quantity: 0, image: null }]);
  }

  function updateVariation(index: number, patch: Partial<ProductVariation>) {
    setVariations((v) => v.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeVariation(index: number) {
    setVariations((v) => v.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.price || !form.category_id) {
      setError("Name, price, and category are required.");
      return;
    }

    setSaving(true);
    const supabase = supabaseBrowser();
    const slug = form.slug ? slugify(form.slug) : slugify(form.name);

    const payload = {
      name: form.name,
      slug,
      description: form.description || null,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      category_id: form.category_id,
      sku: form.sku || null,
      stock_quantity: Number(form.stock_quantity) || 0,
      images,
      featured: form.featured,
      bestseller: form.bestseller,
      new_arrival: form.new_arrival,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    let productId = product?.id;

    if (isEdit) {
      const { error: updateError } = await supabase.from("products").update(payload).eq("id", product!.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase.from("products").insert(payload).select().single();
      if (insertError || !data) {
        setError(insertError?.message || "Failed to create product.");
        setSaving(false);
        return;
      }
      productId = data.id;
    }

    // Sync variations: delete removed ones, upsert the rest
    if (isEdit) {
      const { data: existing } = await supabase.from("product_variations").select("id").eq("product_id", productId);
      const keptIds = variations.filter((v) => v.id).map((v) => v.id);
      const toDelete = (existing || []).filter((e) => !keptIds.includes(e.id)).map((e) => e.id);
      if (toDelete.length > 0) {
        await supabase.from("product_variations").delete().in("id", toDelete);
      }
    }

    for (const v of variations) {
      if (!v.variation_name) continue;
      const vPayload = {
        product_id: productId,
        variation_name: v.variation_name,
        sku: v.sku || null,
        price: v.price ? Number(v.price) : null,
        stock_quantity: Number(v.stock_quantity) || 0,
        image: v.image || null,
      };
      if (v.id) {
        await supabase.from("product_variations").update(vPayload).eq("id", v.id);
      } else {
        await supabase.from("product_variations").insert(vPayload);
      }
    }

    setSaving(false);
    router.push("/admin/products");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-sm">{error}</p>}

      <div className="bg-white rounded-sm border border-black/5 p-6 space-y-4">
        <h2 className="font-medium">Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          />
          <input
            placeholder="Slug (auto-generated if empty)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          />
        </div>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="border border-black/15 rounded-sm p-3 text-sm w-full"
        />
        <div className="grid sm:grid-cols-3 gap-4">
          <input
            required
            type="number"
            placeholder="Price (₦)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          />
          <input
            type="number"
            placeholder="Compare-at price (optional)"
            value={form.compare_at_price}
            onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          />
          <input
            type="number"
            placeholder="Stock quantity"
            value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <select
            required
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="border border-black/15 rounded-sm p-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-6 text-sm pt-2">
          {(["featured", "bestseller", "new_arrival", "active"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {key === "new_arrival" ? "New Arrival" : key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-sm border border-black/5 p-6">
        <h2 className="font-medium mb-4">Product Images</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-sm overflow-hidden border border-black/10">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0 right-0 bg-black/70 text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="text-sm" />
        {uploading && <p className="text-xs text-black/50 mt-2">Uploading...</p>}
      </div>

      <div className="bg-white rounded-sm border border-black/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Variations (optional)</h2>
          <button type="button" onClick={addVariation} className="text-sm flex items-center gap-1 text-nova-gold">
            <Plus className="w-4 h-4" /> Add Variation
          </button>
        </div>
        <div className="space-y-3">
          {variations.map((v, i) => (
            <div key={i} className="grid sm:grid-cols-5 gap-2 items-center border-b border-black/5 pb-3">
              <input
                placeholder="e.g. Black / Leather"
                value={v.variation_name || ""}
                onChange={(e) => updateVariation(i, { variation_name: e.target.value })}
                className="border border-black/15 rounded-sm p-2 text-sm sm:col-span-2"
              />
              <input
                placeholder="SKU"
                value={v.sku || ""}
                onChange={(e) => updateVariation(i, { sku: e.target.value })}
                className="border border-black/15 rounded-sm p-2 text-sm"
              />
              <input
                type="number"
                placeholder="Price override"
                value={v.price ?? ""}
                onChange={(e) => updateVariation(i, { price: e.target.value ? Number(e.target.value) : null })}
                className="border border-black/15 rounded-sm p-2 text-sm"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock_quantity ?? 0}
                  onChange={(e) => updateVariation(i, { stock_quantity: Number(e.target.value) })}
                  className="border border-black/15 rounded-sm p-2 text-sm w-full"
                />
                <button type="button" onClick={() => removeVariation(i)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {variations.length === 0 && (
            <p className="text-xs text-black/40">No variations — customers will buy the main product directly.</p>
          )}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
