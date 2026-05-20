import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";
import { MERCHANT_KEY, MERCHANT_PASS } from "@/lib/merchant-credentials";
const MOBIBOX_URL = process.env.MOBIBOX_URL || "https://pay.mobibox.io";

export async function POST(req: NextRequest) {
  try {
    const { payment_id } = await req.json();

    if (!payment_id) {
      return NextResponse.json(
        { error: "payment_id is required" },
        { status: 400 }
      );
    }

    const toMd5 = (payment_id + MERCHANT_PASS).toUpperCase();
    const md5Hash = CryptoJS.MD5(toMd5).toString();
    const hash = CryptoJS.SHA1(md5Hash).toString(CryptoJS.enc.Hex);

    const payload = {
      merchant_key: MERCHANT_KEY,
      payment_id: payment_id,
      hash: hash,

    };

    const response = await fetch(`${MOBIBOX_URL}/api/v1/payment/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GET_TRANS_STATUS error:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
      });

      return NextResponse.json(
        { error: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in get-transaction-status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
