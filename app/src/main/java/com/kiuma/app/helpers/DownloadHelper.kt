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
import java.io.File

class DownloadHelper(private val context: Context) {

    companion object {
        private const val TAG = "DownloadHelper"
    }

    private val downloadManager: DownloadManager by lazy {
        context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    }

    private val activeDownloads = mutableMapOf<Long, String>()

    fun downloadFile(
        url: String,
        userAgent: String,
        contentDisposition: String,
        mimeType: String,
        contentLength: Long
    ): Long {
        try {
            val fileName = getFileName(url, contentDisposition, mimeType)
            val downloadDir = getDownloadDirectory(mimeType, fileName)
            
            Log.d(TAG, "Starting download: $fileName from $url")

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle(fileName)
                setDescription("Downloading $fileName")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                
                // Set destination
                setDestinationInExternalPublicDir(downloadDir, fileName)
                
                // Set headers
                if (userAgent.isNotEmpty()) {
                    addRequestHeader("User-Agent", userAgent)
                }
                
                // Add cookies
                val cookies = CookieManager.getInstance().getCookie(url)
                if (!cookies.isNullOrEmpty()) {
                    addRequestHeader("Cookie", cookies)
                }
                
                // Allow mobile and wifi
                setAllowedNetworkTypes(
                    DownloadManager.Request.NETWORK_WIFI or DownloadManager.Request.NETWORK_MOBILE
                )
                setAllowedOverRoaming(true)
                
                // Set MIME type if available
                if (mimeType.isNotEmpty()) {
                    setMimeType(mimeType)
                }
            }

            val downloadId = downloadManager.enqueue(request)
            activeDownloads[downloadId] = fileName
            
            Toast.makeText(context, "Download started: $fileName", Toast.LENGTH_SHORT).show()
            
            return downloadId
        } catch (e: Exception) {
            Log.e(TAG, "Download failed", e)
            Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
            return -1
        }
    }

    private fun getFileName(url: String, contentDisposition: String, mimeType: String): String {
        var fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
        
        // Clean up filename
        fileName = fileName.replace("[^a-zA-Z0-9._-]".toRegex(), "_")
        
        // Ensure file has extension
        if (!fileName.contains(".")) {
            val extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)
            if (!extension.isNullOrEmpty()) {
                fileName = "$fileName.$extension"
            }
        }
        
        return fileName
    }

    private fun getDownloadDirectory(mimeType: String, fileName: String): String {
        return when {
            mimeType.startsWith("video/") -> Environment.DIRECTORY_MOVIES
            mimeType.startsWith("audio/") -> Environment.DIRECTORY_MUSIC
            mimeType.startsWith("image/") -> Environment.DIRECTORY_PICTURES
            mimeType == "application/pdf" -> Environment.DIRECTORY_DOCUMENTS
            fileName.endsWith(".pdf", ignoreCase = true) -> Environment.DIRECTORY_DOCUMENTS
            fileName.endsWith(".epub", ignoreCase = true) -> Environment.DIRECTORY_DOCUMENTS
            fileName.endsWith(".doc", ignoreCase = true) || 
            fileName.endsWith(".docx", ignoreCase = true) -> Environment.DIRECTORY_DOCUMENTS
            else -> Environment.DIRECTORY_DOWNLOADS
        }
    }

    fun onDownloadComplete(downloadId: Long) {
        val fileName = activeDownloads.remove(downloadId)
        if (fileName != null) {
            val query = DownloadManager.Query().setFilterById(downloadId)
            val cursor = downloadManager.query(query)
            
            if (cursor.moveToFirst()) {
                val statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                val status = cursor.getInt(statusIndex)
                
                when (status) {
                    DownloadManager.STATUS_SUCCESSFUL -> {
                        Toast.makeText(context, "Downloaded: $fileName", Toast.LENGTH_LONG).show()
                    }
                    DownloadManager.STATUS_FAILED -> {
                        val reasonIndex = cursor.getColumnIndex(DownloadManager.COLUMN_REASON)
                        val reason = cursor.getInt(reasonIndex)
                        Log.e(TAG, "Download failed with reason: $reason")
                        Toast.makeText(context, "Download failed: $fileName", Toast.LENGTH_LONG).show()
                    }
                }
            }
            cursor.close()
        }
    }

    fun cancelDownload(downloadId: Long) {
        downloadManager.remove(downloadId)
        activeDownloads.remove(downloadId)
    }

    fun cancelAllDownloads() {
        activeDownloads.keys.forEach { downloadId ->
            downloadManager.remove(downloadId)
        }
        activeDownloads.clear()
    }
}
