package com.trjt3a.reminder.ui.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.trjt3a.reminder.data.model.NotificationItem
import com.trjt3a.reminder.data.repository.NotificationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationUiState(
    val notifications: List<NotificationItem> = emptyList(),
    val unreadCount: Int = 0
)

class NotificationViewModel(
    private val notificationRepository: NotificationRepository = NotificationRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            notificationRepository.notifications.collect { list ->
                val unread = list.count { !it.isRead }
                _uiState.update {
                    it.copy(
                        notifications = list,
                        unreadCount = unread
                    )
                }
            }
        }
    }

    fun markAsRead(id: String) {
        notificationRepository.markAsRead(id)
    }

    fun markAllAsRead() {
        notificationRepository.markAllAsRead()
    }
}
