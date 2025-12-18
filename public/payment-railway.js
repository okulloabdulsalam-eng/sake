/**
 * KIUMA Secure Payment Frontend - Railway Backend Integration
 * 
 * This version works with Railway Express server instead of Firebase Functions
 * 
 * CRITICAL SECURITY RULES:
 * - NEVER verify payment success on frontend
 * - NEVER store or access secret keys
 * - ONLY request payment initiation from backend
 * - ONLY redirect user to Pesapal checkout
 * - ALWAYS wait for backend verification before showing success
 */

// Railway API URL - UPDATE THIS with your Railway URL
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://your-app.railway.app';

/**
 * Initialize payment with Railway backend
 * 
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment initialization result with checkout URL
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
    // Call Railway backend to initialize payment
    const response = await fetch(`${RAILWAY_API_URL}/api/initialize-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      throw new Error(errorData.message || `Server error: ${response.status}`);
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
      throw new Error(result.message || 'Failed to initialize payment');
    }
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    
    let errorMessage = 'Failed to initialize payment. Please try again.';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Redirect user to Pesapal checkout
 * 
 * @param {string} checkoutUrl - Pesapal checkout URL from backend
 */
function redirectToPesapalCheckout(checkoutUrl) {
  if (!checkoutUrl) {
    throw new Error('Checkout URL is required');
  }
  
  // Redirect to Pesapal checkout page
  window.location.href = checkoutUrl;
}

/**
 * Process payment (main entry point)
 * 
 * Flow:
 * 1. Request payment initiation from Railway backend
 * 2. Get Pesapal checkout URL
 * 3. Redirect user to Pesapal
 * 4. User completes payment on Pesapal
 * 5. Pesapal redirects back to callback URL
 * 6. Backend verifies payment (NOT frontend)
 * 
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment initialization result
 */
async function processPayment(paymentData) {
  // Step 1: Initialize payment with Railway backend
  const result = await initializePayment(paymentData);
  
  // Step 2: Store reference and order tracking ID for verification after redirect
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('pesapal_reference', result.reference);
    sessionStorage.setItem('pesapal_order_tracking_id', result.order_tracking_id);
  }
  
  // Step 3: Redirect to Pesapal checkout
  redirectToPesapalCheckout(result.checkout_url);
  
  return result;
}

/**
 * Verify payment after Pesapal redirect
 * 
 * SECURITY: This calls Railway backend verification function
 * Frontend NEVER decides if payment was successful
 * 
 * @param {string} orderTrackingId - Order tracking ID from Pesapal redirect
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} Verification result
 */
async function verifyPaymentAfterRedirect(orderTrackingId, reference) {
  if (!orderTrackingId || !reference) {
    throw new Error('Order tracking ID and reference are required');
  }
  
  try {
    // Show loading state
    if (typeof showPaymentLoading === 'function') {
      showPaymentLoading('Verifying payment...');
    }
    
    // Call Railway backend verification function
    const response = await fetch(`${RAILWAY_API_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_tracking_id: orderTrackingId,
        reference: reference
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Verification failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Backend has verified payment
    if (result.success) {
      // NOW we can show success (only after backend confirmation)
      if (typeof showPaymentLoading === 'function') {
        hidePaymentLoading();
      }
      
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
      throw new Error(result.message || 'Payment verification failed');
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    
    let errorMessage = 'Payment verification failed. Please contact support.';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    if (typeof showPaymentLoading === 'function') {
      hidePaymentLoading();
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Handle Pesapal callback redirect
 * 
 * Called when user returns from Pesapal checkout
 * Extracts order tracking ID from URL and verifies payment
 * 
 * @param {Object} urlParams - URL parameters from Pesapal redirect
 * @returns {Promise<Object>} Verification result
 */
async function handlePesapalCallback(urlParams) {
  // Extract order tracking ID from URL parameters
  const orderTrackingId = urlParams.OrderTrackingId || urlParams.order_tracking_id;
  const reference = urlParams.OrderMerchantReference || urlParams.reference;
  
  // Also check sessionStorage as fallback
  const storedReference = sessionStorage?.getItem('pesapal_reference');
  const storedOrderTrackingId = sessionStorage?.getItem('pesapal_order_tracking_id');
  
  const finalOrderTrackingId = orderTrackingId || storedOrderTrackingId;
  const finalReference = reference || storedReference;
  
  if (!finalOrderTrackingId || !finalReference) {
    throw new Error('Missing payment information from Pesapal redirect');
  }
  
  // Verify payment with Railway backend
  return await verifyPaymentAfterRedirect(finalOrderTrackingId, finalReference);
}

/**
 * Get user payment history
 * 
 * Note: This would need to be implemented in Railway backend
 * For now, returns empty array
 * 
 * @param {number} limit - Number of payments to fetch
 * @returns {Promise<Array>} Payment history
 */
async function getUserPaymentHistory(limit = 50) {
  // TODO: Implement in Railway backend if needed
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

