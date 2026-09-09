/**
 * TRJT 3A REMINDER — Course Assignments Service
 * Realtime Firestore Sync + Offline LocalStorage Cache
 * Handles assignment creation, deadline calculations, and personal task completion tracking.
 */

(function () {
  'use strict';

  const STORAGE_KEY_ASSIGNMENTS = 'trjt_assignments_cache_v1';
  const STORAGE_KEY_COMPLETED = 'trjt_completed_assignments_v1';

  // Seed sample assignments for TRJT 3A Semester 5 so students have immediate data
  const DEFAULT_INITIAL_ASSIGNMENTS = [
    {
      id: 'task-antena-lap1',
      courseId: 'senin-praktikum-antena-dan-propagasi',
      courseName: 'Praktikum Antena dan Propagasi',
      title: 'Laporan Praktikum Bab 1: Pengukuran Pola Radiasi Antena Dipole',
      description: 'Format laporan resmi TRJT, lampirkan grafik pola radiasi hasil ukur di Lab HF dan analisa perhitungan gain.',
      dueDate: getRelativeDateStr(2), // 2 days from now
      dueTime: '23:59',
      type: 'individu', // individu | kelompok
      submissionMethod: 'lab', // lab | classroom | email | drive | lainnya
      submissionPlace: 'Kumpul fisik hardcopy di Lab. HF (L10)',
      createdBy: 'Komti TRJT 3A',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-jarkom-subnet',
      courseId: 'senin-jaringan-komputer-lanjut',
      courseName: 'Jaringan Komputer Lanjut',
      title: 'Tugas Mandiri: Analisis Routing Dinamis OSPF Multi-Area',
      description: 'Selesaikan simulasi topologi Cisco Packet Tracer dan buat ringkasan tabel routing dalam file PDF.',
      dueDate: getRelativeDateStr(4), // 4 days from now
      dueTime: '12:00',
      type: 'individu',
      submissionMethod: 'classroom',
      submissionPlace: 'Google Classroom Jarkom Lanjut',
      createdBy: 'Dosen Pengampu',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-satelit-link',
      courseId: 'selasa-praktikum-sistem-komunikasi-satelit-dan-radar',
      courseName: 'Praktikum Sistem Komunikasi Satelit dan Radar',
      title: 'Laporan Awal: Perhitungan Link Budget Uplink/Downlink C-Band',
      description: 'Kerjakan per kelompok praktikum, cantumkan spesifikasi transponder satelit Telkom 4.',
      dueDate: getRelativeDateStr(6), // 6 days from now
      dueTime: '10:00',
      type: 'kelompok',
      submissionMethod: 'drive',
      submissionPlace: 'Folder Google Drive Praktikum Satelit',
      createdBy: 'Asisten Lab',
      createdAt: new Date().toISOString()
    }
  ];

  function getRelativeDateStr(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  let assignmentsCache = loadCachedAssignments();
  let completedSet = loadCompletedIds();
  let isFirestoreConnected = false;

  function loadCachedAssignments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Load assignments cache error:', e);
    }
    // Default fallback
    saveAssignmentsToCache(DEFAULT_INITIAL_ASSIGNMENTS);
    return [...DEFAULT_INITIAL_ASSIGNMENTS];
  }

  function saveAssignmentsToCache(list) {
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(list));
    } catch (e) {
      console.warn('Save assignments cache error:', e);
    }
  }

  function loadCompletedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMPLETED);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    return new Set();
  }

  function saveCompletedIds() {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(Array.from(completedSet)));
    } catch (e) {}
  }

  // Initialize Firestore realtime listener
  function initAssignmentsListener() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (!db) {
      console.log('ℹ️ Local offline mode for assignments active.');
      return;
    }

    try {
      db.collection('courseAssignments')
        .onSnapshot((snapshot) => {
          if (snapshot && !snapshot.empty) {
            const list = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            assignmentsCache = list;
            saveAssignmentsToCache(list);
            isFirestoreConnected = true;
            window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: list }));
          } else if (snapshot && snapshot.empty) {
            // If remote collection empty, keep or seed
            if (assignmentsCache.length > 0) {
              window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: assignmentsCache }));
            }
          }
        }, (error) => {
          console.warn('Firestore assignments listener notice:', error.message);
        });
    } catch (err) {
      console.warn('Assignments init error:', err);
    }
  }

  // Calculate timestamp for sorting
  function parseDueTimestamp(dueDate, dueTime) {
    if (!dueDate) return Infinity;
    const timeStr = dueTime || '23:59';
    const isoString = `${dueDate}T${timeStr}:00`;
    const ts = new Date(isoString).getTime();
    return isNaN(ts) ? Infinity : ts;
  }

  // Format deadline countdown and friendly Indonesian labels
  function formatDeadlineCountdown(dueDate, dueTime) {
    if (!dueDate) return { text: 'Tanpa deadline', urgency: 'normal', badgeClass: 'badge-deadline-normal', isPast: false };

    const timeStr = dueTime || '23:59';
    const dueDateTime = new Date(`${dueDate}T${timeStr}:00`);
    const now = window.appTimeProvider ? window.appTimeProvider.now() : new Date();

    const diffMs = dueDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    const isPast = diffMs < 0;

    // Formatting date string: e.g. "Jumat, 11 Sep 2026 • 23:59 WIB"
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = dayNames[dueDateTime.getDay()] || '';
    const dateNum = dueDateTime.getDate();
    const monthName = monthNames[dueDateTime.getMonth()] || '';
    const formattedFull = `${dayName}, ${dateNum} ${monthName} • ${timeStr} WIB`;

    if (isPast) {
      const pastHours = Math.abs(diffHours);
      let pastLabel = 'Lewat batas';
      if (pastHours < 24) {
        pastLabel = 'Lewat hari ini';
      } else {
        const pastDays = Math.floor(pastHours / 24);
        pastLabel = `Lewat ${pastDays} hari lalu`;
      }
      return {
        text: pastLabel,
        fullText: formattedFull,
        urgency: 'passed',
        badgeClass: 'badge-deadline-passed',
        diffDays,
        isPast: true
      };
    }

    // Same day
    const isToday = dueDateTime.toDateString() === now.toDateString();
    if (isToday) {
      return {
        text: `Hari ini, ${timeStr}`,
        fullText: formattedFull,
        urgency: 'critical',
        badgeClass: 'badge-deadline-critical',
        diffDays: 0,
        isPast: false
      };
    }

    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = dueDateTime.toDateString() === tomorrow.toDateString();
    if (isTomorrow) {
      return {
        text: `Besok, ${timeStr}`,
        fullText: formattedFull,
        urgency: 'urgent',
        badgeClass: 'badge-deadline-urgent',
        diffDays: 1,
        isPast: false
      };
    }

    // 2-3 days
    if (diffDays <= 3) {
      return {
        text: `${diffDays} hari lagi`,
        fullText: formattedFull,
        urgency: 'warning',
        badgeClass: 'badge-deadline-warning',
        diffDays,
        isPast: false
      };
    }

    // Normal
    return {
      text: `${diffDays} hari lagi`,
      fullText: formattedFull,
      urgency: 'normal',
      badgeClass: 'badge-deadline-normal',
      diffDays,
      isPast: false
    };
  }

  // Get all assignments sorted by deadline
  function getAllAssignments() {
    return [...assignmentsCache].sort((a, b) => {
      return parseDueTimestamp(a.dueDate, a.dueTime) - parseDueTimestamp(b.dueDate, b.dueTime);
    });
  }

  // Get assignments for specific course
  function getAssignmentsForCourse(courseNameOrId) {
    if (!courseNameOrId) return [];
    const q = courseNameOrId.toLowerCase().trim();
    return getAllAssignments().filter((item) => {
      const cName = (item.courseName || '').toLowerCase().trim();
      const cId = (item.courseId || '').toLowerCase().trim();
      return cName.includes(q) || q.includes(cName) || cId.includes(q) || q.includes(cId);
    });
  }

  // Get upcoming active assignments (not marked completed by user, sorted nearest deadline)
  function getUpcomingAssignments(limit = 4) {
    const list = getAllAssignments().filter((a) => !completedSet.has(a.id));
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }

  // Stats
  function getAssignmentStats() {
    const all = getAllAssignments();
    const completedCount = all.filter((a) => completedSet.has(a.id)).length;
    const pending = all.filter((a) => !completedSet.has(a.id));

    let urgentCount = 0;
    pending.forEach((a) => {
      const info = formatDeadlineCountdown(a.dueDate, a.dueTime);
      if (!info.isPast && (info.urgency === 'critical' || info.urgency === 'urgent' || info.diffDays <= 2)) {
        urgentCount++;
      }
    });

    return {
      total: all.length,
      pending: pending.length,
      completed: completedCount,
      urgent: urgentCount
    };
  }

  // Toggle personal completed status
  function togglePersonalCompletion(assignmentId) {
    if (!assignmentId) return false;
    let isNowCompleted = false;
    if (completedSet.has(assignmentId)) {
      completedSet.delete(assignmentId);
      isNowCompleted = false;
    } else {
      completedSet.add(assignmentId);
      isNowCompleted = true;
    }
    saveCompletedIds();
    window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: assignmentsCache }));
    return isNowCompleted;
  }

  function isPersonalCompleted(assignmentId) {
    return completedSet.has(assignmentId);
  }

  // Create Assignment
  async function createAssignment(data) {
    if (!data || !data.title || !data.courseName) {
      throw new Error('Mata kuliah dan judul tugas wajib diisi.');
    }

    const newId = 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const assignment = {
      id: newId,
      courseId: data.courseId || data.courseName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      courseName: data.courseName.trim(),
      title: data.title.trim(),
      description: (data.description || '').trim(),
      dueDate: data.dueDate || getRelativeDateStr(3),
      dueTime: data.dueTime || '23:59',
      type: data.type || 'individu',
      submissionMethod: data.submissionMethod || 'lab',
      submissionPlace: (data.submissionPlace || '').trim(),
      createdBy: (data.createdBy || 'Mahasiswa TRJT 3A').trim(),
      createdAt: new Date().toISOString()
    };

    // Save locally
    assignmentsCache.unshift(assignment);
    saveAssignmentsToCache(assignmentsCache);

    // Save to Firestore if available
    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        await db.collection('courseAssignments').doc(newId).set(assignment);
        console.log('✅ Assignment successfully saved to Firestore:', newId);
      } catch (err) {
        console.warn('⚠️ Firestore save assignment fallback to local:', err.message);
      }
    }

    window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: assignmentsCache }));
    return assignment;
  }

  // Delete Assignment
  async function deleteAssignment(assignmentId) {
    if (!assignmentId) return false;

    assignmentsCache = assignmentsCache.filter((a) => a.id !== assignmentId);
    completedSet.delete(assignmentId);
    saveAssignmentsToCache(assignmentsCache);
    saveCompletedIds();

    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        await db.collection('courseAssignments').doc(assignmentId).delete();
      } catch (err) {
        console.warn('Firestore delete assignment notice:', err.message);
      }
    }

    window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: assignmentsCache }));
    return true;
  }

  // Export to Global Window
  window.TRJT_ASSIGNMENTS = {
    init: initAssignmentsListener,
    getAllAssignments: getAllAssignments,
    getAssignmentsForCourse: getAssignmentsForCourse,
    getUpcomingAssignments: getUpcomingAssignments,
    getAssignmentStats: getAssignmentStats,
    formatDeadlineCountdown: formatDeadlineCountdown,
    togglePersonalCompletion: togglePersonalCompletion,
    isPersonalCompleted: isPersonalCompleted,
    createAssignment: createAssignment,
    deleteAssignment: deleteAssignment
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAssignmentsListener);
    } else {
      initAssignmentsListener();
    }
  }
})();
