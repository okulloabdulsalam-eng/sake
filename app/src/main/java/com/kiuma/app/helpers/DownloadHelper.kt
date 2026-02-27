package com.kiuma.app.helpers

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.util.Log
import android.webkit.CookieManager
import android.webkit.MimeTypeMap
import android.webkit.URLUtil
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class DownloadHelper(private val context: Context) {

    companion object {
        private const val TAG = "DownloadHelper"
        private const val PREF_NAME = "kiuma_downloads"
        private const val KEY_INDEX = "download_index"
        private const val KIUMA_SUBDIR = "KIUMA"
    }

    private val downloadManager: DownloadManager by lazy {
        context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    }

    private val prefs by lazy {
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    // downloadId -> (fileName, mimeType, category, absolutePath)
    private val activeDownloads = mutableMapOf<Long, Quad<String, String, String, String>>()

    private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

    fun downloadFile(
        url: String,
        userAgent: String,
        contentDisposition: String,
        mimeType: String,
        contentLength: Long
    ): Long {
        return downloadFileWithCategory(url, userAgent, contentDisposition, mimeType, contentLength, categoryFromMime(mimeType, url))
    }

    fun downloadFileWithCategory(
        url: String,
        userAgent: String,
        contentDisposition: String,
        mimeType: String,
        contentLength: Long,
        category: String
    ): Long {
        try {
            val fileName = getFileName(url, contentDisposition, mimeType)
            val (destDir, subdir) = getAppDownloadDir(mimeType, fileName)
            val destFile = File(destDir, fileName)

            Log.d(TAG, "Starting download: $fileName -> ${destFile.absolutePath}")

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle(fileName)
                setDescription("Downloading $fileName")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationUri(Uri.fromFile(destFile))
                if (userAgent.isNotEmpty()) addRequestHeader("User-Agent", userAgent)
                val cookies = CookieManager.getInstance().getCookie(url)
                if (!cookies.isNullOrEmpty()) addRequestHeader("Cookie", cookies)
                setAllowedNetworkTypes(
                    DownloadManager.Request.NETWORK_WIFI or DownloadManager.Request.NETWORK_MOBILE
                )
                setAllowedOverRoaming(true)
                if (mimeType.isNotEmpty()) setMimeType(mimeType)
            }

            val downloadId = downloadManager.enqueue(request)
            activeDownloads[downloadId] = Quad(fileName, mimeType, subdir, destFile.absolutePath)
            Toast.makeText(context, "Download started: $fileName", Toast.LENGTH_SHORT).show()
            return downloadId
        } catch (e: Exception) {
            Log.e(TAG, "Download failed", e)
            Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
            return -1
        }
    }

    private fun categoryFromMime(mimeType: String, url: String): String {
        val lower = url.lowercase()
        return when {
            mimeType.startsWith("video/") || lower.contains(".mp4") || lower.contains(".webm") -> "video"
            mimeType.startsWith("audio/") || lower.contains(".mp3") || lower.contains(".m4a") -> "audio"
            mimeType == "application/pdf" || lower.endsWith(".pdf") -> "books"
            lower.endsWith(".epub") || lower.endsWith(".doc") || lower.endsWith(".docx") -> "books"
            else -> "other"
        }
    }

    private fun getAppDownloadDir(mimeType: String, fileName: String): Pair<File, String> {
        val base = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            ?: context.filesDir
        val kiumaDir = File(base, KIUMA_SUBDIR)
        val subdir = when {
            mimeType.startsWith("video/") || fileName.endsWith(".mp4", true) || fileName.endsWith(".webm", true) -> "Videos"
            mimeType.startsWith("audio/") || fileName.endsWith(".mp3", true) || fileName.endsWith(".m4a", true) -> "Audio"
            mimeType.contains("pdf") || fileName.endsWith(".pdf", true) || fileName.endsWith(".epub", true) -> "Books"
            else -> "Other"
        }
        val dir = File(kiumaDir, subdir)
        dir.mkdirs()
        return Pair(dir, subdir.lowercase())
    }

    private fun getFileName(url: String, contentDisposition: String, mimeType: String): String {
        var fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
        fileName = fileName.replace("[^a-zA-Z0-9._-]".toRegex(), "_")
        if (!fileName.contains(".")) {
            val ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)
            if (!ext.isNullOrEmpty()) fileName = "$fileName.$ext"
        }
        return fileName
    }

    fun onDownloadComplete(downloadId: Long): String? {
        val meta = activeDownloads.remove(downloadId) ?: return null
        val (fileName, mimeType, category, destPath) = meta

        val query = DownloadManager.Query().setFilterById(downloadId)
        val cursor = downloadManager.query(query)
        var addedPath: String? = null
        if (cursor.moveToFirst()) {
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                val path = destPath
                val file = File(path)
                if (file.exists()) {
                    val size = file.length()
                    addToIndex(path, fileName, mimeType, size, category)
                    addedPath = path
                    Toast.makeText(context, "Saved: $fileName", Toast.LENGTH_LONG).show()
                }
            } else {
                val reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
                Log.e(TAG, "Download failed: $reason")
                Toast.makeText(context, "Download failed: $fileName", Toast.LENGTH_LONG).show()
            }
        }
        cursor.close()
        return addedPath
    }

    private fun addToIndex(path: String, name: String, mimeType: String, size: Long, category: String) {
        try {
            val list = getIndexJson().toMutableList()
            list.add(0, mapOf(
                "path" to path,
                "name" to name,
                "mimeType" to mimeType,
                "size" to size,
                "category" to category,
                "date" to System.currentTimeMillis()
            ))
            val arr = JSONArray()
            list.forEach { item ->
                arr.put(JSONObject(item))
            }
            prefs.edit().putString(KEY_INDEX, arr.toString()).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error adding to download index", e)
        }
    }

    fun getDownloadIndex(): String {
        return try {
            val list = getIndexJson()
            val arr = JSONArray()
            list.forEach { arr.put(JSONObject(it)) }
            arr.toString()
        } catch (e: Exception) {
            Log.e(TAG, "Error reading download index", e)
            "[]"
        }
    }

    private fun getIndexJson(): List<Map<String, Any>> {
        val raw = prefs.getString(KEY_INDEX, "[]") ?: "[]"
        val arr = JSONArray(raw)
        val list = mutableListOf<Map<String, Any>>()
        for (i in 0 until arr.length()) {
            val obj = arr.optJSONObject(i) ?: continue
            val path = obj.optString("path", "")
            if (path.isEmpty()) continue
            if (!File(path).exists()) continue
            list.add(mapOf(
                "path" to path,
                "name" to obj.optString("name", "Unknown"),
                "mimeType" to obj.optString("mimeType", ""),
                "size" to obj.optLong("size", 0),
                "category" to obj.optString("category", "other"),
                "date" to obj.optLong("date", 0)
            ))
        }
        return list
    }

    fun removeFromIndex(path: String) {
        try {
            val list = getIndexJson().filter { it["path"] != path }
            val arr = JSONArray()
            list.forEach { arr.put(JSONObject(it)) }
            prefs.edit().putString(KEY_INDEX, arr.toString()).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error removing from index", e)
        }
    }

    fun cancelDownload(downloadId: Long) {
        downloadManager.remove(downloadId)
        activeDownloads.remove(downloadId)
    }

    fun cancelAllDownloads() {
        activeDownloads.keys.forEach { downloadManager.remove(it) }
        activeDownloads.clear()
    }
}
