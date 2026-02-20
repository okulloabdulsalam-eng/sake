package com.kiuma.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationManagerCompat

class KiumaApplication : Application() {

    companion object {
        const val CHANNEL_DOWNLOADS = "downloads_channel"
        const val CHANNEL_NOTIFICATIONS = "notifications_channel"
        const val CHANNEL_UPDATES = "updates_channel"
        
        lateinit var instance: KiumaApplication
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
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
