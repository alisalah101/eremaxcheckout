'use client';
import React, { useState, useEffect } from 'react';
import { WIRELESS_CONTENT, TERMS_CONTENT, PRIVACY_CONTENT } from '../constants/modal';

const ThankYou = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(0);
  
  // ✅ State for MobiPay payment result
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleOpenModal = (type: string) => {
    if (type === 'terms') {
      setModalContent(TERMS_CONTENT);
    } else if (type === 'privacy') {
      setModalContent(PRIVACY_CONTENT);
    } else if (type === 'wireless') {
      setModalContent(WIRELESS_CONTENT);
    }
    setIsModalOpen(true);
  };

  
  useEffect(() => {
    console.log('Thank You page loaded - capturing MobiPay result');
    if (typeof window !== 'undefined' && (window as any).MobiPaySDK) {
      try {
        const sdk = new (window as any).MobiPaySDK({ debug: true });
        console.log('✅ MobiPay SDK instance created for result capture');

        console.log(sdk)
        const result = sdk.captureReturnResult();
        
        console.log('✅ MobiPay Payment Result:', result);
        setPaymentResult(result);
        

        if (result) {
          console.log('📄 Order Number:', result.order_number);
          console.log('💰 Amount:', result.amount);
          console.log('✔️ Status:', result.status);
          console.log('🔑 Transaction ID:', result.transaction_id);
          
        }
      } catch (error) {
        console.error('❌ Error capturing payment result:', error);
      }
    }
  }, []);

  useEffect(() => {
    const latestPackage = localStorage.getItem('latestPackage');
    const upsellPackage = localStorage.getItem('upsellPackage');

    const latestQuantity = latestPackage ? JSON.parse(latestPackage)?.quantity || 0 : 0;
    const upsellQuantity = upsellPackage ? JSON.parse(upsellPackage)?.quantity || 0 : 0;

    setTotalQuantity(latestQuantity + upsellQuantity);
  }, []);

  // Optional: Prevent scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  useEffect(() => {
    // Track purchase event when payment result is available
    if (typeof window !== 'undefined' && paymentResult) {
      const purchaseValue = paymentResult?.amount || 10.00;
      let retryCount = 0;
      const maxRetries = 30; // Try for 3 seconds

      // Wait for fbq to be available
      const trackPurchase = () => {
        if (window.fbq) {
          console.log('📊 Tracking Facebook Purchase event:', {
            value: purchaseValue,
            currency: 'USD',
            order_number: paymentResult.order_number,
            transaction_id: paymentResult.transaction_id
          });

          try {
            window.fbq('track', 'Purchase', {
              value: purchaseValue,
              currency: 'USD',
              content_name: 'FortiVir',
              content_type: 'product',
              transaction_id: paymentResult.transaction_id || paymentResult.order_number
            });
            console.log('✅ Facebook Purchase event tracked successfully');
          } catch (error) {
            console.error('❌ Error tracking Purchase event:', error);
          }
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`⏳ Waiting for Facebook Pixel... (attempt ${retryCount}/${maxRetries})`);
            setTimeout(trackPurchase, 100);
          } else {
            console.error('❌ Facebook Pixel not available after 3 seconds. It may be blocked by an ad blocker.');
            console.log('ℹ️ Purchase data:', {
              value: purchaseValue,
              currency: 'USD',
              transaction_id: paymentResult.transaction_id || paymentResult.order_number
            });
          }
        }
      };

      trackPurchase();
    }
  }, [paymentResult])

  const Modal = ({ content, onClose }: any) => (
    <div className="fixed inset-0 z-50 flex justify-center items-center text-start">
      <div className="bg-white max-h-[90vh] overflow-y-auto p-6 rounded-md max-w-xl w-full relative">
        <button
          className="absolute top-1 left-[95%] text-red-500 font-bold text-xl"
          onClick={onClose}
        >
          ✕
        </button>
        <p
          className="text-sm border-1 p-4 text-gray-900 whitespace-pre-line leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#FFFFF] min-h-[100vh] h-full w-full p-4 text-center">
      <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center gap-4">
        <img className="h-[150px]" src="./images/hopepharma.webp" alt="Hope Pharma" />
        <h1 className="text-7xl font-extrabold text-[#2f2f2f]">Thank You</h1>
        <p className="text-3xl">Your Order was Completed Successfully. </p>
        <div className="flex flex-col items-center text-center">
          <p className="text-[18px]">
            You Will Receive The Order Within <strong>15-18 Business Days.</strong>
          </p>
          <p className="text-[16px]">
            We will do our best to{' '}
            <span className="underline font-extrabold">deliver before then as well</span>
          </p>
        </div>
      {/* {product receipt} */}
        {/* <div className="w-full p-4">
          <div className="bg-[#eae4da] w-[100%] flex items-center gap-2 p-4 rounded-md mx-auto">
            <img className="h-[30px]" src="./images/check.webp" alt="" />
            <p className="text-start font-bold text-[#2f2f2f] text-2xl">Your Product Receipt:</p>
          </div>
          <div className="border-b-1 border-b-gray-300 flex justify-between items-center m-4 pb-4">
            <p className="text-start text-sm font-bold text-[#2f2f2f]">Product</p>
            <p className="text-start text-sm font-bold text-[#2f2f2f]">FortiVir</p>
          </div>
          <div className="flex justify-between items-center m-4 pb-4">
            <p className="text-start text-sm font-bold text-[#2f2f2f]">Quantity</p>
            <p className="text-start text-sm font-bold text-gray-400">{totalQuantity}</p>
          </div>
        </div> */}

        {/* ✅ NEW: Optional - Display Payment Confirmation Details (uncomment to show) */}
        {/* {paymentResult && (
          <div className="w-full max-w-[600px] p-4 bg-green-50 rounded-lg border border-green-200 mt-4">
            <h3 className="font-bold text-green-800 mb-2">Payment Confirmed</h3>
            <div className="text-sm text-left space-y-1">
              <p><strong>Order Number:</strong> {paymentResult.order_number}</p>
              <p><strong>Amount:</strong> ${paymentResult.amount} {paymentResult.currency}</p>
              <p><strong>Transaction ID:</strong> {paymentResult.transaction_id}</p>
              <p><strong>Status:</strong> {paymentResult.status}</p>
            </div>
          </div>
        )} */}

        <div className="gap-0">
          <p className="text-2xl">For any support to your order, you can contact</p>
          <p className="text-2xl">customerservice@hopepharma.online</p>
        </div>
      </div>

      <div className="bg-[#F6FBFF] flex flex-col items-center justify-center w-full gap-4 py-8 mt-8 sticky top-[100%]">
        <img className="h-[80px]" src="./images/hopepharma.webp" alt="Hope Pharma Logo" />
        <div className="max-w-[300px] w-full">
          <ul className="text-[#235272] text-xs flex w-full justify-around">
            <li className="cursor-pointer" onClick={() => handleOpenModal('terms')}>
              Terms & Conditions
            </li>
            <li className="cursor-pointer" onClick={() => handleOpenModal('privacy')}>
              Privacy Policy
            </li>
            <li className="cursor-pointer" onClick={() => handleOpenModal('wireless')}>
              Wireless Policy
            </li>
          </ul>
        </div>
        <p className="text-xs">© 2024 Hope Pharma. All rights reserved.</p>
        <p className="text-xs">customerservice@hopepharma.online</p>
        <img src="./images/dmca.webp" alt="" />
      </div>

      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black opacity-30 z-40"
            onClick={() => setIsModalOpen(false)}
          />
          <Modal className="p-4" content={modalContent} onClose={() => setIsModalOpen(false)} />
        </>
      )}
    </div>
  );
};

export default ThankYou;