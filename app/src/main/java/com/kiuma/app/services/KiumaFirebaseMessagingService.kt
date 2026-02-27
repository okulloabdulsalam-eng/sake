package com.kiuma.app.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.kiuma.app.KiumaApplication
import com.kiuma.app.MainActivity
import com.kiuma.app.helpers.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Handles FCM push notifications. Saves to Room (offline-first) and shows system notification.
 * Works when app is in background or closed.
 * Backend should send data-only messages (no "notification" payload) so onMessageReceived
 * is always called; we then save to Room and show our own notification with click handling.
 */
class KiumaFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "KiumaFCM"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val title = data["title"] ?: message.notification?.title ?: "KIUMA"
        val body = data["body"] ?: message.notification?.body ?: ""
        val url = data["url"] ?: data["click_action"] ?: data["relatedPageUrl"]
        val id = data["id"] ?: "fcm-${System.currentTimeMillis()}"

        scope.launch {
            try {
                val app = application as? KiumaApplication ?: return@launch
                app.getNotificationRepository().insertFromFcm(id, title, body, url.ifBlank { null })
            } catch (e: Exception) {
                Log.e(TAG, "Error saving FCM to Room", e)
            }
        }

        val notificationHelper = NotificationHelper(this)
        val notificationId = notificationHelper.showNotificationWithClickUrl(
            title = title,
            message = body,
            clickUrl = url?.takeIf { it.isNotBlank() }
        )
        if (notificationId < 0) {
            Log.w(TAG, "Could not show notification (permission denied?)")
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed")
        sendTokenToBackend(token)
    }

    private fun sendTokenToBackend(token: String) {
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val doc = hashMapOf(
                "token" to token,
                "platform" to "android",
                "updatedAt" to com.google.firebase.Timestamp.now()
            )
            val docId = "android_${android.provider.Settings.Secure.getString(applicationContext.contentResolver, android.provider.Settings.Secure.ANDROID_ID) ?: token.hashCode()}"
            db.collection("fcm_tokens")
                .document(docId)
                .set(doc)
                .addOnSuccessListener { Log.d(TAG, "FCM token sent to Firestore") }
                .addOnFailureListener { e -> Log.e(TAG, "Failed to send token to backend", e) }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending FCM token", e)
        }
    }
}
