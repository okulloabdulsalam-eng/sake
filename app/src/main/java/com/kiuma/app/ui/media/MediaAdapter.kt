package com.kiuma.app.ui.media

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.kiuma.app.data.local.MediaItemEntity
import com.kiuma.app.databinding.ItemMediaBinding

class MediaAdapter(
    private val onPlay: (MediaItemEntity) -> Unit,
    private val onDownload: (MediaItemEntity) -> Unit
) : ListAdapter<MediaItemEntity, MediaAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemMediaBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onPlay, onDownload)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemMediaBinding,
        private val onPlay: (MediaItemEntity) -> Unit,
        private val onDownload: (MediaItemEntity) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: MediaItemEntity) {
            binding.title.text = item.title
            binding.typeBadge.text = item.mediaType.uppercase()
            binding.subtitle.text = if (item.isDownloaded) "Downloaded" else "Tap to play • Download for offline"
            binding.iconPlay.visibility = if (item.mediaType == "video" || item.mediaType == "audio") android.view.View.VISIBLE else android.view.View.GONE
            binding.btnDownload.setOnClickListener { onDownload(item) }
            binding.root.setOnClickListener { onPlay(item) }

            val thumbUrl = if (item.thumbnailUrl.isNotEmpty()) item.thumbnailUrl else item.mediaUrl
            if (thumbUrl.isNotEmpty()) {
                Glide.with(binding.thumbnail.context)
                    .load(thumbUrl)
                    .apply(
                        RequestOptions()
                            .diskCacheStrategy(DiskCacheStrategy.ALL)
                            .centerCrop()
                    )
                    .into(binding.thumbnail)
            } else {
                Glide.with(binding.thumbnail.context).clear(binding.thumbnail)
            }
        }
    }

    private object DiffCallback : DiffUtil.ItemCallback<MediaItemEntity>() {
        override fun areItemsTheSame(a: MediaItemEntity, b: MediaItemEntity) = a.id == b.id
        override fun areContentsTheSame(a: MediaItemEntity, b: MediaItemEntity) = a == b
    }
}
