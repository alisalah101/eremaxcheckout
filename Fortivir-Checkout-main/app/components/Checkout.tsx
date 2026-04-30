"use client";
import { useEffect } from "react";

export default function Checkout() {

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout');
    }
  }, []);

  return (
    <iframe
      src="/checkout.html"
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="Checkout"
    />
  );
}
