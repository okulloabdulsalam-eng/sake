package com.kiuma.app.ui.media

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.webkit.URLUtil
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.kiuma.app.databinding.ActivityMediaBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.io.File

/**
 * Native media list: offline-first from Room, Glide thumbnails, DownloadManager for offline files.
 */
class MediaActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMediaBinding
    private val viewModel: MediaViewModel by viewModels { (application as MediaViewModelProvider).mediaViewModelFactory }
    /** downloadId -> (mediaId, destinationPath) so we can update Room on complete */
    private val downloadIdToMediaIdAndPath = mutableMapOf<Long, Pair<String, String>>()

    private val downloadCompleteReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val downloadId = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) ?: return
            val pair = downloadIdToMediaIdAndPath.remove(downloadId) ?: return
            val (mediaId, destPath) = pair
            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val query = DownloadManager.Query().setFilterById(downloadId)
            dm.query(query).use { cursor ->
                if (cursor.moveToFirst()) {
                    val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        val file = File(destPath)
                        if (file.exists()) {
                            lifecycleScope.launch {
                                viewModel.setLocalPath(mediaId, file.absolutePath)
                                runOnUiThread { Toast.makeText(this@MediaActivity, "Downloaded", Toast.LENGTH_SHORT).show() }
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMediaBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        val adapter = MediaAdapter(
            onPlay = { item -> openPlayer(item) },
            onDownload = { item -> startDownload(item) }
        )
        binding.recycler.adapter = adapter

        fun setFilterAndChip(filter: String) {
            viewModel.setFilter(filter)
            binding.chipAll.isChecked = filter == "all"
            binding.chipVideo.isChecked = filter == "video"
            binding.chipAudio.isChecked = filter == "audio"
            binding.chipImage.isChecked = filter == "image"
            binding.chipDownloads.isChecked = filter == "downloads"
        }
        binding.chipAll.setOnClickListener { setFilterAndChip("all") }
        binding.chipVideo.setOnClickListener { setFilterAndChip("video") }
        binding.chipAudio.setOnClickListener { setFilterAndChip("audio") }
        binding.chipImage.setOnClickListener { setFilterAndChip("image") }
        binding.chipDownloads.setOnClickListener { setFilterAndChip("downloads") }

        binding.swipeRefresh.setOnRefreshListener { viewModel.refresh() }

        lifecycleScope.launch {
            viewModel.mediaList.collectLatest { list ->
                adapter.submitList(list)
                binding.emptyText.isVisible = list.isEmpty()
            }
        }
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                binding.swipeRefresh.isRefreshing = state.isRefreshing
                state.refreshError?.let { Toast.makeText(this@MediaActivity, it, Toast.LENGTH_SHORT).show() }
                viewModel.clearRefreshError()
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(downloadCompleteReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(downloadCompleteReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
        }
    }

    private fun openPlayer(item: com.kiuma.app.data.local.MediaItemEntity) {
        startActivity(Intent(this, MediaPlayerActivity::class.java).putExtra(MediaPlayerActivity.EXTRA_MEDIA_ID, item.id))
    }

    private fun startDownload(item: com.kiuma.app.data.local.MediaItemEntity) {
        val base = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: filesDir
        val kiumaDir = File(base, "KIUMA")
        val subdir = when (item.mediaType) {
            "video" -> "Videos"
            "audio" -> "Audio"
            "image" -> "Other"
            else -> "Other"
        }
        val dir = File(kiumaDir, subdir)
        dir.mkdirs()
        val fileName = URLUtil.guessFileName(item.mediaUrl, null, null) ?: "media_${item.id.hashCode()}"
        val destFile = File(dir, fileName)
        val request = DownloadManager.Request(Uri.parse(item.mediaUrl)).apply {
            setTitle(item.title)
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationUri(Uri.fromFile(destFile))
        }
        val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val downloadId = dm.enqueue(request)
        downloadIdToMediaIdAndPath[downloadId] = item.id to destFile.absolutePath
        Toast.makeText(this, "Downloading: ${item.title}", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        try { unregisterReceiver(downloadCompleteReceiver) } catch (_: Exception) {}
        super.onDestroy()
    }
}
