import { CartItem } from "./types";

// The WhatsApp number is read from store settings (DB) at render time by
// callers; this file only builds the message + link, so the number is never
// hardcoded in multiple components. Fallback env var is used if settings
// haven't loaded yet.
export function getWhatsAppLink(phoneNumber: string, message: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}

export function buildSingleProductMessage(params: {
  productName: string;
  variationName?: string | null;
  quantity: number;
  price: number;
  customerName?: string;
}): string {
  const { productName, variationName, quantity, price, customerName } = params;
  let msg = `Hello NOVAHAUS 👋\n\nI want to order:\n\n`;
  msg += `Product: ${productName}\n`;
  if (variationName) msg += `Variation: ${variationName}\n`;
  msg += `Quantity: ${quantity}\n`;
  msg += `Price: ₦${price.toLocaleString()}\n\n`;
  if (customerName) msg += `Customer name: ${customerName}\n\n`;
  msg += `Please confirm availability and delivery details.`;
  return msg;
}

export function buildCartMessage(items: CartItem[], total: number, customerName?: string): string {
  let msg = `Hello NOVAHAUS 👋\n\nI want to order:\n\n`;
  items.forEach((item, i) => {
    msg += `${i + 1}. ${item.productName}`;
    if (item.variationName) msg += ` (${item.variationName})`;
    msg += ` — Qty: ${item.quantity} — ₦${(item.unitPrice * item.quantity).toLocaleString()}\n`;
  });
  msg += `\nTotal: ₦${total.toLocaleString()}\n\n`;
  if (customerName) msg += `Customer name: ${customerName}\n\n`;
  msg += `Please confirm availability and delivery details.`;
  return msg;
}
