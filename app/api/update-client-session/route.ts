import { NextResponse } from 'next/server';

type FrontendRequest = {
  clientToken: string;
  user: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
  };
  shipment: {
    country?: string;
    city?: string;
    address?: string;
    state?: string;
    postcode?: string;
  };
  package: {
    expeditedShipping?: boolean;
    price?: number;     // final discounted price for entire bundle
    quantity?: number;  // total quantity in bundle
    selectedBundleId?: string;
    originalPrice?: number;
  };
};

interface PrimerUpdateRequest {
  clientToken: string;
  amount: number;
  currencyCode: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    mobileNumber?: string;
    billingAddress?: {
      addressLine1: string;
      countryCode: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  order?: {
    lineItems: Array<{
      itemId: string;
      quantity: number;
      amount: number;
      name: string;
    }>;
  };
  paymentMethod?: {
    vaultOnSuccess?: boolean;
  };
}

export async function PATCH(req: Request) {
  try {
    const body: FrontendRequest = await req.json();
    const { clientToken, user, shipment, package: packageData } = body;

    if (!clientToken) {
      return NextResponse.json({ error: 'Client token is required' }, { status: 400 });
    }

    const { name, surname, email, phone } = user;
    const { country, city, address, state, postcode } = shipment;
    const { expeditedShipping, price = 0, quantity = 1, selectedBundleId } = packageData;

    const shippingCost = expeditedShipping ? 1000 : 0;

    // Total amount = discounted price + shipping
    const totalAmount = price + shippingCost;

    const updatePayload: PrimerUpdateRequest = {
      clientToken,
      amount: totalAmount,
      currencyCode: 'USD',
      paymentMethod: {
        vaultOnSuccess: true
      }
    };

    if (name || surname || email || phone || (country && city && postcode)) {
      updatePayload.customer = {};
      if (name) updatePayload.customer.firstName = name;
      if (surname) updatePayload.customer.lastName = surname;
      if (email) updatePayload.customer.emailAddress = email;
      if (phone) updatePayload.customer.mobileNumber = phone;

      if (country && city && postcode) {
        updatePayload.customer.billingAddress = {
          addressLine1: address || '123 Main St',
          countryCode: country.length === 2 ? country : '',
          city,
          state: state || '',
          postalCode: postcode
        };
      }
    }

    const lineItems = [];

    // Product line item: quantity 1 because amount is total for the entire bundle (already discounted)
    lineItems.push({
      itemId: selectedBundleId?.toString() || 'main-product',
      quantity: 1,
      amount: price,
      name: selectedBundleId ? `Bundle ${selectedBundleId}` : 'Product'
    });

    if (shippingCost > 0) {
      lineItems.push({
        itemId: 'shipping',
        quantity: 1,
        amount: shippingCost,
        name: expeditedShipping ? 'Expedited Shipping' : 'Standard Shipping'
      });
    }

    updatePayload.order = { lineItems };

    console.log('🔄 Updating client session with:', JSON.stringify(updatePayload, null, 2));

    const response = await fetch(`${process.env.PRIMER_URL}/client-session`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Version': '2.4',
        'X-Api-Key':  process.env.PRIMER_API_KEY!
      },
      body: JSON.stringify(updatePayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Primer API error:', data);
      if (data.error?.validationErrors) {
        console.error('Validation Errors:', data.error.validationErrors);
      }
      return NextResponse.json(
        { error: data.message || 'Failed to update client session' },
        { status: response.status }
      );
    }

    console.log('✅ Client session updated successfully');
    return NextResponse.json({ success: true, clientSession: data });

  } catch (error: any) {
    console.error('❌ Update client session error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
