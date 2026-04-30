"use client";
import { useEffect, useState, useRef } from "react";
import { Clock, Globe } from "lucide-react";
import { bundles } from "../constants/bundle";

type PackageFormProps = {
  data: {
    selectedBundleId: number;
    expeditedShipping: boolean;
    price: number;
    quantity: number;
  };
  updateFields: (fields: any) => void;
};

export default function PackageForm({ data, updateFields }: PackageFormProps) {
  const [timeLeft, setTimeLeft] = useState(10 * 60); 


  useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => Math.max(prev - 1, 0));
  }, 1000);
  return () => clearInterval(timer);
}, []);

  const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};
  // Update price/quantity when bundle changes
  useEffect(() => {
    const selected = bundles.find((b) => b.id === data.selectedBundleId);
    if (selected) {
      updateFields({
        price: selected.price,
        quantity: selected.quantity,
      });
    }
  }, [data.selectedBundleId]);

  return (
    <div className="rounded-lg  shadow-lg min-w[400px] ">
      {/* Free Shipping Banner */}
      <div className="bg-[#fcf8e3] border border-blue-200 rounded-lg p-4 mb-4 text-center">
        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
          <Globe className="w-5 h-5" />
          FREE Shipping WORLDWIDE!
        </div>
      </div>

      {/* Stock Warning with countdown timer */}
      <div className="bg-[#f8f8f8] border-solid border-1 rounded-lg p-4 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 text-red-600 font-medium">
          <Clock className="w- h-5 " />
          LIMITED STOCK! Cart reserved for {formatTime(timeLeft)}
        </div>
      </div>

      {/* Bundle Selection */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4">
          STEP 1: PICK YOUR BUNDLE DISCOUNT
        </h3>
        <p className="text-gray-600 mb-4">
          Buy multiple units and save even more!
        </p>

        <div className="space-y-3  ">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`border-2 h-[120px]  text-wrap   rounded-lg cursor-pointer transition-all sm:px-2 ${data.selectedBundleId === bundle.id 
                  ? "border-[#B88720]"
                  : "border-gray-200 hover:border-gray-300"
              } ${bundle.id === 1 ? "bg-[#ffff00] shadow-xl" : ""}`}
              onClick={() =>
                updateFields({ selectedBundleId: bundle.id })
              }
            >
              <div className="flex items-center justify-between w-full h-full px-2">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="bundle"
                    checked={data.selectedBundleId === bundle.id}
                    onChange={() =>
                      updateFields({ selectedBundleId: bundle.id })
                    }
                    className="w-4"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w- h-14 bg-gray-200 rounded flex items-center justify-center">
                      <img className="h-22 shadow-2xl rounded-lg" src={bundle.img} alt="" />
                    </div>
                    <div>
                      {bundle.savings && (
                        <div className="text-[14px] font-semibold px-0 py-1 rounded inline-block text-[#f00000]">
                          {bundle.savings}
                        </div>
                      )}
                      <div className="text-[15px]">{bundle.label}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 line-through">
                    ${bundle.originalPrice}
                  </div>
                  <div className="text-[15px] font-bold text-[#252a32]">
                    ${bundle.price}/bottle
                  </div>
                  <div className="text-xs text-[#252a32]">
                    + FREE SHIPPING
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}