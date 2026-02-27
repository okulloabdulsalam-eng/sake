package com.kiuma.app.ui.media

import android.app.Application
import com.kiuma.app.data.MediaRepository
import com.kiuma.app.data.NetworkMonitor

/**
 * Application must implement this to provide Media screen dependencies.
 */
interface MediaViewModelProvider {
    val mediaViewModelFactory: MediaViewModelFactory
    val mediaRepository: MediaRepository
    val networkMonitor: NetworkMonitor
}
