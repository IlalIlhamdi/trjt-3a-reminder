package com.trjt3a.reminder.data.repository

import com.trjt3a.reminder.data.local.ScheduleSeedData
import com.trjt3a.reminder.data.model.ClassDay
import com.trjt3a.reminder.data.model.Schedule
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class ScheduleRepository {
    private val _schedules = MutableStateFlow(ScheduleSeedData.officialSchedules)
    val schedules: Flow<List<Schedule>> = _schedules.asStateFlow()

    fun getAllDays(): List<ClassDay> = ScheduleSeedData.days

    fun getSchedulesForDay(dayOfWeek: Int): List<Schedule> {
        return _schedules.value
            .filter { it.dayOfWeek == dayOfWeek && it.active }
            .sortedBy { it.startTime }
    }

    fun getAllSchedules(): List<Schedule> = _schedules.value
}
