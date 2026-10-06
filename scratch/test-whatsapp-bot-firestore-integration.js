import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n================================================================');
console.log('🤖 TEST SUITE: INTEGRASI DATA TUGAS FIRESTORE KE WHATSAPP BOT');
console.log('================================================================\n');

// 1. Storage & Environment Mocking
const mockStorage = {};
const localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

globalThis.localStorage = localStorage;
globalThis.window = globalThis;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};
globalThis.dispatchEvent = () => {};

// Mock Firestore Database Simulator
const mockFirestoreStore = new Map();
let mockServerTimestampCounter = 1000;

const mockDb = {
  collection: (collName) => {
    assert.strictEqual(collName, 'courseAssignments', 'Collection WAJIB courseAssignments');
    return {
      doc: (docId) => ({
        set: async (data, options) => {
          if (options && options.merge) {
            const prev = mockFirestoreStore.get(docId) || {};
            mockFirestoreStore.set(docId, { ...prev, ...data });
          } else {
            mockFirestoreStore.set(docId, { ...data });
          }
          return true;
        },
        get: async () => ({
          exists: mockFirestoreStore.has(docId),
          id: docId,
          data: () => mockFirestoreStore.get(docId)
        }),
        delete: async () => {
          mockFirestoreStore.delete(docId);
          return true;
        }
      }),
      get: async () => {
        const docs = [];
        for (const [id, data] of mockFirestoreStore.entries()) {
          docs.push({
            id,
            data: () => data
          });
        }
        return {
          empty: docs.length === 0,
          size: docs.length,
          forEach: (fn) => docs.forEach(fn),
          docs
        };
      }
    };
  }
};

globalThis.window.firebase = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => {
        mockServerTimestampCounter += 100;
        return { _methodName: 'serverTimestamp', _seq: mockServerTimestampCounter };
      }
    }
  }
};

globalThis.window.TRJT_FIREBASE = {
  getDb: () => mockDb
};

// Time Provider Simulator
class FakeTimeProvider {
  constructor(initialDate) {
    this.currentDate = new Date(initialDate);
  }
  setTime(d) {
    this.currentDate = new Date(d);
  }
  now() {
    return new Date(this.currentDate);
  }
}

const fakeTime = new FakeTimeProvider('2026-10-04T12:00:00+07:00');
globalThis.window.appTimeProvider = fakeTime;

// Load js/assignment-service.js
const serviceCode = fs.readFileSync('js/assignment-service.js', 'utf8');
eval(serviceCode);

const service = globalThis.window.TRJT_ASSIGNMENTS;
assert.ok(service, 'TRJT_ASSIGNMENTS must be defined on window');
assert.ok(typeof service.createAssignment === 'function', 'createAssignment must be a function');
assert.ok(typeof service.updateAssignment === 'function', 'updateAssignment must be a function');
assert.ok(typeof service.deleteAssignment === 'function', 'deleteAssignment must be a function');

async function runTests() {
  console.log('--- TEST 1: Audit Koleksi & Skema Field Awal ---');
  // Pastikan tidak ada collection bot_tasks atau cache kedua
  assert.strictEqual(mockFirestoreStore.size, 0, 'Firestore collection awal bersih');
  console.log('  ✅ Koleksi Firestore adalah "courseAssignments" tanpa database bot terpisah.');

  console.log('\n--- TEST 2: Tambah Tugas Kuliah (Create) Sesuai Spesifikasi ---');
  /*
    Input:
    Laporan Praktikum Antena
    Praktikum Antena dan Propagasi
    6 Oktober 2026
    Kelompok
    Kumpul Fisik
  */
  const created = await service.createAssignment({
    title: 'Laporan Praktikum Antena',
    courseName: 'Praktikum Antena dan Propagasi',
    deadline: '2026-10-06',
    assignmentType: 'Kelompok',
    submissionMethod: 'Kumpul Fisik'
  });

  assert.ok(created.id, 'Tugas memiliki ID');
  const taskId = created.id;
  console.log(`  Created task ID: ${taskId}`);

  // Cek isi document di mock Firestore
  const docInFirestore = mockFirestoreStore.get(taskId);
  assert.ok(docInFirestore, 'Document tersimpan di Firestore');
  assert.strictEqual(docInFirestore.title, 'Laporan Praktikum Antena', 'Field title sesuai');
  assert.strictEqual(docInFirestore.courseName, 'Praktikum Antena dan Propagasi', 'Field courseName sesuai');
  assert.strictEqual(docInFirestore.deadline, '2026-10-06', 'Field deadline format YYYY-MM-DD');
  assert.strictEqual(docInFirestore.dueDate, '2026-10-06', 'Field dueDate terhubung konsisten');
  assert.strictEqual(docInFirestore.assignmentType, 'Kelompok', 'Field assignmentType adalah "Kelompok"');
  assert.strictEqual(docInFirestore.type, 'kelompok', 'Field type adalah "kelompok" (backward compatible)');
  assert.strictEqual(docInFirestore.submissionMethod, 'Kumpul Fisik', 'Field submissionMethod adalah "Kumpul Fisik"');
  assert.ok(docInFirestore.createdAt, 'Field createdAt tersedia');
  assert.ok(docInFirestore.updatedAt, 'Field updatedAt tersedia');

  // Pastikan tidak ada data UI tersimpan
  assert.strictEqual(docInFirestore.cssClass, undefined, 'Tidak ada field CSS class di Firestore');
  assert.strictEqual(docInFirestore.color, undefined, 'Tidak ada field warna di Firestore');
  assert.strictEqual(docInFirestore.icon, undefined, 'Tidak ada field icon di Firestore');
  assert.strictEqual(docInFirestore.cardState, undefined, 'Tidak ada field cardState di Firestore');
  console.log('  ✅ TEST 2 PASSED: Firestore memiliki document tugas lengkap dan bersih dari atribut UI.');

  console.log('\n--- TEST 3: Edit Deadline Tugas ke 7 Oktober 2026 (Update) ---');
  const updated = await service.updateAssignment(taskId, {
    deadline: '2026-10-07'
  });

  const docAfterUpdate = mockFirestoreStore.get(taskId);
  assert.ok(docAfterUpdate, 'Document masih ada setelah diedit');
  assert.strictEqual(docAfterUpdate.deadline, '2026-10-07', 'Deadline document Firestore terupdate ke 2026-10-07');
  assert.strictEqual(docAfterUpdate.dueDate, '2026-10-07', 'DueDate terupdate ke 2026-10-07');
  assert.strictEqual(docAfterUpdate.title, 'Laporan Praktikum Antena', 'Judul tetap sama');
  assert.strictEqual(docAfterUpdate.courseName, 'Praktikum Antena dan Propagasi', 'Mata kuliah tetap sama');
  assert.strictEqual(docAfterUpdate.assignmentType, 'Kelompok', 'Tipe tetap sama');
  assert.strictEqual(docAfterUpdate.submissionMethod, 'Kumpul Fisik', 'Metode tetap sama');
  console.log('  ✅ TEST 3 PASSED: Document yang sama di Firestore langsung terupdate.');

  console.log('\n--- TEST 4: Validasi Aturan Auto-Expired (Asia/Jakarta WIB) ---');
  // Deadline 6 Okt: aktif sampai 6 Okt 23:59:59.999 WIB, expired mulai 7 Okt 00:00:00 WIB
  const deadlineCheck = '2026-10-06';
  fakeTime.setTime('2026-10-06T23:59:50+07:00');
  assert.strictEqual(service.isAssignmentExpired(deadlineCheck), false, '6 Okt 23:59 WIB: tugas harus AKTIF');

  fakeTime.setTime('2026-10-07T00:00:01+07:00');
  assert.strictEqual(service.isAssignmentExpired(deadlineCheck), true, '7 Okt 00:00:01 WIB: tugas harus EXPIRED');
  console.log('  ✅ TEST 4 PASSED: Aturan auto-expired konsisten.');

  console.log('\n--- TEST 5: Simulasi WhatsApp Bot Membaca Data Tugas Firestore ---');
  // Simulasikan query read Firestore oleh server WhatsApp Bot
  const snapshot = await mockDb.collection('courseAssignments').get();
  const botTasks = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    botTasks.push({
      id: doc.id,
      title: data.title,
      courseName: data.courseName,
      deadline: data.deadline,
      assignmentType: data.assignmentType,
      submissionMethod: data.submissionMethod
    });
  });

  assert.strictEqual(botTasks.length, 1, 'Bot membaca 1 tugas');
  const botTask = botTasks[0];

  // Helper format tanggal Indonesia untuk Bot
  function formatIndonesianDate(ymd) {
    const [y, m, d] = ymd.split('-');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  }

  const botOutputMessage = 
`Nama tugas:
${botTask.title}

Mata kuliah:
${botTask.courseName}

Deadline:
${formatIndonesianDate(botTask.deadline)}

Tipe:
${botTask.assignmentType}

Pengumpulan:
${botTask.submissionMethod}`;

  console.log('--- OUTPUT PESAN BOT WHATSAPP ---');
  console.log(botOutputMessage);
  console.log('---------------------------------');

  assert.ok(botOutputMessage.includes('Nama tugas:\nLaporan Praktikum Antena'));
  assert.ok(botOutputMessage.includes('Mata kuliah:\nPraktikum Antena dan Propagasi'));
  assert.ok(botOutputMessage.includes('Deadline:\n7 Oktober 2026'));
  assert.ok(botOutputMessage.includes('Tipe:\nKelompok'));
  assert.ok(botOutputMessage.includes('Pengumpulan:\nKumpul Fisik'));
  console.log('  ✅ TEST 5 PASSED: Data siap pakai untuk format WhatsApp Bot.');

  console.log('\n--- TEST 6: Hapus Tugas (Delete) ---');
  await service.deleteAssignment(taskId);
  assert.strictEqual(mockFirestoreStore.has(taskId), false, 'Document harus terhapus permanen dari Firestore');
  
  const postDeleteSnapshot = await mockDb.collection('courseAssignments').get();
  assert.strictEqual(postDeleteSnapshot.size, 0, 'Firestore courseAssignments kosong');
  console.log('  ✅ TEST 6 PASSED: Document terhapus dan tidak ditemukan oleh WhatsApp Bot.');

  console.log('\n================================================================');
  console.log('🎉 SEMUA PENGUJIAN INTEGRASI WHATSAPP BOT BERHASIL (100%)!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
