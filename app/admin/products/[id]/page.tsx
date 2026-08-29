"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Product } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseBrowser()
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        setProduct(data as Product);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <p className="text-black/50">Loading...</p>;
  if (!product) return <p className="text-black/50">Product not found.</p>;

  return (
    <div>
      <h1 className="font-serif text-2xl mb-8">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
