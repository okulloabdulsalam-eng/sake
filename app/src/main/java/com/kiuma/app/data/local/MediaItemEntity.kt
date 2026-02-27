package com.kiuma.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "media_items",
    indices = [Index(value = ["mediaUrl"], unique = true), Index(value = ["mediaType"])]
)
data class MediaItemEntity(
    @PrimaryKey(autoGenerate = false)
    val id: String,
    val title: String,
    val description: String,
    val thumbnailUrl: String,
    val mediaUrl: String,
    val mediaType: String, // "video", "audio", "image", "book"
    val lastUpdated: Long,
    val localPath: String? = null, // set when downloaded
    val size: Long = 0
) {
    val isDownloaded: Boolean get() = !localPath.isNullOrBlank()
}
