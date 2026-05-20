"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { upsellBundle, upsellBundle2 } from "../constants/bundle";
import {
  markS2sCallbackSent,
  resolveClickidForS2s,
  wasS2sCallbackSent,
} from "@/lib/tracking-params";

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
  /** Retries for `/api/get-transaction-status` on first upsell */
  statusFetchRetries?: number;
  /**
   * `stored-first`: use session recurring token immediately (upsell 2).
   * Optional single refresh uses `recurring_init_trans_id`, not URL `payment_id`.
   */
  recurringLoadMode?: "default" | "stored-first";
  /** Try `/api/one-click-payment` (Primer) if Mobibox recurring charge fails */
  enablePrimerOneClickFallback?: boolean;
  /** First upsell only: POST Mobibox S2S callback using checkout `clickid` + `pid` */
  enableS2sCallback?: boolean;
}

const MOBIBOX_RECURRING_STORAGE_KEY = "mobiboxRecurringContext";

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
  statusFetchRetries = 1,
  enablePrimerOneClickFallback = false,
  enableS2sCallback = false,
  recurringLoadMode = "default",
}: UpsellOfferClientProps) {
  const searchParams = useSearchParams();
  const paymentIdParam = searchParams.get("payment_id") ?? "";
  const s2sCallbackSentRef = useRef(false);
  const recurringLoadStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.top && window.top !== window.self) {
      window.top.location.replace(window.location.href);
      return;
    }

    if (!enableS2sCallback || s2sCallbackSentRef.current || wasS2sCallbackSent()) {
      return;
    }

    const { clickid, pid } = resolveClickidForS2s(window.location.search);

    if (!clickid) {
      console.warn("Mobibox S2S skipped: no clickid in URL or session", {
        search: window.location.search,
      });
      return;
    }

    s2sCallbackSentRef.current = true;

    fetch("/api/mobibox-s2s-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clickid,
        pid: pid ?? "",
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Mobibox S2S callback error:", data);
          s2sCallbackSentRef.current = false;
          return;
        }
        markS2sCallbackSent();
        console.log("Mobibox S2S callback sent:", { clickid, pid });
      })
      .catch((err) => {
        console.error("Mobibox S2S callback request failed:", err);
        s2sCallbackSentRef.current = false;
      });
  }, [enableS2sCallback, paymentIdParam]);

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

  const persistRecurringContext = useCallback((data: RecurringData) => {
    try {
      sessionStorage.setItem(
        MOBIBOX_RECURRING_STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const loadStoredRecurringContext = useCallback((): RecurringData | null => {
    try {
      const raw = sessionStorage.getItem(MOBIBOX_RECURRING_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RecurringData;
      if (parsed?.recurring_init_trans_id && parsed?.recurring_token) {
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  const fetchRecurringData = useCallback(
    async (
      paymentId: string,
      options?: { silent?: boolean }
    ): Promise<boolean> => {
      if (!options?.silent) {
        setIsFetchingToken(true);
        setError("");
      }
      try {
        const response = await fetch("/api/get-transaction-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: paymentId }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("GET_TRANS_STATUS failed:", data);
          return false;
        }

        if (data.recurring_token) {
          const recurring: RecurringData = {
            recurring_init_trans_id: data.payment_id || paymentId,
            recurring_token: data.recurring_token,
          };
          setRecurringData(recurring);
          persistRecurringContext(recurring);
          console.log("Recurring data retrieved successfully");
          return true;
        }

        console.warn("No recurring_token in transaction status response");
        return false;
      } catch (err) {
        console.error("Error fetching transaction status:", err);
        return false;
      } finally {
        if (!options?.silent) {
          setIsFetchingToken(false);
        }
      }
    },
    [persistRecurringContext]
  );

  const fetchRecurringDataWithRetries = useCallback(
    async (paymentId: string) => {
      const attempts = Math.max(1, statusFetchRetries);
      for (let i = 0; i < attempts; i++) {
        const ok = await fetchRecurringData(paymentId);
        if (ok) return;
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        }
      }

      const stored = loadStoredRecurringContext();
      if (stored) {
        setRecurringData(stored);
        console.log("Using stored recurring context for one-click upsell");
        return;
      }

      setError("Payment method not available for one-click purchase");
    },
    [
      fetchRecurringData,
      statusFetchRetries,
      loadStoredRecurringContext,
    ]
  );

  const loadRecurringForPage = useCallback(async () => {
    if (recurringLoadMode === "stored-first") {
      const stored = loadStoredRecurringContext();
      if (stored) {
        setRecurringData(stored);
        void fetchRecurringData(stored.recurring_init_trans_id, {
          silent: true,
        });
        return;
      }

      if (paymentIdParam) {
        await fetchRecurringData(paymentIdParam);
        return;
      }

      setError("Payment method not available for one-click purchase");
      return;
    }

    if (paymentIdParam) {
      await fetchRecurringDataWithRetries(paymentIdParam);
      return;
    }

    const stored = loadStoredRecurringContext();
    if (stored) {
      setRecurringData(stored);
    }
  }, [
    recurringLoadMode,
    paymentIdParam,
    loadStoredRecurringContext,
    fetchRecurringData,
    fetchRecurringDataWithRetries,
  ]);

  useEffect(() => {
    if (recurringLoadStartedRef.current) return;
    recurringLoadStartedRef.current = true;
    loadRecurringForPage();
  }, [loadRecurringForPage]);

  const chargeMobiboxOneClick = useCallback(async () => {
    if (!recurringData) {
      throw new Error("Payment method not available. Please try again.");
    }

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
    if (!data.success) {
      throw new Error(data.reason || "Payment was declined");
    }
    return data;
  }, [recurringData, isFertiBloom]);

  const chargePrimerOneClick = useCallback(
    async (paymentId: string) => {
      const vaultRes = await fetch("/api/vault-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const vaultData = await vaultRes.json();
      if (!vaultRes.ok) {
        throw new Error(vaultData.error || "Could not load vaulted payment method");
      }

      const paymentMethodToken =
        vaultData?.paymentMethod?.paymentMethodToken ||
        vaultData?.paymentMethod?.token ||
        vaultData?.paymentMethodToken ||
        vaultData?.vaultedPaymentMethodId;

      if (!paymentMethodToken) {
        throw new Error("No vaulted payment method for one-click charge");
      }

      const amount = resolvedPriceCents;
      const response = await fetch("/api/one-click-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodToken,
          amount,
          currency: "USD",
          orderId: `upsell-${Date.now()}`,
          customerId: vaultData?.customerId || vaultData?.customer?.id,
          description: isFertiBloom
            ? "Ferti Bloom upsell"
            : "Fortivir MAX Upsell",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "One-click payment failed");
      }
      return data;
    },
    [isFertiBloom, resolvedPriceCents]
  );

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
      if (recurringLoadMode === "stored-first") {
        const stored = loadStoredRecurringContext();
        if (stored) {
          setRecurringData(stored);
        } else if (paymentIdParam) {
          await fetchRecurringData(paymentIdParam);
        }
      } else if (paymentIdParam) {
        await fetchRecurringDataWithRetries(paymentIdParam);
      }
    }
    if (!recurringData) {
      setError("Payment method not available. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      let nextPaymentId = recurringData.recurring_init_trans_id;

      try {
        const mobiboxResult = await chargeMobiboxOneClick();
        nextPaymentId =
          (typeof mobiboxResult.payment_id === "string" &&
            mobiboxResult.payment_id) ||
          nextPaymentId;
      } catch (mobiboxErr) {
        if (!enablePrimerOneClickFallback || !paymentIdParam) {
          throw mobiboxErr;
        }
        console.warn("Mobibox one-click failed, trying Primer:", mobiboxErr);
        const primerResult = await chargePrimerOneClick(paymentIdParam);
        nextPaymentId = primerResult.paymentId || nextPaymentId;
      }

      setSuccess("Payment successful!");
      const basePath = successRedirectPath.split("?")[0];
      const queryPrefix = successRedirectPath.includes("?")
        ? `${successRedirectPath.slice(successRedirectPath.indexOf("?"))}&`
        : "?";
      const dest = `${basePath}${queryPrefix}payment_id=${encodeURIComponent(nextPaymentId)}`;
      setTimeout(() => {
        navigateTopLevel(dest);
      }, 1500);
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
