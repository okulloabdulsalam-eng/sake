package com.kiuma.app.data

import com.kiuma.app.data.local.MediaDao
import com.kiuma.app.data.local.MediaItemEntity
import com.kiuma.app.data.remote.MediaApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

/**
 * Offline-first media repository.
 * - When online: fetch from API and update Room (never clear UI on failure).
 * - UI always observes Room (Flow); list remains visible offline.
 */
class MediaRepository(
    private val mediaDao: MediaDao,
    private val api: MediaApiService,
    private val isOnline: () -> Boolean
) {

    fun getMediaFlow(filterType: String?): Flow<List<MediaItemEntity>> = when (filterType) {
        null, "all" -> mediaDao.getAllMedia()
        "downloads" -> mediaDao.getDownloadedMedia()
        else -> mediaDao.getMediaByType(filterType)
    }

    suspend fun refreshFromApiIfOnline() {
        if (!isOnline()) return
        withContext(Dispatchers.IO) {
            try {
                val items = api.fetchAllMedia()
                val existing = mediaDao.getAllMediaOnce()
                val existingMap = existing.associate { it.id to it.localPath }
                val entities = items.map { item ->
                    MediaItemEntity(
                        id = item.id,
                        title = item.title,
                        description = item.description,
                        thumbnailUrl = item.thumbnailUrl,
                        mediaUrl = item.mediaUrl,
                        mediaType = item.mediaType,
                        lastUpdated = System.currentTimeMillis(),
                        localPath = existingMap[item.id],
                        size = item.size
                    )
                }
                mediaDao.insertAll(entities)
            } catch (_: Exception) {
                // Do not clear UI; keep showing cached data
            }
        }
    }

    suspend fun getById(id: String): MediaItemEntity? = withContext(Dispatchers.IO) {
        mediaDao.getById(id)
    }

    suspend fun setLocalPath(id: String, path: String?) = withContext(Dispatchers.IO) {
        mediaDao.setLocalPath(id, path)
    }
}
