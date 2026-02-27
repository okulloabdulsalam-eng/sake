package com.kiuma.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "notifications",
    indices = [Index(value = ["id"], unique = true)]
)
data class NotificationEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val message: String,
    val icon: String = "fas fa-bell",
    val category: String = "general",
    val status: String = "unread",
    val date: String,
    val lastUpdated: Long,
    val relatedPageUrl: String? = null
)
