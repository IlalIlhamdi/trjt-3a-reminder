/**
 * TRJT 3A — Firestore Seeder Script
 * Run this script to populate your Firestore 'schedules' collection with the 100% verified TRJT 3A roster.
 * 
 * Usage:
 * 1. Place your serviceAccountKey.json in this directory (do NOT commit to git)
 * 2. Run: node firebase/seed-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('⚠️ serviceAccountKey.json not found in /firebase folder.');
  console.log('To seed automatically:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate new private key" and save as firebase/serviceAccountKey.json');
  console.log('3. Run "node firebase/seed-firestore.js" again.');
  process.exit(0);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 100% Verified Official TRJT 3A Schedule Data
const officialSchedules = [
  // SENIN
  {
    id: "senin-praktikum-antena-dan-propagasi",
    classId: "trjt-3a",
    dayOfWeek: 1,
    courseName: "Praktikum Antena dan Propagasi",
    lecturerCode: "ISD",
    lecturerName: "Ipan Suandi, S.T., M.T.",
    roomCode: "L10",
    roomName: "Lab. HF & Propagasi",
    startTime: "07:30",
    endTime: "10:00",
    active: true
  },
  {
    id: "senin-jaringan-komputer-lanjut",
    classId: "trjt-3a",
    dayOfWeek: 1,
    courseName: "Jaringan Komputer Lanjut",
    lecturerCode: "MSY",
    lecturerName: "Muhammad Syahroni, S.T., M.T.",
    roomCode: "R16",
    roomName: "Gedung III Teknik Elektro Lt. 2",
    startTime: "10:20",
    endTime: "12:00",
    active: true
  },

  // SELASA
  {
    id: "selasa-praktikum-jaringan-komputer-lanjut",
    classId: "trjt-3a",
    dayOfWeek: 2,
    courseName: "Praktikum Jaringan Komputer Lanjut",
    lecturerCode: "MSY",
    lecturerName: "Muhammad Syahroni, S.T., M.T.",
    roomCode: "L13",
    roomName: "Lab. Jaringan Komputer",
    startTime: "07:30",
    endTime: "10:00",
    active: true
  },
  {
    id: "selasa-praktikum-sistem-komunikasi-satelit-dan-radar",
    classId: "trjt-3a",
    dayOfWeek: 2,
    courseName: "Praktikum Sistem Komunikasi Satelit dan Radar",
    lecturerCode: "RCM",
    lecturerName: "Rachmawati, S.T., M.Eng.",
    roomCode: "L10",
    roomName: "Lab. HF & Propagasi",
    startTime: "10:20",
    endTime: "12:50",
    active: true
  },
  {
    id: "selasa-teknik-instalasi-fiber-optik",
    classId: "trjt-3a",
    dayOfWeek: 2,
    courseName: "Teknik Instalasi Fiber Optik",
    lecturerCode: "ANF",
    lecturerName: "Anita Fauziah, S.ST., M.T.",
    roomCode: "R15",
    roomName: "Gedung III Teknik Elektro Lt. 2",
    startTime: "13:30",
    endTime: "15:10",
    active: true
  },

  // RABU
  {
    id: "rabu-praktikum-teknik-instalasi-fiber-optik",
    classId: "trjt-3a",
    dayOfWeek: 3,
    courseName: "Praktikum Teknik Instalasi Fiber Optik",
    lecturerCode: "ANF",
    lecturerName: "Anita Fauziah, S.ST., M.T.",
    roomCode: "L23",
    roomName: "Lab. Transmisi",
    startTime: "07:30",
    endTime: "10:00",
    active: true
  },
  {
    id: "rabu-antena-dan-propagasi",
    classId: "trjt-3a",
    dayOfWeek: 3,
    courseName: "Antena dan Propagasi",
    lecturerCode: "ISD",
    lecturerName: "Ipan Suandi, S.T., M.T.",
    roomCode: "R17",
    roomName: "Gedung III Teknik Elektro Lt. 2",
    startTime: "10:20",
    endTime: "12:50",
    active: true
  },

  // KAMIS
  {
    id: "kamis-praktikum-sistem-komunikasi-seluler",
    classId: "trjt-3a",
    dayOfWeek: 4,
    courseName: "Praktikum Sistem Komunikasi Seluler",
    lecturerCode: "YS",
    lecturerName: "Yassir, S.T., M.Eng.Sc.",
    roomCode: "L11",
    roomName: "Lab. Jaringan Telekomunikasi",
    startTime: "07:30",
    endTime: "10:00",
    active: true
  },
  {
    id: "kamis-sistem-komunikasi-satelit-dan-radar",
    classId: "trjt-3a",
    dayOfWeek: 4,
    courseName: "Sistem Komunikasi Satelit dan Radar",
    lecturerCode: "RCM",
    lecturerName: "Rachmawati, S.T., M.Eng.",
    roomCode: "R17",
    roomName: "Gedung III Teknik Elektro Lt. 2",
    startTime: "10:20",
    endTime: "12:50",
    active: true
  },

  // JUMAT
  {
    id: "jumat-sistem-komunikasi-seluler",
    classId: "trjt-3a",
    dayOfWeek: 5,
    courseName: "Sistem Komunikasi Seluler",
    lecturerCode: "YS",
    lecturerName: "Yassir, S.T., M.Eng.Sc.",
    roomCode: "R18",
    roomName: "Gedung III Teknik Elektro Lt. 2",
    startTime: "07:30",
    endTime: "10:00",
    active: true
  },
  {
    id: "jumat-metodologi-penelitian",
    classId: "trjt-3a",
    dayOfWeek: 5,
    courseName: "Metodologi Penelitian",
    lecturerCode: "NEL",
    lecturerName: null, // Dosen belum tersedia
    roomCode: "R18",
    roomName: "Gedung III Teknik Elektro Lt. 2",
    startTime: "10:20",
    endTime: "12:00",
    active: true
  }
];

async function seed() {
  console.log('🚀 Seeding 11 official schedules to Firestore...');
  const batch = db.batch();

  for (const item of officialSchedules) {
    const docRef = db.collection('schedules').doc(item.id);
    batch.set(docRef, item, { merge: true });
  }

  await batch.commit();
  console.log('✅ Successfully seeded 11 TRJT 3A schedules to Firestore collection "schedules"!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
