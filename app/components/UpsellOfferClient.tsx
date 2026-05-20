"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { upsellBundle, upsellBundle2 } from "../constants/bundle";

export interface UpsellOfferClientProps {
  /**
   * Where to send the customer after a successful one-click upsell charge.
   * `payment_id` for the new/chargeable transaction is always appended as a query param.
   */
  successRedirectPath: string;
  /** Optional Facebook pixel `content_name` for this step */
  pixelContentName?: string;
  /** First upsell (Eremax / upsellE333) vs second upsell ([upsellp9](https://secure.getfmtoday.com/upsellp9) Ferti Bloom) */
  variant?: "eremax" | "fertiBloom";
  /** Display price in cents; defaults from `upsellBundle` / `upsellBundle2` by variant */
  priceCents?: number;
}

interface RecurringData {
  recurring_init_trans_id: string;
  recurring_token: string;
}

const fjalla = { fontFamily: "'Fjalla One', sans-serif" };
const oswald = { fontFamily: "'Oswald', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const UPSELL_BADGE_URL =
  "https://assets.checkoutchamp.com/Funnel/assets/images/47b52b00-26e8-470a-9fc8-bee3121f4fe5/f57bf90a-2a8c-414e-b873-ebd444a6c929/1745513835-badge.png?versionId=T3vhQH3CtVj5BEbmDY_kM_HE4JnNIQ9a";

/** Navigate the top-level window (breaks out of checkout payment iframe). */
function navigateTopLevel(path: string) {
  const url = new URL(path, window.location.origin).href;
  const target = window.top ?? window;
  target.location.href = url;
}

export function UpsellLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-[#4E9510]" />
      <p className="text-sm text-neutral-600">Loading offer…</p>
    </div>
  );
}

export default function UpsellOfferClient({
  successRedirectPath,
  pixelContentName = "EREMAX",
  variant = "eremax",
  priceCents: priceCentsProp,
}: UpsellOfferClientProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, []);

  const [recurringData, setRecurringData] = useState<RecurringData | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [error, setError] = useState("");
  const purchaseTrackedRef = useRef(false);
  const [success, setSuccess] = useState("");
  const isFertiBloom = variant === "fertiBloom";
  const resolvedPriceCents =
    priceCentsProp ??
    (isFertiBloom ? upsellBundle2.price : upsellBundle.price);
  const priceFormatted = (resolvedPriceCents / 100).toFixed(2);

  const badgeSrc = isFertiBloom
    ? "/images/upsellp9-badge.png"
    : UPSELL_BADGE_URL;
  const productSrc = isFertiBloom
    ? "/images/upsellp9-product.png"
    : "/images/upsell-e333-product.webp";
  const trustSrc = isFertiBloom
    ? "/images/upsellp9-trust.webp"
    : "/images/upsell-e333-trust.webp";
  const productAlt = isFertiBloom
    ? "Ferti Bloom — upsell offer"
    : "Fortivir MAX — upsell offer";

  const fetchRecurringData = useCallback(async (paymentId: string) => {
    setIsFetchingToken(true);
    try {
      const response = await fetch("/api/get-transaction-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("GET_TRANS_STATUS failed:", data);
        return;
      }

      if (data.recurring_token) {
        setRecurringData({
          recurring_init_trans_id: data.payment_id || paymentId,
          recurring_token: data.recurring_token,
        });
        console.log("Recurring data retrieved successfully");
      } else {
        console.warn("No recurring_token in transaction status response");
        setError("Payment method not available for one-click purchase");
      }
    } catch (err) {
      console.error("Error fetching transaction status:", err);
    } finally {
      setIsFetchingToken(false);
    }
  }, []);

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    if (paymentId) {
      fetchRecurringData(paymentId);
    }
  }, [searchParams, fetchRecurringData]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Purchase", { content_name: "purchase" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const paymentId = searchParams.get("payment_id");
    if (!paymentId || purchaseTrackedRef.current) return;

    let purchaseValue = 10.0;
    const latestPackage = window.localStorage.getItem("latestPackage");
    if (latestPackage) {
      try {
        const parsed = JSON.parse(latestPackage);
        purchaseValue = Number(
          (
            (parsed.price || 0) * (parsed.quantity || 0) +
            (parsed.expeditedShipping ? 10 : 0)
          ).toFixed(2)
        );
      } catch (err) {
        console.warn("Unable to parse latestPackage for purchase value", err);
      }
    }

    let retryCount = 0;
    const maxRetries = 30;

    const trackPurchase = () => {
      if ((window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
        console.log("📊 Tracking Facebook Purchase event from upsell page:", {
          value: purchaseValue,
          currency: "USD",
          transaction_id: paymentId,
        });

        try {
          (window as unknown as { fbq: (...args: unknown[]) => void }).fbq(
            "track",
            "Purchase",
            {
              value: purchaseValue,
              currency: "USD",
              content_name: pixelContentName,
              content_type: "product",
              transaction_id: paymentId,
            }
          );
          purchaseTrackedRef.current = true;
          window.sessionStorage.setItem("purchaseTracked", paymentId);
          console.log("✅ Facebook Purchase event tracked on upsell page");
        } catch (e) {
          console.error("❌ Error tracking Purchase event on upsell page:", e);
        }
      } else if (retryCount < maxRetries) {
        retryCount += 1;
        setTimeout(trackPurchase, 100);
      } else {
        console.error(
          "❌ Facebook Pixel not available after 3 seconds on upsell page. It may be blocked by an ad blocker."
        );
      }
    };

    const alreadyTracked = window.sessionStorage.getItem("purchaseTracked");
    if (alreadyTracked === paymentId) {
      purchaseTrackedRef.current = true;
      return;
    }

    trackPurchase();
  }, [searchParams, pixelContentName]);

  const handleUpsellPurchase = async () => {
    if (!recurringData) {
      setError("Payment method not available. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/create-upsell-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recurringData,
          upsellProduct: isFertiBloom ? "fertiBloom" : "eremax",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      if (data.success) {
        setSuccess("Payment successful!");
        const nextPaymentId =
          (typeof data.payment_id === "string" && data.payment_id) ||
          recurringData.recurring_init_trans_id;
        const basePath = successRedirectPath.split("?")[0];
        const queryPrefix = successRedirectPath.includes("?")
          ? `${successRedirectPath.slice(successRedirectPath.indexOf("?"))}&`
          : "?";
        const dest = `${basePath}${queryPrefix}payment_id=${encodeURIComponent(nextPaymentId)}`;
        setTimeout(() => {
          navigateTopLevel(dest);
        }, 1500);
      } else {
        throw new Error(data.reason || "Payment was declined");
      }
    } catch (err) {
      console.error("Upsell payment error:", err);
      setError(
        err instanceof Error ? err.message : "Payment processing failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const skipUpsell = () => {
    navigateTopLevel("/thank-you");
  };

  const offerCopyEremax = (
    <>
      Others who have purchased <strong>Eremax Gummies</strong> have also had
      incredible results with{" "}
      <strong>
        <em>Fortivir MAX 3 Bottles offer!</em>
      </strong>{" "}
      Would you like to add this to your order?
    </>
  );

  const offerCopyFertiBloom = (
    <>
      Benefit from this MEGA SALE of{" "}
      <strong>
        <em>Ferti Bloom</em>
      </strong>{" "}
      before its gone. Would you like to add this to your order?
    </>
  );

  const productPitchEremax = (
    <>
      <p
        className="text-xl font-semibold tracking-tight text-[#303030] sm:text-2xl md:text-[28px] lg:text-[31px]"
        style={fjalla}
      >
        <strong>OUR #1 BEST SELLING</strong>
      </p>

      <div
        className="relative mt-2 text-4xl font-extrabold italic leading-none text-[#EA1190] sm:text-5xl md:text-6xl lg:text-[63px] [&_p]:leading-[0.95]"
        style={{ ...fjalla, transform: "rotate(-5deg)" }}
      >
        <p>INSTANT MALE</p>
        <p className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px]">
          ENHANCER!
        </p>
      </div>

      <p
        className="my-3 text-xl font-semibold italic tracking-tight text-[#303030] sm:text-2xl md:text-[26px] lg:text-[30px]"
        style={oswald}
      >
        THE MOST POWERFUL Booster pills
      </p>

      <ul
        className="my-4 space-y-2 text-base sm:text-lg md:text-xl"
        style={poppins}
      >
        <li>
          <span className="mr-1" aria-hidden>
            ⚡
          </span>
          Supports <strong>Male Vitality</strong>
        </li>
        <li>
          <span className="mr-1" aria-hidden>
            💪
          </span>
          Boosts <strong>Performance &amp; Endurance</strong>
        </li>
        <li>
          <span className="mr-1" aria-hidden>
            🌿
          </span>
          Powered by <strong>Natural Extracts</strong>
        </li>
      </ul>

      <p
        className="mb-3 text-lg font-semibold sm:text-xl md:text-2xl"
        style={poppins}
      >
        THE MOST POWERFUL MALE Booster
      </p>

      <p
        className="mb-2 text-base sm:text-lg md:text-xl lg:text-2xl"
        style={poppins}
      >
        Claim your Bottle Today ONLY
      </p>

      <p className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-[56px]">
        ${priceFormatted}/ per bottle
      </p>
    </>
  );

  const productPitchFertiBloom = (
    <>
      <p
        className="text-xl font-semibold tracking-tight text-[#303030] sm:text-2xl md:text-[28px] lg:text-[31px]"
        style={fjalla}
      >
        <strong>OUR #1 BEST SELLING</strong>
      </p>
      <div
        className="relative mt-2 text-4xl font-extrabold italic leading-none text-[#2f33a1] sm:text-5xl md:text-6xl lg:text-[63px] [&_p]:leading-[0.95]"
        style={{ ...fjalla, transform: "rotate(-5deg)" }}
      >
        <p>MEN&apos;S FERTILITY</p>
        <p className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px]">
          CAPSULES!
        </p>
      </div>
      <p
        className="my-3 text-xl font-semibold italic tracking-tight text-[#303030] sm:text-2xl md:text-[26px] lg:text-[30px]"
        style={oswald}
      >
        THE MOST POWERFUL BOOSTER CAPSULES!
      </p>
      <ul
        className="my-4 space-y-2 text-base sm:text-lg md:text-xl"
        style={poppins}
      >
        <li>
          <span className="mr-1" aria-hidden>
            ⚡
          </span>
          Levels up <strong>sperm count</strong>
        </li>
        <li>
          <span className="mr-1" aria-hidden>
            💪
          </span>
          Improves <strong>sperm mobility</strong>
        </li>
        <li>
          <span className="mr-1" aria-hidden>
            🌿
          </span>
          Powered by <strong>Natural Extracts</strong>
        </li>
      </ul>
      <p
        className="mb-4 mt-2 text-lg font-semibold sm:text-xl md:text-2xl"
        style={poppins}
      >
        THE MOST POWERFUL MALE Booster
      </p>
      <p className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-[56px]">
        ${priceFormatted}/ per bottle
      </p>
    </>
  );

  const offerCopy = isFertiBloom ? offerCopyFertiBloom : offerCopyEremax;
  const productPitch = isFertiBloom ? productPitchFertiBloom : productPitchEremax;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-12 pt-6 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <p className="font-semibold text-red-700">
            This Offer Expires When Sold Out!
          </p>
          <p className="text-3xl font-extrabold sm:text-4xl">
            Wait, your order is not complete...
          </p>
          <p className="max-w-2xl text-lg text-[#303030] sm:text-xl sm:leading-snug">
            {offerCopy}
          </p>
        </div>

        <div className="mb-8 flex w-full max-w-3xl flex-col gap-6 overflow-visible rounded-lg border-2 border-dashed border-neutral-300 p-5 sm:grid sm:grid-cols-6 sm:p-8 lg:max-w-none">
          <div className="flex flex-col items-center justify-start gap-3 sm:col-span-2 sm:items-start sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeSrc}
              alt=""
              className="mb-1 w-20 object-contain sm:w-[130px]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productSrc}
              alt={productAlt}
              className="mx-auto max-h-[280px] w-auto max-w-full object-contain sm:h-auto sm:max-h-[340px] md:max-h-[400px] lg:max-h-none"
            />
          </div>
          <div className="text-center sm:col-span-4 sm:text-left">
            {productPitch}
          </div>
        </div>

        <p
          className="mb-6 text-center text-4xl font-bold text-[#CB1313] sm:text-[48px]"
          style={oswald}
        >
          ONLY 22 LEFT!
        </p>

        <div className="flex w-full max-w-3xl flex-col items-center space-y-4">
          <button
            type="button"
            onClick={handleUpsellPurchase}
            disabled={isProcessing || isFetchingToken || !recurringData}
            className={`flex h-[70px] w-full max-w-[775px] cursor-pointer items-center justify-center rounded border px-4 py-2 font-semibold text-white transition-opacity duration-200 sm:text-xl ${
              isProcessing || isFetchingToken || !recurringData
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
            style={{
              background: "linear-gradient(to bottom, #94DE57, #4E9510)",
              borderColor: "#49900B",
            }}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-white" />
                Processing Payment...
              </span>
            ) : isFetchingToken ? (
              <span className="flex items-center">
                <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-white" />
                Loading payment method...
              </span>
            ) : (
              <span className="text-xl sm:text-2xl">Complete Checkout!</span>
            )}
          </button>

          <button
            type="button"
            onClick={skipUpsell}
            disabled={isProcessing}
            className="mx-auto w-fit text-left disabled:opacity-50"
          >
            <span className="text-[12px] text-[#8E8E8E]">
              NO, I DON&apos;T WANT TO TURBO CHARGE MY RESULTS
            </span>
          </button>

          {error && (
            <div className="mt-2 w-full max-w-xl rounded border border-red-400 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-2 w-full max-w-xl rounded border border-green-400 px-4 py-3 text-green-700">
              {success}
            </div>
          )}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mx-auto my-10 h-auto max-w-[min(100%,289px)] object-contain sm:max-w-[320px]"
          src={trustSrc}
          alt=""
        />

        <footer className="mt-2 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} My Vitae Shop. All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
