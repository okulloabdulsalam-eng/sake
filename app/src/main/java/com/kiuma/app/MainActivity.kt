package com.kiuma.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.provider.MediaStore
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.kiuma.app.databinding.ActivityMainBinding
import com.kiuma.app.helpers.DownloadHelper
import com.kiuma.app.helpers.NotificationHelper
import com.kiuma.app.helpers.OfflineHelper
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var downloadHelper: DownloadHelper
    private lateinit var notificationHelper: NotificationHelper
    private lateinit var offlineHelper: OfflineHelper

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoPath: String? = null
    private var pendingDownloadUrl: String? = null
    private var isOfflineMode = false
    private var lastLoadedUrl: String? = null
    private var isShowingAssets = false
    private var pendingPermissionRequest: PermissionRequest? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private var upgradeRunnable: Runnable? = null
    private var stabilitySuccessCount = 0
    private var stabilityCheckInFlight = false
    private var upgradeGeneration = 0

    private lateinit var connectivityManager: ConnectivityManager
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    private val prefs by lazy { getSharedPreferences("kiuma_prefs", Context.MODE_PRIVATE) }

    companion object {
        const val EXTRA_PENDING_URL = "pending_url"
        private const val TAG = "KIUMA"
        private const val WEB_URL = "https://okulloabdulsalam-eng.github.io/sake/"
        private const val ASSETS_PATH = "file:///android_asset/sake/"
        private const val REQUEST_PERMISSIONS = 1001
        private const val REQUEST_MEDIA_PERMISSIONS = 1003
        private const val PREF_OFFLINE_BANNER_DISMISSED = "offlineBannerDismissed"
        private const val PREF_IS_LOGGED_IN = "is_logged_in"
        private const val PREF_USER_ID = "user_id"
        private const val UPGRADE_CHECK_INTERVAL_MS = 4000L
        private const val UPGRADE_STABLE_REQUIRED_SUCCESSES = 2
        private const val UPGRADE_HTTP_TIMEOUT_MS = 2000
        private const val UPGRADE_MAX_STABLE_RTT_MS = 1500L
    }

    private val requiredPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        arrayOf(
            Manifest.permission.POST_NOTIFICATIONS,
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_VIDEO,
            Manifest.permission.READ_MEDIA_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        arrayOf(
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    } else {
        arrayOf(
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        handleFileChooserResult(result.resultCode, result.data)
    }

    private val downloadCompleteReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val downloadId = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) ?: return
            val path = downloadHelper.onDownloadComplete(downloadId)
            if (!path.isNullOrEmpty()) {
                runOnUiThread { notifyWebViewDownloadComplete(path) }
            }
        }
    }

    private fun notifyWebViewDownloadComplete(path: String) {
        try {
            val name = path.substringAfterLast('/')
            val script = "javascript:try{if(window.dispatchEvent){window.dispatchEvent(new CustomEvent('kiumaDownloadComplete',{detail:{path:\"${path.replace("\"", "\\\"")}\",name:\"${name.replace("\"", "\\\"")}\"}}));}}catch(e){}"
            binding.webView.evaluateJavascript(script, null)
        } catch (_: Exception) {}
    }

    fun getDownloadIndexJson(): String = downloadHelper.getDownloadIndex()

    fun openDownloadedFile(path: String) {
        try {
            val file = File(path)
            if (!file.exists()) {
                Toast.makeText(this, "File not found", Toast.LENGTH_SHORT).show()
                return
            }
            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(this, "${packageName}.fileprovider", file)
            } else {
                Uri.fromFile(file)
            }
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, getMimeType(path))
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(intent, "Open with"))
        } catch (e: Exception) {
            Log.e(TAG, "Error opening file", e)
            Toast.makeText(this, "Could not open file", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getMimeType(path: String): String {
        val ext = path.substringAfterLast('.', "").lowercase()
        return when (ext) {
            "pdf" -> "application/pdf"
            "epub" -> "application/epub+zip"
            "mp4", "m4v" -> "video/mp4"
            "webm" -> "video/webm"
            "mp3", "m4a" -> "audio/mpeg"
            "wav" -> "audio/wav"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            else -> "application/octet-stream"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupSystemUI()
        initHelpers()
        setupWebView()
        setupSwipeRefresh()
        setupErrorHandling()
        setupBackNavigation()
        requestPermissions()
        registerReceivers()

        setupOfflineBannerDismiss()
        setupNetworkMonitoring()

        loadContent()
        handleNotificationClickUrl(intent?.getStringExtra(EXTRA_PENDING_URL))
    }

    private fun setupOfflineBannerDismiss() {
        binding.offlineDismissButton.setOnClickListener {
            prefs.edit().putBoolean(PREF_OFFLINE_BANNER_DISMISSED, true).apply()
            updateOfflineIndicatorVisibility()
        }

        binding.offlineDot.setOnClickListener {
            prefs.edit().putBoolean(PREF_OFFLINE_BANNER_DISMISSED, false).apply()
            updateOfflineIndicatorVisibility()
        }
    }

    private fun isOfflineBannerDismissed(): Boolean {
        return prefs.getBoolean(PREF_OFFLINE_BANNER_DISMISSED, false)
    }

    private fun updateOfflineIndicatorVisibility() {
        val dismissed = isOfflineBannerDismissed()

        binding.offlineIndicator.visibility = if (isOfflineMode && !dismissed) View.VISIBLE else View.GONE
        binding.offlineDot.visibility = if (isOfflineMode && dismissed) View.VISIBLE else View.GONE
    }

    private fun setupNetworkMonitoring() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        if (networkCallback != null) return

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                runOnUiThread {
                    handleNetworkStateChanged(isOnline = isNetworkAvailable())
                }
            }

            override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                runOnUiThread {
                    handleNetworkStateChanged(isOnline = isNetworkAvailable())
                }
            }

            override fun onLost(network: Network) {
                runOnUiThread {
                    handleNetworkStateChanged(isOnline = isNetworkAvailable())
                }
            }
        }

        try {
            connectivityManager.registerDefaultNetworkCallback(networkCallback!!)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register network callback", e)
        }
    }

    private fun handleNetworkStateChanged(isOnline: Boolean) {
        isOfflineMode = !isOnline

        if (isOnline) {
            binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
            updateOfflineIndicatorVisibility()

            if (isShowingAssets) {
                startOnlineUpgradeMonitoring()
                return
            }
            // Do NOT reload WebView on reconnect - preserves current UI state.
            // Native screens (Media, Notifications) refresh via NetworkMonitor in KiumaApplication.
        } else {
            stopOnlineUpgradeMonitoring()
            stabilitySuccessCount = 0
            binding.webView.settings.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
            updateOfflineIndicatorVisibility()
        }
    }

    private fun setupSystemUI() {
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = ContextCompat.getColor(this, android.R.color.black)
        WindowInsetsControllerCompat(window, binding.root).isAppearanceLightStatusBars = false
    }

    private fun initHelpers() {
        downloadHelper = DownloadHelper(this)
        notificationHelper = NotificationHelper(this)
        offlineHelper = OfflineHelper(this)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        binding.webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = if (isNetworkAvailable()) {
                    WebSettings.LOAD_DEFAULT
                } else {
                    WebSettings.LOAD_CACHE_ELSE_NETWORK
                }

                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                loadWithOverviewMode = true
                useWideViewPort = true

                setSupportMultipleWindows(true)
                javaScriptCanOpenWindowsAutomatically = true

                userAgentString = "$userAgentString KIUMA-App/1.0"

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    safeBrowsingEnabled = false
                }
            }

            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                applyForceDarkMode()
            }

            webViewClient = KiumaWebViewClient()
            webChromeClient = KiumaWebChromeClient()

            val bridge = WebAppInterface(this@MainActivity)
            addJavascriptInterface(bridge, "AndroidApp")
            addJavascriptInterface(bridge, "Android")

            setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
                handleDownload(url, userAgent, contentDisposition, mimeType, contentLength)
            }
        }
    }

    private fun applyForceDarkMode() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) return

        val forceLight = isOfflineMode || isShowingAssets
        val mode = if (forceLight) {
            WebSettingsCompat.FORCE_DARK_OFF
        } else {
            WebSettingsCompat.FORCE_DARK_AUTO
        }
        WebSettingsCompat.setForceDark(binding.webView.settings, mode)
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.apply {
            setColorSchemeColors(
                ContextCompat.getColor(this@MainActivity, android.R.color.holo_green_dark)
            )
            setOnRefreshListener {
                binding.webView.reload()
            }
            // Disable swipe refresh - only enable when WebView is at top
            isEnabled = false
        }

        // Only enable swipe refresh when WebView is scrolled to top
        binding.webView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
            binding.swipeRefreshLayout.isEnabled = scrollY == 0
        }
    }

    private fun setupErrorHandling() {
        binding.retryButton.setOnClickListener {
            binding.errorView.visibility = View.GONE
            loadContent()
        }

        binding.offlineButton.setOnClickListener {
            binding.errorView.visibility = View.GONE
            loadBundledAssetsHome()
            startOnlineUpgradeMonitoring()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    binding.webView.canGoBack() -> binding.webView.goBack()
                    else -> {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            }
        })
    }

    private fun requestPermissions() {
        val permissionsToRequest = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest, REQUEST_PERMISSIONS)
        }
    }

    private fun registerReceivers() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(
                downloadCompleteReceiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                RECEIVER_NOT_EXPORTED
            )
        } else {
            registerReceiver(
                downloadCompleteReceiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            )
        }
    }

    /** True if user has been logged in and not yet logged out (persists across app restarts). */
    fun isLoggedIn(): Boolean = prefs.getBoolean(PREF_IS_LOGGED_IN, false)

    /** Relative path for entry page: index.html (home) when logged in, join-us.html (login) when not. */
    private fun getEntryPagePath(): String = if (isLoggedIn()) "index.html" else "join-us.html"

    /** Navigate WebView to login screen (join-us). Used after logout. */
    fun loadLoginScreen() {
        val url = if (isShowingAssets) ASSETS_PATH + "join-us.html" else WEB_URL + "join-us.html"
        binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        binding.webView.loadUrl(url)
        lastLoadedUrl = url
    }

    private fun loadContent() {
        // HTML splash handles loading - no native overlay needed
        binding.errorView.visibility = View.GONE
        
        if (isNetworkAvailable()) {
            isOfflineMode = false
            isShowingAssets = false
            updateOfflineIndicatorVisibility()
            binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
            val entryPath = getEntryPagePath()
            val url = if (entryPath == "index.html") WEB_URL else WEB_URL + entryPath
            binding.webView.loadUrl(url)
            lastLoadedUrl = url
        } else {
            loadOfflineContent()
        }
    }

    private fun loadBundledAssetsHome() {
        stopOnlineUpgradeMonitoring()
        stabilitySuccessCount = 0
        binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        isShowingAssets = true
        isOfflineMode = !isNetworkAvailable()
        updateOfflineIndicatorVisibility()
        val url = ASSETS_PATH + getEntryPagePath()
        binding.webView.loadUrl(url)
        lastLoadedUrl = url
    }

    private fun buildOnlineUrlFromCurrent(currentUrl: String?): String {
        val url = currentUrl ?: return WEB_URL

        return when {
            url.startsWith(WEB_URL) -> url
            url.startsWith(ASSETS_PATH) -> {
                val relative = url.removePrefix(ASSETS_PATH).removePrefix("/")
                when {
                    relative.isBlank() || relative == "index.html" -> WEB_URL
                    else -> WEB_URL + relative
                }
            }
            else -> WEB_URL
        }
    }

    private fun stopOnlineUpgradeMonitoring() {
        upgradeGeneration += 1
        upgradeRunnable?.let { mainHandler.removeCallbacks(it) }
        upgradeRunnable = null
        stabilityCheckInFlight = false
    }

    private fun startOnlineUpgradeMonitoring() {
        if (!isShowingAssets) return

        if (upgradeRunnable != null) return

        val myGeneration = upgradeGeneration

        val runnable = object : Runnable {
            override fun run() {
                if (myGeneration != upgradeGeneration) {
                    stopOnlineUpgradeMonitoring()
                    return
                }

                if (!isShowingAssets) {
                    stopOnlineUpgradeMonitoring()
                    return
                }

                if (!isNetworkAvailable()) {
                    stabilitySuccessCount = 0
                    mainHandler.postDelayed(this, UPGRADE_CHECK_INTERVAL_MS)
                    return
                }

                if (stabilityCheckInFlight) {
                    mainHandler.postDelayed(this, UPGRADE_CHECK_INTERVAL_MS)
                    return
                }

                stabilityCheckInFlight = true
                thread {
                    val stable = isWebUrlStable()
                    mainHandler.post {
                        if (myGeneration != upgradeGeneration) {
                            stopOnlineUpgradeMonitoring()
                            return@post
                        }

                        stabilityCheckInFlight = false

                        if (!isShowingAssets) {
                            stopOnlineUpgradeMonitoring()
                            return@post
                        }

                        if (stable) {
                            stabilitySuccessCount += 1
                        } else {
                            stabilitySuccessCount = 0
                        }

                        if (stabilitySuccessCount >= UPGRADE_STABLE_REQUIRED_SUCCESSES) {
                            val onlineUrl = buildOnlineUrlFromCurrent(lastLoadedUrl)
                            isShowingAssets = false
                            binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
                            binding.webView.loadUrl(onlineUrl)
                            lastLoadedUrl = onlineUrl
                            stopOnlineUpgradeMonitoring()
                            return@post
                        }

                        mainHandler.postDelayed(this, UPGRADE_CHECK_INTERVAL_MS)
                    }
                }
            }
        }

        upgradeRunnable = runnable
        mainHandler.postDelayed(runnable, 300L)
    }

    private fun isWebUrlStable(): Boolean {
        return try {
            val start = System.currentTimeMillis()
            val url = URL(WEB_URL)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                instanceFollowRedirects = true
                connectTimeout = UPGRADE_HTTP_TIMEOUT_MS
                readTimeout = UPGRADE_HTTP_TIMEOUT_MS
                setRequestProperty("Cache-Control", "no-cache")
                setRequestProperty("Pragma", "no-cache")
                setRequestProperty("Range", "bytes=0-0")
            }

            conn.inputStream.use { }
            val elapsed = System.currentTimeMillis() - start

            val code = conn.responseCode
            (code in 200..399) && elapsed <= UPGRADE_MAX_STABLE_RTT_MS
        } catch (_: Exception) {
            false
        }
    }

    private fun loadOfflineContent() {
        isOfflineMode = true
        isShowingAssets = false
        updateOfflineIndicatorVisibility()
        // HTML splash handles loading - no native overlay needed
        binding.errorView.visibility = View.GONE

        // Prefer the cached live website (service worker / webview cache) so you keep the latest UI offline.
        val entryPath = getEntryPagePath()
        val url = if (entryPath == "index.html") WEB_URL else WEB_URL + entryPath
        binding.webView.settings.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
        binding.webView.loadUrl(url)
        lastLoadedUrl = url

        applyForceDarkMode()
    }

    private fun loadOfflineAssetFallback() {
        stopOnlineUpgradeMonitoring()
        stabilitySuccessCount = 0
        binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        isShowingAssets = true
        isOfflineMode = !isNetworkAvailable()
        updateOfflineIndicatorVisibility()
        val url = ASSETS_PATH + getEntryPagePath()
        binding.webView.loadUrl(url)
        lastLoadedUrl = url
        startOnlineUpgradeMonitoring()

        applyForceDarkMode()
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    private fun handleDownload(
        url: String,
        userAgent: String,
        contentDisposition: String,
        mimeType: String,
        contentLength: Long
    ) {
        if (!hasStoragePermission()) {
            pendingDownloadUrl = url
            requestStoragePermission()
            return
        }

        downloadHelper.downloadFile(url, userAgent, contentDisposition, mimeType, contentLength)
    }

    private fun hasStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            true
        } else {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestStoragePermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
                REQUEST_PERMISSIONS
            )
        }
    }

    private fun handleFileChooserResult(resultCode: Int, data: Intent?) {
        if (resultCode != Activity.RESULT_OK) {
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
            return
        }

        val results = when {
            data?.dataString != null -> arrayOf(Uri.parse(data.dataString))
            data?.clipData != null -> {
                val clipData = data.clipData!!
                Array(clipData.itemCount) { clipData.getItemAt(it).uri }
            }
            cameraPhotoPath != null -> arrayOf(Uri.parse(cameraPhotoPath))
            else -> null
        }

        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
        cameraPhotoPath = null
    }

    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "KIUMA_${timeStamp}_"
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }

    inner class KiumaWebViewClient : WebViewClient() {
        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            binding.progressBar.visibility = View.VISIBLE
            binding.progressBar.progress = 0
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            binding.progressBar.visibility = View.GONE
            binding.swipeRefreshLayout.isRefreshing = false

            url?.let { finishedUrl ->
                lastLoadedUrl = finishedUrl

                when {
                    finishedUrl.startsWith(ASSETS_PATH) -> {
                        if (!isShowingAssets) {
                            isShowingAssets = true
                            startOnlineUpgradeMonitoring()
                        }
                    }
                    finishedUrl.startsWith(WEB_URL) -> {
                        if (isShowingAssets) {
                            isShowingAssets = false
                            stopOnlineUpgradeMonitoring()
                        }
                    }
                }
            }
            
            applyForceDarkMode()
            injectJavaScript()
        }

        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            if (request?.isForMainFrame == true) {
                handleLoadError()
            }
        }

        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val url = request?.url?.toString() ?: return false
            return handleUrl(url)
        }

        private fun handleUrl(url: String): Boolean {
            return when {
                url.startsWith("whatsapp://") || url.contains("wa.me") || url.contains("whatsapp") ||
                        url.contains("chat.whatsapp.com") -> {
                    openExternalApp(url)
                    true
                }
                url.startsWith("tel:") -> {
                    openExternalApp(url)
                    true
                }
                url.startsWith("mailto:") -> {
                    openExternalApp(url)
                    true
                }
                url.startsWith("sms:") -> {
                    openExternalApp(url)
                    true
                }
                url.contains("play.google.com") || url.contains("market://") -> {
                    openExternalApp(url)
                    true
                }
                url.startsWith("intent://") -> {
                    handleIntentUrl(url)
                    true
                }
                url.contains("youtube.com") || url.contains("youtu.be") -> {
                    openExternalApp(url)
                    true
                }
                url.contains("media.html") && (url.startsWith(WEB_URL) || url.startsWith(ASSETS_PATH)) -> {
                    startActivity(Intent(this@MainActivity, com.kiuma.app.ui.media.MediaActivity::class.java))
                    true
                }
                url.contains("notifications.html") && (url.startsWith(WEB_URL) || url.startsWith(ASSETS_PATH)) -> {
                    startActivity(Intent(this@MainActivity, com.kiuma.app.ui.notifications.NotificationsActivity::class.java))
                    true
                }
                url.startsWith("https://okulloabdulsalam-eng.github.io/sake") ||
                        url.startsWith("file:///android_asset/sake") -> {
                    false
                }
                url.startsWith("http://") || url.startsWith("https://") -> {
                    false
                }
                else -> {
                    try {
                        openExternalApp(url)
                        true
                    } catch (e: Exception) {
                        Log.e(TAG, "Cannot handle URL: $url", e)
                        false
                    }
                }
            }
        }

        private fun handleLoadError() {
            if (isShowingAssets && offlineHelper.hasLocalAssets()) {
                loadBundledAssetsHome()
                startOnlineUpgradeMonitoring()
                return
            }

            if (offlineHelper.hasLocalAssets() && !isShowingAssets) {
                loadBundledAssetsHome()
                startOnlineUpgradeMonitoring()
                return
            }

            // If we're already in offline mode and the cached web load fails, fallback to bundled assets.
            if (isOfflineMode && lastLoadedUrl == WEB_URL && offlineHelper.hasLocalAssets()) {
                loadOfflineAssetFallback()
                return
            }

            binding.errorView.visibility = View.VISIBLE
        }
    }

    inner class KiumaWebChromeClient : WebChromeClient() {
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            binding.progressBar.progress = newProgress
        }

        override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
        ): Boolean {
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = filePathCallback

            val acceptTypes = fileChooserParams?.acceptTypes ?: arrayOf("*/*")
            val captureEnabled = fileChooserParams?.isCaptureEnabled ?: false

            val intentList = mutableListOf<Intent>()

            if (acceptTypes.any { it.contains("image") } || captureEnabled) {
                try {
                    val photoFile = createImageFile()
                    cameraPhotoPath = "file:${photoFile.absolutePath}"
                    val photoUri = FileProvider.getUriForFile(
                        this@MainActivity,
                        "${packageName}.fileprovider",
                        photoFile
                    )
                    val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                        putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
                    }
                    if (captureIntent.resolveActivity(packageManager) != null) {
                        intentList.add(captureIntent)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error creating camera intent", e)
                }
            }

            val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = if (acceptTypes.isNotEmpty() && acceptTypes[0] != "") {
                    acceptTypes[0]
                } else {
                    "*/*"
                }
                if (fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                }
            }

            val chooserIntent = Intent.createChooser(contentIntent, "Select File").apply {
                if (intentList.isNotEmpty()) {
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, intentList.toTypedArray())
                }
            }

            fileChooserLauncher.launch(chooserIntent)
            return true
        }

        override fun onPermissionRequest(request: PermissionRequest?) {
            if (request == null) return
            val resources = request.resources
            val neededAndroidPerms = mutableListOf<String>()

            for (resource in resources) {
                when (resource) {
                    PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                        if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO)
                            != PackageManager.PERMISSION_GRANTED) {
                            neededAndroidPerms.add(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                        if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA)
                            != PackageManager.PERMISSION_GRANTED) {
                            neededAndroidPerms.add(Manifest.permission.CAMERA)
                        }
                    }
                }
            }

            if (neededAndroidPerms.isEmpty()) {
                request.grant(resources)
            } else {
                pendingPermissionRequest = request
                ActivityCompat.requestPermissions(
                    this@MainActivity,
                    neededAndroidPerms.toTypedArray(),
                    REQUEST_MEDIA_PERMISSIONS
                )
            }
        }

        override fun onGeolocationPermissionsShowPrompt(
            origin: String?,
            callback: GeolocationPermissions.Callback?
        ) {
            callback?.invoke(origin, true, false)
        }

        override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
            val level = consoleMessage?.messageLevel()
            if (level == ConsoleMessage.MessageLevel.ERROR || level == ConsoleMessage.MessageLevel.WARNING) {
                Log.w(TAG, "WebView Console ($level): ${consoleMessage?.message()}")
                return true
            }
            return true
        }

        override fun onCreateWindow(
            view: WebView?,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message?
        ): Boolean {
            val newWebView = WebView(this@MainActivity)
            newWebView.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false
                    binding.webView.loadUrl(url)
                    return true
                }
            }
            val transport = resultMsg?.obj as? WebView.WebViewTransport
            transport?.webView = newWebView
            resultMsg?.sendToTarget()
            return true
        }
    }

    private fun openExternalApp(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "No app found to handle this action", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handleIntentUrl(url: String) {
        try {
            val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
            } else {
                intent.`package`?.let { packageName ->
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName")))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling intent URL", e)
        }
    }

    private fun injectJavaScript() {
        val forceLight = isOfflineMode || isShowingAssets
        val jsCode = """
            (function() {
                var forceLight = ${forceLight};
                if (forceLight) {
                    try { localStorage.setItem('themePreference', 'light'); } catch(e) {}
                    try { document.documentElement.setAttribute('data-theme', 'light'); } catch(e) {}
                }

                // Notify Android app that page is ready
                if (window.AndroidApp) {
                    window.AndroidApp.onPageReady();
                }
                
                // Fix WhatsApp links
                document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"], a[href*="chat.whatsapp.com"]').forEach(function(link) {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (window.AndroidApp) {
                            window.AndroidApp.openWhatsApp(this.href);
                        } else {
                            window.location.href = this.href;
                        }
                    });
                });
                
                // Override console for debugging
                var originalLog = console.log;
                console.log = function() {
                    originalLog.apply(console, arguments);
                };
            })();
        """.trimIndent()

        binding.webView.evaluateJavascript(jsCode, null)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            REQUEST_PERMISSIONS -> {
                pendingDownloadUrl?.let { url ->
                    if (hasStoragePermission()) {
                        downloadHelper.downloadFile(url, "", "", "", 0)
                    }
                    pendingDownloadUrl = null
                }
            }
            REQUEST_MEDIA_PERMISSIONS -> {
                pendingPermissionRequest?.let { request ->
                    if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                        request.grant(request.resources)
                    } else {
                        request.deny()
                        Toast.makeText(this, "Permission denied. Some media features may not work.", Toast.LENGTH_SHORT).show()
                    }
                    pendingPermissionRequest = null
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        binding.webView.onResume()

        if (isShowingAssets && isNetworkAvailable()) {
            startOnlineUpgradeMonitoring()
            return
        }

        if (!isOfflineMode && !isNetworkAvailable() && lastLoadedUrl == WEB_URL) {
            loadOfflineContent()
        }
    }

    override fun onPause() {
        super.onPause()
        stopOnlineUpgradeMonitoring()
        binding.webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(downloadCompleteReceiver)
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering receiver", e)
        }

        networkCallback?.let {
            try {
                connectivityManager.unregisterNetworkCallback(it)
            } catch (e: Exception) {
                Log.e(TAG, "Error unregistering network callback", e)
            }
        }
        networkCallback = null

        stopOnlineUpgradeMonitoring()

        binding.webView.destroy()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleNotificationClickUrl(intent?.getStringExtra(EXTRA_PENDING_URL))
        if (intent?.getStringExtra(EXTRA_PENDING_URL) == null) handleDeepLink(intent)
    }

    private fun handleNotificationClickUrl(url: String?) {
        if (url.isNullOrBlank()) return
        when {
            url.contains("media.html") -> {
                startActivity(Intent(this, com.kiuma.app.ui.media.MediaActivity::class.java))
            }
            url.contains("notifications.html") -> {
                startActivity(Intent(this, com.kiuma.app.ui.notifications.NotificationsActivity::class.java))
            }
            else -> {
                val fullUrl = when {
                    url.startsWith("http://") || url.startsWith("https://") -> url
                    url.startsWith("/") -> "https://okulloabdulsalam-eng.github.io$url"
                    else -> WEB_URL + url.removePrefix("/")
                }
                isShowingAssets = false
                binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
                binding.webView.loadUrl(fullUrl)
                lastLoadedUrl = fullUrl
            }
        }
        intent?.removeExtra(EXTRA_PENDING_URL)
    }

    private fun handleDeepLink(intent: Intent?) {
        intent?.data?.let { uri ->
            val path = uri.path ?: ""
            val relative = path.removePrefix("/sake").removePrefix("/")

            if (offlineHelper.hasLocalAssets()) {
                val assetsUrl = if (relative.isBlank()) {
                    ASSETS_PATH + "index.html"
                } else {
                    ASSETS_PATH + relative
                }
                binding.webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
                isShowingAssets = true
                binding.webView.loadUrl(assetsUrl)
                lastLoadedUrl = assetsUrl
                startOnlineUpgradeMonitoring()
            } else {
                val webUrl = if (relative.isBlank()) WEB_URL else WEB_URL + relative
                isShowingAssets = false
                binding.webView.loadUrl(webUrl)
                lastLoadedUrl = webUrl
            }
        }
    }
}
