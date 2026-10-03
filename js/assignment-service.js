/**
 * TRJT 3A REMINDER — Course Assignments Service
 * Realtime Firestore Sync + Offline LocalStorage Cache
 * Handles assignment creation, deadline calculations, and personal task completion tracking.
 * Features automated expiration detection and background cleanup for overdue assignments.
 */

(function () {
  'use strict';

  const STORAGE_KEY_ASSIGNMENTS = 'trjt_assignments_cache_v1';
  const STORAGE_KEY_COMPLETED = 'trjt_completed_assignments_v1';
  const STORAGE_KEY_DELETED = 'trjt_deleted_assignment_ids_v1';

  const DUMMY_TASK_IDS = new Set(['task-antena-lap1', 'task-jarkom-subnet', 'task-satelit-link']);

  let deletedSet = loadDeletedIds();
  let assignmentsCache = loadCachedAssignments();
  let completedSet = loadCompletedIds();
  let isFirestoreConnected = false;
  let isCleaningUp = false;

  function loadDeletedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    return new Set();
  }

  function saveDeletedIds() {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(deletedSet)));
    } catch (e) {}
  }

  function loadCachedAssignments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out legacy dummy sample tasks, deleted tombstones & expired tasks
          const cleaned = parsed.filter((t) => t && !DUMMY_TASK_IDS.has(t.id) && !deletedSet.has(t.id) && !isAssignmentExpired(t.dueDate, t.dueTime));
          if (cleaned.length !== parsed.length) {
            saveAssignmentsToCache(cleaned);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Load assignments cache error:', e);
    }
    // Clean initial state
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
      const onFirebaseReady = () => {
        window.removeEventListener('trjt:firebase-ready', onFirebaseReady);
        initAssignmentsListener();
      };
      window.addEventListener('trjt:firebase-ready', onFirebaseReady);

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
          console.log('📡 Local offline mode for assignments active.');
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
          if (snapshot) {
            const list = [];
            let foundExpired = false;
            snapshot.forEach((doc) => {
              const item = { id: doc.id, ...doc.data() };
              if (item && !DUMMY_TASK_IDS.has(item.id) && !deletedSet.has(item.id)) {
                // Section W: Filter expired tasks before adding to display list
                if (isAssignmentExpired(item.dueDate, item.dueTime)) {
                  foundExpired = true;
                } else {
                  list.push(item);
                }
              }
            });

            assignmentsCache = list;
            saveAssignmentsToCache(list);
            isFirestoreConnected = true;
            window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: list }));

            // Cleanup expired tasks from Firestore in background
            if (foundExpired) {
              setTimeout(() => { cleanupExpiredAssignments(); }, 50);
            }
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

  function getRelativeDateStr(offsetDays = 0) {
    const now = window.appTimeProvider ? window.appTimeProvider.now() : (window.RealJakartaTimeProvider ? new window.RealJakartaTimeProvider().now() : new Date());
    const target = new Date(now.getTime() + offsetDays * 86400000);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Safe Jakarta Date parser & time boundary helper
   * Interpret dueDate ('YYYY-MM-DD' or Timestamp or Date) in Asia/Jakarta timezone
   */
  function getJakartaDateParts(dateInput) {
    let d;
    if (!dateInput) {
      d = window.appTimeProvider ? window.appTimeProvider.now() : (window.RealJakartaTimeProvider ? new window.RealJakartaTimeProvider().now() : new Date());
    } else if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        const parts = dateInput.split('T')[0].split('-');
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10) - 1,
          day: parseInt(parts[2], 10)
        };
      }
      d = new Date(dateInput);
    } else if (dateInput && typeof dateInput.toDate === 'function') {
      d = dateInput.toDate();
    } else {
      d = new Date(dateInput);
    }
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate()
    };
  }

  /**
   * Helper to determine exact deadline boundary in Asia/Jakarta (WIB)
   * The task expires ONLY after the end of the deadline day (after 23:59:59.999 WIB)
   */
  function getAssignmentDeadline(dueDate, dueTime) {
    if (!dueDate) return null;
    const parts = getJakartaDateParts(dueDate);
    if (isNaN(parts.year) || isNaN(parts.month) || isNaN(parts.day)) {
      return null;
    }

    // End of deadline day in Asia/Jakarta is strictly 23:59:59.999 WIB
    const deadlineEndOfDay = new Date(parts.year, parts.month, parts.day, 23, 59, 59, 999);
    const deadlineStartOfDay = new Date(parts.year, parts.month, parts.day, 0, 0, 0, 0);

    const now = window.appTimeProvider ? window.appTimeProvider.now() : (window.RealJakartaTimeProvider ? new window.RealJakartaTimeProvider().now() : new Date());
    const todayStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Strictly expired ONLY when current time is past the end of the deadline day (after 23:59:59.999)
    const isExpired = now.getTime() > deadlineEndOfDay.getTime();
    const diffCalendarDays = Math.round((deadlineStartOfDay.getTime() - todayStartOfDay.getTime()) / (1000 * 60 * 60 * 24));

    return {
      deadlineEndOfDay,
      deadlineStartOfDay,
      todayStartOfDay,
      diffDays: diffCalendarDays,
      isExpired,
      now
    };
  }

  function isAssignmentExpired(dueDate, dueTime) {
    if (!dueDate) return false;
    const info = getAssignmentDeadline(dueDate, dueTime);
    return info ? info.isExpired : false;
  }

  /**
   * Cleanup expired assignments from cache and Firestore
   * Protected against concurrent runs and double deletes
   */
  async function cleanupExpiredAssignments() {
    if (isCleaningUp) return 0;
    isCleaningUp = true;

    try {
      const all = [...assignmentsCache];
      const expiredTasks = all.filter((task) => {
        return task && task.id && isAssignmentExpired(task.dueDate, task.dueTime);
      });

      if (expiredTasks.length === 0) {
        return 0;
      }

      console.log(`[AutoDelete] Found ${expiredTasks.length} expired assignment(s). Cleaning up...`);

      // 1. Remove expired tasks from memory cache & track tombstone
      let cacheChanged = false;
      expiredTasks.forEach((t) => {
        deletedSet.add(t.id);
        completedSet.delete(t.id);
        assignmentsCache = assignmentsCache.filter((a) => a.id !== t.id);
        cacheChanged = true;
      });

      if (cacheChanged) {
        saveDeletedIds();
        saveCompletedIds();
        saveAssignmentsToCache(assignmentsCache);
        window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: assignmentsCache }));
      }

      // 2. Delete expired tasks from Firestore if connected
      const db = getFirestoreDb();
      if (db) {
        for (const t of expiredTasks) {
          try {
            await db.collection('courseAssignments').doc(t.id).delete();
            console.log(`[AutoDelete] Pruned expired assignment from Firestore: ${t.id} (${t.title})`);
          } catch (err) {
            console.warn(`[AutoDelete] Firestore notice for ${t.id}:`, err.message);
          }
        }
      }

      return expiredTasks.length;
    } catch (e) {
      console.error('[AutoDelete] Error in cleanupExpiredAssignments:', e);
      return 0;
    } finally {
      isCleaningUp = false;
    }
  }

  // Format deadline countdown and friendly Indonesian labels
  function formatDeadlineCountdown(dueDate, dueTime) {
    if (!dueDate) return { text: 'Tanpa deadline', fullText: 'Tanpa deadline', shortText: 'Tanpa deadline', urgency: 'normal', badgeClass: 'badge-deadline-countdown', isPast: false, isExpired: false, diffDays: 999 };

    const deadline = getAssignmentDeadline(dueDate, dueTime);
    if (!deadline) {
      return { text: 'Tanpa deadline', fullText: 'Tanpa deadline', shortText: 'Tanpa deadline', urgency: 'normal', badgeClass: 'badge-deadline-countdown', isPast: false, isExpired: false, diffDays: 999 };
    }

    // Indonesian friendly day & month names
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const parts = getJakartaDateParts(dueDate);
    const targetDate = new Date(parts.year, parts.month, parts.day);
    const dayName = dayNames[targetDate.getDay()] || '';
    const monthName = monthNames[parts.month] || '';
    const formattedShort = `${dayName}, ${parts.day} ${monthName} ${parts.year}`;

    const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const fullDayName = fullDayNames[targetDate.getDay()] || '';
    const formattedFull = `${fullDayName}, ${parts.day} ${monthName} ${parts.year}`;

    if (deadline.isExpired) {
      return {
        text: 'Lewat batas',
        fullText: formattedFull,
        shortText: formattedShort,
        urgency: 'passed',
        badgeClass: 'badge-deadline-countdown',
        diffDays: deadline.diffDays,
        isPast: true,
        isExpired: true
      };
    }

    // Same day: 0 calendar days difference (active during the whole day)
    if (deadline.diffDays === 0) {
      return {
        text: 'Hari ini',
        fullText: formattedFull,
        shortText: formattedShort,
        urgency: 'critical',
        badgeClass: 'badge-deadline-countdown',
        diffDays: 0,
        isPast: false,
        isExpired: false
      };
    }

    // Tomorrow: 1 calendar day difference
    if (deadline.diffDays === 1) {
      return {
        text: 'Besok',
        fullText: formattedFull,
        shortText: formattedShort,
        urgency: 'urgent',
        badgeClass: 'badge-deadline-countdown',
        diffDays: 1,
        isPast: false,
        isExpired: false
      };
    }

    // 2-3 days
    if (deadline.diffDays <= 3) {
      return {
        text: `${deadline.diffDays} hari lagi`,
        fullText: formattedFull,
        shortText: formattedShort,
        urgency: 'warning',
        badgeClass: 'badge-deadline-countdown',
        diffDays: deadline.diffDays,
        isPast: false,
        isExpired: false
      };
    }

    // Normal: 4+ days
    return {
      text: `${deadline.diffDays} hari lagi`,
      fullText: formattedFull,
      shortText: formattedShort,
      urgency: 'normal',
      badgeClass: 'badge-deadline-countdown',
      diffDays: deadline.diffDays,
      isPast: false,
      isExpired: false
    };
  }

  // Get all assignments sorted by deadline (excluding expired tasks)
  function getAllAssignments() {
    const valid = assignmentsCache.filter((a) => !isAssignmentExpired(a.dueDate, a.dueTime));
    if (valid.length !== assignmentsCache.length) {
      setTimeout(() => { cleanupExpiredAssignments(); }, 0);
    }
    return [...valid].sort((a, b) => {
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

    // Ensure ID is not marked as deleted
    deletedSet.delete(newId);
    saveDeletedIds();

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

    // 1. Permanently record tombstone
    deletedSet.add(assignmentId);
    saveDeletedIds();

    // 2. Remove immediately from active cache & completed tracking
    assignmentsCache = assignmentsCache.filter((a) => a.id !== assignmentId);
    completedSet.delete(assignmentId);
    saveAssignmentsToCache(assignmentsCache);
    saveCompletedIds();

    // 3. Immediately dispatch reactive update event
    window.dispatchEvent(new CustomEvent('trjt:assignments-updated', { detail: assignmentsCache }));

    // 4. Delete from Firestore
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('courseAssignments').doc(assignmentId).delete();
        console.log('🗑️ Successfully deleted assignment from Firestore:', assignmentId);
      } catch (err) {
        console.warn('Firestore delete assignment notice:', err.message);
      }
    }

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
    deleteAssignment: deleteAssignment,
    isAssignmentExpired: isAssignmentExpired,
    getAssignmentDeadline: getAssignmentDeadline,
    cleanupExpiredAssignments: cleanupExpiredAssignments
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initAssignmentsListener();
        cleanupExpiredAssignments();
      });
    } else {
      initAssignmentsListener();
      cleanupExpiredAssignments();
    }

    // Periodic cleanup on tab reactivation
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        cleanupExpiredAssignments();
      }
    });
  }
})();
