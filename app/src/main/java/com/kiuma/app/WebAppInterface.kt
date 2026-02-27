package com.kiuma.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.kiuma.app.data.local.AppDatabase
import com.kiuma.app.data.local.UserAccountEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WebAppInterface(private val activity: MainActivity) {

    companion object {
        private const val TAG = "WebAppInterface"
    }

    private var mediaRecorder: MediaRecorder? = null
    private var mediaPlayer: MediaPlayer? = null
    private var currentRecordingPath: String? = null
    private var isRecording = false
    private var isPlaying = false

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun onPageReady() {
        Log.d(TAG, "Page is ready")
    }

    @JavascriptInterface
    fun openWhatsApp(url: String) {
        activity.runOnUiThread {
            try {
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse(url)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                
                // Try WhatsApp first
                intent.setPackage("com.whatsapp")
                if (intent.resolveActivity(activity.packageManager) != null) {
                    activity.startActivity(intent)
                    return@runOnUiThread
                }
                
                // Try WhatsApp Business
                intent.setPackage("com.whatsapp.w4b")
                if (intent.resolveActivity(activity.packageManager) != null) {
                    activity.startActivity(intent)
                    return@runOnUiThread
                }
                
                // Open in browser as fallback
                intent.setPackage(null)
                activity.startActivity(intent)
                
            } catch (e: Exception) {
                Log.e(TAG, "Error opening WhatsApp", e)
                Toast.makeText(activity, "Could not open WhatsApp", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun openExternalLink(url: String) {
        activity.runOnUiThread {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error opening external link", e)
                Toast.makeText(activity, "Could not open link", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /** Open native Notifications screen (offline-first from Room). */
    @JavascriptInterface
    fun openNativeNotifications() {
        activity.runOnUiThread {
            try {
                val intent = Intent(activity, com.kiuma.app.ui.notifications.NotificationsActivity::class.java)
                activity.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error opening native notifications", e)
                Toast.makeText(activity, "Could not open Notifications", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /** Open native Media screen (offline-first list, downloads, ExoPlayer). Use from WebView when user navigates to media. */
    @JavascriptInterface
    fun openNativeMedia() {
        activity.runOnUiThread {
            try {
                val intent = Intent(activity, com.kiuma.app.ui.media.MediaActivity::class.java)
                activity.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error opening native media", e)
                Toast.makeText(activity, "Could not open Media", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun shareContent(title: String, text: String, url: String) {
        activity.runOnUiThread {
            try {
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, title)
                    putExtra(Intent.EXTRA_TEXT, if (url.isNotEmpty()) "$text\n$url" else text)
                }
                activity.startActivity(Intent.createChooser(shareIntent, "Share via"))
            } catch (e: Exception) {
                Log.e(TAG, "Error sharing content", e)
            }
        }
    }

    @JavascriptInterface
    fun isAppInstalled(packageName: String): Boolean {
        return try {
            activity.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return try {
            val pInfo = activity.packageManager.getPackageInfo(activity.packageName, 0)
            pInfo.versionName ?: "1.0"
        } catch (e: Exception) {
            "1.0"
        }
    }

    @JavascriptInterface
    fun isOnline(): Boolean {
        return try {
            val connectivityManager = activity.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) 
                as android.net.ConnectivityManager
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.runOnUiThread {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                activity.requestPermissions(
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                    1002
                )
            }
        }
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        activity.runOnUiThread {
            try {
                val helper = com.kiuma.app.helpers.NotificationHelper(activity)
                helper.showNotification(title, message)
            } catch (e: Exception) {
                Log.e(TAG, "Error showing notification", e)
            }
        }
    }

    @JavascriptInterface
    fun downloadFile(url: String, filename: String) {
        activity.runOnUiThread {
            try {
                val helper = com.kiuma.app.helpers.DownloadHelper(activity)
                helper.downloadFile(url, "", "attachment; filename=\"$filename\"", "", 0)
            } catch (e: Exception) {
                Log.e(TAG, "Error downloading file", e)
                Toast.makeText(activity, "Download failed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun getDownloadedFiles(): String {
        return try {
            (activity as? com.kiuma.app.MainActivity)?.getDownloadIndexJson() ?: "[]"
        } catch (e: Exception) {
            Log.e(TAG, "Error getting downloads", e)
            "[]"
        }
    }

    @JavascriptInterface
    fun openFile(path: String) {
        activity.runOnUiThread {
            try {
                (activity as? com.kiuma.app.MainActivity)?.openDownloadedFile(path)
            } catch (e: Exception) {
                Log.e(TAG, "Error opening file", e)
                Toast.makeText(activity, "Could not open file", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun vibrate(duration: Long) {
        activity.runOnUiThread {
            try {
                val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                    val vibratorManager = activity.getSystemService(android.content.Context.VIBRATOR_MANAGER_SERVICE) 
                        as android.os.VibratorManager
                    vibratorManager.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    activity.getSystemService(android.content.Context.VIBRATOR_SERVICE) as android.os.Vibrator
                }
                
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    vibrator.vibrate(android.os.VibrationEffect.createOneShot(duration, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(duration)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error vibrating", e)
            }
        }
    }

    @JavascriptInterface
    fun copyToClipboard(text: String) {
        activity.runOnUiThread {
            try {
                val clipboard = activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE) 
                    as android.content.ClipboardManager
                val clip = android.content.ClipData.newPlainText("KIUMA", text)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(activity, "Copied to clipboard", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e(TAG, "Error copying to clipboard", e)
            }
        }
    }

    @JavascriptInterface
    fun openDialer(phoneNumber: String) {
        activity.runOnUiThread {
            try {
                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber"))
                activity.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error opening dialer", e)
            }
        }
    }

    @JavascriptInterface
    fun openEmail(email: String, subject: String, body: String) {
        activity.runOnUiThread {
            try {
                val intent = Intent(Intent.ACTION_SENDTO).apply {
                    data = Uri.parse("mailto:")
                    putExtra(Intent.EXTRA_EMAIL, arrayOf(email))
                    putExtra(Intent.EXTRA_SUBJECT, subject)
                    putExtra(Intent.EXTRA_TEXT, body)
                }
                activity.startActivity(Intent.createChooser(intent, "Send Email"))
            } catch (e: Exception) {
                Log.e(TAG, "Error opening email", e)
            }
        }
    }

    // ===== Audio Recording =====

    @JavascriptInterface
    fun hasRecordAudioPermission(): Boolean {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED
    }

    @JavascriptInterface
    fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
    }

    @JavascriptInterface
    fun requestRecordAudioPermission() {
        activity.runOnUiThread {
            activity.requestPermissions(
                arrayOf(Manifest.permission.RECORD_AUDIO),
                1004
            )
        }
    }

    @JavascriptInterface
    fun requestCameraPermission() {
        activity.runOnUiThread {
            activity.requestPermissions(
                arrayOf(Manifest.permission.CAMERA),
                1005
            )
        }
    }

    @JavascriptInterface
    fun requestMediaPermissions() {
        activity.runOnUiThread {
            val perms = mutableListOf(
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.CAMERA
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                perms.add(Manifest.permission.READ_MEDIA_AUDIO)
                perms.add(Manifest.permission.READ_MEDIA_IMAGES)
                perms.add(Manifest.permission.READ_MEDIA_VIDEO)
            } else {
                perms.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
            activity.requestPermissions(perms.toTypedArray(), 1006)
        }
    }

    @JavascriptInterface
    fun startRecording(): String {
        if (!hasRecordAudioPermission()) {
            return "{\"error\":\"Permission denied\",\"status\":\"no_permission\"}"
        }
        if (isRecording) {
            return "{\"error\":\"Already recording\",\"status\":\"busy\"}"
        }
        return try {
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val audioDir = File(activity.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "recordings")
            if (!audioDir.exists()) audioDir.mkdirs()
            val audioFile = File(audioDir, "KIUMA_REC_$timeStamp.m4a")
            currentRecordingPath = audioFile.absolutePath

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(activity)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }
            mediaRecorder?.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(128000)
                setAudioSamplingRate(44100)
                setOutputFile(currentRecordingPath)
                prepare()
                start()
            }
            isRecording = true
            "{\"status\":\"recording\",\"path\":\"$currentRecordingPath\"}"
        } catch (e: Exception) {
            Log.e(TAG, "Error starting recording", e)
            releaseRecorder()
            "{\"error\":\"${e.message}\",\"status\":\"error\"}"
        }
    }

    @JavascriptInterface
    fun stopRecording(): String {
        if (!isRecording) {
            return "{\"error\":\"Not recording\",\"status\":\"idle\"}"
        }
        return try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            isRecording = false
            val path = currentRecordingPath ?: ""
            val file = File(path)
            val sizeKB = if (file.exists()) file.length() / 1024 else 0
            "{\"status\":\"stopped\",\"path\":\"$path\",\"sizeKB\":$sizeKB}"
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording", e)
            releaseRecorder()
            "{\"error\":\"${e.message}\",\"status\":\"error\"}"
        }
    }

    @JavascriptInterface
    fun isCurrentlyRecording(): Boolean = isRecording

    @JavascriptInterface
    fun getRecordingAmplitude(): Int {
        return try {
            if (isRecording) mediaRecorder?.maxAmplitude ?: 0 else 0
        } catch (e: Exception) { 0 }
    }

    private fun releaseRecorder() {
        try {
            mediaRecorder?.release()
        } catch (_: Exception) {}
        mediaRecorder = null
        isRecording = false
    }

    // ===== Audio Playback =====

    @JavascriptInterface
    fun playAudio(filePath: String): String {
        return try {
            stopAudio()
            mediaPlayer = MediaPlayer().apply {
                setDataSource(filePath)
                prepare()
                start()
            }
            isPlaying = true
            mediaPlayer?.setOnCompletionListener {
                isPlaying = false
            }
            "{\"status\":\"playing\",\"durationMs\":${mediaPlayer?.duration ?: 0}}"
        } catch (e: Exception) {
            Log.e(TAG, "Error playing audio", e)
            "{\"error\":\"${e.message}\",\"status\":\"error\"}"
        }
    }

    @JavascriptInterface
    fun pauseAudio(): String {
        return try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.pause()
                isPlaying = false
                "{\"status\":\"paused\",\"positionMs\":${mediaPlayer?.currentPosition ?: 0}}"
            } else {
                "{\"status\":\"not_playing\"}"
            }
        } catch (e: Exception) {
            "{\"error\":\"${e.message}\"}"
        }
    }

    @JavascriptInterface
    fun resumeAudio(): String {
        return try {
            mediaPlayer?.start()
            isPlaying = true
            "{\"status\":\"playing\"}"
        } catch (e: Exception) {
            "{\"error\":\"${e.message}\"}"
        }
    }

    @JavascriptInterface
    fun stopAudio(): String {
        return try {
            mediaPlayer?.apply {
                if (isPlaying) stop()
                release()
            }
            mediaPlayer = null
            isPlaying = false
            "{\"status\":\"stopped\"}"
        } catch (e: Exception) {
            mediaPlayer = null
            isPlaying = false
            "{\"error\":\"${e.message}\"}"
        }
    }

    @JavascriptInterface
    fun seekAudio(positionMs: Int): String {
        return try {
            mediaPlayer?.seekTo(positionMs)
            "{\"status\":\"seeked\",\"positionMs\":$positionMs}"
        } catch (e: Exception) {
            "{\"error\":\"${e.message}\"}"
        }
    }

    @JavascriptInterface
    fun getAudioPosition(): Int {
        return try { mediaPlayer?.currentPosition ?: 0 } catch (_: Exception) { 0 }
    }

    @JavascriptInterface
    fun getAudioDuration(): Int {
        return try { mediaPlayer?.duration ?: 0 } catch (_: Exception) { 0 }
    }

    @JavascriptInterface
    fun isAudioPlaying(): Boolean = isPlaying

    // ===== Audio Settings =====

    @JavascriptInterface
    fun getVolume(): Int {
        return try {
            val audioManager = activity.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
            audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        } catch (e: Exception) { 0 }
    }

    @JavascriptInterface
    fun getMaxVolume(): Int {
        return try {
            val audioManager = activity.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
            audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        } catch (e: Exception) { 15 }
    }

    @JavascriptInterface
    fun setVolume(volume: Int) {
        try {
            val audioManager = activity.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, volume, 0)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting volume", e)
        }
    }

    @JavascriptInterface
    fun isMuted(): Boolean {
        return try {
            val audioManager = activity.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
            audioManager.getStreamVolume(AudioManager.STREAM_MUSIC) == 0
        } catch (e: Exception) { false }
    }

    // ===== Media File Listing =====

    @JavascriptInterface
    fun listRecordings(): String {
        return try {
            val audioDir = File(activity.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "recordings")
            if (!audioDir.exists()) return "[]"
            val files = audioDir.listFiles()?.filter { it.isFile && (it.name.endsWith(".m4a") || it.name.endsWith(".mp3") || it.name.endsWith(".wav")) }
                ?.sortedByDescending { it.lastModified() }
                ?.map { file ->
                    "{\"name\":\"${file.name}\",\"path\":\"${file.absolutePath}\",\"sizeKB\":${file.length()/1024},\"modified\":${file.lastModified()}}"
                } ?: emptyList()
            "[${files.joinToString(",")}]"
        } catch (e: Exception) {
            Log.e(TAG, "Error listing recordings", e)
            "[]"
        }
    }

    @JavascriptInterface
    fun deleteRecording(filePath: String): Boolean {
        return try {
            val file = File(filePath)
            if (file.exists() && file.absolutePath.contains("recordings")) {
                file.delete()
            } else false
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting recording", e)
            false
        }
    }

    // ===== Media Permissions Status =====

    @JavascriptInterface
    fun getMediaPermissionsStatus(): String {
        val audio = ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        val camera = ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        val location = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val storage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        }
        val notifications = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        } else true

        return "{\"audio\":$audio,\"camera\":$camera,\"location\":$location,\"storage\":$storage,\"notifications\":$notifications}"
    }

    @JavascriptInterface
    fun openAppSettings() {
        activity.runOnUiThread {
            try {
                val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${activity.packageName}")
                }
                activity.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error opening app settings", e)
            }
        }
    }

    // ===== Account persistence (Room) =====

    /** Persist account details to Room. Called after signup and after profile edit. */
    @JavascriptInterface
    fun saveAccountDetails(json: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = AppDatabase.getInstance(activity)
                db.userAccountDao().insert(
                    UserAccountEntity(userJson = json, updatedAt = System.currentTimeMillis())
                )
                Log.d(TAG, "Account details saved to Room")
            } catch (e: Exception) {
                Log.e(TAG, "Error saving account details", e)
            }
        }
    }

    /** Return persisted account details as JSON, or empty string if none. */
    @JavascriptInterface
    fun getAccountDetails(): String {
        return runBlocking(Dispatchers.IO) {
            try {
                val db = AppDatabase.getInstance(activity)
                db.userAccountDao().getAccount()?.userJson ?: ""
            } catch (e: Exception) {
                Log.e(TAG, "Error getting account details", e)
                ""
            }
        }
    }

    /** Clear persisted account (e.g. on logout). */
    @JavascriptInterface
    fun clearAccountDetails() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                AppDatabase.getInstance(activity).userAccountDao().clear()
                Log.d(TAG, "Account details cleared from Room")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing account details", e)
            }
        }
    }

    // ===== Persistent login state (SharedPreferences) =====

    private val loginPrefs by lazy {
        activity.getSharedPreferences("kiuma_prefs", android.content.Context.MODE_PRIVATE)
    }

    /** Call after successful login/signup. isLoggedIn "true" = logged in, else = not logged in. */
    @JavascriptInterface
    fun setLoginState(isLoggedIn: String) {
        loginPrefs.edit()
            .putBoolean("is_logged_in", "true" == isLoggedIn)
            .apply()
        Log.d(TAG, "Login state set: is_logged_in=${"true" == isLoggedIn}")
    }

    /** Optionally store user id for display or recovery. */
    @JavascriptInterface
    fun saveUserId(userId: String) {
        if (userId.isNotEmpty()) {
            loginPrefs.edit().putString("user_id", userId).apply()
        }
    }

    /** Call on logout: clear login state, clear account in Room, then navigate to login screen. */
    @JavascriptInterface
    fun clearLoginState() {
        loginPrefs.edit()
            .remove("is_logged_in")
            .remove("user_id")
            .apply()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                AppDatabase.getInstance(activity).userAccountDao().clear()
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing account on logout", e)
            }
        }
        activity.runOnUiThread {
            (activity as? MainActivity)?.loadLoginScreen()
        }
        Log.d(TAG, "Login state cleared, navigated to login screen")
    }
}
