package com.trjt3a.reminder.data.model

data class Schedule(
    val id: String,
    val classId: String = "trjt-3a",
    val dayOfWeek: Int, // 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat
    val courseName: String,
    val lecturerCode: String,
    val lecturerName: String?,
    val roomCode: String,
    val roomName: String?,
    val startTime: String, // HH:mm format e.g. "07:30"
    val endTime: String,   // HH:mm format e.g. "10:00"
    val active: Boolean = true
) {
    val displayLecturer: String
        get() = lecturerName ?: "Dosen belum tersedia"

    val displayRoom: String
        get() = if (roomName != null) "$roomCode · $roomName" else roomCode

    val formattedStartTime: String
        get() = startTime.replace(':', '.')

    val formattedEndTime: String
        get() = endTime.replace(':', '.')

    val formattedTimeRange: String
        get() = "$formattedStartTime – $formattedEndTime"
}

enum class ClassStatus {
    UPCOMING,
    STARTING_SOON_H10,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
