import { Suspense } from "react";
import UpsellOfferClient, {
  UpsellLoadingFallback,
} from "../components/UpsellOfferClient";

export default function UpsellPage() {
  return (
    <Suspense fallback={<UpsellLoadingFallback />}>
      <UpsellOfferClient
        successRedirectPath="/upsell-2"
        pixelContentName="EREMAX_upsell1"
      />
    </Suspense>
  );
}
