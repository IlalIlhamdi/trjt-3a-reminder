package com.trjt3a.reminder.utils

import com.trjt3a.reminder.data.local.ScheduleSeedData
import com.trjt3a.reminder.data.model.PiketGroup
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters

object PiketRotationManager {
    // Reference Monday: 31 Agustus 2026 was assigned to Group 2 (Kelompok II)
    val REFERENCE_MONDAY: LocalDate = LocalDate.of(2026, 8, 31)
    const val REFERENCE_GROUP_NUMBER: Int = 2

    fun getCurrentWeekMonday(date: LocalDate): LocalDate {
        return if (date.dayOfWeek == DayOfWeek.MONDAY) {
            date
        } else {
            date.with(TemporalAdjusters.previous(DayOfWeek.MONDAY))
        }
    }

    fun getActiveGroupNumber(date: LocalDate): Int {
        val currentMonday = getCurrentWeekMonday(date)
        val weeksDiff = ChronoUnit.WEEKS.between(REFERENCE_MONDAY, currentMonday)
        // Group index: 0 for Group 1, 1 for Group 2, etc.
        val refIndex = REFERENCE_GROUP_NUMBER - 1
        val groupIndex = Math.floorMod(refIndex + weeksDiff, 5).toInt()
        return groupIndex + 1
    }

    fun getCurrentPiketGroup(dateTime: ZonedDateTime = JakartaTimeProvider.now()): PiketGroup {
        val groupNum = getActiveGroupNumber(dateTime.toLocalDate())
        return ScheduleSeedData.piketGroups.find { it.groupNumber == groupNum }
            ?: ScheduleSeedData.piketGroups.first()
    }
}
