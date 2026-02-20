package com.kiuma.app.services

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.kiuma.app.KiumaApplication
import com.kiuma.app.R

class DownloadService : Service() {

    companion object {
        const val NOTIFICATION_ID = 1
        const val ACTION_START = "com.kiuma.app.action.START_DOWNLOAD"
        const val ACTION_STOP = "com.kiuma.app.action.STOP_DOWNLOAD"
        const val EXTRA_URL = "extra_url"
        const val EXTRA_FILENAME = "extra_filename"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val url = intent.getStringExtra(EXTRA_URL)
                val filename = intent.getStringExtra(EXTRA_FILENAME) ?: "file"
                startForeground(NOTIFICATION_ID, createNotification(filename))
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotification(filename: String): Notification {
        return NotificationCompat.Builder(this, KiumaApplication.CHANNEL_DOWNLOADS)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("Downloading")
            .setContentText(filename)
            .setProgress(0, 0, true)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
