"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function BillingDisclosureModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = open && mounted && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-disclosure-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close billing disclosure"
        onClick={close}
      />
      <div
        className="relative z-[101] max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-200 bg-white p-6 text-left text-[#303030] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id="billing-disclosure-title"
            className="text-lg font-bold text-[#1a1a1a]"
          >
            Billing
          </h2>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-md p-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="space-y-4 text-sm leading-relaxed md:text-[15px]">
          <p>
            Your card is charged once at checkout for the displayed amount,
            including taxes and shipping.
          </p>
          <p>
            By placing your monthly recurring order of{" "}
            <strong>EREMAX 3 Get 2 Free</strong>, you will be charged{" "}
            <strong>$199.00</strong> now and every 30 days thereafter until you
            cancel your subscription. For <strong>EREMAX 2 Get 1 Free</strong>,
            you will be charged <strong>$159.00</strong> now and every 30 days
            thereafter until you cancel your subscription. For{" "}
            <strong>EREMAX 1 Get 1 Free</strong>, you will be charged{" "}
            <strong>$119.00</strong> now and every 30 days thereafter until you
            cancel your subscription. You will receive an electronic notification
            5 to 7 days prior to your transaction and receipt after each
            successful transaction.
          </p>
          <p className="pt-2 text-sm text-neutral-600">
            Contact{" "}
            <a
              href="mailto:customerservice@myvitaeshop.com"
              className="text-[#336699] underline"
            >
              customerservice@myvitaeshop.com
            </a>{" "}
            for support.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[#336699] underline hover:opacity-80"
      >
        Billing
      </button>
      {modal && createPortal(modal, document.body)}
    </>
  );
}
