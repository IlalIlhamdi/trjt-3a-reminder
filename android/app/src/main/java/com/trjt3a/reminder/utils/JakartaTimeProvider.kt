package com.trjt3a.reminder.utils

import java.time.DayOfWeek
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

object JakartaTimeProvider {
    val JAKARTA_ZONE_ID: ZoneId = ZoneId.of("Asia/Jakarta")

    fun now(): ZonedDateTime {
        return ZonedDateTime.now(JAKARTA_ZONE_ID)
    }

    fun getGreeting(hour: Int): String {
        return when (hour) {
            in 4..10 -> "Selamat pagi 👋"
            in 11..14 -> "Selamat siang 👋"
            in 15..17 -> "Selamat sore 👋"
            else -> "Selamat malam 👋"
        }
    }

    fun formatIndonesianDate(dateTime: ZonedDateTime): String {
        val days = mapOf(
            DayOfWeek.SUNDAY to "Minggu",
            DayOfWeek.MONDAY to "Senin",
            DayOfWeek.TUESDAY to "Selasa",
            DayOfWeek.WEDNESDAY to "Rabu",
            DayOfWeek.THURSDAY to "Kamis",
            DayOfWeek.FRIDAY to "Jumat",
            DayOfWeek.SATURDAY to "Sabtu"
        )
        val months = listOf(
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        )

        val dayName = days[dateTime.dayOfWeek] ?: ""
        val dayNum = dateTime.dayOfMonth
        val monthName = months[dateTime.monthValue - 1]
        val year = dateTime.year

        return "$dayName, $dayNum $monthName $year"
    }

    fun getDayOfWeekInt(dateTime: ZonedDateTime): Int {
        // Map java DayOfWeek: MONDAY=1, TUESDAY=2, ..., FRIDAY=5, SATURDAY=6, SUNDAY=0/7
        return when (dateTime.dayOfWeek) {
            DayOfWeek.SUNDAY -> 0
            DayOfWeek.MONDAY -> 1
            DayOfWeek.TUESDAY -> 2
            DayOfWeek.WEDNESDAY -> 3
            DayOfWeek.THURSDAY -> 4
            DayOfWeek.FRIDAY -> 5
            DayOfWeek.SATURDAY -> 6
        }
    }

    fun parseTimeToMinutes(timeStr: String): Int {
        val parts = timeStr.split(":")
        if (parts.size != 2) return 0
        val h = parts[0].toIntOrNull() ?: 0
        val m = parts[1].toIntOrNull() ?: 0
        return h * 60 + m
    }

    fun formatCountdown(remainingSeconds: Long): String {
        if (remainingSeconds <= 0) return "00 : 00 : 00"
        val hours = remainingSeconds / 3600
        val minutes = (remainingSeconds % 3600) / 60
        val seconds = remainingSeconds % 60
        return String.format(Locale.getDefault(), "%02d : %02d : %02d", hours, minutes, seconds)
    }
}
