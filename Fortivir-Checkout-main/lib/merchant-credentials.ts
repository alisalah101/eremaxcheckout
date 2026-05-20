export const MERCHANT_KEY =
  process.env.NEXT_PUBLIC_MERCHANT_KEY || "eb515e92-a819-11f0-95c8-ae0005bd273e";

export const MERCHANT_PASS =
  process.env.NEXT_PUBLIC_MERCHANT_PASS || "9e7d01b8a2ce585c1108432aa102b489";

export function getMerchantCredentials(): {
  merchant_key: string;
  merchant_pass: string;
} {
  return { merchant_key: MERCHANT_KEY, merchant_pass: MERCHANT_PASS };
}
