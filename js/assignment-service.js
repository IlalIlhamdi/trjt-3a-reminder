/**
 * TRJT 3A REMINDER — Course Assignments Service
 * Realtime Firestore Sync + Offline LocalStorage Cache
 * Handles assignment creation, deadline calculations, and personal task completion tracking.
 */

(function () {
  'use strict';

  const STORAGE_KEY_ASSIGNMENTS = 'trjt_assignments_cache_v1';
  const STORAGE_KEY_COMPLETED = 'trjt_completed_assignments_v1';

  const DUMMY_TASK_IDS = new Set(['task-antena-lap1', 'task-jarkom-subnet', 'task-satelit-link']);

  let assignmentsCache = loadCachedAssignments();
  let completedSet = loadCompletedIds();
  let isFirestoreConnected = false;

  function loadCachedAssignments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out legacy dummy sample tasks so they never persist or reappear
          const cleaned = parsed.filter((t) => t && !DUMMY_TASK_IDS.has(t.id));
          if (cleaned.length !== parsed.length) {
            saveAssignmentsToCache(cleaned);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Load assignments cache error:', e);
    }
    // Clean initial state: start empty without fake dummy assignments
    saveAssignmentsToCache([]);
    return [];
  }

  function saveAssignmentsToCache(list) {
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(list || []));
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

  function getFirestoreDb() {
    try {
      if (window.TRJT_FIREBASE && typeof window.TRJT_FIREBASE.getDb === 'function') {
        const d = window.TRJT_FIREBASE.getDb();
        if (d) return d;
      }
      if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
        return window.firebase.firestore();
      }
    } catch (e) {
      console.warn('Get Firestore db fallback:', e.message);
    }
    return null;
  }

  let isFirestoreListening = false;
  let unsubscribeAssignments = null;

  // Initialize Firestore realtime listener
  function initAssignmentsListener() {
    if (isFirestoreListening) return;

    const db = getFirestoreDb();
    if (!db) {
      // Waiting for Firebase to complete initialization
      const onFirebaseReady = () => {
        window.removeEventListener('trjt:firebase-ready', onFirebaseReady);
        initAssignmentsListener();
      };
      window.addEventListener('trjt:firebase-ready', onFirebaseReady);

      // Polling fallback in case event was already dispatched or missed
      let retries = 0;
      const pollInterval = setInterval(() => {
        retries++;
        if (isFirestoreListening) {
          clearInterval(pollInterval);
          return;
        }
        const retryDb = getFirestoreDb();
        if (retryDb) {
          clearInterval(pollInterval);
          initAssignmentsListener();
        } else if (retries >= 20) {
          clearInterval(pollInterval);
          console.log('ℹ️ Local offline mode for assignments active.');
        }
      }, 500);
      return;
    }

    try {
      isFirestoreListening = true;
      if (typeof unsubscribeAssignments === 'function') {
        try { unsubscribeAssignments(); } catch (_) {}
      }

      unsubscribeAssignments = db.collection('courseAssignments')
        .onSnapshot((snapshot) => {
          if (snapshot && !snapshot.empty) {
            const list = [];
            const remoteIds = new Set();
            snapshot.forEach((doc) => {
              const item = { id: doc.id, ...doc.data() };
              list.push(item);
              remoteIds.add(doc.id);
            });
            const cleanedList = list.filter((t) => t && !DUMMY_TASK_IDS.has(t.id));

            // Auto-sync any local real tasks that were created locally but not yet in Firestore
            const localUnsynced = assignmentsCache.filter((t) => t && !DUMMY_TASK_IDS.has(t.id) && !remoteIds.has(t.id));
            if (localUnsynced.length > 0) {
              localUnsynced.forEach((task) => {
                cleanedList.push(task);
                db.collection('courseAssignments').doc(task.id).set(task).catch((e) => {
                  console.warn('Sync local assignment to cloud error:', e);
                });
              });
            }

            assignmentsCache = cleanedList;
            saveAssignmentsToCache(cleanedList);
            isFirestoreConnected = true;
            window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: cleanedList }));
          } else if (snapshot && snapshot.empty) {
            // Remote collection is empty: preserve real local tasks and sync them up to Firestore
            const realTasks = assignmentsCache.filter((t) => t && !DUMMY_TASK_IDS.has(t.id));
            assignmentsCache = realTasks;
            saveAssignmentsToCache(realTasks);
            if (realTasks.length > 0) {
              realTasks.forEach((task) => {
                db.collection('courseAssignments').doc(task.id).set(task).catch((e) => {
                  console.warn('Upload cached assignment to empty Firestore error:', e);
                });
              });
            }
            isFirestoreConnected = true;
            window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: realTasks }));
          }
        }, (error) => {
          console.warn('Firestore assignments listener notice:', error.message);
          isFirestoreListening = false;
        });
    } catch (err) {
      console.warn('Assignments init error:', err);
      isFirestoreListening = false;
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
    const formattedFull = `${dayName}, ${dateNum} ${monthName} ${dueDateTime.getFullYear()}`;

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
        text: 'Hari ini',
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
        text: 'Besok',
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
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('courseAssignments').doc(newId).set(assignment);
        console.log('✅ Assignment successfully saved to Firestore:', newId);
      } catch (err) {
        console.error('⚠️ Firestore save assignment error:', err);
        throw new Error('Gagal menyimpan ke database cloud: ' + (err.message || err));
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

    const db = getFirestoreDb();
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
