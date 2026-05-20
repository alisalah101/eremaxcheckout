"use client"
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getMerchantCredentials } from '@/lib/merchant-credentials'

// TypeScript interfaces
interface PackageData {
    price: number;
    quantity: number;
    expeditedShipping: boolean;
}

interface User {
    name: string;
    surname: string;
    email: string;
    phone: string;
}

interface Shipment {
    country: string;
    state: string;
    city: string;
    address: string;
    postcode: string;
}

interface PaymentContainerProps {
    package: PackageData;
    user: User;
    shipment: Shipment;
    shouldUpdateSession: boolean;
}

interface MobiPaySDK {
    clickId?: string;
    init: () => Promise<void>;
    createSession: (payload: unknown) => Promise<{ redirect_url?: string }>;
}

const PaymentContainer = (props: PaymentContainerProps) => {
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState("")
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);

    const {
        package: packageData,
        user,
        shipment,
    } = props;

    // ✅ MobiPay SDK initialization
    const sdkRef = useRef<MobiPaySDK | null>(null);
    const [sdkInitialized, setSdkInitialized] = useState(false);

    const { shouldUpdateSession } = props;

    // ✅ Initialize MobiPay SDK on component mount
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as { MobiPaySDK?: new (config: { debug: boolean; retries: number; retryDelay: number }) => MobiPaySDK }).MobiPaySDK) {
            try {
                const MobiPaySDKConstructor = (window as { MobiPaySDK: new (config: { debug: boolean; retries: number; retryDelay: number }) => MobiPaySDK }).MobiPaySDK;
                sdkRef.current = new MobiPaySDKConstructor({
                    debug: true,
                    retries: 3,
                    retryDelay: 500
                });

                // Initialize SDK tracking and generate ClickId
                sdkRef.current.init()
                    .then(() => {
                        console.log('✅ MobiPay SDK initialized successfully');
                        console.log('📍 ClickId generated:', sdkRef.current?.clickId);
                        setSdkInitialized(true);
                    })
                    .catch((err: unknown) => {
                        console.error('❌ MobiPay SDK init failed:', err);
                    });
            } catch (err) {
                console.error('❌ Error creating MobiPay SDK instance:', err);
            }
        }
    }, []);


    useEffect(() => {
        if (!shouldUpdateSession) {
            console.log("fb pixel paymentformView event returned")
            return
        }
           console.log("fb pixel paymentformView event fired")

        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'paymentformView')
        }
    }, [sdkInitialized, shouldUpdateSession])

    const handleCustomButtonClick = useCallback(async () => {
        console.log('clicked custom button');

        if (shouldUpdateSession === false) {
            document.getElementById('errorSection')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (!sdkRef.current || !sdkRef.current.clickId) {
            console.error('❌ SDK not initialized or ClickId missing');
            alert('Payment system not ready. Please refresh the page.');
            return;
        }

        setLoading(true);

        const order_number = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const rawAmount = packageData.price * packageData.quantity + (packageData.expeditedShipping ? 10.0 : 0.0);

        const order_amount = Number(rawAmount.toFixed(2));
        console.log("quantity", packageData.quantity);
        console.log("price", packageData.price);
        console.log('Order Amount:', order_amount);
        const order_currency = "USD";
        const order_description = "Fortivir Purchase";
        const { merchant_key, merchant_pass } = getMerchantCredentials();

        // ✅ Build payload for SDK (SDK handles hashing automatically)
        const sessionPayload = {
            merchant_name: "hopepharma",
            merchant_key,
            operation: "purchase",
            methods: ["card"],
            order: {
                number: order_number,
                amount: order_amount.toString(),
                currency: order_currency,
                description: order_description
            },
            cancel_url: process.env.NEXT_PUBLIC_BASE_URL,
            success_url: "https://fortivir-checkout-production-b1be.up.railway.app/upsell",
            // success_url: `http://localhost:3000/thank-you`,
            url_target: "_top",
            customer: {
                name: user.name + " " + user.surname,
                email: user.email,
                Phone: user.phone
            },
            billing_address: {
                country: shipment.country || "",
                state: shipment.state || "",
                city: shipment.city || "",
                address: shipment.address || "",
                zip: shipment.postcode || "",
                phone: user.phone || "",
            },
            custom_data: {
                quantity: packageData.quantity.toString(),
                expedited_shipping: packageData.expeditedShipping ? "true" : "false"
            },
            recurring_init: "true",
            req_token: true,
            merchant_pass: merchant_pass
        };

        console.log('🔹 Payload for session creation:', sessionPayload);

        try {
            // ✅ Use SDK's createSession method
            const response = await sdkRef.current.createSession(sessionPayload);

            console.log('✅ Session created successfully:', response);
            if (typeof window !== 'undefined' && (window as { fbq?: (action: string, event: string) => void }).fbq) {
                console.log("fb pixel paymentformView event fired")
                // const fbq = (window as { fbq: (action: string, event: string) => void }).fbq;
                // fbq('track', 'AddPaymentInfo')
            }

            if (response && response.redirect_url) {
                // Store package data before redirect
                localStorage.setItem('latestPackage', JSON.stringify(packageData));

                console.log('🔄 Loading payment gateway in iframe:', response.redirect_url);
                setIframeUrl(response.redirect_url);
                setLoading(false);
            } else {
                console.error("❌ No redirect_url found in API response.");
                setError("Failed to create payment session");
                setLoading(false);
            }

        } catch (error) {
            console.error('❌ Error creating session:', error);
            setError("Payment session creation failed. Please try again.");
            setLoading(false);
        }
    }, [shouldUpdateSession, packageData, user, shipment]);

    // 🧠 Session update logic
    useEffect(() => {
        console.log(shouldUpdateSession, "******************")
        if (!shouldUpdateSession || !sdkInitialized) {
            console.log("⏸️ Skipping session update - forms not valid or no token");
            return;
        }
        const timer = setTimeout(() => {
            handleCustomButtonClick();
        }, 500);

        return () => clearTimeout(timer);

    }, [shouldUpdateSession, sdkInitialized, handleCustomButtonClick]);

    if (isLoading) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Processing payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center text-red-600">
                    <p>Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='w-full text-center'>
            {!iframeUrl && (
                <button
                    onClick={handleCustomButtonClick}
                    className="bg-[#ffd712] h-[100px] w-full min-w-[340px] flex flex-col items-center justify-center gap-2 rounded-lg shadow-lg text-center hover:bg-[#ffdb28] transition-colors"
                >
                    <p className="font-bold">COMPLETE PURCHASE</p>
                    <p>TRY IT RISK FREE! - 90 DAY MONEY BACK GUARANTEE!</p>
                </button>
            )}

            {iframeUrl && (
                <div className="mt-6">
                    <iframe
                        src={iframeUrl}
                        width="100%"
                        height="750"
                        className="border rounded-lg shadow-md"
                        allow="payment *; fullscreen"
                        onLoad={() => console.log("Payment iframe loaded")}
                        onError={() => setError("Error loading payment page.")}
                    />
                </div>
            )}
        </div>
    );
}

export default PaymentContainer;
