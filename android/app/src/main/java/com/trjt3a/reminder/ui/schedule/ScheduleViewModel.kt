package com.trjt3a.reminder.ui.schedule

import androidx.lifecycle.ViewModel
import com.trjt3a.reminder.data.model.ClassDay
import com.trjt3a.reminder.data.model.Schedule
import com.trjt3a.reminder.data.repository.ScheduleRepository
import com.trjt3a.reminder.utils.JakartaTimeProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class ScheduleUiState(
    val days: List<ClassDay> = emptyList(),
    val selectedDayId: Int = 1,
    val schedulesForSelectedDay: List<Schedule> = emptyList()
)

class ScheduleViewModel(
    private val scheduleRepository: ScheduleRepository = ScheduleRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScheduleUiState())
    val uiState: StateFlow<ScheduleUiState> = _uiState.asStateFlow()

    init {
        val days = scheduleRepository.getAllDays()
        val currentDayOfWeek = JakartaTimeProvider.getDayOfWeekInt(JakartaTimeProvider.now())
        val defaultDayId = if (currentDayOfWeek in 1..5) currentDayOfWeek else 1

        _uiState.update {
            it.copy(
                days = days,
                selectedDayId = defaultDayId,
                schedulesForSelectedDay = scheduleRepository.getSchedulesForDay(defaultDayId)
            )
        }
    }

    fun selectDay(dayId: Int) {
        _uiState.update {
            it.copy(
                selectedDayId = dayId,
                schedulesForSelectedDay = scheduleRepository.getSchedulesForDay(dayId)
            )
        }
    }
}
