package com.kiuma.app.data

import com.kiuma.app.data.local.NotificationDao
import com.kiuma.app.data.local.NotificationEntity
import com.kiuma.app.data.remote.NotificationApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

/**
 * Offline-first notifications repository.
 * - UI always observes Room; never cleared on network failure.
 * - When online: fetch from API and update Room.
 */
class NotificationRepository(
    private val notificationDao: NotificationDao,
    private val api: NotificationApiService,
    private val isOnline: () -> Boolean
) {

    fun getNotificationsFlow(): Flow<List<NotificationEntity>> =
        notificationDao.getAllNotifications()

    suspend fun refreshFromApiIfOnline() {
        if (!isOnline()) return
        withContext(Dispatchers.IO) {
            try {
                val items = api.fetchNotifications()
                val entities = items.map { item ->
                    NotificationEntity(
                        id = item.id,
                        title = item.title,
                        message = item.message,
                        icon = item.icon ?: "fas fa-bell",
                        category = item.category ?: "general",
                        status = item.status ?: "read",
                        date = item.date ?: item.createdAt ?: "",
                        lastUpdated = System.currentTimeMillis(),
                        relatedPageUrl = item.relatedPageUrl
                    )
                }
                notificationDao.insertAll(entities)
            } catch (_: Exception) {
                // Do NOT clear; keep showing cached data
            }
        }
    }

    /** Insert notification from FCM payload. Called by FirebaseMessagingService. */
    suspend fun insertFromFcm(
        id: String,
        title: String,
        message: String,
        relatedPageUrl: String?
    ) = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val isoDate = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            .format(java.util.Date(now))
        val entity = NotificationEntity(
            id = id,
            title = title,
            message = message,
            icon = "fas fa-bell",
            category = "general",
            status = "unread",
            date = isoDate,
            lastUpdated = now,
            relatedPageUrl = relatedPageUrl
        )
        notificationDao.insert(entity)
    }

    suspend fun updateReadStatus(id: String, status: String) = withContext(Dispatchers.IO) {
        notificationDao.updateReadStatus(id, status)
    }
}
