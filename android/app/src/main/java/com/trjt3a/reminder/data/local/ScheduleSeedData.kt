package com.trjt3a.reminder.data.local

import com.trjt3a.reminder.data.model.ClassDay
import com.trjt3a.reminder.data.model.Dosen
import com.trjt3a.reminder.data.model.NotificationCategory
import com.trjt3a.reminder.data.model.NotificationItem
import com.trjt3a.reminder.data.model.PiketGroup
import com.trjt3a.reminder.data.model.Schedule
import com.trjt3a.reminder.data.model.Student

object ScheduleSeedData {

    const val GOOGLE_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1W7F5rWsNNq-nsLUF1emnOj4eJsYSShzW?usp=drive_link"

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
        "ANF" to "Anita Fauziah, SST., M.T.",
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
            lecturerName = "Dr. Nelly Safitri, SST., M.Eng.Sc.",
            roomCode = "R18",
            roomName = roomMap["R18"],
            startTime = "10:20",
            endTime = "12:00"
        )
    )

    // ==========================================
    // DAFTAR DOSEN PENGAMPU TRJT 3A (SEMESTER 5)
    // ==========================================
    val dosenList = listOf(
        Dosen(
            no = 1,
            initial = "IS",
            name = "Ipan Suandi, S.T., M.T.",
            nip = "19800510 200501 1 002",
            courses = listOf(
                "Praktikum Antena dan Propagasi",
                "Antena dan Propagasi"
            )
        ),
        Dosen(
            no = 2,
            initial = "MS",
            name = "Muhammad Syahroni, S.T., M.T.",
            nip = "19721026 200604 1 001",
            courses = listOf(
                "Jaringan Komputer Lanjut",
                "Praktikum Jaringan Komputer Lanjut"
            )
        ),
        Dosen(
            no = 3,
            initial = "RS",
            name = "Rachmawati, S.T., M.Eng.",
            nip = "19790826 200312 2 001",
            courses = listOf(
                "Praktikum Sistem Komunikasi Satelit dan Radar",
                "Sistem Komunikasi Satelit dan Radar"
            )
        ),
        Dosen(
            no = 4,
            initial = "AF",
            name = "Anita Fauziah, SST., M.T.",
            nip = "19720129 199803 2 001",
            courses = listOf(
                "Teknik Instalasi Fiber Optik",
                "Praktikum Teknik Instalasi Fiber Optik"
            )
        ),
        Dosen(
            no = 5,
            initial = "YS",
            name = "Yassir, S.T., M.Eng.Sc.",
            nip = "19800419 200312 1 002",
            courses = listOf(
                "Praktikum Sistem Komunikasi Seluler",
                "Sistem Komunikasi Seluler"
            )
        ),
        Dosen(
            no = 6,
            initial = "DN",
            name = "Dr. Nelly Safitri, SST., M.Eng.Sc.",
            nip = "NIP Belum Tercatat",
            courses = listOf(
                "Metodologi Penelitian"
            )
        )
    )

    // ==========================================
    // DAFTAR PIKET KELAS KELOMPOK I - V
    // ==========================================
    val piketGroups = listOf(
        PiketGroup(
            groupNumber = 1,
            groupRoman = "I",
            groupName = "Kelompok I",
            members = listOf(
                "Aqil Ocean Difra",
                "Renka Laura",
                "Firlita Afianti",
                "Afriansyah Sinamo"
            )
        ),
        PiketGroup(
            groupNumber = 2,
            groupRoman = "II",
            groupName = "Kelompok II",
            members = listOf(
                "Lunna Auamara",
                "Nazar Alfaraby",
                "Rahmat Haikal",
                "Muhammad Halfi Al Barizi"
            )
        ),
        PiketGroup(
            groupNumber = 3,
            groupRoman = "III",
            groupName = "Kelompok III",
            members = listOf(
                "Syawal Fitriadi",
                "Sarah Fonna",
                "Muhammad Rais"
            )
        ),
        PiketGroup(
            groupNumber = 4,
            groupRoman = "IV",
            groupName = "Kelompok IV",
            members = listOf(
                "Nesya Zikriya",
                "Farhan Alfarisi",
                "Ilal Ilhamdi"
            )
        ),
        PiketGroup(
            groupNumber = 5,
            groupRoman = "V",
            groupName = "Kelompok V",
            members = listOf(
                "Durratul Hikmah",
                "Suheil Maulana",
                "Khairul Fajar Sidiq"
            )
        )
    )

    // ==========================================
    // DAFTAR 17 MAHASISWA AKTIF TRJT 3A
    // ==========================================
    val students: List<Student> by lazy {
        piketGroups.flatMap { group ->
            group.members.map { name ->
                Student(
                    name = name,
                    groupNumber = group.groupNumber,
                    groupRoman = group.groupRoman
                )
            }
        }.sortedBy { it.name }
    }

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
