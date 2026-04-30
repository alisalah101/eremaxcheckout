
import Checkout from "./components/Checkout"
import Footer from "./components/Footer";
import Header from "./components/Header";
import ThankYou from "./thank-you/page";
declare global {
  interface Window {
    fbq: (track: string, event: string, data?: Record<string, any>) => void;
    MobiPaySDK: any;
  }
}

export default function Home() {
  return (
    <>
      <Header />
      <Checkout />
      <Footer />
    </>
  )
}

