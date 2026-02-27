package com.kiuma.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface UserAccountDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: UserAccountEntity)

    @Query("SELECT * FROM user_account WHERE id = 1 LIMIT 1")
    suspend fun getAccount(): UserAccountEntity?

    @Query("DELETE FROM user_account")
    suspend fun clear()
}
