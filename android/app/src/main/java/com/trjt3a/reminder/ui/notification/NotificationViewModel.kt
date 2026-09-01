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
    val allNotifications: List<NotificationItem> = emptyList(),
    val filteredNotifications: List<NotificationItem> = emptyList(),
    val filterType: String = "all", // "all" or "unread"
    val unreadCount: Int = 0
)

class NotificationViewModel(
    private val repository: NotificationRepository = NotificationRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.notifications.collect { list ->
                val unread = list.count { !it.isRead }
                val filtered = if (_uiState.value.filterType == "unread") {
                    list.filter { !it.isRead }
                } else {
                    list
                }
                _uiState.update {
                    it.copy(
                        allNotifications = list,
                        filteredNotifications = filtered,
                        unreadCount = unread
                    )
                }
            }
        }
    }

    fun setFilter(filter: String) {
        val list = _uiState.value.allNotifications
        val filtered = if (filter == "unread") {
            list.filter { !it.isRead }
        } else {
            list
        }
        _uiState.update { it.copy(filterType = filter, filteredNotifications = filtered) }
    }

    fun markAsRead(id: String) {
        repository.markAsRead(id)
    }

    fun markAllAsRead() {
        repository.markAllAsRead()
    }
}
