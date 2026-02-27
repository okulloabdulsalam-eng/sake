package com.kiuma.app.ui.notifications

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.kiuma.app.data.local.NotificationEntity
import com.kiuma.app.databinding.ItemNotificationBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class NotificationAdapter(
    private val onItemClick: (NotificationEntity) -> Unit
) : ListAdapter<NotificationEntity, NotificationAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemNotificationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onItemClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemNotificationBinding,
        private val onItemClick: (NotificationEntity) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: NotificationEntity) {
            binding.title.text = item.title
            binding.message.text = item.message
            binding.time.text = formatTimeAgo(item.date)
            binding.root.alpha = if (item.status == "read") 0.7f else 1f
            binding.root.setOnClickListener { onItemClick(item) }
        }

        private fun formatTimeAgo(dateStr: String): String {
            if (dateStr.isEmpty()) return ""
            return try {
                val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
                val d = fmt.parse(dateStr.take(19)) ?: SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).parse(dateStr) ?: return dateStr
                val now = System.currentTimeMillis()
                val diff = now - d.time
                when {
                    diff < 60_000 -> "Just now"
                    diff < 3600_000 -> "${diff / 60_000} min ago"
                    diff < 86400_000 -> "${diff / 3600_000} hours ago"
                    diff < 604800_000 -> "${diff / 86400_000} days ago"
                    else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(d.time))
                }
            } catch (_: Exception) {
                dateStr
            }
        }
    }

    private object DiffCallback : DiffUtil.ItemCallback<NotificationEntity>() {
        override fun areItemsTheSame(a: NotificationEntity, b: NotificationEntity) = a.id == b.id
        override fun areContentsTheSame(a: NotificationEntity, b: NotificationEntity) = a == b
    }
}
