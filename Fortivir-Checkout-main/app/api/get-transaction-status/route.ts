import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

const MERCHANT_KEY = process.env.MOBIBOX_MERCHANT_KEY || "eb515e92-a819-11f0-95c8-ae0005bd273e";
const MERCHANT_PASS = process.env.MOBIBOX_MERCHANT_PASS || "9e7d01b8a2ce585c1108432aa102b489";
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
      payment_id,
      hash,
    };

    const response = await fetch(`${MOBIBOX_URL}/api/v1/payment/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GET_TRANS_STATUS error:", data);
      return NextResponse.json(
        { error: data.error_message || "Failed to get transaction status" },
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
