package com.kiuma.app.ui.notifications

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.kiuma.app.MainActivity
import com.kiuma.app.databinding.ActivityNotificationsBinding
import com.kiuma.app.ui.media.MediaActivity
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * Native notifications list: offline-first from Room.
 * Loads from Room immediately, refreshes from API when online. Never clears on network failure.
 * FCM notifications are saved to Room and displayed here.
 */
class NotificationsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityNotificationsBinding
    private val viewModel: NotificationViewModel by viewModels {
        (application as NotificationViewModelProvider).notificationViewModelFactory
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        val adapter = NotificationAdapter(onItemClick = { item ->
            viewModel.markAsRead(item.id)
            val url = item.relatedPageUrl
            if (!url.isNullOrBlank()) {
                when {
                    url.contains("media.html") -> startActivity(Intent(this, MediaActivity::class.java))
                    url.contains("notifications.html") -> { /* already here */ }
                    else -> {
                        val intent = Intent(this, MainActivity::class.java).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                            putExtra(MainActivity.EXTRA_PENDING_URL, url)
                        }
                        startActivity(intent)
                    }
                }
                finish()
            }
        })
        binding.recycler.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { viewModel.refresh() }

        lifecycleScope.launch {
            viewModel.notificationList.collectLatest { list ->
                adapter.submitList(list)
                binding.emptyText.isVisible = list.isEmpty()
            }
        }
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                binding.swipeRefresh.isRefreshing = state.isRefreshing
                state.refreshError?.let { Toast.makeText(this@NotificationsActivity, it, Toast.LENGTH_SHORT).show() }
                viewModel.clearRefreshError()
            }
        }
    }
}
