export type MobiPaySDKInstance = {
  clickId: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  createSession: (payload: unknown) => Promise<{ redirect_url?: string }>;
};

export type MobiPaySDKConstructor = new (config: {
  debug?: boolean;
  retries?: number;
  retryDelay?: number;
}) => MobiPaySDKInstance;

const MOBIPAY_READY_EVENT = "mobipay-sdk-ready";

export function notifyMobiPaySdkReady() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOBIPAY_READY_EVENT));
  }
}

export function waitForMobiPaySDK(timeoutMs = 15000): Promise<MobiPaySDKConstructor> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("MobiPay SDK is only available in the browser"));
      return;
    }

    const getCtor = () =>
      (window as Window & { MobiPaySDK?: MobiPaySDKConstructor }).MobiPaySDK;

    if (getCtor()) {
      resolve(getCtor()!);
      return;
    }

    const deadline = Date.now() + timeoutMs;

    const onReady = () => {
      const ctor = getCtor();
      if (ctor) {
        cleanup();
        resolve(ctor);
      }
    };

    const interval = window.setInterval(() => {
      if (getCtor()) {
        cleanup();
        resolve(getCtor()!);
        return;
      }
      if (Date.now() >= deadline) {
        cleanup();
        reject(
          new Error(
            "MobiPay SDK script did not load. Check network access to sdk.mobibox.io."
          )
        );
      }
    }, 100);

    window.addEventListener(MOBIPAY_READY_EVENT, onReady);

    function cleanup() {
      window.clearInterval(interval);
      window.removeEventListener(MOBIPAY_READY_EVENT, onReady);
    }
  });
}

export async function createInitializedMobiPaySDK(
  config: { debug?: boolean; retries?: number; retryDelay?: number } = {}
): Promise<MobiPaySDKInstance> {
  const MobiPaySDK = await waitForMobiPaySDK();
  const sdk = new MobiPaySDK({
    debug: config.debug ?? true,
    retries: config.retries ?? 3,
    retryDelay: config.retryDelay ?? 500,
  });
  await sdk.init();
  if (!sdk.clickId) {
    throw new Error("MobiPay SDK init completed without a ClickId");
  }
  return sdk;
}
