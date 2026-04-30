import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentMethodToken, amount, currency, orderId, customerId, description } = body;

        const payload = {
            amount,
            currencyCode: currency,
            customerId,
            orderId,
            paymentMethodToken,
            paymentMethod: {
                paymentType: 'UNSCHEDULED'
            },
        };

        console.log("🛒 Sending to Primer:", JSON.stringify(payload, null, 2));

        const paymentResponse = await fetch(`${process.env.PRIMER_URL}/payments`, {
            method: 'POST',
            headers: {
                'X-API-KEY':  process.env.PRIMER_API_KEY!,
                'X-Api-Version': '2.4',  
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const paymentResult = await paymentResponse.json();

        // if (paymentResponse.ok && paymentResult.status === 'SETTLED') {
            if(paymentResponse.ok){
            return NextResponse.json({
                success: true,
                paymentId: paymentResult.id,
                status: paymentResult.status,
                message: 'One-click payment successful'
            });
        } else {
            console.error('❌ Primer API error response:', JSON.stringify(paymentResult, null, 2));
            return NextResponse.json({
                success: false, 
                error: paymentResult.errorMessage ||
                    paymentResult.error?.description ||
                    paymentResult.message ||
                    'Payment failed'
            }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ One-click payment error:', error);
        return NextResponse.json({
            success: false,
            error: 'Payment processing failed'
        }, { status: 500 });
    }
}
