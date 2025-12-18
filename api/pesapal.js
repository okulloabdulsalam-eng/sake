/**
 * Pesapal Serverless Function for Vercel/Netlify
 * 
 * This is a serverless function that handles Pesapal payments
 * Deploy this to Vercel or Netlify (both free)
 * 
 * No backend server needed - just deploy and it works!
 */

// Vercel supports both CommonJS and ES modules
// Using CommonJS for better compatibility
const axios = require('axios');
const crypto = require('crypto');

const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';
const PESAPAL_SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3';

/**
 * Get Pesapal OAuth token
 */
async function getPesapalToken(consumerKey, consumerSecret, baseUrl) {
  try {
    const response = await axios.post(
      `${baseUrl}/api/Auth/RequestToken`,
      {
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.status !== 200 || !response.data || !response.data.token) {
      throw new Error('Failed to obtain Pesapal access token');
    }
    
    return response.data.token;
  } catch (error) {
    console.error('Error getting Pesapal token:', error.message);
    throw new Error('Failed to authenticate with Pesapal');
  }
}

/**
 * Generate unique transaction reference
 */
function generateReference() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KIUMA-${timestamp}-${random}`;
}

/**
 * Vercel Serverless Function Handler
 * 
 * Vercel auto-detects functions in /api folder
 * This file will be available at: /api/pesapal
 */
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, amount, currency, description, email, phone, first_name, last_name, callback_url, cancel_url, order_tracking_id } = req.body;

  // Get credentials from environment variables (set in Vercel/Netlify dashboard)
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const testMode = process.env.PESAPAL_TEST_MODE === 'true';
  const baseUrl = testMode ? PESAPAL_SANDBOX_URL : PESAPAL_BASE_URL;
  const appBaseUrl = process.env.APP_BASE_URL || '';

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ 
      success: false,
      error: 'Pesapal credentials not configured. Set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET in environment variables.' 
    });
  }

  try {
    // Action: Initialize Payment
    if (action === 'initialize') {
      // Validate input
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
      }
      
      if (!description) {
        return res.status(400).json({ success: false, error: 'Payment description is required' });
      }
      
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      // Get OAuth token
      const token = await getPesapalToken(consumerKey, consumerSecret, baseUrl);
      
      // Generate unique reference
      const reference = generateReference();

      // Create Pesapal order
      const orderResponse = await axios.post(
        `${baseUrl}/api/Transactions/SubmitOrderRequest`,
        {
          id: reference,
          currency: currency || 'UGX',
          amount: parseFloat(amount),
          description: description,
          callback_url: callback_url || `${appBaseUrl}/payment/callback.html`,
          cancellation_url: cancel_url || `${appBaseUrl}/payment/cancel.html`,
          notification_id: process.env.PESAPAL_NOTIFICATION_ID || '',
          billing_address: {
            email_address: email,
            phone_number: phone || '',
            country_code: 'UG',
            first_name: first_name || 'User',
            middle_name: '',
            last_name: last_name || '',
            line_1: '',
            line_2: '',
            city: '',
            state: '',
            postal_code: '',
            zip_code: ''
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      if (orderResponse.status !== 200 || !orderResponse.data) {
        throw new Error('Failed to create Pesapal payment order');
      }

      return res.json({
        success: true,
        reference: reference,
        checkout_url: orderResponse.data.redirect_url,
        order_tracking_id: orderResponse.data.order_tracking_id
      });
    }

    // Action: Verify Payment
    if (action === 'verify') {
      if (!order_tracking_id) {
        return res.status(400).json({ success: false, error: 'Order tracking ID is required' });
      }

      // Get OAuth token
      const token = await getPesapalToken(consumerKey, consumerSecret, baseUrl);

      // Verify payment with Pesapal
      const verifyResponse = await axios.get(
        `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (verifyResponse.status !== 200 || !verifyResponse.data) {
        throw new Error('Failed to verify payment');
      }

      const pesapalData = verifyResponse.data;
      const status = pesapalData.payment_status_description || pesapalData.status || '';
      const isCompleted = status.toLowerCase() === 'completed' || status.toLowerCase() === 'success';

      return res.json({
        success: isCompleted,
        reference: pesapalData.merchant_reference || '',
        amount: pesapalData.amount || pesapalData.payment_amount,
        currency: pesapalData.currency_code || 'UGX',
        status: status,
        order_tracking_id: order_tracking_id
      });
    }

    return res.status(400).json({ success: false, error: 'Invalid action. Use "initialize" or "verify"' });
    
  } catch (error) {
    console.error('Pesapal error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Payment processing failed' 
    });
  }
}

