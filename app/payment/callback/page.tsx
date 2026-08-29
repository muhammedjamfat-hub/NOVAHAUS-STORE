"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "failed">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");

    if (!reference || !orderId || !orderNumber) {
      setStatus("failed");
      setMessage("Missing payment reference.");
      return;
    }

    fetch(`/api/payment/paystack/verify?reference=${encodeURIComponent(reference)}&orderId=${orderId}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success) {
          router.replace(`/order-success/${orderNumber}?oid=${orderId}`);
        } else {
          setStatus("failed");
          setMessage(data.error || "Payment was not completed.");
        }
      });
  }, [searchParams, router]);

  if (status === "verifying") {
    return <div className="container-nova py-24 text-center text-black/60">Verifying your payment...</div>;
  }

  return (
    <div className="container-nova py-24 text-center max-w-md mx-auto">
      <h1 className="font-serif text-2xl mb-4">Payment Not Completed</h1>
      <p className="text-black/60 mb-8">{message}</p>
      <Link href="/checkout" className="btn-gold inline-block">
        Try Again
      </Link>
    </div>
  );
}
