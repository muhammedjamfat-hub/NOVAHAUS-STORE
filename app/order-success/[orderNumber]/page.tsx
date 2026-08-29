"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getWhatsAppLink } from "@/lib/whatsapp";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params.orderNumber as string;
  const oid = searchParams.get("oid");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("2347041629846");

  useEffect(() => {
    import("@/lib/supabase-browser").then(({ supabaseBrowser }) => {
      supabaseBrowser()
        .from("store_settings")
        .select("whatsapp_number")
        .single()
        .then(({ data }) => {
          if (data?.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
        });
    });
    if (!oid) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/get?orderNumber=${orderNumber}&oid=${oid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
        setLoading(false);
      });
  }, [orderNumber, oid]);

  async function handleReceiptUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("receipt") as HTMLInputElement;
    if (!fileInput.files?.[0]) return;

    setUploading(true);
    setUploadMsg("");
    const fd = new FormData();
    fd.append("orderNumber", orderNumber);
    fd.append("phone", order.phone);
    fd.append("file", fileInput.files[0]);

    const res = await fetch("/api/orders/upload-receipt", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setUploadMsg(data.error || "We couldn't upload your receipt. Please try again.");
      return;
    }
    setUploadMsg(data.message);
    setOrder({ ...order, payment_status: "verification_pending" });
  }

  if (loading) return <div className="container-nova py-24 text-center text-black/50">Loading order...</div>;

  if (!order) {
    return (
      <div className="container-nova py-24 text-center">
        <h1 className="font-serif text-2xl mb-4">Order Received 🎉</h1>
        <p className="text-black/60 mb-2">Order Number: <strong>{orderNumber}</strong></p>
        <p className="text-black/50 text-sm mb-6">
          Save your order number and phone number — you can track your order any time.
        </p>
        <Link href="/track-order" className="btn-gold inline-block">
          Track My Order
        </Link>
      </div>
    );
  }

  const waLink = getWhatsAppLink(
    whatsappNumber,
    `Hello NOVAHAUS 👋 I just placed order ${order.order_number}, please confirm availability and delivery details.`
  );

  return (
    <div className="container-nova py-16 max-w-2xl">
      <h1 className="font-serif text-3xl mb-2">Order Received 🎉</h1>
      <p className="text-black/60 mb-8">Thank you, {order.customer_name}. We've received your order.</p>

      <div className="bg-nova-cream rounded-sm p-6 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>Order Number</span>
          <strong>{order.order_number}</strong>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Payment Method</span>
          <span className="capitalize">{order.payment_method.replace(/_/g, " ")}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Order Status</span>
          <span>{STATUS_LABELS[order.order_status]}</span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span>Delivery</span>
          <span>{order.city}, {order.state}</span>
        </div>

        <div className="border-t border-black/10 pt-4 space-y-2">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product_name}
                {item.variation_name ? ` (${item.variation_name})` : ""} × {item.quantity}
              </span>
              <span>₦{Number(item.total_price).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-semibold border-t border-black/10 pt-3 mt-3">
          <span>Total</span>
          <span>₦{Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      {order.payment_method === "bank_transfer" && order.payment_status === "pending" && (
        <div className="border border-black/15 rounded-sm p-6 mb-8">
          <h2 className="font-medium mb-2">Upload Payment Receipt</h2>
          <p className="text-sm text-black/60 mb-4">
            After completing your transfer, upload a screenshot or PDF of your receipt here.
          </p>
          <form onSubmit={handleReceiptUpload} className="flex flex-col gap-3">
            <input type="file" name="receipt" accept="image/*,.pdf" required className="text-sm" />
            <button type="submit" disabled={uploading} className="btn-primary w-fit">
              {uploading ? "Uploading..." : "Upload Payment Receipt"}
            </button>
          </form>
          {uploadMsg && <p className="text-sm mt-3 text-green-700">{uploadMsg}</p>}
        </div>
      )}

      {order.payment_status === "verification_pending" && (
        <div className="border border-nova-gold bg-nova-cream rounded-sm p-4 mb-8 text-sm">
          Payment receipt submitted. Your payment is being verified.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/track-order" className="btn-primary text-center">
          Track My Order
        </Link>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" /> Order on WhatsApp
        </a>
        <Link href="/shop" className="text-center underline text-sm self-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
