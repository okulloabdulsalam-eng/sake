/**
 * KIUMA Secure Payment Frontend - Pesapal/DPO Pay Integration
 * 
 * STATUS: LOCKED - This payment system is currently disabled
 * The code remains in place for future use but is not active.
 * 
 * Frontend payment initialization ONLY
 * 
 * CRITICAL SECURITY RULES:
 * - NEVER verify payment success on frontend
 * - NEVER store or access secret keys
 * - ONLY request payment initiation from backend
 * - ONLY redirect user to Pesapal checkout
 * - ALWAYS wait for backend verification before showing success
 * 
 * WHY FRONTEND CANNOT VERIFY PAYMENTS:
 * - Frontend code can be manipulated by attackers
 * - Client-side validation can be bypassed
 * - Only backend can trust Pesapal API responses
 * - Prevents fraud and replay attacks
 */

// Pesapal Public Key (if needed for frontend - usually not required)
// Note: Pesapal typically doesn't require public key in frontend
// All payment initiation happens via backend

/**
 * Initialize Firebase Functions
 */
function getFunctions() {
  if (typeof firebase === 'undefined' || !firebase.functions) {
    throw new Error('Firebase Functions not initialized');
  }
  return firebase.functions();
}

/**
 * Initialize payment with backend
 * 
 * SECURITY: Frontend only requests payment initiation
 * Backend creates Pesapal order and returns checkout URL
 * 
 * STATUS: LOCKED - Returns error if system is disabled
 * 
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment initialization result with checkout URL
 */
async function initializePayment(paymentData) {
  // FEATURE FLAG: Check if Pesapal is enabled (via backend)
  // Frontend will get error from backend if disabled
  // Validate payment data
  if (!paymentData.amount || paymentData.amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  
  if (!paymentData.description || typeof paymentData.description !== 'string') {
    throw new Error('Payment description is required');
  }
  
  // Check if user is authenticated
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User must be logged in to make payments');
    }
    paymentData.userId = user.uid;
    paymentData.email = paymentData.email || user.email;
  } else {
    throw new Error('User authentication required');
  }
  
  try {
    // Get Firebase Functions
    const functions = getFunctions();
    const initializePaymentFunction = functions.httpsCallable('initializePayment');
    
    // Call backend to initialize payment
    // SECURITY: Backend validates amount, generates reference, creates Pesapal order
    const result = await initializePaymentFunction({
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency || 'UGX',
      description: paymentData.description,
      callback_url: paymentData.callback_url || window.location.origin + '/payment/callback',
      cancel_url: paymentData.cancel_url || window.location.origin + '/payment/cancel',
      email: paymentData.email,
      phone: paymentData.phone || '',
      first_name: paymentData.first_name || '',
      last_name: paymentData.last_name || '',
      address: paymentData.address || '',
      city: paymentData.city || '',
      state: paymentData.state || '',
      postal_code: paymentData.postal_code || ''
    });
    
    if (result.data.success) {
      return {
        success: true,
        reference: result.data.reference,
        checkout_url: result.data.checkout_url,
        order_tracking_id: result.data.order_tracking_id
      };
    } else {
      throw new Error('Failed to initialize payment');
    }
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    
    // Handle specific error codes
    let errorMessage = 'Failed to initialize payment. Please try again.';
    
    if (error.code === 'unauthenticated') {
      errorMessage = 'Please log in to make payments.';
    } else if (error.code === 'invalid-argument') {
      errorMessage = error.message || 'Invalid payment details.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Redirect user to Pesapal checkout
 * 
 * SECURITY: This only redirects - does NOT verify payment
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
 * 1. Request payment initiation from backend
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
  // Step 1: Initialize payment with backend
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
 * SECURITY: This calls backend verification function
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
    
    // Get Firebase Functions
    const functions = getFunctions();
    const verifyPaymentFunction = functions.httpsCallable('verifyPayment');
    
    // Call backend verification function
    // SECURITY: Backend verifies with Pesapal API - this is the ONLY source of truth
    const result = await verifyPaymentFunction({
      order_tracking_id: orderTrackingId,
      reference: reference
    });
    
    // Backend has verified payment
    if (result.data.success) {
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
        reference: result.data.reference,
        amount: result.data.amount,
        currency: result.data.currency,
        status: result.data.status
      };
    } else {
      throw new Error('Payment verification failed');
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Handle specific error codes
    let errorMessage = 'Payment verification failed. Please contact support.';
    
    if (error.code === 'unauthenticated') {
      errorMessage = 'Please log in to verify payment.';
    } else if (error.code === 'not-found') {
      errorMessage = 'Payment record not found.';
    } else if (error.code === 'failed-precondition') {
      errorMessage = error.message || 'Payment validation failed.';
    } else if (error.code === 'already-exists') {
      errorMessage = 'This payment has already been processed.';
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
  // Pesapal typically returns: ?OrderTrackingId=xxx&OrderMerchantReference=xxx
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
  
  // Verify payment with backend
  return await verifyPaymentAfterRedirect(finalOrderTrackingId, finalReference);
}

/**
 * Get user payment history
 * 
 * @param {number} limit - Number of payments to fetch
 * @returns {Promise<Array>} Payment history
 */
async function getUserPaymentHistory(limit = 50) {
  try {
    const functions = getFunctions();
    const getUserPayments = functions.httpsCallable('getUserPayments');
    
    const result = await getUserPayments({ limit });
    
    if (result.data.success) {
      return result.data.payments;
    } else {
      throw new Error('Failed to fetch payment history');
    }
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
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

