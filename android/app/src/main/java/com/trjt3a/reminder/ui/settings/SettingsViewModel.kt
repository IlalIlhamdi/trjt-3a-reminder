package com.trjt3a.reminder.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.trjt3a.reminder.data.model.NotificationCategory
import com.trjt3a.reminder.data.model.NotificationItem
import com.trjt3a.reminder.data.repository.NotificationRepository
import com.trjt3a.reminder.ui.theme.ThemeManager
import com.trjt3a.reminder.ui.theme.ThemeMode
import com.trjt3a.reminder.utils.JakartaTimeProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.format.DateTimeFormatter

data class SettingsUiState(
    val h10ReminderEnabled: Boolean = true,
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val themeMode: ThemeMode = ThemeMode.LIGHT,
    val appVersion: String = "v5.3",
    val testNotificationSent: Boolean = false
)

class SettingsViewModel(
    private val notificationRepository: NotificationRepository = NotificationRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            ThemeManager.themeMode.collect { mode ->
                _uiState.update { it.copy(themeMode = mode) }
            }
        }
    }

    fun toggleH10Reminder(enabled: Boolean) {
        _uiState.update { it.copy(h10ReminderEnabled = enabled) }
    }

    fun toggleSound(enabled: Boolean) {
        _uiState.update { it.copy(soundEnabled = enabled) }
    }

    fun toggleVibration(enabled: Boolean) {
        _uiState.update { it.copy(vibrationEnabled = enabled) }
    }

    fun setThemeMode(mode: ThemeMode) {
        ThemeManager.setThemeMode(mode)
    }

    fun sendTestNotification() {
        val now = JakartaTimeProvider.now()
        val timeStr = now.format(DateTimeFormatter.ofPattern("HH.mm"))
        val testItem = NotificationItem(
            id = "test-${System.currentTimeMillis()}",
            category = NotificationCategory.REMINDER,
            title = "🔔 Tes Pengingat Kelas",
            subject = "Praktikum Antena dan Propagasi",
            lecturer = "Ipan Suandi, S.T., M.T.",
            meta = "07.30 – 10.00 · L10 (Lab. HF & Propagasi)",
            time = timeStr,
            isRead = false
        )
        notificationRepository.addNotification(testItem)
        _uiState.update { it.copy(testNotificationSent = true) }
    }

    fun resetTestNotificationStatus() {
        _uiState.update { it.copy(testNotificationSent = false) }
    }
}
