import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";
import { MERCHANT_KEY, MERCHANT_PASS } from "@/lib/merchant-credentials";
const MOBIBOX_URL = process.env.MOBIBOX_URL || "https://pay.mobibox.io";

export async function POST(req: NextRequest) {
  try {
    const { recurring_init_trans_id, recurring_token } = await req.json();

    if (!recurring_init_trans_id || !recurring_token) {
      return NextResponse.json(
        { error: "recurring_init_trans_id and recurring_token are required" },
        { status: 400 }
      );
    }

    const order_number = `upsell-${Date.now()}`;
    const order_amount = "39.99";
    const order_description = "Fortivir MAX Upsell - 2 Bottles";

    // Recurring hash: SHA1(MD5((recurring_init_trans_id + recurring_token + order_number + order_amount + order_description + merchant_pass).toUpperCase()))
    const toMd5 = (recurring_init_trans_id + recurring_token + order_number + order_amount + order_description + MERCHANT_PASS).toUpperCase();
    const md5Hash = CryptoJS.MD5(toMd5).toString();
    const hash = CryptoJS.SHA1(md5Hash).toString(CryptoJS.enc.Hex);

    const payload = {
      merchant_key: MERCHANT_KEY,
      recurring_init_trans_id,
      recurring_token,
      order: {
        number: order_number,
        amount: order_amount,
        description: order_description,
      },
      hash,
    };

    const response = await fetch(`${MOBIBOX_URL}/api/v1/payment/recurring`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Recurring payment error:", data);
      return NextResponse.json(
        { error: data.error_message || data.reason || "Recurring payment failed" },
        { status: response.status }
      );
    }

    // status can be "settled", "pending", or "declined"
    const success = data.status?.toLowerCase() === "settled";

    return NextResponse.json({
      success,
      status: data.status,
      payment_id: data.payment_id,
      reason: data.reason || null,
      order: data.order || null,
    }, { status: 200 });
  } catch (error) {
    console.error("Error in create-upsell-session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
