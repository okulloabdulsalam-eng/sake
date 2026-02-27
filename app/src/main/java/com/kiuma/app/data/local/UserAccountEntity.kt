package com.kiuma.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_account")
data class UserAccountEntity(
    @PrimaryKey
    val id: Int = 1,
    val userJson: String,
    val updatedAt: Long = System.currentTimeMillis()
)
