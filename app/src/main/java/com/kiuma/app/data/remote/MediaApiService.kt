package com.kiuma.app.data.remote

import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Fetches media list from KIUMA R2 Worker API.
 * GET {baseUrl}/list?prefix=media/{type}/
 * Response: { "files": [ { "key", "name", "size" } ] }
 */
data class R2File(
    val key: String,
    val name: String?,
    val size: Long? = 0
)

data class R2ListResponse(
    val files: List<R2File>? = null
)

data class MediaApiItem(
    val id: String,
    val title: String,
    val description: String,
    val thumbnailUrl: String,
    val mediaUrl: String,
    val mediaType: String,
    val size: Long
)

class MediaApiService(
    private val baseUrl: String = DEFAULT_BASE_URL,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
) {
    companion object {
        private const val DEFAULT_BASE_URL = "https://kiuma-storage.kiuma.workers.dev"
        private val MEDIA_TYPES = listOf("video", "audio", "image")
    }

    fun fetchAllMedia(): List<MediaApiItem> {
        val all = mutableListOf<MediaApiItem>()
        val seenKeys = mutableSetOf<String>()
        for (type in MEDIA_TYPES) {
            try {
                val prefix = "media/$type/"
                val url = "$baseUrl/list?prefix=${java.net.URLEncoder.encode(prefix, "UTF-8")}"
                val request = Request.Builder().url(url).get().build()
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) continue
                    val body = response.body?.string() ?: continue
                    val parsed = parseListResponse(body)
                    parsed.files?.forEach { file ->
                        if (file.key in seenKeys) return@forEach
                        seenKeys.add(file.key)
                        val mediaUrl = "$baseUrl/file/${java.net.URLEncoder.encode(file.key, "UTF-8")}"
                        val title = file.name?.let { parseTitleFromName(it) } ?: "Untitled"
                        all.add(
                            MediaApiItem(
                                id = mediaUrl,
                                title = title,
                                description = "",
                                thumbnailUrl = if (type == "video" || type == "image") mediaUrl else "",
                                mediaUrl = mediaUrl,
                                mediaType = type,
                                size = file.size ?: 0
                            )
                        )
                    }
                }
            } catch (_: Exception) { }
        }
        return all
    }

    private fun parseListResponse(json: String): R2ListResponse {
        return try {
            com.google.gson.Gson().fromJson(json, R2ListResponse::class.java)
        } catch (_: Exception) {
            R2ListResponse(emptyList())
        }
    }

    private fun parseTitleFromName(name: String): String {
        val noExt = name.replace(Regex("\\.[^.]+$"), "")
        return noExt.replace(Regex("^\\d+_"), "").replace("_", " ").trim().ifBlank { name }
    }
}
