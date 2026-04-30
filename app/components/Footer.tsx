import React from "react";
import { Montserrat } from "next/font/google";
import { Star } from "lucide-react";
import Card from "./Card";
import { BillingDisclosureModal } from "./BillingDisclosureModal";
import { testimonials } from "../constants/testimonials";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const Footer = () => {
  return (
    <footer
      className={`w-full overflow-x-hidden bg-white ${montserrat.className}`}
    >
      {/* More Trusted Customer Reviews section */}
      <div className="bg-[#EAE4DA] h-[100px] my-10 flex items-center justify-center text-3xl md:text-4xl font-semibold px-4">
        <h3 className="text-center">More Trusted Customer Reviews</h3>
      </div>
      <div className="columns-[300px] sm:space-y-4 max-w-[1300px] mx-auto pb-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="break-inside-avoid">
            <Card
              key={`${testimonial.name}-${index}`}
              name={testimonial.name}
              url={testimonial.url}
              text={testimonial.text}
            />
          </div>
        ))}
      </div>

      {/* Rating row */}
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 py-4 px-4 text-[#333] text-sm md:text-base">
        {[0, 1, 2, 3, 4].map((s) => (
          <Star
            key={s}
            className="w-4 h-4 md:w-[15px] md:h-[15px] fill-amber-400 text-amber-400 shrink-0"
            aria-hidden
          />
        ))}
        <strong className="font-bold ml-1">9.7/10</strong>
        <span className="ml-1">based on 23,812 reviews</span>
      </div>

      {/* Footer bar — My Vitae Shop */}
      <div className="border-t border-neutral-200 bg-[#fafafa] py-8 md:py-10 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/eremax-logo.png"
            alt="EREMAX"
            width={150}
            height={150}
            className="w-[120px] md:w-[150px] h-auto"
          />

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:text-[15px]">
            <a
              href="#"
              className="text-[#336699] underline hover:opacity-80"
            >
              Terms &amp; Conditions
            </a>
            <a
              href="#"
              className="text-[#336699] underline hover:opacity-80"
            >
              Privacy Policy
            </a>
            <BillingDisclosureModal />
          </nav>

          <div className="space-y-2 text-[#333]">
            <p className="text-sm md:text-base">
              © 2026 / My Vitae Shop / All rights reserved.
            </p>
            <h3 className="text-base md:text-lg font-semibold">
              customerservice@myvitaeshop.com
            </h3>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
