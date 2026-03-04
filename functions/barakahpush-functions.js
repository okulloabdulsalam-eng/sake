/**
 * BarakahPush Notification System – Active
 * 
 * Firebase Cloud Functions for scheduled and manual notifications
 * Handles: Hijri calendar notifications, gender-based notifications, admin sends
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Send notification to all users via FCM DATA messages
 */
async function sendBarakahPushNotification(title, body, type = 'general', sendEmail = false) {
  try {
    // Get all user tokens
    const tokensSnapshot = await db.collection('user_tokens').get();
    const tokens = [];
    
    tokensSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcm_token && data.fcm_token !== '') {
        tokens.push({
          token: data.fcm_token,
          user_id: doc.id
        });
      }
    });

    if (tokens.length === 0) {
      console.log('[BarakahPush] No FCM tokens found');
      return { success: false, message: 'No tokens found' };
    }

    // Create notification record for each user
    const batch = db.batch();
    const notificationId = Date.now().toString();

    tokens.forEach(({ user_id }) => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        title: title,
        body: body,
        type: type,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        sent_by_admin: true,
        email_enabled: sendEmail,
        is_read: false,
        user_id: user_id
      });
    });

    await batch.commit();

    // Send FCM DATA messages (WebView-safe)
    const messages = tokens.map(({ token }) => ({
      token: token,
      data: {
        notification_id: notificationId,
        title: title,
        body: body,
        type: type,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      // Use DATA message only (no notification payload for WebView compatibility)
      android: {
        priority: 'high',
        data: {
          notification_id: notificationId,
          title: title,
          body: body,
          type: type
        }
      },
      apns: {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default'
          },
          notification_id: notificationId,
          title: title,
          body: body,
          type: type
        }
      }
    }));

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const response = await admin.messaging().sendAll(batch);
      
      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`[BarakahPush] Failed to send to token ${batch[idx].token}:`, resp.error);
        }
      });
    }

    console.log(`[BarakahPush] Sent ${successCount} notifications, ${failCount} failed`);

    // Send emails if enabled (implement email service here)
    if (sendEmail) {
      // TODO: Implement email sending
      console.log('[BarakahPush] Email sending not yet implemented');
    }

    return {
      success: true,
      sent: successCount,
      failed: failCount,
      total: tokens.length
    };
  } catch (error) {
    console.error('[BarakahPush] Error sending notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to specific users (by gender)
 */
async function sendBarakahPushToGender(gender, title, body, type = 'general') {
  try {
    // Get user IDs by gender (assuming you have a users collection with gender field)
    const usersSnapshot = await db.collection('users')
      .where('gender', '==', gender)
      .get();

    const userIds = [];
    usersSnapshot.forEach(doc => {
      userIds.push(doc.id);
    });

    if (userIds.length === 0) {
      console.log(`[BarakahPush] No users found with gender: ${gender}`);
      return { success: false, message: 'No users found' };
    }

    // Get FCM tokens for these users
    const tokensSnapshot = await db.collection('user_tokens')
      .where(admin.firestore.FieldPath.documentId(), 'in', userIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    const tokens = [];
    tokensSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcm_token) {
        tokens.push({
          token: data.fcm_token,
          user_id: doc.id
        });
      }
    });

    // For more than 10 users, need to batch queries
    // Simplified for now - implement batching if needed

    // Send notifications
    const notificationId = Date.now().toString();
    const batch = db.batch();

    tokens.forEach(({ user_id }) => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        title: title,
        body: body,
        type: type,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        sent_by_admin: false,
        email_enabled: false,
        is_read: false,
        user_id: user_id
      });
    });

    await batch.commit();

    // Send FCM messages
    const messages = tokens.map(({ token }) => ({
      token: token,
      data: {
        notification_id: notificationId,
        title: title,
        body: body,
        type: type
      }
    }));

    const response = await admin.messaging().sendAll(messages);
    const successCount = response.responses.filter(r => r.success).length;

    return {
      success: true,
      sent: successCount,
      total: tokens.length
    };
  } catch (error) {
    console.error('[BarakahPush] Error sending gender-based notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current Hijri date
 * Simplified - use a proper Hijri calendar library in production
 */
function getHijriDate() {
  // This is a simplified version - use a proper library like 'hijri-date' in production
  const today = new Date();
  // Approximate conversion (not accurate - use proper library)
  const hijriYear = Math.floor((today.getFullYear() - 622) * 1.0307);
  const hijriMonth = Math.floor((today.getMonth() + 1) * 0.97);
  const hijriDay = Math.floor(today.getDate() * 0.97);
  
  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear
  };
}

/**
 * Scheduled function: Hijri calendar notifications
 * Runs every hour to check if it's time to send
 */
exports.sendHijriNotifications = onSchedule('0 * * * *', async (event) => {
  const hijri = getHijriDate();
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Check if it's one of the white days (10th, 11th, 12th)
  const isWhiteDay = hijri.day >= 10 && hijri.day <= 12;

  if (!isWhiteDay) {
    console.log('[BarakahPush] Not a white day, skipping');
    return;
  }

  // Check if it's one of the scheduled times
  const scheduledTimes = [8, 12, 22]; // 8 AM, 12 PM, 10 PM
  if (!scheduledTimes.includes(hour) || minute !== 0) {
    console.log('[BarakahPush] Not a scheduled time, skipping');
    return;
  }

  const title = 'Fasting Reminder';
  const body = 'Reminder: Tomorrow is from the white days. Prepare to fast and seek reward.';

  const result = await sendBarakahPushNotification(title, body, 'hijri', true);
  console.log('[BarakahPush] Hijri notification sent:', result);
  
  return result;
});

/**
 * Scheduled function: Gender-based prayer reminders (MALE only)
 * Runs every hour to check if it's time to send
 */
exports.sendPrayerReminders = onSchedule('0 * * * *', async (event) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Check if it's 8 AM (Fajr) or 9 PM (Isha)
  if ((hour === 8 && minute === 0) || (hour === 21 && minute === 0)) {
    const title = hour === 8 ? 'Fajr Prayer Reminder' : 'Isha Prayer Reminder';
    const body = 'Have you prayed ' + (hour === 8 ? 'Fajr' : 'Isha') + ' in Jamaah today?';

    const result = await sendBarakahPushToGender('MALE', title, body, 'prayer');
    console.log('[BarakahPush] Prayer reminder sent:', result);
    
    return result;
  }

  return { success: true, message: 'Not a scheduled time' };
});

/**
 * HTTP function: Admin send notification
 */
exports.adminSendNotification = functions.https.onCall(async (data, context) => {
  // Verify admin (you can use Firebase Custom Claims here)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user is admin (implement your admin check here)
  // For now, using password check - replace with proper admin check
  const isAdmin = data.password === 'kiuma2025';
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { title, body, send_email, send_push } = data;

  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body are required');
  }

  const result = await sendBarakahPushNotification(
    title,
    body,
    'admin',
    send_email || false
  );

  return result;
});

