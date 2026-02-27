package com.kiuma.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface MediaDao {

    @Query("SELECT * FROM media_items ORDER BY lastUpdated DESC")
    fun getAllMedia(): Flow<List<MediaItemEntity>>

    @Query("SELECT * FROM media_items ORDER BY lastUpdated DESC")
    suspend fun getAllMediaOnce(): List<MediaItemEntity>

    @Query("SELECT * FROM media_items WHERE mediaType = :type ORDER BY lastUpdated DESC")
    fun getMediaByType(type: String): Flow<List<MediaItemEntity>>

    @Query("SELECT * FROM media_items WHERE localPath IS NOT NULL AND localPath != ''")
    fun getDownloadedMedia(): Flow<List<MediaItemEntity>>

    @Query("SELECT * FROM media_items WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): MediaItemEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<MediaItemEntity>)

    @Update
    suspend fun update(item: MediaItemEntity)

    @Query("UPDATE media_items SET localPath = :path WHERE id = :id")
    suspend fun setLocalPath(id: String, path: String?)

    @Query("DELETE FROM media_items")
    suspend fun deleteAll()
}
