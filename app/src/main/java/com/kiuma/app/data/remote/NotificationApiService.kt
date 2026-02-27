package com.kiuma.app.data.remote

import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

data class NotificationApiItem(
    val id: String,
    val title: String,
    val message: String,
    val icon: String? = null,
    val category: String? = null,
    val status: String? = null,
    val date: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("url") val relatedPageUrl: String? = null
)

class NotificationApiService(
    private val baseUrl: String = DEFAULT_URL,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
) {
    companion object {
        private const val DEFAULT_URL = "https://raw.githubusercontent.com/okulloabdulsalam-eng/kiuma-storage/main/notifications/notifications.json"
    }

    fun fetchNotifications(): List<NotificationApiItem> {
        val request = Request.Builder().url("$baseUrl?t=${System.currentTimeMillis()}").get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw Exception("Failed to fetch notifications")
            val body = response.body?.string() ?: "[]"
            val array = com.google.gson.Gson().fromJson(body, Array<NotificationApiItem>::class.java)
            return array.toList()
        }
    }
}
