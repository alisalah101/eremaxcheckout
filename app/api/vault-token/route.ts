import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { paymentId } = await req.json();
        console.log("PaymentID :", paymentId);

        const response = await fetch(`${process.env.PRIMER_URL}/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'X-API-KEY':  process.env.PRIMER_API_KEY!,
                'X-Api-Version': '2.4',
                'Content-Type': 'application/json'  
            }
        });
        const payment = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: payment.error || 'Failed to fetch payment' },
                { status: response.status }
            );
        }

        return NextResponse.json(payment, { status: 200 });

    } catch (error) {
        console.error('Error fetching payment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment' },
            { status: 500 }
        );
    }
}
