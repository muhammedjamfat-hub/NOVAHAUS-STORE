"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageCircle, ShoppingBag, Minus, Plus } from "lucide-react";
import { Product, ProductVariation } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { getWhatsAppLink, buildSingleProductMessage } from "@/lib/whatsapp";

export default function ProductPurchasePanel({
  product,
  variations,
  whatsappNumber,
}: {
  product: Product;
  variations: ProductVariation[];
  whatsappNumber: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [variationId, setVariationId] = useState<string | null>(
    variations.length > 0 ? variations[0].id : null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const activeVariation = variations.find((v) => v.id === variationId) || null;
  const price = activeVariation?.price ?? product.price;
  const stock = activeVariation ? activeVariation.stock_quantity : product.stock_quantity;
  const inStock = stock > 0;
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(100 - (product.price / product.compare_at_price) * 100)
      : null;

  const image = activeVariation?.image || product.images?.[0] || null;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      variationId: activeVariation?.id || null,
      variationName: activeVariation?.variation_name || null,
      unitPrice: price,
      quantity: qty,
      image,
      maxStock: stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/checkout");
  }

  const waLink = useMemo(() => {
    const message = buildSingleProductMessage({
      productName: product.name,
      variationName: activeVariation?.variation_name,
      quantity: qty,
      price: price * qty,
    });
    return getWhatsAppLink(whatsappNumber, message);
  }, [product.name, activeVariation, qty, price, whatsappNumber]);

  return (
    <div>
      <h1 className="font-serif text-3xl">{product.name}</h1>

      <div className="flex items-center gap-2 mt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`w-4 h-4 ${
              n <= Math.round(product.rating) ? "fill-nova-gold text-nova-gold" : "text-black/20"
            }`}
          />
        ))}
        <span className="text-xs text-black/50">({product.rating.toFixed(1)})</span>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-2xl font-semibold">₦{price.toLocaleString()}</span>
        {product.compare_at_price && (
          <span className="text-black/40 line-through">₦{product.compare_at_price.toLocaleString()}</span>
        )}
        {discount && (
          <span className="text-xs bg-nova-gold text-nova-black font-semibold px-2 py-1 rounded-sm">
            -{discount}%
          </span>
        )}
      </div>

      <p className={`mt-2 text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}>
        {inStock ? `In Stock (${stock} available)` : "Out of Stock"}
      </p>

      {variations.length > 0 && (
        <div className="mt-6">
          <label className="text-sm font-medium">Variation</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {variations.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVariationId(v.id);
                  setQty(1);
                }}
                disabled={v.stock_quantity === 0}
                className={`text-sm px-4 py-2 rounded-sm border transition-colors ${
                  variationId === v.id
                    ? "bg-nova-black text-white border-nova-black"
                    : "border-black/20"
                } ${v.stock_quantity === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {v.variation_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <label className="text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 border border-black/20 rounded-sm flex items-center justify-center"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            disabled={qty >= stock}
            className="w-10 h-10 border border-black/20 rounded-sm flex items-center justify-center disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {inStock ? (
          <>
            <button onClick={handleBuyNow} className="btn-gold flex items-center justify-center gap-2">
              Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              {added ? "Added to cart ✓" : "Add to Cart"}
            </button>
          </>
        ) : (
          <button disabled className="bg-black/10 text-black/40 px-6 py-3 rounded-sm font-medium cursor-not-allowed">
            Out of Stock
          </button>
        )}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Order on WhatsApp
        </a>
      </div>

      <div className="mt-8 border-t border-black/10 pt-6 text-sm text-black/60 space-y-1">
        <p>SKU: {activeVariation?.sku || product.sku || "N/A"}</p>
        <p>Brand: {product.brand}</p>
        <p>Category: {product.category_id ? "See categories" : "Uncategorized"}</p>
      </div>
    </div>
  );
}
