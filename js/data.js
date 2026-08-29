/**
 * TRJT 3A Schedule Database — Source of Truth
 * Program Studi: Teknologi Rekayasa Jaringan Telekomunikasi
 * Jurusan: Teknik Elektro, Politeknik Negeri Lhokseumawe
 * Kelas: TRJT 3A (Semester 5, TA 2026/2027)
 */

// Centralized Room & Lab Mapping
const roomMap = {
  L10: 'Lab. HF & Propagasi',
  L11: 'Lab. Jaringan Telekomunikasi',
  L13: 'Lab. Jaringan Komputer',
  L23: 'Lab. Transmisi',
  R15: 'Gedung III Teknik Elektro Lt. 2',
  R16: 'Gedung III Teknik Elektro Lt. 2',
  R17: 'Gedung III Teknik Elektro Lt. 2',
  R18: 'Gedung III Teknik Elektro Lt. 2'
};

const lecturerMap = {
  ISD: 'Ipan Suandi, S.T., M.T.',
  MSY: 'Muhammad Syahroni, S.T., M.T.',
  RCM: 'Rachmawati, S.T., M.Eng.',
  ANF: 'Anita Fauziah, S.ST., M.T.',
  YS: 'Yassir, S.T., M.Eng.Sc.',
  NEL: 'Dr. Nelly Safitri, SST., M.Eng.Sc.'
};

const TRJT_SCHEDULE = {
  academicInfo: {
    programStudi: 'Teknologi Rekayasa Jaringan Telekomunikasi',
    jurusan: 'Teknik Elektro',
    institusi: 'Politeknik Negeri Lhokseumawe',
    kelas: 'TRJT 3A',
    semester: 5,
    tahunAkademik: '2026/2027'
  },

  days: [
    { id: 1, key: 'senin', name: 'Senin', shortName: 'Sen' },
    { id: 2, key: 'selasa', name: 'Selasa', shortName: 'Sel' },
    { id: 3, key: 'rabu', name: 'Rabu', shortName: 'Rab' },
    { id: 4, key: 'kamis', name: 'Kamis', shortName: 'Kam' },
    { id: 5, key: 'jumat', name: 'Jumat', shortName: 'Jum' }
  ],

  roomMap,
  lecturerMap,

  classes: [
    // ==========================================
    // SENIN
    // ==========================================
    {
      id: 'senin-praktikum-antena-dan-propagasi',
      classId: 'trjt-3a',
      dayOfWeek: 1,
      courseName: 'Praktikum Antena dan Propagasi',
      lecturerCode: 'ISD',
      lecturerName: lecturerMap.ISD,
      roomCode: 'L10',
      roomName: roomMap.L10,
      startTime: '07:30',
      endTime: '10:00',
      active: true
    },
    {
      id: 'senin-jaringan-komputer-lanjut',
      classId: 'trjt-3a',
      dayOfWeek: 1,
      courseName: 'Jaringan Komputer Lanjut',
      lecturerCode: 'MSY',
      lecturerName: lecturerMap.MSY,
      roomCode: 'R16',
      roomName: roomMap.R16,
      startTime: '10:20',
      endTime: '12:00',
      active: true
    },

    // ==========================================
    // SELASA
    // ==========================================
    {
      id: 'selasa-praktikum-jaringan-komputer-lanjut',
      classId: 'trjt-3a',
      dayOfWeek: 2,
      courseName: 'Praktikum Jaringan Komputer Lanjut',
      lecturerCode: 'MSY',
      lecturerName: lecturerMap.MSY,
      roomCode: 'L13',
      roomName: roomMap.L13,
      startTime: '07:30',
      endTime: '10:00',
      active: true
    },
    {
      id: 'selasa-praktikum-sistem-komunikasi-satelit-dan-radar',
      classId: 'trjt-3a',
      dayOfWeek: 2,
      courseName: 'Praktikum Sistem Komunikasi Satelit dan Radar',
      lecturerCode: 'RCM',
      lecturerName: lecturerMap.RCM,
      roomCode: 'L10',
      roomName: roomMap.L10,
      startTime: '10:20',
      endTime: '12:50',
      active: true
    },
    {
      id: 'selasa-teknik-instalasi-fiber-optik',
      classId: 'trjt-3a',
      dayOfWeek: 2,
      courseName: 'Teknik Instalasi Fiber Optik',
      lecturerCode: 'ANF',
      lecturerName: lecturerMap.ANF,
      roomCode: 'R15',
      roomName: roomMap.R15,
      startTime: '13:30',
      endTime: '15:10',
      active: true
    },

    // ==========================================
    // RABU
    // ==========================================
    {
      id: 'rabu-praktikum-teknik-instalasi-fiber-optik',
      classId: 'trjt-3a',
      dayOfWeek: 3,
      courseName: 'Praktikum Teknik Instalasi Fiber Optik',
      lecturerCode: 'ANF',
      lecturerName: lecturerMap.ANF,
      roomCode: 'L23',
      roomName: roomMap.L23,
      startTime: '07:30',
      endTime: '10:00',
      active: true
    },
    {
      id: 'rabu-antena-dan-propagasi',
      classId: 'trjt-3a',
      dayOfWeek: 3,
      courseName: 'Antena dan Propagasi',
      lecturerCode: 'ISD',
      lecturerName: lecturerMap.ISD,
      roomCode: 'R17',
      roomName: roomMap.R17,
      startTime: '10:20',
      endTime: '12:50',
      active: true
    },

    // ==========================================
    // KAMIS
    // ==========================================
    {
      id: 'kamis-praktikum-sistem-komunikasi-seluler',
      classId: 'trjt-3a',
      dayOfWeek: 4,
      courseName: 'Praktikum Sistem Komunikasi Seluler',
      lecturerCode: 'YS',
      lecturerName: lecturerMap.YS,
      roomCode: 'L11',
      roomName: roomMap.L11,
      startTime: '07:30',
      endTime: '10:00',
      active: true
    },
    {
      id: 'kamis-sistem-komunikasi-satelit-dan-radar',
      classId: 'trjt-3a',
      dayOfWeek: 4,
      courseName: 'Sistem Komunikasi Satelit dan Radar',
      lecturerCode: 'RCM',
      lecturerName: lecturerMap.RCM,
      roomCode: 'R17',
      roomName: roomMap.R17,
      startTime: '10:20',
      endTime: '12:50',
      active: true
    },

    // ==========================================
    // JUMAT
    // ==========================================
    {
      id: 'jumat-sistem-komunikasi-seluler',
      classId: 'trjt-3a',
      dayOfWeek: 5,
      courseName: 'Sistem Komunikasi Seluler',
      lecturerCode: 'YS',
      lecturerName: lecturerMap.YS,
      roomCode: 'R18',
      roomName: roomMap.R18,
      startTime: '07:30',
      endTime: '10:00',
      active: true
    },
    {
      id: 'jumat-metodologi-penelitian',
      classId: 'trjt-3a',
      dayOfWeek: 5,
      courseName: 'Metodologi Penelitian',
      lecturerCode: 'NEL',
      lecturerName: 'Dr. Nelly Safitri, SST., M.Eng.Sc.',
      roomCode: 'R18',
      roomName: roomMap.R18,
      startTime: '10:20',
      endTime: '12:00',
      active: true
    }
  ],

  // Piket Schedule (Daftar Piket Kelas Kelompok I - V - Rotasi Mingguan)
  piket: [
    {
      groupNumber: 1,
      groupRoman: 'I',
      groupName: 'Kelompok I',
      members: [
        'Aqil Ocean Difra',
        'Renka Laura',
        'Firlita Afianti',
        'Afriansyah Sinamo'
      ]
    },
    {
      groupNumber: 2,
      groupRoman: 'II',
      groupName: 'Kelompok II',
      members: [
        'Lunna Auamara',
        'Nazar Alfaraby',
        'Rahmat Haikal',
        'Muhammad Halfi Al Barizi'
      ]
    },
    {
      groupNumber: 3,
      groupRoman: 'III',
      groupName: 'Kelompok III',
      members: [
        'Syawal Fitriadi',
        'Sarah Fonna',
        'Muhammad Rais'
      ]
    },
    {
      groupNumber: 4,
      groupRoman: 'IV',
      groupName: 'Kelompok IV',
      members: [
        'Nesya Zikriya',
        'Farhan Alfarisi',
        'Ilal Ilhamdi'
      ]
    },
    {
      groupNumber: 5,
      groupRoman: 'V',
      groupName: 'Kelompok V',
      members: [
        'Durratul Hikmah',
        'Suheil Maulana',
        'Khairul Fajar Sidiq'
      ]
    }
  ],

  // Konfigurasi Rotasi Piket Mingguan: 1 kelompok bertugas selama 1 minggu (Senin - Jumat)
  // Acuan: Pekan 24 - 30 Agustus 2026 adalah giliran Kelompok II
  piketRotation: {
    referenceMonday: '2026-08-24',
    referenceGroupNumber: 2
  },

  // Notifications
  initialNotifications: [
    {
      id: 'notif-1',
      type: 'h10',
      title: 'Kelas 10 Menit Lagi',
      subject: 'Jaringan Komputer Lanjut',
      lecturer: 'Muhammad Syahroni, S.T., M.T.',
      meta: '10.20 – 12.00 · R16',
      time: '10.10',
      read: true
    },
    {
      id: 'notif-2',
      type: 'h10',
      title: 'Kelas 10 Menit Lagi',
      subject: 'Praktikum Antena dan Propagasi',
      lecturer: 'Ipan Suandi, S.T., M.T.',
      meta: '07.30 – 10.00 · L10',
      time: '07.20',
      read: true
    },
    {
      id: 'notif-3',
      type: 'info',
      title: 'Informasi Ruangan',
      subject: 'Praktikum Jaringan Komputer Lanjut',
      lecturer: 'Muhammad Syahroni, S.T., M.T.',
      meta: '07.30 – 10.00 · L13 (Lab. Jaringan Komputer)',
      time: 'Kemarin, 16.45',
      read: true
    }
  ],

  // ==========================================
  // DAFTAR DOSEN PENGAMPU TRJT 3A (SEMESTER 5)
  // ==========================================
  dosen: [
    {
      no: 1,
      initial: "IS",
      name: "Ipan Suandi, S.T., M.T.",
      nip: "198005102005011002",
      courses: [
        "Praktikum Antena dan Propagasi",
        "Antena dan Propagasi"
      ]
    },
    {
      no: 2,
      initial: "MS",
      name: "Muhammad Syahroni, S.T., M.T.",
      nip: "197210262006041001",
      courses: [
        "Jaringan Komputer Lanjut",
        "Praktikum Jaringan Komputer Lanjut"
      ]
    },
    {
      no: 3,
      initial: "RS",
      name: "Rachmawati, S.T., M.Eng.",
      nip: "197908262003122001",
      courses: [
        "Praktikum Sistem Komunikasi Satelit dan Radar",
        "Sistem Komunikasi Satelit dan Radar"
      ]
    },
    {
      no: 4,
      initial: "AF",
      name: "Anita Fauziah, SST., M.T.",
      nip: "197201291998032001",
      courses: [
        "Teknik Instalasi Fiber Optik",
        "Praktikum Teknik Instalasi Fiber Optik"
      ]
    },
    {
      no: 5,
      initial: "YS",
      name: "Yassir, S.T., M.Eng.Sc.",
      nip: "198004192003121002",
      courses: [
        "Praktikum Sistem Komunikasi Seluler",
        "Sistem Komunikasi Seluler"
      ]
    },
    {
      no: 6,
      initial: "DN",
      name: "Dr. Nelly Safitri, SST., M.Eng.Sc.",
      nip: "NIP Belum Tercatat",
      courses: [
        "Metodologi Penelitian"
      ]
    }
  ]
};

const TRJT_PIKET = TRJT_SCHEDULE.piket;
const TRJT_DOSEN = TRJT_SCHEDULE.dosen;

window.roomMap = roomMap;
window.lecturerMap = lecturerMap;
window.TRJT_SCHEDULE = TRJT_SCHEDULE;
window.TRJT_PIKET = TRJT_PIKET;
window.TRJT_DOSEN = TRJT_DOSEN;

