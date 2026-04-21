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

/** One payment request per user action; reset on error so user can retry. */
let paymentSent = false;

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
  
  // Attach user info if logged in (but do NOT require login to pay)
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        paymentData.userId = user.uid;
        paymentData.email = paymentData.email || user.email;
      }
    } catch (e) { /* guest checkout */ }
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
    
    if (error.code === 'invalid-argument') {
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
 * Uses Cloudflare worker first (same as SAKE; IPN updates live balance); falls back to Firebase if worker unavailable.
 * Flow:
 * 1. Try worker /api/initialize-payment (same notification_id = IPN hits our worker = balance updates)
 * 2. Else Firebase initializePayment
 * 3. Redirect to Pesapal checkout
 * 4. After payment, callback verifies via worker (or Firebase fallback)
 * 
 * All payments except Zakat use this Pesapal configuration (Zakat uses zakat-form.html).
 * 
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment initialization result
 */
async function processPayment(paymentData) {
  if (paymentSent) return;
  paymentSent = true;

  try {
    var workerUrl = '';
    try {
      workerUrl = localStorage.getItem('kiuma_pesapal_worker_url') || 'https://kiuma-pesapal.abdulsalamokullo7.workers.dev';
    } catch (e) {}

    if (workerUrl) {
      try {
        var res = await fetch(workerUrl + '/api/initialize-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(paymentData.amount),
            currency: paymentData.currency || 'UGX',
            description: paymentData.description,
            email: paymentData.email || '',
            phone: paymentData.phone || '',
            first_name: paymentData.first_name || 'User',
            last_name: paymentData.last_name || '',
            callback_url: paymentData.callback_url || (window.location.origin + '/payment/callback.html'),
            cancellation_url: paymentData.cancel_url || (window.location.origin + '/pay.html?payment=cancelled'),
          }),
        });
        var data = await res.json();
        if (data.success && data.checkout_url) {
          try {
            localStorage.setItem('kiuma_pesapal_worker_url', workerUrl);
            var pending = { reference: data.reference, order_tracking_id: data.order_tracking_id, amount: paymentData.amount, currency: paymentData.currency || 'UGX', description: paymentData.description };
            localStorage.setItem('kiuma_pending_payment', JSON.stringify(pending));
          } catch (e) {}
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('pesapal_reference', data.reference);
            sessionStorage.setItem('pesapal_order_tracking_id', data.order_tracking_id);
          }
          redirectToPesapalCheckout(data.checkout_url);
          return { success: true, reference: data.reference, checkout_url: data.checkout_url, order_tracking_id: data.order_tracking_id };
        }
      } catch (err) {
        console.warn('Worker initialize failed, falling back to Firebase:', err);
      }
    }

    // Fallback: Firebase
    var result = await initializePayment(paymentData);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pesapal_reference', result.reference);
      sessionStorage.setItem('pesapal_order_tracking_id', result.order_tracking_id);
    }
    redirectToPesapalCheckout(result.checkout_url);
    return result;
  } catch (e) {
    paymentSent = false;
    throw e;
  }
}

/**
 * Verify payment after Pesapal redirect
 * 
 * Uses same Pesapal configuration as SAKE: try Cloudflare worker /api/verify-payment first, then Firebase.
 * SECURITY: Backend verifies with Pesapal API - frontend never decides success alone.
 * 
 * @param {string} orderTrackingId - Order tracking ID from Pesapal redirect
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} Verification result
 */
async function verifyPaymentAfterRedirect(orderTrackingId, reference) {
  if (!orderTrackingId || !reference) {
    throw new Error('Order tracking ID and reference are required');
  }
  
  if (typeof showPaymentLoading === 'function') {
    showPaymentLoading('Verifying payment...');
  }

  var workerUrl = '';
  try {
    workerUrl = localStorage.getItem('kiuma_pesapal_worker_url') || 'https://kiuma-pesapal.abdulsalamokullo7.workers.dev';
  } catch (e) {}

  // Try worker verify first (same as SAKE)
  if (workerUrl) {
    try {
      var resp = await fetch(workerUrl + '/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_tracking_id: orderTrackingId }),
      });
      var data = await resp.json();
      if (data.success && data.completed) {
        if (typeof showPaymentLoading === 'function') hidePaymentLoading();
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('pesapal_reference');
          sessionStorage.removeItem('pesapal_order_tracking_id');
        }
        return {
          success: true,
          reference: data.reference || reference,
          amount: data.amount,
          currency: data.currency || 'UGX',
          status: data.payment_status_description || data.status || 'Completed'
        };
      }
    } catch (err) {
      console.warn('Worker verify failed, falling back to Firebase:', err);
    }
  }

  // Fallback: Firebase
  try {
    const functions = getFunctions();
    const verifyPaymentFunction = functions.httpsCallable('verifyPayment');
    const result = await verifyPaymentFunction({
      order_tracking_id: orderTrackingId,
      reference: reference
    });
    if (result.data.success) {
      if (typeof showPaymentLoading === 'function') hidePaymentLoading();
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
    }
    throw new Error('Payment verification failed');
  } catch (error) {
    console.error('Payment verification error:', error);
    let errorMessage = 'Payment verification failed. Please contact support.';
    if (error.code === 'unauthenticated') errorMessage = 'Please log in to verify payment.';
    else if (error.code === 'not-found') errorMessage = 'Payment record not found.';
    else if (error.code === 'failed-precondition') errorMessage = error.message || 'Payment validation failed.';
    else if (error.code === 'already-exists') errorMessage = 'This payment has already been processed.';
    else if (error.message) errorMessage = error.message;
    if (typeof showPaymentLoading === 'function') hidePaymentLoading();
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

