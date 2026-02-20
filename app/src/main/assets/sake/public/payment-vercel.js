/**
 * KIUMA Pesapal Payment - Vercel Serverless Function Integration
 * 
 * This version works with Vercel serverless functions
 * No backend server needed - just deploy to Vercel (free)!
 */

// Vercel API URL - UPDATE THIS with your Vercel URL
const VERCEL_API_URL = window.VERCEL_API_URL || 'https://your-app.vercel.app';

/**
 * Initialize payment with Vercel serverless function
 */
async function initializePayment(paymentData) {
  // Validate payment data
  if (!paymentData.amount || paymentData.amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  
  if (!paymentData.description || typeof paymentData.description !== 'string') {
    throw new Error('Payment description is required');
  }
  
  if (!paymentData.email) {
    throw new Error('Email is required');
  }
  
  try {
    // Call Vercel serverless function
    const response = await fetch(`${VERCEL_API_URL}/api/pesapal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'initialize',
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'UGX',
        description: paymentData.description,
        email: paymentData.email,
        phone: paymentData.phone || '',
        first_name: paymentData.first_name || '',
        last_name: paymentData.last_name || '',
        callback_url: paymentData.callback_url || `${window.location.origin}/payment/callback.html`,
        cancel_url: paymentData.cancel_url || `${window.location.origin}/payment/cancel.html`
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        reference: result.reference,
        checkout_url: result.checkout_url,
        order_tracking_id: result.order_tracking_id
      };
    } else {
      throw new Error(result.error || 'Failed to initialize payment');
    }
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw new Error(error.message || 'Failed to initialize payment. Please try again.');
  }
}

/**
 * Redirect to Pesapal checkout
 */
function redirectToPesapalCheckout(checkoutUrl) {
  if (!checkoutUrl) {
    throw new Error('Checkout URL is required');
  }
  window.location.href = checkoutUrl;
}

/**
 * Process payment (main entry point)
 */
async function processPayment(paymentData) {
  // Step 1: Initialize payment
  const result = await initializePayment(paymentData);
  
  // Step 2: Store reference for verification
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('pesapal_reference', result.reference);
    sessionStorage.setItem('pesapal_order_tracking_id', result.order_tracking_id);
  }
  
  // Step 3: Redirect to Pesapal
  redirectToPesapalCheckout(result.checkout_url);
  
  return result;
}

/**
 * Verify payment after Pesapal redirect
 */
async function verifyPaymentAfterRedirect(orderTrackingId, reference) {
  if (!orderTrackingId || !reference) {
    throw new Error('Order tracking ID and reference are required');
  }
  
  try {
    // Call Vercel serverless function to verify
    const response = await fetch(`${VERCEL_API_URL}/api/pesapal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'verify',
        order_tracking_id: orderTrackingId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Verification failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Clear stored reference
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('pesapal_reference');
        sessionStorage.removeItem('pesapal_order_tracking_id');
      }
      
      return {
        success: true,
        reference: result.reference,
        amount: result.amount,
        currency: result.currency,
        status: result.status
      };
    } else {
      throw new Error(result.error || 'Payment verification failed');
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error(error.message || 'Payment verification failed. Please contact support.');
  }
}

/**
 * Handle Pesapal callback
 */
async function handlePesapalCallback(urlParams) {
  const orderTrackingId = urlParams.OrderTrackingId || urlParams.order_tracking_id;
  const reference = urlParams.OrderMerchantReference || urlParams.reference;
  
  // Check sessionStorage as fallback
  const storedReference = sessionStorage?.getItem('pesapal_reference');
  const storedOrderTrackingId = sessionStorage?.getItem('pesapal_order_tracking_id');
  
  const finalOrderTrackingId = orderTrackingId || storedOrderTrackingId;
  const finalReference = reference || storedReference;
  
  if (!finalOrderTrackingId || !finalReference) {
    throw new Error('Missing payment information from Pesapal redirect');
  }
  
  return await verifyPaymentAfterRedirect(finalOrderTrackingId, finalReference);
}

/**
 * Get user payment history
 */
async function getUserPaymentHistory(limit = 50) {
  // Not implemented in serverless function - can be added if needed
  return [];
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.processPayment = processPayment;
  window.verifyPaymentAfterRedirect = verifyPaymentAfterRedirect;
  window.handlePesapalCallback = handlePesapalCallback;
  window.getUserPaymentHistory = getUserPaymentHistory;
  window.initializePayment = initializePayment;
  window.redirectToPesapalCheckout = redirectToPesapalCheckout;
}

