import { Suspense } from "react";
import UpsellOfferClient, {
  UpsellLoadingFallback,
} from "../components/UpsellOfferClient";

export default function Upsell2Page() {
  return (
    <Suspense fallback={<UpsellLoadingFallback />}>
      <UpsellOfferClient
        successRedirectPath="/thank-you"
        pixelContentName="EREMAX_upsell2"
        variant="fertiBloom"
      />
    </Suspense>
  );
}
