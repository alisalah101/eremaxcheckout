"use client";

import Script from "next/script";
import { notifyMobiPaySdkReady } from "@/lib/mobipay-sdk-client";

export default function MobiPayScript() {
  return (
    <Script
      src="https://sdk.mobibox.io/mobi-pay-sdk.js"
      strategy="afterInteractive"
      onLoad={notifyMobiPaySdkReady}
      onReady={notifyMobiPaySdkReady}
    />
  );
}
