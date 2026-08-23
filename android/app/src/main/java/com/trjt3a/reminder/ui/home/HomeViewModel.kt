package com.trjt3a.reminder.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.trjt3a.reminder.data.model.ClassStatus
import com.trjt3a.reminder.data.model.Schedule
import com.trjt3a.reminder.data.repository.NotificationRepository
import com.trjt3a.reminder.data.repository.ScheduleRepository
import com.trjt3a.reminder.utils.JakartaTimeProvider
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.ZonedDateTime

data class HomeUiState(
    val currentDateTime: ZonedDateTime = JakartaTimeProvider.now(),
    val greeting: String = "Selamat pagi 👋",
    val formattedDate: String = "",
    val todaySchedules: List<Schedule> = emptyList(),
    val inProgressSchedule: Schedule? = null,
    val nextUpcomingSchedule: Schedule? = null,
    val currentStatus: ClassStatus = ClassStatus.UPCOMING,
    val countdownText: String = "00 : 00 : 00",
    val progressPercent: Float = 0f,
    val completedCount: Int = 0,
    val totalCount: Int = 0,
    val completedScheduleIds: Set<String> = emptySet(),
    val nextDayName: String? = null,
    val nextDayUpcomingSchedule: Schedule? = null,
    val unreadNotifCount: Int = 0
)

class HomeViewModel(
    private val scheduleRepository: ScheduleRepository = ScheduleRepository(),
    private val notificationRepository: NotificationRepository = NotificationRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        // Collect unread notifications count
        viewModelScope.launch {
            notificationRepository.notifications.collect { list ->
                val unread = list.count { !it.isRead }
                _uiState.update { it.copy(unreadNotifCount = unread) }
            }
        }

        // Start 1-second clock loop
        viewModelScope.launch {
            while (isActive) {
                evaluateState()
                delay(1000)
            }
        }
    }

    private fun evaluateState() {
        val now = JakartaTimeProvider.now()
        val dayOfWeekInt = JakartaTimeProvider.getDayOfWeekInt(now)
        val currentMinutes = now.hour * 60 + now.minute
        val currentSeconds = now.second

        val todaySchedules = scheduleRepository.getSchedulesForDay(dayOfWeekInt)

        var inProgress: Schedule? = null
        var nextUpcoming: Schedule? = null
        val completedIds = mutableSetOf<String>()

        for (item in todaySchedules) {
            val startMin = JakartaTimeProvider.parseTimeToMinutes(item.startTime)
            val endMin = JakartaTimeProvider.parseTimeToMinutes(item.endTime)

            if (currentMinutes in startMin until endMin) {
                inProgress = item
            } else if (currentMinutes < startMin && nextUpcoming == null) {
                nextUpcoming = item
            } else if (currentMinutes >= endMin) {
                completedIds.add(item.id)
            }
        }

        // Find upcoming on next academic day if no classes today
        var nextDayName: String? = null
        var nextDayUpcomingSchedule: Schedule? = null

        if (inProgress == null && nextUpcoming == null) {
            for (offset in 1..7) {
                val nextDayId = (dayOfWeekInt + offset) % 7
                val potential = scheduleRepository.getSchedulesForDay(nextDayId)
                if (potential.isNotEmpty()) {
                    nextDayUpcomingSchedule = potential.first()
                    nextDayName = scheduleRepository.getAllDays().find { it.id == nextDayId }?.name ?: "Senin"
                    break
                }
            }
        }

        var countdownText = "00 : 00 : 00"
        var progressPercent = 0f
        var status = ClassStatus.UPCOMING

        if (inProgress != null) {
            status = ClassStatus.IN_PROGRESS
            val startMin = JakartaTimeProvider.parseTimeToMinutes(inProgress.startTime)
            val endMin = JakartaTimeProvider.parseTimeToMinutes(inProgress.endTime)
            val totalSec = (endMin - startMin) * 60
            val elapsedSec = (currentMinutes - startMin) * 60 + currentSeconds
            progressPercent = (elapsedSec.toFloat() / totalSec.toFloat() * 100f).coerceIn(0f, 100f)

            val remainingSec = (endMin * 60L) - (currentMinutes * 60L + currentSeconds)
            countdownText = JakartaTimeProvider.formatCountdown(remainingSec.coerceAtLeast(0L))
        } else if (nextUpcoming != null) {
            val startMin = JakartaTimeProvider.parseTimeToMinutes(nextUpcoming.startTime)
            val targetSec = startMin * 60L
            val currentTotalSec = currentMinutes * 60L + currentSeconds
            val remainingSec = targetSec - currentTotalSec

            if (remainingSec in 1..600) {
                status = ClassStatus.STARTING_SOON_H10
            } else {
                status = ClassStatus.UPCOMING
            }
            countdownText = JakartaTimeProvider.formatCountdown(remainingSec.coerceAtLeast(0L))
        }

        _uiState.update {
            it.copy(
                currentDateTime = now,
                greeting = JakartaTimeProvider.getGreeting(now.hour),
                formattedDate = JakartaTimeProvider.formatIndonesianDate(now),
                todaySchedules = todaySchedules,
                inProgressSchedule = inProgress,
                nextUpcomingSchedule = nextUpcoming,
                currentStatus = status,
                countdownText = countdownText,
                progressPercent = progressPercent,
                completedCount = completedIds.size,
                totalCount = todaySchedules.size,
                completedScheduleIds = completedIds,
                nextDayName = nextDayName,
                nextDayUpcomingSchedule = nextDayUpcomingSchedule
            )
        }
    }
}
