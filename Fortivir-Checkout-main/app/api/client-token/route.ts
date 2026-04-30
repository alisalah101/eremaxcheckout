import { NextRequest, NextResponse } from "next/server";

type FrontendRequest = {
  user: { name?: string; surname?: string; email?: string; phone?: string };
  shipment: { country?: string; city?: string; address?: string; state?: string; postcode?: string };
  package: { expeditedShipping?: boolean; price?: number; originalPrice?: number; selectedBundleId?: string; };
};

interface PrimerClientSessionRequest {
  orderId: string;
  currencyCode: string;
  amount: number;
  customerId: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    mobileNumber?: string;
    billingAddress?: { addressLine1: string; countryCode: string; city: string; state: string; postalCode: string };
  };
  order?: {
    lineItems: Array<{ itemId: string; quantity: number; amount: number; description: string }>;
  };
  paymentMethod?: { vaultOnSuccess?: boolean };
}

type SuccessResponse = { token: string };
type ErrorResponse = { error: string | object };

export async function POST(req: NextRequest) {
  try {
    const body: FrontendRequest = await req.json();
    console.log("🔄 Input received:", body);

    const { user, shipment, package: pkg } = body;
    const { name, surname, email, phone } = user;
    const { country, city, address, state, postcode } = shipment;
    const { expeditedShipping, price = 0, selectedBundleId } = pkg;

    const productAmount = price; // Should already be discounted total
    const shippingCost = expeditedShipping ? 1000 : 0; // 10 dollar in cents
    const totalAmount = productAmount + shippingCost; 

    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const customerId = `CUSTOMER-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const payload: PrimerClientSessionRequest = {
      orderId,
      currencyCode: "USD",
      amount: totalAmount,
      customerId,
      paymentMethod: { vaultOnSuccess: true },
      order: {
        lineItems: [
          {
            itemId: selectedBundleId ? `bundle-${selectedBundleId}` : "main-product",
            quantity: 1,
            amount: productAmount,
            description: selectedBundleId ? `Bundle ${selectedBundleId}` : "Product",
          },
          ...(shippingCost > 0
            ? [{
                itemId: "shipping",
                quantity: 1,
                amount: shippingCost,
                description: expeditedShipping ? "Expedited Shipping" : "Standard Shipping",
              }]
            : []),
        ],
      },
    };

    if (name || surname || email || phone || (country && city && postcode)) {
      payload.customer = {};
      if (name) payload.customer.firstName = name;
      if (surname) payload.customer.lastName = surname;
      if (email) payload.customer.emailAddress = email;
      if (phone) payload.customer.mobileNumber = phone;
      if (country && city && postcode) {
        payload.customer.billingAddress = {
          addressLine1: address || "123 Main St",
          countryCode: country,
          city,
          state: state || "",
          postalCode: postcode,
        };
      }
    }

    console.log(" Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(`${process.env.PRIMER_URL}/client-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Version": "2.4",
        "X-Api-Key": process.env.PRIMER_API_KEY! 
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(" Primer API error:", data);
      if (data.error?.validationErrors) console.error(" Validation details:", data.error.validationErrors);
      return NextResponse.json<ErrorResponse>({ error: data.error?.description || "Validation failed" }, { status: res.status });
    }

    return NextResponse.json<SuccessResponse>({ token: data.clientToken }, { status: 200 });
  } catch (err: any) {
    console.error(" Unexpected error:", err);
    return NextResponse.json<ErrorResponse>({ error: "Internal Server Error" }, { status: 500 });
  }
}
