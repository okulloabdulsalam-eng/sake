package com.kiuma.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import com.kiuma.app.data.MediaRepository
import com.kiuma.app.data.NetworkMonitor
import com.kiuma.app.data.NotificationRepository
import com.kiuma.app.data.local.AppDatabase
import com.kiuma.app.data.remote.MediaApiService
import com.kiuma.app.data.remote.NotificationApiService
import com.kiuma.app.ui.media.MediaViewModelFactory
import com.kiuma.app.ui.media.MediaViewModelProvider
import com.kiuma.app.ui.notifications.NotificationViewModelFactory
import com.kiuma.app.ui.notifications.NotificationViewModelProvider
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch

class KiumaApplication : Application(), MediaViewModelProvider, NotificationViewModelProvider {

    companion object {
        const val CHANNEL_DOWNLOADS = "downloads_channel"
        const val CHANNEL_NOTIFICATIONS = "notifications_channel"
        const val CHANNEL_UPDATES = "updates_channel"
        
        lateinit var instance: KiumaApplication
            private set
    }

    private val database by lazy { AppDatabase.getInstance(this) }
    private val mediaApi by lazy { MediaApiService() }
    private val notificationApi by lazy { NotificationApiService() }
    private val networkMonitor by lazy { NetworkMonitor(this) }

    override val mediaRepository: MediaRepository by lazy {
        MediaRepository(
            mediaDao = database.mediaDao(),
            api = mediaApi,
            isOnline = { networkMonitor.isOnline() }
        )
    }

    private val notificationRepository: NotificationRepository by lazy {
        NotificationRepository(
            notificationDao = database.notificationDao(),
            api = notificationApi,
            isOnline = { networkMonitor.isOnline() }
        )
    }

    override val mediaViewModelFactory: MediaViewModelFactory by lazy {
        MediaViewModelFactory(mediaRepository)
    }

    override val notificationViewModelFactory: NotificationViewModelFactory by lazy {
        NotificationViewModelFactory(notificationRepository)
    }

    override val networkMonitor: NetworkMonitor get() = networkMonitor

    fun getNotificationRepository(): NotificationRepository = notificationRepository

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
        startNetworkRefreshObserver()
        requestFcmToken()
    }

    private fun requestFcmToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful && task.result != null) {
                android.util.Log.d("KiumaFCM", "FCM token obtained")
                sendTokenToBackend(task.result!!)
            }
        }
    }

    private fun sendTokenToBackend(token: String) {
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val doc = hashMapOf<String, Any>(
                "token" to token,
                "platform" to "android",
                "updatedAt" to com.google.firebase.Timestamp.now()
            )
            val androidId = android.provider.Settings.Secure.getString(
                contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: token.hashCode().toString()
            val docId = "android_$androidId"
            db.collection("fcm_tokens").document(docId).set(doc)
                .addOnSuccessListener { android.util.Log.d("KiumaFCM", "Token sent to Firestore") }
                .addOnFailureListener { e -> android.util.Log.e("KiumaFCM", "Failed to send token", e) }
        } catch (e: Exception) {
            android.util.Log.e("KiumaFCM", "Error sending token", e)
        }
    }

    /** When network returns (offline -> online), refresh all repositories. Database is single source of truth. */
    private fun startNetworkRefreshObserver() {
        appScope.launch {
            var wasOffline = !networkMonitor.isOnline()
            networkMonitor.onlineFlow
                .distinctUntilChanged()
                .collect { isOnline ->
                    if (wasOffline && isOnline) {
                        kotlinx.coroutines.withContext(Dispatchers.IO) {
                            try { mediaRepository.refreshFromApiIfOnline() } catch (_: Exception) {}
                            try { notificationRepository.refreshFromApiIfOnline() } catch (_: Exception) {}
                        }
                    }
                    wasOffline = !isOnline
                }
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Downloads channel
            val downloadsChannel = NotificationChannel(
                CHANNEL_DOWNLOADS,
                "Downloads",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "File download notifications"
                setShowBadge(false)
            }

            // General notifications channel - Heads-up/popup notifications
            val notificationsChannel = NotificationChannel(
                CHANNEL_NOTIFICATIONS,
                "KIUMA Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "KIUMA notifications and alerts"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                enableLights(true)
                lightColor = android.graphics.Color.GREEN
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }

            // Updates channel
            val updatesChannel = NotificationChannel(
                CHANNEL_UPDATES,
                "Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "App and content updates"
            }

            notificationManager.createNotificationChannels(
                listOf(downloadsChannel, notificationsChannel, updatesChannel)
            )
        }
    }
}
