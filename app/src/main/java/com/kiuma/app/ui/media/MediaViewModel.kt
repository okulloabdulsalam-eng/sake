package com.kiuma.app.ui.media

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.kiuma.app.data.MediaRepository
import com.kiuma.app.data.local.MediaItemEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MediaUiState(
    val filterType: String = "all",
    val isRefreshing: Boolean = false,
    val refreshError: String? = null
)

class MediaViewModel(
    private val repository: MediaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MediaUiState())
    val uiState: StateFlow<MediaUiState> = _uiState.asStateFlow()

    private val _filterType = MutableStateFlow("all")

    val mediaList: StateFlow<List<MediaItemEntity>> = _filterType
        .flatMapLatest { repository.getMediaFlow(it) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    init {
        viewModelScope.launch {
            repository.refreshFromApiIfOnline()
        }
    }

    fun setFilter(type: String) {
        _filterType.value = type
        _uiState.update { it.copy(filterType = type) }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true, refreshError = null) }
            try {
                repository.refreshFromApiIfOnline()
            } catch (e: Exception) {
                _uiState.update { it.copy(refreshError = e.message) }
            }
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    fun clearRefreshError() {
        _uiState.update { it.copy(refreshError = null) }
    }

    fun setLocalPath(id: String, path: String?) {
        viewModelScope.launch {
            repository.setLocalPath(id, path)
        }
    }
}

class MediaViewModelFactory(
    private val repository: MediaRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass != MediaViewModel::class.java) throw IllegalArgumentException()
        return MediaViewModel(repository) as T
    }
}
