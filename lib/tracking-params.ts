/** Session keys for affiliate / tracking params from checkout URL */
export const TRACKING_CLICKID_KEY = "mobibox_clickid";
export const TRACKING_PID_KEY = "mobibox_pid";
export const S2S_SENT_KEY = "mobibox_s2s_sent";

export type CheckoutTrackingParams = {
  clickid: string | null;
  pid: string | null;
};

function readParam(params: URLSearchParams, name: string): string | null {
  const value = params.get(name);
  return value && value.trim() !== "" ? value.trim() : null;
}

/**
 * Read affiliate params from checkout URL only.
 * `clickid` must be lowercase (not MobiPay SDK `ClickId` on payment return).
 */
export function parseCheckoutTrackingFromSearch(
  search: string | URLSearchParams
): CheckoutTrackingParams {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;

  return {
    clickid: readParam(params, "clickid"),
    pid: readParam(params, "pid") || readParam(params, "PID"),
  };
}

/** Persist checkout URL `clickid` / `pid` in sessionStorage (not localStorage). */
export function saveCheckoutTrackingParams(
  search: string | URLSearchParams
): CheckoutTrackingParams {
  if (typeof window === "undefined") {
    return { clickid: null, pid: null };
  }

  const { clickid, pid } = parseCheckoutTrackingFromSearch(search);

  if (clickid) {
    sessionStorage.setItem(TRACKING_CLICKID_KEY, clickid);
  }
  if (pid) {
    sessionStorage.setItem(TRACKING_PID_KEY, pid);
  }

  return { clickid, pid };
}

export function getCheckoutTrackingParams(): CheckoutTrackingParams {
  if (typeof window === "undefined") {
    return { clickid: null, pid: null };
  }

  return {
    clickid: sessionStorage.getItem(TRACKING_CLICKID_KEY),
    pid: sessionStorage.getItem(TRACKING_PID_KEY),
  };
}

/**
 * S2S uses checkout `clickid` / `pid` from session only.
 * Ignores `ClickId` on /upsell (that is the MobiPay SDK id, not the affiliate clickid).
 */
export function resolveClickidForS2s(): CheckoutTrackingParams {
  return getCheckoutTrackingParams();
}

export function markS2sCallbackSent(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(S2S_SENT_KEY, "1");
  }
}

export function wasS2sCallbackSent(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(S2S_SENT_KEY) === "1";
}
