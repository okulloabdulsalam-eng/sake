/**
 * Firebase Cloud Messaging (FCM) - Server-side Notification Sender
 * 
 * This Node.js script uses Firebase Admin SDK to send push notifications
 * to devices registered with FCM tokens.
 * 
 * @fileoverview
 * Production-ready server-side notification sender with comprehensive
 * error handling, batch sending, and token management.
 * 
 * Requirements:
 * - Firebase Admin SDK installed: npm install firebase-admin
 * - Service account key JSON file from Firebase Console
 * - FCM tokens stored in your database
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path');

/**
 * Initialize Firebase Admin SDK
 * 
 * IMPORTANT: Replace the path to your service account key file
 * Get this from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
 * 
 * Best Practice: Store the service account key file securely and never commit it to Git
 */
let serviceAccount;
try {
    // Option 1: Load from JSON file (recommended for development)
    // Replace 'path/to/serviceAccountKey.json' with your actual file path
    serviceAccount = require('./serviceAccountKey.json');
    
    // Option 2: Use environment variables (recommended for production)
    // Uncomment and use this instead:
    /*
    serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };
    */
} catch (error) {
    console.error('Error loading service account key:', error.message);
    console.error('Please ensure serviceAccountKey.json exists in the server directory');
    process.exit(1);
}

/**
 * Initialize Firebase Admin App
 * Only initialize if not already initialized (prevents re-initialization errors)
 */
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized');
}

/**
 * Send Push Notification to Single Device
 * 
 * @param {string} token - FCM registration token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @param {Object} options - Additional options (priority, timeToLive, etc.)
 * @returns {Promise<Object>} Response from FCM
 * 
 * @example
 * sendNotificationToDevice(
 *   'fcm-token-here',
 *   {
 *     title: 'New Event',
 *     body: 'You have a new event scheduled',
 *     icon: '/logo.png'
 *   },
 *   {
 *     click_action: '/events.html',
 *     eventId: '123'
 *   }
 * );
 */
async function sendNotificationToDevice(token, notification, data = {}, options = {}) {
    try {
        // Validate token
        if (!token || typeof token !== 'string') {
            throw new Error('Invalid FCM token provided');
        }

        // Build message payload
        const message = {
            // Notification payload (displayed to user)
            notification: {
                title: notification.title || 'New Notification',
                body: notification.body || 'You have a new message',
                icon: notification.icon || '/logo.png',
                image: notification.image, // Optional: Large image
                sound: notification.sound || 'default',
                ...notification
            },
            
            // Data payload (custom data sent with notification)
            data: {
                // Convert all data values to strings (FCM requirement)
                ...Object.keys(data).reduce((acc, key) => {
                    acc[key] = String(data[key]);
                    return acc;
                }, {}),
                // Ensure click_action is included
                click_action: data.click_action || data.url || '/notifications.html',
                timestamp: String(Date.now())
            },
            
            // Token to send to
            token: token,
            
            // Web push specific options
            webpush: {
                notification: {
                    icon: notification.icon || '/logo.png',
                    badge: notification.icon || '/logo.png',
                    requireInteraction: options.requireInteraction || false,
                    vibrate: options.vibrate || [200, 100, 200],
                    ...notification
                },
                fcmOptions: {
                    link: data.click_action || data.url || '/notifications.html'
                }
            },
            
            // Android specific options (if needed)
            android: {
                priority: options.priority || 'high',
                notification: {
                    sound: notification.sound || 'default',
                    channelId: options.channelId || 'default'
                }
            },
            
            // APNS specific options (if needed for iOS)
            apns: {
                payload: {
                    aps: {
                        sound: notification.sound || 'default',
                        badge: options.badge
                    }
                }
            }
        };

        // Send the message
        const response = await admin.messaging().send(message);
        
        console.log('Successfully sent notification:', response);
        return {
            success: true,
            messageId: response,
            token: token
        };

    } catch (error) {
        console.error('Error sending notification:', error);
        
        // Handle specific error cases
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
            // Token is invalid or unregistered - should be removed from database
            return {
                success: false,
                error: 'invalid_token',
                message: 'Token is invalid or unregistered',
                token: token
            };
        }
        
        return {
            success: false,
            error: error.code || 'unknown_error',
            message: error.message,
            token: token
        };
    }
}

/**
 * Send Push Notification to Multiple Devices
 * 
 * @param {Array<string>} tokens - Array of FCM registration tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Results with success/failure counts
 * 
 * @example
 * sendNotificationToMultipleDevices(
 *   ['token1', 'token2', 'token3'],
 *   {
 *     title: 'Announcement',
 *     body: 'Important announcement for all users'
 *   },
 *   {
 *     click_action: '/notifications.html'
 *   }
 * );
 */
async function sendNotificationToMultipleDevices(tokens, notification, data = {}, options = {}) {
    try {
        // Validate tokens array
        if (!Array.isArray(tokens) || tokens.length === 0) {
            throw new Error('Invalid tokens array provided');
        }

        // FCM allows up to 500 tokens per batch
        const MAX_TOKENS_PER_BATCH = 500;
        const batches = [];
        
        // Split tokens into batches
        for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_BATCH) {
            batches.push(tokens.slice(i, i + MAX_TOKENS_PER_BATCH));
        }

        const results = {
            total: tokens.length,
            successful: 0,
            failed: 0,
            invalidTokens: [],
            errors: []
        };

        // Process each batch
        for (const batch of batches) {
            const message = {
                notification: {
                    title: notification.title || 'New Notification',
                    body: notification.body || 'You have a new message',
                    icon: notification.icon || '/logo.png',
                    image: notification.image,
                    sound: notification.sound || 'default',
                    ...notification
                },
                data: {
                    ...Object.keys(data).reduce((acc, key) => {
                        acc[key] = String(data[key]);
                        return acc;
                    }, {}),
                    click_action: data.click_action || data.url || '/notifications.html',
                    timestamp: String(Date.now())
                },
                tokens: batch,
                webpush: {
                    notification: {
                        icon: notification.icon || '/logo.png',
                        badge: notification.icon || '/logo.png',
                        requireInteraction: options.requireInteraction || false,
                        vibrate: options.vibrate || [200, 100, 200]
                    },
                    fcmOptions: {
                        link: data.click_action || data.url || '/notifications.html'
                    }
                }
            };

            try {
                const response = await admin.messaging().sendEachForMulticast(message);
                
                results.successful += response.successCount;
                results.failed += response.failureCount;
                
                // Collect invalid tokens
                if (response.responses) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            if (resp.error?.code === 'messaging/invalid-registration-token' ||
                                resp.error?.code === 'messaging/registration-token-not-registered') {
                                results.invalidTokens.push(batch[idx]);
                            }
                            results.errors.push({
                                token: batch[idx],
                                error: resp.error?.code || 'unknown',
                                message: resp.error?.message || 'Unknown error'
                            });
                        }
                    });
                }
                
            } catch (batchError) {
                console.error('Error sending batch:', batchError);
                results.failed += batch.length;
                results.errors.push({
                    batch: batch,
                    error: batchError.code || 'unknown',
                    message: batchError.message || 'Unknown error'
                });
            }
        }

        console.log(`Notification sending complete: ${results.successful} successful, ${results.failed} failed`);
        return results;

    } catch (error) {
        console.error('Error in sendNotificationToMultipleDevices:', error);
        throw error;
    }
}

/**
 * Send Notification to Topic
 * 
 * Topics allow you to send notifications to groups of devices
 * that have subscribed to a specific topic.
 * 
 * @param {string} topic - Topic name (e.g., 'all-users', 'events', 'announcements')
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} Response from FCM
 */
async function sendNotificationToTopic(topic, notification, data = {}) {
    try {
        const message = {
            notification: {
                title: notification.title || 'New Notification',
                body: notification.body || 'You have a new message',
                icon: notification.icon || '/logo.png',
                image: notification.image,
                sound: notification.sound || 'default'
            },
            data: {
                ...Object.keys(data).reduce((acc, key) => {
                    acc[key] = String(data[key]);
                    return acc;
                }, {}),
                click_action: data.click_action || data.url || '/notifications.html',
                timestamp: String(Date.now())
            },
            topic: topic,
            webpush: {
                notification: {
                    icon: notification.icon || '/logo.png',
                    badge: notification.icon || '/logo.png'
                },
                fcmOptions: {
                    link: data.click_action || data.url || '/notifications.html'
                }
            }
        };

        const response = await admin.messaging().send(message);
        
        console.log('Successfully sent notification to topic:', topic, response);
        return {
            success: true,
            messageId: response,
            topic: topic
        };

    } catch (error) {
        console.error('Error sending notification to topic:', error);
        throw error;
    }
}

/**
 * Example Usage Function
 * 
 * This demonstrates how to use the notification functions
 */
async function exampleUsage() {
    // Example 1: Send to single device
    const token = 'YOUR_FCM_TOKEN_HERE';
    await sendNotificationToDevice(
        token,
        {
            title: 'Welcome to KIUMA!',
            body: 'Thank you for joining our community.',
            icon: '/logo.png'
        },
        {
            click_action: '/notifications.html',
            type: 'welcome'
        }
    );

    // Example 2: Send to multiple devices
    const tokens = ['token1', 'token2', 'token3'];
    await sendNotificationToMultipleDevices(
        tokens,
        {
            title: 'New Event',
            body: 'Check out our upcoming event!',
            icon: '/logo.png'
        },
        {
            click_action: '/events.html',
            eventId: '123'
        }
    );

    // Example 3: Send to topic
    await sendNotificationToTopic(
        'all-users',
        {
            title: 'Announcement',
            body: 'Important announcement for all members',
            icon: '/logo.png'
        },
        {
            click_action: '/notifications.html',
            type: 'announcement'
        }
    );
}

// Export functions for use in other files
module.exports = {
    sendNotificationToDevice,
    sendNotificationToMultipleDevices,
    sendNotificationToTopic,
    admin // Export admin instance if needed elsewhere
};

// If running directly, show usage
if (require.main === module) {
    console.log('FCM Notification Sender');
    console.log('Import this module to use the notification functions');
    console.log('\nExample:');
    console.log('const { sendNotificationToDevice } = require("./send-notification");');
    console.log('sendNotificationToDevice(token, notification, data);');
}

