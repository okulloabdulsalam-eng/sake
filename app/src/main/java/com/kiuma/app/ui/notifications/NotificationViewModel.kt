package com.kiuma.app.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.kiuma.app.data.NotificationRepository
import com.kiuma.app.data.local.NotificationEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationUiState(
    val isRefreshing: Boolean = false,
    val refreshError: String? = null
)

class NotificationViewModel(
    private val repository: NotificationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    val notificationList: StateFlow<List<NotificationEntity>> = repository.getNotificationsFlow()
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

    fun markAsRead(id: String) {
        viewModelScope.launch {
            repository.updateReadStatus(id, "read")
        }
    }
}

class NotificationViewModelFactory(
    private val repository: NotificationRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass != NotificationViewModel::class.java) throw IllegalArgumentException()
        return NotificationViewModel(repository) as T
    }
}
