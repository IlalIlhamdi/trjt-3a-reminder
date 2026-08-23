package com.trjt3a.reminder.data.repository

import com.trjt3a.reminder.data.local.ScheduleSeedData
import com.trjt3a.reminder.data.model.NotificationItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class NotificationRepository {
    private val _notifications = MutableStateFlow(ScheduleSeedData.initialNotifications)
    val notifications: Flow<List<NotificationItem>> = _notifications.asStateFlow()

    fun markAsRead(id: String) {
        _notifications.update { list ->
            list.map { if (it.id == id) it.copy(isRead = true) else it }
        }
    }

    fun markAllAsRead() {
        _notifications.update { list ->
            list.map { it.copy(isRead = true) }
        }
    }

    fun addNotification(item: NotificationItem) {
        _notifications.update { list ->
            listOf(item) + list
        }
    }
}
