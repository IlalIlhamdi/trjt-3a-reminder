package com.trjt3a.reminder.data.local

import com.trjt3a.reminder.data.model.ClassDay
import com.trjt3a.reminder.data.model.NotificationCategory
import com.trjt3a.reminder.data.model.NotificationItem
import com.trjt3a.reminder.data.model.Schedule

object ScheduleSeedData {

    val roomMap = mapOf(
        "L10" to "Lab. HF & Propagasi",
        "L11" to "Lab. Jaringan Telekomunikasi",
        "L13" to "Lab. Jaringan Komputer",
        "L23" to "Lab. Transmisi",
        "R15" to "Gedung III Teknik Elektro Lt. 2",
        "R16" to "Gedung III Teknik Elektro Lt. 2",
        "R17" to "Gedung III Teknik Elektro Lt. 2",
        "R18" to "Gedung III Teknik Elektro Lt. 2"
    )

    val lecturerMap = mapOf(
        "ISD" to "Ipan Suandi, S.T., M.T.",
        "MSY" to "Muhammad Syahroni, S.T., M.T.",
        "RCM" to "Rachmawati, S.T., M.Eng.",
        "ANF" to "Anita Fauziah, S.ST., M.T.",
        "YS" to "Yassir, S.T., M.Eng.Sc.",
        "NEL" to "Dr. Nelly Safitri, SST., M.Eng.Sc."
    )

    val days = listOf(
        ClassDay(1, "Senin", "Sen"),
        ClassDay(2, "Selasa", "Sel"),
        ClassDay(3, "Rabu", "Rab"),
        ClassDay(4, "Kamis", "Kam"),
        ClassDay(5, "Jumat", "Jum")
    )

    val officialSchedules = listOf(
        // ==========================================
        // SENIN
        // ==========================================
        Schedule(
            id = "senin-praktikum-antena-dan-propagasi",
            classId = "trjt-3a",
            dayOfWeek = 1,
            courseName = "Praktikum Antena dan Propagasi",
            lecturerCode = "ISD",
            lecturerName = lecturerMap["ISD"],
            roomCode = "L10",
            roomName = roomMap["L10"],
            startTime = "07:30",
            endTime = "10:00"
        ),
        Schedule(
            id = "senin-jaringan-komputer-lanjut",
            classId = "trjt-3a",
            dayOfWeek = 1,
            courseName = "Jaringan Komputer Lanjut",
            lecturerCode = "MSY",
            lecturerName = lecturerMap["MSY"],
            roomCode = "R16",
            roomName = roomMap["R16"],
            startTime = "10:20",
            endTime = "12:00"
        ),

        // ==========================================
        // SELASA
        // ==========================================
        Schedule(
            id = "selasa-praktikum-jaringan-komputer-lanjut",
            classId = "trjt-3a",
            dayOfWeek = 2,
            courseName = "Praktikum Jaringan Komputer Lanjut",
            lecturerCode = "MSY",
            lecturerName = lecturerMap["MSY"],
            roomCode = "L13",
            roomName = roomMap["L13"],
            startTime = "07:30",
            endTime = "10:00"
        ),
        Schedule(
            id = "selasa-praktikum-sistem-komunikasi-satelit-dan-radar",
            classId = "trjt-3a",
            dayOfWeek = 2,
            courseName = "Praktikum Sistem Komunikasi Satelit dan Radar",
            lecturerCode = "RCM",
            lecturerName = lecturerMap["RCM"],
            roomCode = "L10",
            roomName = roomMap["L10"],
            startTime = "10:20",
            endTime = "12:50"
        ),
        Schedule(
            id = "selasa-teknik-instalasi-fiber-optik",
            classId = "trjt-3a",
            dayOfWeek = 2,
            courseName = "Teknik Instalasi Fiber Optik",
            lecturerCode = "ANF",
            lecturerName = lecturerMap["ANF"],
            roomCode = "R15",
            roomName = roomMap["R15"],
            startTime = "13:30",
            endTime = "15:10"
        ),

        // ==========================================
        // RABU
        // ==========================================
        Schedule(
            id = "rabu-praktikum-teknik-instalasi-fiber-optik",
            classId = "trjt-3a",
            dayOfWeek = 3,
            courseName = "Praktikum Teknik Instalasi Fiber Optik",
            lecturerCode = "ANF",
            lecturerName = lecturerMap["ANF"],
            roomCode = "L23",
            roomName = roomMap["L23"],
            startTime = "07:30",
            endTime = "10:00"
        ),
        Schedule(
            id = "rabu-antena-dan-propagasi",
            classId = "trjt-3a",
            dayOfWeek = 3,
            courseName = "Antena dan Propagasi",
            lecturerCode = "ISD",
            lecturerName = lecturerMap["ISD"],
            roomCode = "R17",
            roomName = roomMap["R17"],
            startTime = "10:20",
            endTime = "12:50"
        ),

        // ==========================================
        // KAMIS
        // ==========================================
        Schedule(
            id = "kamis-praktikum-sistem-komunikasi-seluler",
            classId = "trjt-3a",
            dayOfWeek = 4,
            courseName = "Praktikum Sistem Komunikasi Seluler",
            lecturerCode = "YS",
            lecturerName = lecturerMap["YS"],
            roomCode = "L11",
            roomName = roomMap["L11"],
            startTime = "07:30",
            endTime = "10:00"
        ),
        Schedule(
            id = "kamis-sistem-komunikasi-satelit-dan-radar",
            classId = "trjt-3a",
            dayOfWeek = 4,
            courseName = "Sistem Komunikasi Satelit dan Radar",
            lecturerCode = "RCM",
            lecturerName = lecturerMap["RCM"],
            roomCode = "R17",
            roomName = roomMap["R17"],
            startTime = "10:20",
            endTime = "12:50"
        ),

        // ==========================================
        // JUMAT
        // ==========================================
        Schedule(
            id = "jumat-sistem-komunikasi-seluler",
            classId = "trjt-3a",
            dayOfWeek = 5,
            courseName = "Sistem Komunikasi Seluler",
            lecturerCode = "YS",
            lecturerName = lecturerMap["YS"],
            roomCode = "R18",
            roomName = roomMap["R18"],
            startTime = "07:30",
            endTime = "10:00"
        ),
        Schedule(
            id = "jumat-metodologi-penelitian",
            classId = "trjt-3a",
            dayOfWeek = 5,
            courseName = "Metodologi Penelitian",
            lecturerCode = "NEL",
            lecturerName = lecturerMap["NEL"], // null
            roomCode = "R18",
            roomName = roomMap["R18"],
            startTime = "10:20",
            endTime = "12:00"
        )
    )

    val initialNotifications = listOf(
        NotificationItem(
            id = "notif-1",
            category = NotificationCategory.REMINDER,
            title = "Kelas 10 Menit Lagi",
            subject = "Jaringan Komputer Lanjut",
            lecturer = "Muhammad Syahroni, S.T., M.T.",
            meta = "10.20 – 12.00 · R16",
            time = "10.10",
            isRead = false
        ),
        NotificationItem(
            id = "notif-2",
            category = NotificationCategory.REMINDER,
            title = "Kelas 10 Menit Lagi",
            subject = "Praktikum Antena dan Propagasi",
            lecturer = "Ipan Suandi, S.T., M.T.",
            meta = "07.30 – 10.00 · L10",
            time = "07.20",
            isRead = true
        ),
        NotificationItem(
            id = "notif-3",
            category = NotificationCategory.ANNOUNCEMENT,
            title = "Informasi Ruangan",
            subject = "Praktikum Jaringan Komputer Lanjut",
            lecturer = "Muhammad Syahroni, S.T., M.T.",
            meta = "07.30 – 10.00 · L13 (Lab. Jaringan Komputer)",
            time = "Kemarin, 16.45",
            isRead = true
        )
    )
}
