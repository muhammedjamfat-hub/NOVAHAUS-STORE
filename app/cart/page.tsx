"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { getWhatsAppLink, buildCartMessage } from "@/lib/whatsapp";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const [whatsappNumber, setWhatsappNumber] = useState("2347041629846");

  useEffect(() => {
    supabaseBrowser()
      .from("store_settings")
      .select("whatsapp_number")
      .single()
      .then(({ data }) => {
        if (data?.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      });
  }, []);

  if (items.length === 0) {
    return (
      <div className="container-nova py-24 text-center">
        <p className="text-black/60 mb-6">Your cart is empty.</p>
        <Link href="/shop" className="btn-gold inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const waLink = getWhatsAppLink(whatsappNumber, buildCartMessage(items, subtotal));

  return (
    <div className="container-nova py-12">
      <h1 className="font-serif text-3xl mb-8">Your Cart</h1>

      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variationId}`}
              className="flex gap-4 border-b border-black/10 pb-6"
            >
              <div className="relative w-24 h-24 bg-nova-cream rounded-sm overflow-hidden flex-shrink-0">
                {item.image && <Image src={item.image} alt={item.productName} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/product/${item.slug}`} className="font-medium hover:text-nova-gold">
                  {item.productName}
                </Link>
                {item.variationName && <p className="text-sm text-black/50">{item.variationName}</p>}
                <p className="text-sm mt-1">₦{item.unitPrice.toLocaleString()}</p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variationId, item.quantity - 1)}
                    className="w-8 h-8 border border-black/20 rounded-sm flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variationId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="w-8 h-8 border border-black/20 rounded-sm flex items-center justify-center disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId, item.variationId)}
                    className="ml-auto text-red-500 flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-medium">
                ₦{(item.unitPrice * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}

          <Link href="/shop" className="text-sm underline text-black/60">
            ← Continue Shopping
          </Link>
        </div>

        <div className="bg-nova-cream rounded-sm p-6 h-fit">
          <h2 className="font-serif text-lg mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-black/50 mb-4">Delivery fee is calculated at checkout based on your state.</p>
          <div className="flex justify-between font-semibold border-t border-black/10 pt-3 mb-6">
            <span>Total</span>
            <span>₦{subtotal.toLocaleString()}+</span>
          </div>
          <Link href="/checkout" className="btn-gold w-full block text-center">
            Proceed to Checkout
          </Link>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full flex items-center justify-center gap-2 mt-3"
          >
            <MessageCircle className="w-4 h-4" /> Order Cart on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
