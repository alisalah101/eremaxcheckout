import { NextRequest, NextResponse } from "next/server";

const S2S_CALLBACK_BASE =
  "https://apis.mymobibox.mobi/API/Auth/Tracking/S2S_CallBack.aspx";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clickid =
      typeof body.clickid === "string" ? body.clickid.trim() : "";
    const pid = typeof body.pid === "string" ? body.pid.trim() : "";

    if (!clickid) {
      return NextResponse.json(
        { error: "clickid is required" },
        { status: 400 }
      );
    }

    const callbackUrl = `${S2S_CALLBACK_BASE}?clickid=${encodeURIComponent(clickid)}`;

    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        clickid,
        ...(pid ? { pid } : {}),
      }).toString(),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Mobibox S2S callback failed:", {
        status: response.status,
        body: text.slice(0, 500),
      });
      return NextResponse.json(
        { error: "S2S callback failed", status: response.status, body: text },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      body: text,
    });
  } catch (error) {
    console.error("Error in mobibox-s2s-callback:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
