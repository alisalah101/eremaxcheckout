import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body (coming from frontend)
    const payload = await req.json();
    console.log("🔹 Creating Mobibox session with payload:", payload);

    // Make the POST request to Mobibox API
    const response = await fetch("https://pay.mobibox.io/api/v1/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Parse response
    const data = await response.json();

    // If the Mobibox API returns an error code
    if (!response.ok) {
      console.error("❌ Mobibox error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to create Mobibox session" },
        { status: response.status }
      );
    }

    console.log("✅ Mobibox session created successfully");
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("💥 Error creating Mobibox session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
