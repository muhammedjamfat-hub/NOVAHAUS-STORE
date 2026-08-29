import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock_quantity > 0;
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(100 - (product.price / product.compare_at_price) * 100)
      : null;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square bg-nova-cream overflow-hidden rounded-sm">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-nova-gold text-nova-black text-xs font-semibold px-2 py-1 rounded-sm">
            -{discount}%
          </span>
        )}
        {!inStock && (
          <span className="absolute top-2 right-2 bg-nova-black text-white text-xs font-semibold px-2 py-1 rounded-sm">
            Out of Stock
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-nova-black">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-nova-black font-semibold">₦{product.price.toLocaleString()}</span>
          {product.compare_at_price && (
            <span className="text-gray-400 text-sm line-through">
              ₦{product.compare_at_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
