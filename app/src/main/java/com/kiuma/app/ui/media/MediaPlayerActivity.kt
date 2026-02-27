package com.kiuma.app.ui.media

import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import com.kiuma.app.databinding.ActivityMediaPlayerBinding
import kotlinx.coroutines.launch
import java.io.File

/**
 * Native playback with ExoPlayer: local file if downloaded, stream if online, else "Offline - Not Downloaded".
 */
class MediaPlayerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMediaPlayerBinding
    private var player: ExoPlayer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMediaPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        val mediaId = intent.getStringExtra(EXTRA_MEDIA_ID) ?: run {
            finish()
            return
        }

        lifecycleScope.launch {
            val repo = (application as MediaViewModelProvider).mediaRepository
            val isOnline = (application as MediaViewModelProvider).networkMonitor.isOnline()
            val item = repo.getById(mediaId)

            if (item == null) {
                Toast.makeText(this@MediaPlayerActivity, "Media not found", Toast.LENGTH_SHORT).show()
                finish()
                return@launch
            }

            runOnUiThread {
                when {
                    item.isDownloaded && item.localPath?.let { File(it).exists() } == true -> {
                        val file = File(item.localPath!!)
                        val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            FileProvider.getUriForFile(this@MediaPlayerActivity, "${packageName}.fileprovider", file)
                        } else {
                            Uri.fromFile(file)
                        }
                        playUri(uri)
                    }
                    isOnline -> {
                        playUri(Uri.parse(item.mediaUrl))
                    }
                    else -> {
                        binding.offlineMessage.isVisible = true
                        binding.playerView.isVisible = false
                    }
                }
            }
        }
    }

    private fun playUri(uri: Uri) {
        binding.offlineMessage.isVisible = false
        binding.playerView.isVisible = true
        player = ExoPlayer.Builder(this).build().also { exo ->
            exo.setMediaItem(MediaItem.fromUri(uri))
            exo.prepare()
            exo.playWhenReady = true
            binding.playerView.player = exo
        }
    }

    override fun onStop() {
        super.onStop()
        player?.release()
        player = null
        binding.playerView.player = null
    }

    companion object {
        const val EXTRA_MEDIA_ID = "media_id"
    }
}
