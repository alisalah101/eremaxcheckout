import React, { useEffect, useState, useRef } from 'react';
import { CreditCard, Lock } from 'lucide-react';

const sample = () => {
  const [clientToken, setClientToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const requestInProgress = useRef(false);
  const primerInitialized = useRef(false);

  useEffect(() => {
    const initializeCheckout = async () => {
      if (requestInProgress.current || loading) return;

      requestInProgress.current = true;
      setLoading(true);

      try {
        const res = await fetch('/api/client-token');
        const data = await res.json();
        
        if (res.ok) {
          setClientToken(data.token);
        } else {
          setError(data.error || 'Failed to get client token');
        }
      } catch (error) {
        console.error('Error initializing checkout:', error);
        setError('Failed to initialize checkout');
      } finally {
        setLoading(false);
        requestInProgress.current = false;
      }
    };

    initializeCheckout();
  }, []);

  // Separate effect to initialize Primer after clientToken is set and DOM is ready
  useEffect(() => {
    if (clientToken && !primerInitialized.current) {
      // Add a small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        initializePrimer(clientToken);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [clientToken]);

  const initializePrimer = async (token: string) => {
    if (primerInitialized.current) return;
    
    try {
      // Check if the container element exists
      const container = document.getElementById('primer-checkout-container');
      if (!container) {
        console.error('Container element not found');
        setError('Payment form container not found');
        return;
      }

      console.log('Initializing Primer with token:', token);
      
      // Import Primer dynamically
      const { Primer } = await import('@primer-io/checkout-web');
      
      await Primer.showUniversalCheckout(token, {
        container: '#primer-checkout-container',
        onTokenizeSuccess: (paymentMethodToken, paymentMethodData) => {
          console.log('Payment tokenized:', { paymentMethodToken, paymentMethodData });
          setPaymentStatus('Payment tokenized successfully!');
          setError(''); // Clear any previous errors
          // Now you can process the payment on your backend
          processPayment(paymentMethodToken);
        },
        onCheckoutFail: (error) => {
          console.error('Primer error:', error);
          setError('Payment processing error: ' + error.message);
        },
        onResumeError: () => {
          console.log('Checkout dismissed');
        }
      });
      
      primerInitialized.current = true;
    } catch (error) {
      console.error('Failed to initialize Primer:', error);
      setError('Failed to load payment form: ' + (error as Error).message);
    }
  };

  const processPayment = async (paymentMethodToken: any) => {
    try {
      setPaymentStatus('Processing payment...');
      
      // Call your backend to process the payment
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodToken,
          amount: 1000, // Amount in cents
          currency: 'USD'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setPaymentStatus('Payment completed successfully!');
        setError('');
      } else {
        setError('Payment failed: ' + result.error);
        setPaymentStatus('');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setError('Payment processing failed');
      setPaymentStatus('');
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !clientToken) {
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border mb-5">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">ALMOST DONE - PAYMENT</h2>
        <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
          <Lock className="w-4 h-4 mr-2" />
          All transactions are secure and encrypted.
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <div className="flex items-center p-3 border-2 border-orange-400 rounded-lg bg-orange-50">
          <div className="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
          <div className="flex items-center flex-1">
            <CreditCard className="w-5 h-5 mr-2 text-gray-700" />
            <span className="font-medium text-gray-800">Credit/Debit Card</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
            <div className="w-8 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
            <div className="w-8 h-5 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">AE</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Status */}
      {paymentStatus && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{paymentStatus}</p>
        </div>
      )}

      {/* Primer Checkout Container */}
      <div id="primer-checkout-container" className="mb-6 min-h-[200px]">
        {!clientToken ? (
          <div className="text-center text-gray-500 py-8">
            Initializing payment form...
          </div>
        ) : !primerInitialized.current ? (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-pulse">Loading payment form...</div>
          </div>
        ) : null}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && !clientToken && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug Info:</strong>
          <br />
          Client Token: {clientToken.substring(0, 50)}...
          <br />
          Status: {primerInitialized.current ? 'Primer Initialized' : 'Waiting for Primer'}
        </div>
      )}
    </div>
  );
};

export default sample;