package com.trjt3a.reminder.data.model

enum class NotificationCategory {
    REMINDER,
    SCHEDULE_CHANGED,
    CANCELLED,
    ANNOUNCEMENT
}

data class NotificationItem(
    val id: String,
    val category: NotificationCategory = NotificationCategory.REMINDER,
    val title: String,
    val subject: String,
    val lecturer: String? = null,
    val meta: String,
    val time: String,
    val isRead: Boolean = false
)
