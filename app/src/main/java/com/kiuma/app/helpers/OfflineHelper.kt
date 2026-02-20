package com.kiuma.app.helpers

import android.content.Context
import android.util.Log
import java.io.IOException

class OfflineHelper(private val context: Context) {

    companion object {
        private const val TAG = "OfflineHelper"
        private const val ASSETS_FOLDER = "sake"
    }

    fun hasLocalAssets(): Boolean {
        return try {
            val assets = context.assets.list(ASSETS_FOLDER)
            val hasAssets = !assets.isNullOrEmpty() && assets.contains("index.html")
            Log.d(TAG, "Local assets available: $hasAssets")
            hasAssets
        } catch (e: IOException) {
            Log.e(TAG, "Error checking local assets", e)
            false
        }
    }

    fun getAssetsList(): List<String> {
        return try {
            context.assets.list(ASSETS_FOLDER)?.toList() ?: emptyList()
        } catch (e: IOException) {
            Log.e(TAG, "Error listing assets", e)
            emptyList()
        }
    }

    fun assetExists(path: String): Boolean {
        return try {
            val cleanPath = path.removePrefix("/").removePrefix("sake/")
            context.assets.open("$ASSETS_FOLDER/$cleanPath").close()
            true
        } catch (e: IOException) {
            false
        }
    }

    fun getAssetContent(path: String): String? {
        return try {
            val cleanPath = path.removePrefix("/").removePrefix("sake/")
            context.assets.open("$ASSETS_FOLDER/$cleanPath").bufferedReader().use { it.readText() }
        } catch (e: IOException) {
            Log.e(TAG, "Error reading asset: $path", e)
            null
        }
    }

    fun getCacheSize(): Long {
        var size = 0L
        try {
            context.cacheDir.walkTopDown().forEach { file ->
                if (file.isFile) {
                    size += file.length()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error calculating cache size", e)
        }
        return size
    }

    fun clearCache(): Boolean {
        return try {
            context.cacheDir.deleteRecursively()
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing cache", e)
            false
        }
    }

    fun formatFileSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            bytes < 1024 * 1024 * 1024 -> "${bytes / (1024 * 1024)} MB"
            else -> "${bytes / (1024 * 1024 * 1024)} GB"
        }
    }
}
