
// ==========================================================================
// SKELETON LOADING & ERROR FALLBACK GENERATORS
// ==========================================================================
function getSkeletonHeroCardHtml() {
  return `
    <div class="skeleton-hero-card" aria-busy="true" role="status">
      <span class="sr-only">Memuat data kelas berikutnya...</span>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="skeleton-box" style="width: 140px; height: 24px;" aria-hidden="true"></div>
        <div class="skeleton-box" style="width: 90px; height: 24px; border-radius: 999px;" aria-hidden="true"></div>
      </div>
      <div class="skeleton-box" style="width: 75%; height: 28px; margin-top: 6px;" aria-hidden="true"></div>
      <div class="skeleton-box" style="width: 55%; height: 18px;" aria-hidden="true"></div>
      <div class="skeleton-box" style="width: 40%; height: 18px;" aria-hidden="true"></div>
    </div>
  `;
}

function getSkeletonScheduleCardHtml(count = 2) {
  let html = `<div aria-busy="true" role="status" style="display: flex; flex-direction: column; gap: 12px;">
    <span class="sr-only">Memuat data jadwal kuliah...</span>`;
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-schedule-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="skeleton-box" style="width: 60%; height: 22px;" aria-hidden="true"></div>
          <div class="skeleton-box" style="width: 75px; height: 20px; border-radius: 999px;" aria-hidden="true"></div>
        </div>
        <div class="skeleton-box" style="width: 45%; height: 16px;" aria-hidden="true"></div>
        <div class="skeleton-box" style="width: 35%; height: 16px;" aria-hidden="true"></div>
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <div class="skeleton-box" style="width: 75px; height: 32px; border-radius: 10px;" aria-hidden="true"></div>
          <div class="skeleton-box" style="width: 75px; height: 32px; border-radius: 10px;" aria-hidden="true"></div>
          <div class="skeleton-box" style="width: 85px; height: 32px; border-radius: 10px;" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }
  html += `</div>`;
  return html;
}

function getSkeletonTaskCardHtml(count = 2) {
  let html = `<div aria-busy="true" role="status" style="display: flex; flex-direction: column; gap: 10px;">
    <span class="sr-only">Memuat data tugas...</span>`;
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-task-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="skeleton-box" style="width: 55%; height: 18px;" aria-hidden="true"></div>
          <div class="skeleton-box" style="width: 80px; height: 18px; border-radius: 999px;" aria-hidden="true"></div>
        </div>
        <div class="skeleton-box" style="width: 40%; height: 14px;" aria-hidden="true"></div>
      </div>
    `;
  }
  html += `</div>`;
  return html;
}

function getSkeletonDosenCardHtml(count = 4) {
  let html = `<div aria-busy="true" role="status" style="display: flex; flex-direction: column; gap: 12px;">
    <span class="sr-only">Memuat data daftar dosen...</span>`;
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-dosen-card">
        <div class="skeleton-box" style="width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;" aria-hidden="true"></div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <div class="skeleton-box" style="width: 60%; height: 20px;" aria-hidden="true"></div>
          <div class="skeleton-box" style="width: 40%; height: 14px;" aria-hidden="true"></div>
          <div class="skeleton-box" style="width: 50%; height: 14px;" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }
  html += `</div>`;
  return html;
}

function getSkeletonMaterialCardHtml(count = 3) {
  let html = `<div aria-busy="true" role="status" style="display: flex; flex-direction: column; gap: 10px;">
    <span class="sr-only">Memuat data materi...</span>`;
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-schedule-card" style="min-height: 70px; flex-direction: row; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <div class="skeleton-box" style="width: 38px; height: 38px; border-radius: 10px;" aria-hidden="true"></div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div class="skeleton-box" style="width: 65%; height: 16px;" aria-hidden="true"></div>
            <div class="skeleton-box" style="width: 45%; height: 13px;" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    `;
  }
  html += `</div>`;
  return html;
}

function getErrorFallbackHtml(message, retryFuncStr) {
  return `
    <div style="text-align: center; padding: 24px 16px; background: rgba(254, 242, 242, 0.85); border: 1px solid rgba(254, 202, 202, 0.9); border-radius: var(--radius-card, 18px); color: #DC2626;" role="alert">
      <div style="font-weight: 650; font-size: 14px; margin-bottom: 4px;">Gagal Memuat Data</div>
      <p style="font-size: 12px; margin: 0 0 14px; opacity: 0.85;">${escapeHtml(message)}</p>
      <button type="button" onclick="${retryFuncStr}" style="background: #DC2626; color: #fff; border: none; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer;">
        Coba Lagi
      </button>
    </div>
  `;
}

/**
 * TRJT 3A REMINDER — Core Application Controller v4.0
 * Production Mode: Clean Asia/Jakarta Time Provider & Official Schedule Engine
 * Glassmorphism White-Blue UI Architecture
 */

(function () {
  'use strict';

  // Instantiate time provider (RealJakartaTimeProvider in production)
  const timeProvider = window.appTimeProvider || new (window.RealJakartaTimeProvider || function () {
    this.now = function () { return new Date(); };
    this.isSimulated = function () { return false; };
  })();

  // --- Version check & Cache Storage Auto-Purge ---
  const CURRENT_APP_VERSION = '5.7';
  try {
    const savedVer = localStorage.getItem('trjt_app_version');
    if (savedVer !== CURRENT_APP_VERSION) {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      localStorage.setItem('trjt_app_version', CURRENT_APP_VERSION);
    }
  } catch (e) {}

  // --- Helper to load persisted notifications ---
  function loadInitialNotifications() {
    try {
      const saved = localStorage.getItem('trjt_notifications_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return (window.TRJT_SCHEDULE?.initialNotifications || []).map((n) => ({ ...n, read: true }));
  }

  // --- Application State ---
  const state = {
    currentTab: 'beranda',
    selectedWeeklyDayId: 1, // Default Senin (1)
    notifications: loadInitialNotifications(),
    notifFilter: 'all', // 'all' or 'unread'
    settings: {
      h10Alert: localStorage.getItem('trjt_h10_enabled') !== 'false',
      soundEnabled: localStorage.getItem('trjt_sound_enabled') !== 'false',
      vibrationEnabled: localStorage.getItem('trjt_vibration_enabled') !== 'false',
      theme: localStorage.getItem('trjt_theme') || 'light'
    }
  };

  function saveNotificationsState() {
    try {
      localStorage.setItem('trjt_notifications_v3', JSON.stringify(state.notifications));
    } catch (e) {}
  }

  // --- Fired H-10 Reminder Deduplication Manager ---
  const H10_FIRED_STORAGE_KEY = 'trjt_h10_fired_v1';
  const processingH10Keys = new Set();

  function getFiredH10Reminders() {
    try {
      const raw = localStorage.getItem(H10_FIRED_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveFiredH10Reminders(list) {
    try {
      localStorage.setItem(H10_FIRED_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function hasH10ReminderFired(key) {
    const list = getFiredH10Reminders();
    return list.some((item) => (typeof item === 'string' ? item === key : item && item.key === key));
  }

  function recordH10ReminderFired(key) {
    let list = getFiredH10Reminders();
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    list = list
      .map((item) => (typeof item === 'string' ? { key: item, timestamp: nowMs } : item))
      .filter((item) => item && item.key && (nowMs - (item.timestamp || 0) <= sevenDaysMs));

    if (!list.some((item) => item.key === key)) {
      list.push({ key, timestamp: nowMs });
    }

    if (list.length > 30) {
      list = list.slice(list.length - 30);
    }

    saveFiredH10Reminders(list);
  }

  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsMap = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function getGreeting(hour) {
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }

  function formatFormattedDate(date) {
    const dayName = daysMap[date.getDay()];
    const dateNum = date.getDate();
    const monthName = monthsMap[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  }

  function parseTimeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function formatCountdown(ms) {
    if (ms <= 0) return '00 : 00 : 00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
  }

  function getLecturerDisplay(lecturerName, lecturerCode, courseName) {
    if (lecturerName && lecturerName.trim() !== '' && lecturerName !== 'null') {
      return lecturerName;
    }
    if (lecturerCode === 'NEL' || (courseName && courseName.toLowerCase().includes('metodologi'))) {
      return 'Dr. Nelly Safitri, SST., M.Eng.Sc.';
    }
    if (lecturerCode && window.lecturerMap && window.lecturerMap[lecturerCode]) {
      return window.lecturerMap[lecturerCode];
    }
    return 'Dosen belum tersedia';
  }

  function getRoomDisplay(roomCode, roomName) {
    if (!roomName) return roomCode;
    return `${roomCode} · ${roomName}`;
  }

  // --- Shared Schedule Evaluation Engine ---
  function evaluateScheduleState(customProvider, customSchedule) {
    const provider = customProvider || timeProvider;
    const scheduleSource = customSchedule || window.TRJT_SCHEDULE;
    if (!scheduleSource || !scheduleSource.classes) return null;

    const now = provider.now();
    const dayIndex = now.getDay(); // 0: Minggu, 1: Senin, ..., 5: Jumat, 6: Sabtu
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    const todayClasses = scheduleSource.classes
      .filter((c) => c.dayOfWeek === dayIndex && c.active !== false)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    let inProgressClass = null;
    let nextUpcomingClass = null;
    let completedCount = 0;

    for (const item of todayClasses) {
      const startMin = parseTimeToMinutes(item.startTime);
      const endMin = parseTimeToMinutes(item.endTime);

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        inProgressClass = item;
      } else if (currentMinutes < startMin && !nextUpcomingClass) {
        nextUpcomingClass = item;
      } else if (currentMinutes >= endMin) {
        completedCount++;
      }
    }

    // Find upcoming class on next academic day if no classes today
    let nextDayUpcomingClass = null;
    let nextDayName = '';
    if (!inProgressClass && !nextUpcomingClass) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayId = (dayIndex + offset) % 7;
        const potentialClasses = scheduleSource.classes
          .filter((c) => c.dayOfWeek === nextDayId && c.active !== false)
          .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
        if (potentialClasses.length > 0) {
          nextDayUpcomingClass = potentialClasses[0];
          const targetDayObj = scheduleSource.days?.find((d) => d.id === nextDayId);
          nextDayName = targetDayObj ? targetDayObj.name : daysMap[nextDayId];
          break;
        }
      }
    }

    let countdownMs = 0;
    let isH10 = false;
    let progressPercent = 0;

    if (inProgressClass) {
      const startMin = parseTimeToMinutes(inProgressClass.startTime);
      const endMin = parseTimeToMinutes(inProgressClass.endTime);
      const totalDurationSecs = (endMin - startMin) * 60;
      const elapsedSecs = (currentMinutes - startMin) * 60 + currentSeconds;
      progressPercent = Math.min(100, Math.max(0, (elapsedSecs / totalDurationSecs) * 100));

      const remainingSecs = (endMin * 60) - (currentMinutes * 60 + currentSeconds);
      countdownMs = remainingSecs * 1000;
    } else if (nextUpcomingClass) {
      const startMin = parseTimeToMinutes(nextUpcomingClass.startTime);
      const targetSecs = startMin * 60;
      const currentTotalSecs = currentMinutes * 60 + currentSeconds;
      const remainingSecs = targetSecs - currentTotalSecs;
      countdownMs = Math.max(0, remainingSecs * 1000);

      if (remainingSecs <= 600 && remainingSecs > 0) {
        isH10 = true;
      }
    }

    return {
      now,
      dayIndex,
      todayClasses,
      inProgressClass,
      nextUpcomingClass,
      completedCount,
      totalCount: todayClasses.length,
      nextDayUpcomingClass,
      nextDayName,
      countdownMs,
      isH10,
      progressPercent
    };
  }

  // --- Dashboard UI Renderers ---
  function renderHeader(data) {
    if (!data) return;
    const greetingEl = document.getElementById('header-greeting');
    const dateEl = document.getElementById('header-date');
    const summaryContainer = document.getElementById('dashboard-summary');

    if (greetingEl) greetingEl.innerText = getGreeting(data.now.getHours());
    if (dateEl) dateEl.innerText = formatFormattedDate(data.now);

    if (summaryContainer) {
      const remaining = Math.max(0, data.totalCount - data.completedCount);
      const isZeroRemaining = remaining === 0;
      const currentSig = `${data.totalCount}-${data.completedCount}-${remaining}`;

      if (!summaryContainer.dataset) summaryContainer.dataset = {};
      if (summaryContainer.dataset.sig !== currentSig) {
        summaryContainer.dataset.sig = currentSig;
        summaryContainer.innerHTML = `
          <div class="summary-item summary-item-total">
            <span class="summary-value">${data.totalCount}</span>
            <span class="summary-label">Kelas hari ini</span>
          </div>
          <div class="summary-item summary-item-completed">
            <span class="summary-value">${data.completedCount}</span>
            <span class="summary-label">Kelas selesai</span>
          </div>
          <div class="summary-item summary-item-remaining">
            <span class="summary-value">
              ${remaining}${isZeroRemaining ? '<i data-lucide="check" class="summary-check-icon" aria-hidden="true"></i>' : ''}
            </span>
            <span class="summary-label">Kelas tersisa</span>
          </div>
        `;
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }
    }
  }

  function renderHeroCard(data) {
    const heroContainer = document.getElementById('hero-card-container');
    if (!heroContainer || !data) return;

    const phase = data.inProgressClass ? 'in-progress' :
      data.nextUpcomingClass ? 'upcoming' :
      data.nextDayUpcomingClass ? 'next-day' : 'empty';
    const visibleClass = data.inProgressClass || data.nextUpcomingClass || data.nextDayUpcomingClass;
    const signature = JSON.stringify([
      phase, data.dayIndex, visibleClass?.id, visibleClass?.courseName, visibleClass?.startTime,
      visibleClass?.endTime, visibleClass?.roomCode, visibleClass?.roomName,
      visibleClass?.lecturerName, visibleClass?.lecturerCode,
      data.nextDayName, data.isH10
    ]);
    if (!heroContainer.dataset) heroContainer.dataset = {};
    if (heroContainer.dataset.signature === signature) {
      const countdown = heroContainer.querySelector('.hero-countdown-digits');
      if (countdown) countdown.textContent = formatCountdown(data.countdownMs);
      const progress = heroContainer.querySelector('.hero-progress-bar');
      if (progress) progress.style.width = `${data.progressPercent}%`;
      const reminder = heroContainer.querySelector('.hero-reminder-badge span');
      if (reminder && data.isH10) reminder.textContent = `Mulai dalam ${formatCountdown(data.countdownMs)}`;
      return;
    }
    heroContainer.dataset.signature = signature;

    // Case 1: In Progress
    if (data.inProgressClass) {
      const item = data.inProgressClass;
      heroContainer.innerHTML = `
        <div class="hero-glass-card">
          <div class="hero-tag-pill in-progress">
            <i data-lucide="play-circle"></i>
            <span>SEDANG BERLANGSUNG</span>
          </div>

          <div class="hero-time-row">
            <div class="hero-clock-circle" style="background: var(--color-success-bg); border-color: var(--color-success-border); color: var(--color-success-text);">
              <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="hero-time-text-wrap">
              <span class="hero-day-text">Hari ini</span>
              <span class="hero-time-dot">•</span>
              <span class="hero-time-text">${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}</span>
            </div>
          </div>

          <div>
            <h2 class="hero-course-title">${item.courseName}</h2>
            <div class="hero-meta-grid">
              <div class="hero-meta-chip">
                <i data-lucide="map-pin"></i>
                <span>${getRoomDisplay(item.roomCode, item.roomName)}</span>
              </div>
              <div class="hero-meta-chip">
                <i data-lucide="user"></i>
                <span>${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
              </div>
            </div>
          </div>

          <div class="hero-countdown-wrap">
            <div class="hero-countdown-label">Selesai dalam</div>
            <div class="hero-countdown-digits">${formatCountdown(data.countdownMs)}</div>
            <div class="hero-progress-track">
              <div class="hero-progress-bar" style="width: ${data.progressPercent}%"></div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Case 2: Upcoming Class (>10m or H-10)
    if (data.nextUpcomingClass) {
      const item = data.nextUpcomingClass;
      const isH10 = data.isH10;
      const dayName = daysMap[data.dayIndex] || 'Hari ini';

      heroContainer.innerHTML = `
        <div class="hero-glass-card">
          <div class="hero-tag-pill">
            <i data-lucide="calendar"></i>
            <span>KELAS BERIKUTNYA</span>
          </div>

          <div class="hero-time-row">
            <div class="hero-clock-circle">
              <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="hero-time-text-wrap">
              <span class="hero-day-text">${dayName}</span>
              <span class="hero-time-dot">•</span>
              <span class="hero-time-text">${item.startTime.replace(':', '.')}</span>
            </div>
          </div>

          <div>
            <h2 class="hero-course-title">${item.courseName}</h2>
            <div class="hero-meta-grid">
              <div class="hero-meta-chip">
                <i data-lucide="map-pin"></i>
                <span>${getRoomDisplay(item.roomCode, item.roomName)}</span>
              </div>
              <div class="hero-meta-chip">
                <i data-lucide="user"></i>
                <span>${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
              </div>
            </div>
          </div>

          <div class="hero-reminder-badge">
            <div class="hero-pulse-dot"></div>
            <i data-lucide="bell"></i>
            <span>${isH10 ? 'Mulai dalam ' + formatCountdown(data.countdownMs) : 'Pengingat 10 menit aktif'}</span>
          </div>
        </div>
      `;
      return;
    }

    // Case 3: All Classes Finished Today or Weekend -> Show Next Academic Day Class
    if (data.nextDayUpcomingClass) {
      const item = data.nextDayUpcomingClass;
      heroContainer.innerHTML = `
        <div class="hero-glass-card">
          <div class="hero-tag-pill">
            <i data-lucide="calendar"></i>
            <span>KELAS BERIKUTNYA</span>
          </div>

          <div class="hero-time-row">
            <div class="hero-clock-circle">
              <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="hero-time-text-wrap">
              <span class="hero-day-text">${data.nextDayName}</span>
              <span class="hero-time-dot">•</span>
              <span class="hero-time-text">${item.startTime.replace(':', '.')}</span>
            </div>
          </div>

          <div>
            <h2 class="hero-course-title">${item.courseName}</h2>
            <div class="hero-meta-grid">
              <div class="hero-meta-chip">
                <i data-lucide="map-pin"></i>
                <span>${getRoomDisplay(item.roomCode, item.roomName)}</span>
              </div>
              <div class="hero-meta-chip">
                <i data-lucide="user"></i>
                <span>${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
              </div>
            </div>
          </div>

          <div class="hero-reminder-badge">
            <div class="hero-pulse-dot"></div>
            <i data-lucide="bell"></i>
            <span>Pengingat 10 menit aktif</span>
          </div>
        </div>
      `;
      return;
    }

    // Case 4: Complete Holiday
    heroContainer.innerHTML = `
      <div class="hero-glass-card" style="text-align: center; align-items: center; padding: 28px 20px;">
        <div class="hero-clock-circle" style="width: 48px; height: 48px; border-radius: 16px; margin-bottom: 4px;">
          <i data-lucide="coffee" style="width: 24px; height: 24px;"></i>
        </div>
        <h2 class="hero-course-title">Tidak ada agenda kuliah</h2>
        <p style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.4; max-width: 280px;">Nikmati waktu istirahatmu. Jadwal perkuliahan telah siap di menu Jadwal.</p>
      </div>
    `;
  }

  function renderTodayTimeline(data) {
    const timelineContainer = document.getElementById('today-timeline-container');
    if (!timelineContainer || !data) return;

    if (data.todayClasses.length === 0) {
      timelineContainer.innerHTML = `
        <div class="hero-glass-card" style="padding: 20px; text-align: center; align-items: center; gap: 6px;">
          <i data-lucide="coffee" style="width: 24px; height: 24px; color: var(--color-text-muted);"></i>
          <p style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">Tidak ada agenda perkuliahan hari ini.</p>
        </div>
      `;
      return;
    }

    const currentMinutes = data.now.getHours() * 60 + data.now.getMinutes();

    timelineContainer.innerHTML = data.todayClasses
      .map((item) => {
        const startMin = parseTimeToMinutes(item.startTime);
        const endMin = parseTimeToMinutes(item.endTime);
        const isActive = currentMinutes >= startMin && currentMinutes < endMin;
        const isPast = currentMinutes >= endMin;

        const cardStateClass = isActive ? 'is-active' : (isPast ? 'is-past' : '');
        const stateLabel = isActive ? 'Berlangsung' : (isPast ? 'Selesai' : 'Akan datang');

        const courseTasks = window.TRJT_ASSIGNMENTS ? window.TRJT_ASSIGNMENTS.getAssignmentsForCourse(item.courseName) : [];
        const pendingTasks = courseTasks.filter((t) => window.TRJT_ASSIGNMENTS && !window.TRJT_ASSIGNMENTS.isPersonalCompleted(t.id));
        const taskBadgeTodayHtml = pendingTasks.length > 0 
          ? `<span class="badge-deadline badge-deadline-warning" style="margin-left: 6px; padding: 1px 6px; font-size: 10px; vertical-align: middle;"><i data-lucide="clipboard-check" style="width: 10px; height: 10px;"></i> ${pendingTasks.length} Tugas</span>` 
          : '';

        return `
          <button type="button" class="today-class-card ${cardStateClass}" onclick="window.openCourseAssignmentsModal('${item.courseName.replace(/'/g, "\\'")}', '${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName).replace(/'/g, "\\'")}', '${item.roomCode}')">
            <span class="today-card-left">
              <span class="today-time-rail">
                <span class="today-time-start">${item.startTime.replace(':', '.')}</span>
                <span class="today-time-end">${item.endTime.replace(':', '.')}</span>
              </span>
              <span class="today-card-info">
                <span class="today-state-label">${stateLabel}</span>
                <span class="today-card-title">${item.courseName} ${taskBadgeTodayHtml}</span>
                <span class="today-card-room"><i data-lucide="map-pin"></i>${getRoomDisplay(item.roomCode, item.roomName)}</span>
              </span>
            </span>
            <i data-lucide="chevron-right" class="today-card-chevron"></i>
          </button>
        `;
      })
      .join('');
  }

  function renderWeeklyDaySelector() {
    const now = timeProvider.now();
    const currentDayOfWeek = now.getDay(); // 0: Minggu, 1: Senin, ..., 5: Jumat
    
    // Calculate date of Monday of this week
    const mondayDate = new Date(now);
    const diffToMonday = (currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek);
    mondayDate.setDate(now.getDate() + diffToMonday);

    // Update numbers 1..5 for Sen, Sel, Rab, Kam, Jum
    for (let dayId = 1; dayId <= 5; dayId++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + (dayId - 1));
      const numEl = document.getElementById(`day-num-${dayId}`);
      if (numEl) {
        numEl.innerText = d.getDate();
      }
    }

    // Update active day class
    document.querySelectorAll('.day-btn-item').forEach((btn) => {
      const dId = parseInt(btn.getAttribute('data-day'), 10);
      if (btn.classList) {
        if (dId === state.selectedWeeklyDayId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  }

  function renderWeeklySchedule() {
    const listContainer = document.getElementById('weekly-cards-container');
    if (!listContainer || !window.TRJT_SCHEDULE) return;

    renderWeeklyDaySelector();

    const dayClasses = window.TRJT_SCHEDULE.classes
      .filter((c) => c.dayOfWeek === state.selectedWeeklyDayId)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    if (dayClasses.length === 0) {
      listContainer.innerHTML = `
        <div class="hero-glass-card" style="padding: 24px; text-align: center; align-items: center; gap: 8px;">
          <i data-lucide="sun" style="width: 32px; height: 32px; color: var(--color-primary-blue);"></i>
          <p style="font-weight: 700; font-size: 15px; color: var(--color-primary-navy);">Tidak ada jadwal kuliah</p>
          <p style="font-size: 13px; color: var(--color-text-secondary);">Hari ini libur / tidak ada agenda perkuliahan.</p>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      return;
    }

    const now = timeProvider.now();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    listContainer.innerHTML = dayClasses
      .map((item) => {
        let cleanRoomName = item.roomName ? item.roomName.split('(')[0].trim() : '';
        cleanRoomName = cleanRoomName
          .replace('Lab. Jaringan Telekomunikasi', 'Lab. Jartel')
          .replace('Lab. Jaringan Komputer', 'Lab. Jarkom')
          .replace('Lab. HF & Propagasi', 'Lab. HF')
          .replace('Gedung III Teknik Elektro Lt. 2', 'Gd. III Lt. 2')
          .replace('Gedung III Teknik Elektro', 'Gd. III');

        const roomDisplay = item.roomCode ? `${item.roomCode} · ${cleanRoomName}` : cleanRoomName;

        const startMin = parseTimeToMinutes(item.startTime);
        const endMin = parseTimeToMinutes(item.endTime);
        const durationMin = Math.max(0, endMin - startMin);

        let statusText = '• AKAN DATANG';
        let statusClass = 'upcoming';
        let cardActiveClass = '';
        let progressPercent = 0;

        if (state.selectedWeeklyDayId < currentDay) {
          statusText = '• SELESAI';
          statusClass = 'finished';
        } else if (state.selectedWeeklyDayId > currentDay) {
          statusText = '• AKAN DATANG';
          statusClass = 'upcoming';
        } else {
          // Selected day is today
          if (currentMinutes >= startMin && currentMinutes < endMin) {
            statusText = '• BERLANGSUNG';
            statusClass = 'in-progress';
            cardActiveClass = 'is-active';
            const totalSecs = (endMin - startMin) * 60;
            const elapsedSecs = (currentMinutes - startMin) * 60 + now.getSeconds();
            progressPercent = Math.min(100, Math.max(0, (elapsedSecs / totalSecs) * 100));
          } else if (currentMinutes >= endMin) {
            statusText = '• SELESAI';
            statusClass = 'finished';
          } else {
            statusText = '• AKAN DATANG';
            statusClass = 'upcoming';
          }
        }

        const courseTasks = window.TRJT_ASSIGNMENTS ? window.TRJT_ASSIGNMENTS.getAssignmentsForCourse(item.courseName) : [];
        const pendingTasks = courseTasks.filter((t) => window.TRJT_ASSIGNMENTS && !window.TRJT_ASSIGNMENTS.isPersonalCompleted(t.id));
        const hasTasks = pendingTasks.length > 0;
        const taskBadgeHtml = hasTasks 
          ? `<span class="badge-deadline badge-deadline-warning" style="margin-left: 6px; padding: 1px 6px; font-size: 10px; vertical-align: middle; display: inline-flex; align-items: center; gap: 3px;"><i data-lucide="clipboard-check" style="width: 10px; height: 10px;"></i> ${pendingTasks.length} Tugas</span>` 
          : '';

        return `
          <div class="schedule-glass-card ${cardActiveClass} status-${statusClass}" data-schedule-id="${item.id}" onclick="window.openCourseAssignmentsModal('${item.courseName.replace(/'/g, "\\'")}', '${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName).replace(/'/g, "\\'")}', '${item.roomCode}')" role="button" tabindex="0" title="Klik untuk lihat tugas & detail mata kuliah" style="cursor: pointer;">
            <div class="schedule-card-body-row">
              <div class="schedule-time-col">
                <span class="schedule-time-start">${item.startTime.replace(':', '.')}</span>
                <span class="schedule-time-end">${item.endTime.replace(':', '.')}</span>
                <span class="schedule-time-duration">${durationMin} mnt</span>
              </div>
              <div class="schedule-card-main-col">
                <h3 class="schedule-subject-heading">${item.courseName} ${taskBadgeHtml}</h3>
                
                <div class="schedule-room-badge" title="${roomDisplay}">
                  <i data-lucide="map-pin"></i>
                  <span>${roomDisplay}</span>
                </div>
                
                <div class="schedule-lecturer-row">
                  <i data-lucide="user" class="schedule-lecturer-icon"></i>
                  <span class="schedule-lecturer-name">${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
                </div>
              </div>
            </div>
            ${statusClass === 'in-progress' ? `
              <div class="schedule-card-progress-track" aria-hidden="true" title="Waktu berjalan: ${Math.round(progressPercent)}%">
                <div class="schedule-card-progress-fill" data-progress-class-id="${item.id}" style="width: ${progressPercent}%;"></div>
              </div>
            ` : ''}
          </div>
        `;
      })
      .join('');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderNotifications() {
    const container = document.getElementById('notif-list-container');
    const headerDot = document.getElementById('header-unread-dot');
    const navDot = document.getElementById('nav-notif-dot');
    if (!container) return;

    const unreadCount = state.notifications.filter((n) => !n.read).length;
    if (headerDot) headerDot.style.display = unreadCount > 0 ? 'block' : 'none';
    if (navDot) navDot.style.display = unreadCount > 0 ? 'block' : 'none';

    // Update filter pills active class
    const filterAllBtn = document.getElementById('filter-notif-all');
    const filterUnreadBtn = document.getElementById('filter-notif-unread');
    if (filterAllBtn && filterAllBtn.classList) {
      if (state.notifFilter === 'all') filterAllBtn.classList.add('active');
      else filterAllBtn.classList.remove('active');
    }
    if (filterUnreadBtn && filterUnreadBtn.classList) {
      if (state.notifFilter === 'unread') filterUnreadBtn.classList.add('active');
      else filterUnreadBtn.classList.remove('active');
    }

    const filteredNotifs = state.notifFilter === 'unread'
      ? state.notifications.filter((n) => !n.read)
      : state.notifications;

    if (filteredNotifs.length === 0) {
      container.innerHTML = `
        <div class="hero-glass-card" style="padding: 32px 20px; text-align: center; align-items: center; gap: 8px;">
          <div class="hero-clock-circle" style="width: 44px; height: 44px;">
            <i data-lucide="bell-off" style="width: 22px; height: 22px; color: var(--color-text-muted);"></i>
          </div>
          <p style="font-weight: 700; font-size: 15px; color: var(--color-primary-navy); margin-top: 6px;">
            ${state.notifFilter === 'unread' ? 'Semua notifikasi telah dibaca' : 'Belum ada notifikasi'}
          </p>
          <p style="font-size: 12.5px; color: var(--color-text-secondary);">
            ${state.notifFilter === 'unread' ? 'Bagus! Kotak masuk Anda bersih.' : 'Pemberitahuan pengingat kelas dan informasi perkuliahan TRJT 3A akan tampil di sini.'}
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredNotifs
      .map((item, index) => {
        const isH10 = item.type === 'h10';
        const isCancel = item.type === 'cancel';
        const isRoom = item.type === 'room' || item.type === 'info';
        const isMat = item.type === 'material';
        const isTest = item.type === 'test';

        let circleColor = 'blue';
        let iconName = 'clock';
        let categoryTitle = 'Pengingat 10 menit';

        if (isTest) {
          circleColor = 'blue';
          iconName = 'bell-ring';
          categoryTitle = 'Uji notifikasi';
        } else if (isCancel) {
          circleColor = 'red';
          iconName = 'alert-triangle';
          categoryTitle = 'Dibatalkan';
        } else if (isRoom) {
          circleColor = 'green';
          iconName = 'calendar';
          categoryTitle = 'Perubahan jadwal';
        } else if (isMat) {
          circleColor = 'blue';
          iconName = 'folder';
          categoryTitle = 'Materi baru';
        } else if (!isH10) {
          circleColor = 'orange';
          iconName = 'megaphone';
          categoryTitle = item.title || 'Pengumuman penting TRJT 3A';
        }

        const desc = item.desc || (isH10 ? `${item.subject || 'Perkuliahan'} dimulai pukul ${item.meta ? item.meta.split('·')[0].trim() : 'segera'}.` : (isTest ? 'Perangkat ini siap menerima pengingat kelas.' : 'Informasi terbaru kelas tersedia.'));
        const timeFooter = item.time ? (item.time.includes('•') ? item.time : (item.time.includes('Kemarin') ? item.time : `Hari ini • ${item.time}`)) : 'Baru saja';

        return `
          <div class="notif-card ${item.read ? 'read' : 'unread'}" data-id="${item.id || index}">
            <div class="notif-cat-circle ${circleColor}">
              <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="notif-card-body">
              <div class="notif-card-title-row">
                <span class="notif-title-text">${categoryTitle}</span>
                ${!item.read ? '<span class="unread-blue-dot"></span>' : ''}
              </div>
              <p class="notif-desc-content">${desc}</p>
              <span class="notif-time-footer">${timeFooter}</span>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.notif-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const notif = state.notifications.find((n, idx) => n.id === id || String(idx) === id);
        if (notif) {
          notif.read = true;
          saveNotificationsState();
          renderNotifications();
          if (window.lucide) window.lucide.createIcons();

          // Open related materials modal if course match
          if (notif.subject && window.TRJT_SCHEDULE) {
            const matchedClass = window.TRJT_SCHEDULE.classes.find(
              (c) => c.courseName.toLowerCase() === notif.subject.toLowerCase()
            );
            if (matchedClass) {
              window.openCourseMaterialsModal(
                matchedClass.id,
                matchedClass.courseName,
                getLecturerDisplay(matchedClass.lecturerName, matchedClass.lecturerCode, matchedClass.courseName),
                matchedClass.roomCode
              );
            }
          }
        }
      });
    });
  }

  async function processH10Reminder(scheduleData) {
    if (!scheduleData) return;
    if (scheduleData.isH10 !== true) return;
    if (!scheduleData.nextUpcomingClass) return;
    if (state.settings.h10Alert !== true) return;
    if (typeof scheduleData.countdownMs !== 'number' || scheduleData.countdownMs <= 0 || scheduleData.countdownMs > 600000) return;

    const course = scheduleData.nextUpcomingClass;
    if (!course || !course.id) return;

    const now = scheduleData.now || timeProvider.now();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const reminderKey = `${dateStr}|${course.id}|${course.startTime}`;

    if (hasH10ReminderFired(reminderKey) || processingH10Keys.has(reminderKey)) {
      return;
    }

    processingH10Keys.add(reminderKey);
    recordH10ReminderFired(reminderKey);

    try {
      await triggerH10Notification(
        course.courseName,
        course.roomCode,
        course.startTime,
        course.lecturerName,
        course.id,
        reminderKey
      );
    } finally {
      processingH10Keys.delete(reminderKey);
    }
  }

  async function triggerH10Notification(courseName, roomCode, startTime, lecturerName, courseId, reminderKey) {
    const formattedLecturer = getLecturerDisplay(lecturerName, null, courseName);
    const nowObj = timeProvider ? timeProvider.now() : new Date();
    const dayName = daysMap[nowObj.getDay()];
    const timeFormatted = nowObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

    const notifId = reminderKey ? `notif-h10-${reminderKey.replace(/\|/g, '_')}` : `notif-${Date.now()}`;

    // 1. Inbox record on Notifikasi page
    const alreadyExists = state.notifications.some((n) => n.id === notifId);
    if (!alreadyExists) {
      const newNotif = {
        id: notifId,
        type: 'h10',
        title: 'Pengingat 10 menit',
        subject: courseName,
        desc: `${courseName} dimulai pukul ${startTime}.`,
        lecturer: formattedLecturer,
        meta: `${(startTime || '').replace(':', '.')} · ${roomCode || ''}`,
        time: `${dayName} • ${(startTime || '').replace(':', '.')}`,
        read: false
      };
      state.notifications.unshift(newNotif);
      saveNotificationsState();
      renderNotifications();
    }

    const title = `🔔 Kelas 10 Menit Lagi: ${courseName}`;
    const body = `Ruangan: ${roomCode} | Dosen: ${formattedLecturer} | Jam: ${startTime}`;
    const tag = reminderKey || `h10-${courseId || courseName}-${startTime}`;

    // 2. Notification API & Permission checks
    if (!('Notification' in window)) {
      console.warn('⚠️ Notification API tidak didukung pada browser/perangkat ini.');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn(`⚠️ Izin notifikasi belum disetujui (Status: ${Notification.permission}). Pengingat kelas dicatat di notifikasi internal aplikasi.`);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (!state.settings.h10Alert) {
      console.warn('ℹ️ Pengingat H-10 dinonaktifkan dalam pengaturan.');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 3. Service Worker notification first
    let swDispatched = false;
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          const notifOptions = {
            body: body,
            tag: tag,
            renotify: false,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
              url: './index.html',
              type: 'h10',
              scheduleId: courseId || null
            }
          };

          if (!isIOS) {
            notifOptions.icon = './assets/icons/app-icon.svg';
            notifOptions.badge = './assets/icons/app-icon.svg';
          }

          await registration.showNotification(title, notifOptions);
          swDispatched = true;
        }
      } catch (swErr) {
        console.warn('⚠️ Service Worker showNotification fallback ke Notification:', swErr);
      }
    }

    // 4. Fallback to new Notification
    if (!swDispatched) {
      try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const options = {
          body: body,
          tag: tag,
          vibrate: [200, 100, 200]
        };
        if (!isIOS) {
          options.icon = './assets/icons/app-icon.svg';
        }
        new Notification(title, options);
      } catch (nativeErr) {
        console.warn('⚠️ Native Notification error:', nativeErr);
      }
    }

    // 5. Sound chime if enabled
    if (state.settings.soundEnabled && window.TRJT_FIREBASE && typeof window.TRJT_FIREBASE.playNotificationChime === 'function') {
      try {
        window.TRJT_FIREBASE.playNotificationChime();
      } catch (e) {}
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- Toast Notification Feedback Utility ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Clean leading emoji symbols from message string to avoid duplicate icons
    let cleanMessage = (message || '').toString();
    cleanMessage = cleanMessage.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\s]+/u, '').trim();
    if (!cleanMessage) cleanMessage = message;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let iconName = 'info';
    let iconBg = 'rgba(47, 128, 237, 0.12)';
    let iconColor = '#2F80ED';
    let titleText = 'Informasi';

    if (type === 'success') {
      iconName = 'check-circle';
      iconBg = 'rgba(16, 185, 129, 0.12)';
      iconColor = '#10B981';
      titleText = 'Berhasil';
    } else if (type === 'error') {
      iconName = 'alert-circle';
      iconBg = 'rgba(239, 68, 68, 0.12)';
      iconColor = '#EF4444';
      titleText = 'Gagal';
    } else if (type === 'warning') {
      iconName = 'alert-triangle';
      iconBg = 'rgba(245, 158, 11, 0.12)';
      iconColor = '#F59E0B';
      titleText = 'Peringatan';
    }

    toast.innerHTML = `
      <div class="toast-accent-bar"></div>
      <div class="toast-icon-badge" style="background: ${iconBg}; color: ${iconColor};">
        <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
      </div>
      <div class="toast-content">
        <span class="toast-message">${cleanMessage}</span>
      </div>
      <button type="button" class="toast-close-btn" onclick="this.parentElement.remove()" aria-label="Tutup notifikasi">
        <i data-lucide="x" style="width: 14px; height: 14px;"></i>
      </button>
    `;

    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    // Auto remove toast after 3s with smooth animation
    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.style.transition = 'opacity 250ms ease, transform 250ms ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.96)';
        setTimeout(() => {
          if (toast && toast.parentElement) toast.remove();
        }, 260);
      }
    }, 3000);
  }

  // --- Dynamic Honest Settings & Diagnostics Renderer ---
  function renderSettingsUI() {
    const badgeEl = document.getElementById('badge-notif-status');
    const switchSound = document.getElementById('switch-sound');
    const switchVibration = document.getElementById('switch-vibration');
    const switchH10 = document.getElementById('switch-h10');

    // 1. Permission status badge
    if (badgeEl) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          badgeEl.className = 'settings-value-badge';
          badgeEl.innerText = 'Diizinkan';
        } else if (Notification.permission === 'denied') {
          badgeEl.className = 'settings-value-badge';
          badgeEl.style.background = 'var(--color-danger-bg)';
          badgeEl.style.borderColor = 'var(--color-danger-border)';
          badgeEl.style.color = 'var(--color-danger-text)';
          badgeEl.innerText = 'Ditolak';
        } else {
          badgeEl.className = 'settings-value-badge';
          badgeEl.style.background = 'var(--color-very-light-blue)';
          badgeEl.style.borderColor = '#BFDBFE';
          badgeEl.style.color = 'var(--color-primary-blue)';
          badgeEl.innerText = 'Belum diminta';
        }
      } else {
        badgeEl.innerText = 'Tidak didukung';
      }
    }

    // 2. Switches
    if (switchSound) switchSound.checked = state.settings.soundEnabled;
    if (switchVibration) switchVibration.checked = state.settings.vibrationEnabled;
    if (switchH10) switchH10.checked = state.settings.h10Alert;

    // Diagnostics if present
    if (window.TRJT_FIREBASE) {
      const notifStatus = window.TRJT_FIREBASE.getNotificationStatus();
      const diagPerm = document.getElementById('diag-permission');
      const diagSw = document.getElementById('diag-sw');
      const diagToken = document.getElementById('diag-token');
      if (diagPerm) diagPerm.innerText = notifStatus.permission;
      if (diagSw) diagSw.innerText = notifStatus.swActive ? 'Aktif' : 'Tidak aktif';
      if (diagToken) diagToken.innerText = notifStatus.tokenMasked || '-';
    }
  }

  function switchTab(tabId) {
    state.currentTab = tabId;
    document.body.classList.toggle('home-active', tabId === 'beranda');

    document.querySelectorAll('.nav-item').forEach((btn) => {
      const isCurrent = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isCurrent);
      if (isCurrent) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    document.querySelectorAll('.view-section').forEach((view) => {
      if (view.id === `view-${tabId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Hide header bell button if present
    const headerBell = document.getElementById('btn-header-bell');
    if (headerBell) {
      headerBell.style.display = 'none';
    }

    if (tabId === 'jadwal') {
      renderWeeklySchedule();
    } else if (tabId === 'notifikasi') {
      renderNotifications();
    } else if (tabId === 'dosen') {
      renderDosenList();
    } else if (tabId === 'pengaturan') {
      renderSettingsUI();
    }

    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupEvents() {
    // Bottom Nav Tabs
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Weekly Day Selector Capsule Buttons (Sen, Sel, Rab, Kam, Jum)
    document.querySelectorAll('.day-btn-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.day-btn-item').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedWeeklyDayId = parseInt(btn.getAttribute('data-day'), 10);
        renderWeeklySchedule();
        if (window.lucide) window.lucide.createIcons();
      });
    });

    const weeklyCards = document.getElementById('weekly-cards-container');
    if (weeklyCards) {
      weeklyCards.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target?.classList?.contains('schedule-glass-card')) {
          event.preventDefault();
          event.target.click();
        }
      });
    }

    // Notification Filter Pills
    const filterAllBtn = document.getElementById('filter-notif-all');
    const filterUnreadBtn = document.getElementById('filter-notif-unread');
    if (filterAllBtn) {
      filterAllBtn.addEventListener('click', () => {
        state.notifFilter = 'all';
        renderNotifications();
        if (window.lucide) window.lucide.createIcons();
      });
    }
    if (filterUnreadBtn) {
      filterUnreadBtn.addEventListener('click', () => {
        state.notifFilter = 'unread';
        renderNotifications();
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Mark all notifications read
    const markAllReadBtn = document.getElementById('btn-mark-all-read');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        state.notifications.forEach((n) => (n.read = true));
        saveNotificationsState();
        renderNotifications();
        showToast('✅ Semua notifikasi telah ditandai dibaca', 'success');
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Row Notification Status click to request/fix permission
    const rowNotifStatus = document.getElementById('row-notif-status');
    if (rowNotifStatus) {
      rowNotifStatus.addEventListener('click', async () => {
        try {
          if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
              showToast('✅ Izin notifikasi berhasil diberikan!', 'success');
            } else if (perm === 'denied') {
              showToast('⚠️ Izin notifikasi diblokir pada browser.', 'error');
            }
          }
          if (window.TRJT_FIREBASE && window.TRJT_FIREBASE.requestNotificationPermission) {
            await window.TRJT_FIREBASE.requestNotificationPermission(true).catch(() => {});
          }
          renderSettingsUI();
        } catch (err) {
          showToast('⚠️ ' + err.message, 'error');
        }
      });
    }

    // Toggle: Suara Alarm
    const switchSound = document.getElementById('switch-sound');
    if (switchSound) {
      switchSound.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        state.settings.soundEnabled = isChecked;
        localStorage.setItem('trjt_sound_enabled', isChecked ? 'true' : 'false');
        if (window.TRJT_FIREBASE) {
          window.TRJT_FIREBASE.updateDeviceSetting('soundEnabled', isChecked);
          if (isChecked && typeof window.TRJT_FIREBASE.playNotificationChime === 'function') {
            window.TRJT_FIREBASE.playNotificationChime();
          }
        }
        showToast(isChecked ? '🔊 Suara alarm diaktifkan' : '🔇 Suara alarm dimatikan', 'info');
      });
    }

    // Toggle: Getar
    const switchVibration = document.getElementById('switch-vibration');
    if (switchVibration) {
      switchVibration.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        state.settings.vibrationEnabled = isChecked;
        localStorage.setItem('trjt_vibration_enabled', isChecked ? 'true' : 'false');
        if (window.TRJT_FIREBASE) {
          window.TRJT_FIREBASE.updateDeviceSetting('vibrationEnabled', isChecked);
        }
        if (isChecked && 'vibrate' in navigator) {
          try { navigator.vibrate(200); } catch (err) {}
        }
        showToast(isChecked ? '📳 Getar diaktifkan' : '📴 Getar dimatikan', 'info');
      });
    }

    // Button: Uji Notifikasi (Tes)
    const btnTest = document.getElementById('btn-test-notification');
    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        btnTest.disabled = true;
        const originalHtml = btnTest.innerHTML;
        btnTest.innerHTML = `<i data-lucide="loader-2" class="spin-animate" style="width: 14px; height: 14px;"></i> Mengirim…`;
        if (window.lucide) window.lucide.createIcons();

        try {
          if (window.TRJT_FIREBASE) {
            await window.TRJT_FIREBASE.sendTestNotification();
            showToast('✅ Notifikasi berhasil diterima', 'success');
          } else {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 Uji Notifikasi Berhasil', {
                body: 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.',
                icon: './assets/icons/app-icon.svg'
              });
              showToast('✅ Notifikasi berhasil diterima', 'success');
            } else {
              throw new Error('Izin notifikasi belum diaktifkan.');
            }
          }
        } catch (err) {
          showToast('❌ Gagal: ' + err.message, 'error');
        } finally {
          btnTest.disabled = false;
          btnTest.innerHTML = originalHtml;
          renderSettingsUI();
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    // Row About App
    const rowAbout = document.getElementById('row-about-app');
    if (rowAbout) {
      rowAbout.addEventListener('click', () => {
        showToast('ℹ️ TRJT 3A Reminder v4.0 (Semester 5 TA 2026/2027)', 'info');
      });
    }

    // Material Modal Close
    const btnCloseMat = document.getElementById('btn-close-materials-modal');
    if (btnCloseMat) btnCloseMat.addEventListener('click', closeCourseMaterialsModal);

    const modalMat = document.getElementById('modal-course-materials');
    if (modalMat) {
      modalMat.addEventListener('click', (e) => {
        if (e.target === modalMat) closeCourseMaterialsModal();
      });
    }

    // Material Category Filter Pills
    document.querySelectorAll('#modal-course-materials .filter-glass-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#modal-course-materials .filter-glass-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        activeMaterialFilter = pill.getAttribute('data-filter') || 'all';
        renderCourseMaterialsList();
      });
    });

    // Material Search Input
    const searchInput = document.getElementById('mat-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeMaterialSearch = e.target.value;
        renderCourseMaterialsList();
      });
    }

    // Material Course Switcher Dropdown
    const courseSelectMat = document.getElementById('mat-course-select');
    if (courseSelectMat) {
      courseSelectMat.addEventListener('change', (e) => {
        const selectedCourseName = e.target.value;
        if (!selectedCourseName) return;

        let matchedClass = null;
        if (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.classes) {
          matchedClass = window.TRJT_SCHEDULE.classes.find(
            (c) => c.courseName.toLowerCase() === selectedCourseName.toLowerCase()
          );
        }

        const schedId = matchedClass ? matchedClass.id : ('mat-' + selectedCourseName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        const lecturer = matchedClass ? getLecturerDisplay(matchedClass.lecturerName, matchedClass.lecturerCode, matchedClass.courseName) : 'Dosen Pengampu';
        const room = matchedClass ? matchedClass.roomCode : '-';

        openCourseMaterialsModal(schedId, selectedCourseName, lecturer, room);
      });
    }

    // Open Upload Modal Trigger
    const btnTriggerUpload = document.getElementById('btn-trigger-upload-modal');
    if (btnTriggerUpload) btnTriggerUpload.addEventListener('click', openUploadModal);

    // Upload Modal Close
    const btnCloseUpload = document.getElementById('btn-close-upload-modal');
    if (btnCloseUpload) btnCloseUpload.addEventListener('click', closeUploadModal);

    const modalUpload = document.getElementById('modal-upload-material');
    if (modalUpload) {
      modalUpload.addEventListener('click', (e) => {
        if (e.target === modalUpload) closeUploadModal();
      });
    }

    // File Input Pickers
    ['file-input-camera', 'file-input-gallery', 'file-input-document'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        });
      }
    });

    // Remove Selected File
    const btnRemoveFile = document.getElementById('btn-remove-selected-file');
    if (btnRemoveFile) {
      btnRemoveFile.addEventListener('click', () => {
        selectedUploadFile = null;
        const previewBox = document.getElementById('upload-preview-box');
        if (previewBox) previewBox.style.display = 'none';
        const submitBtn = document.getElementById('btn-submit-upload-mat');
        if (submitBtn) submitBtn.disabled = true;
        ['file-input-camera', 'file-input-gallery', 'file-input-document'].forEach((id) => {
          const input = document.getElementById(id);
          if (input) input.value = '';
        });
      });
    }

    // Upload Form Submit
    const formUpload = document.getElementById('form-upload-material');
    if (formUpload) {
      formUpload.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedUploadFile) {
          showToast('⚠️ Silakan pilih file atau foto terlebih dahulu', 'error');
          return;
        }

        const submitBtn = document.getElementById('btn-submit-upload-mat');
        const statusText = document.getElementById('upload-status-text');
        const descInput = document.getElementById('upload-material-desc');
        const authorInput = document.getElementById('upload-material-author');

        if (submitBtn) submitBtn.disabled = true;
        if (statusText) statusText.style.display = 'block';
        if (window.lucide) window.lucide.createIcons();

        try {
          if (!window.TRJT_MATERIALS) throw new Error('Layanan materi belum siap.');

          const metadata = {
            scheduleId: activeMaterialCourse.scheduleId,
            courseName: activeMaterialCourse.courseName,
            description: descInput ? descInput.value : '',
            uploadedBy: authorInput && authorInput.value.trim() ? authorInput.value.trim() : 'Mahasiswa TRJT 3A'
          };

          await window.TRJT_MATERIALS.uploadCourseMaterial(selectedUploadFile, metadata);

          closeUploadModal();
          showToast('✅ Materi berhasil disimpan ke Google Drive!', 'success');
          await renderCourseMaterialsList();
        } catch (err) {
          showToast('❌ Gagal unggah: ' + err.message, 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
          }
          if (statusText) statusText.style.display = 'none';
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    // Piket Schedule Modal Trigger & Handlers
    // Piket button listeners (both in Beranda & Jadwal)
    document.querySelectorAll('.btn-piket-action:not(.btn-group-action):not(.btn-materi-action):not(.btn-tugas-action), #btn-open-piket-modal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openPiketModal();
      });
    });

    // Tugas Kuliah button listener (Beranda)
    document.querySelectorAll('.btn-tugas-action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openAllAssignmentsModal();
      });
    });

    // Materi Perkuliahan button listener (Beranda)
    document.querySelectorAll('.btn-materi-action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCourseMaterialsModal();
      });
    });

    const btnClosePiket = document.getElementById('btn-close-piket-modal');
    if (btnClosePiket) btnClosePiket.addEventListener('click', closePiketModal);

    const modalPiket = document.getElementById('modal-piket-schedule');
    if (modalPiket) {
      modalPiket.addEventListener('click', (e) => {
        if (e.target === modalPiket) closePiketModal();
      });
    }

    document.querySelectorAll('#modal-piket-schedule [data-piket-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filterVal = btn.getAttribute('data-piket-filter') || 'all';
        renderPiketModal(filterVal);
      });
    });

    // Theme selector row & modal handlers
    const rowTheme = document.getElementById('row-theme-setting');
    if (rowTheme) rowTheme.addEventListener('click', openThemeModal);

    const btnCloseTheme = document.getElementById('btn-close-theme-modal');
    if (btnCloseTheme) btnCloseTheme.addEventListener('click', closeThemeModal);

    const modalTheme = document.getElementById('modal-theme-selector');
    if (modalTheme) {
      modalTheme.addEventListener('click', (e) => {
        if (e.target === modalTheme) closeThemeModal();
      });
    }

    // Dosen search input listener
    const searchDosen = document.getElementById('dosen-search-input');
    if (searchDosen) {
      searchDosen.addEventListener('input', (e) => {
        renderDosenList(e.target.value);
      });
    }

    // Mahasiswa modal & search handlers
    const searchMahasiswa = document.getElementById('mahasiswa-search-input');
    if (searchMahasiswa) {
      searchMahasiswa.addEventListener('input', (e) => {
        renderMahasiswaModal(e.target.value);
      });
    }

    const btnCloseMahasiswa = document.getElementById('btn-close-mahasiswa-modal');
    if (btnCloseMahasiswa) btnCloseMahasiswa.addEventListener('click', closeMahasiswaModal);

    const modalMahasiswa = document.getElementById('modal-mahasiswa-list');
    if (modalMahasiswa) {
      modalMahasiswa.addEventListener('click', (e) => {
        if (e.target === modalMahasiswa) closeMahasiswaModal();
      });
    }

    // Assignment Modals Backdrop Clicks
    const modalAddAssignment = document.getElementById('modal-add-assignment');
    if (modalAddAssignment) {
      modalAddAssignment.addEventListener('click', (e) => {
        if (e.target === modalAddAssignment) closeAddAssignmentModal();
      });
    }

    const modalCourseAssignments = document.getElementById('modal-course-assignments');
    if (modalCourseAssignments) {
      modalCourseAssignments.addEventListener('click', (e) => {
        if (e.target === modalCourseAssignments) closeCourseAssignmentsModal();
      });
    }

    const modalAllAssignments = document.getElementById('modal-all-assignments');
    if (modalAllAssignments) {
      modalAllAssignments.addEventListener('click', (e) => {
        if (e.target === modalAllAssignments) closeAllAssignmentsModal();
      });
    }

    // All Tasks Modal Filter Listeners
    const searchAllTasks = document.getElementById('all-tasks-search-input');
    if (searchAllTasks) {
      searchAllTasks.addEventListener('input', (e) => {
        activeAllTasksSearch = e.target.value;
        renderAllAssignmentsList();
      });
    }

    const courseFilterAllTasks = document.getElementById('all-tasks-filter-course');
    if (courseFilterAllTasks) {
      courseFilterAllTasks.addEventListener('change', (e) => {
        activeAllTasksCourse = e.target.value;
        renderAllAssignmentsList();
      });
    }

    // Form Add Assignment Listeners
    const formAddAssignment = document.getElementById('form-add-assignment');
    
    const dateInputEl = document.getElementById('task-input-due-date');
    if (dateInputEl) {
      const handleDateChange = (e) => {
        const val = e.target.value;
        updateDueDatePreview(val);
        syncQuickDateButtons(val);
        if (val) {
          dateInputEl.classList.remove('form-input-error');
          const errDate = document.getElementById('error-task-due-date');
          if (errDate) {
            errDate.style.display = 'none';
            errDate.classList.remove('is-visible');
          }
          checkAllFieldsValidToDismissAlert();
        }
      };
      dateInputEl.addEventListener('input', handleDateChange);
      dateInputEl.addEventListener('change', handleDateChange);
    }

    const courseSelectEl = document.getElementById('task-input-course');
    if (courseSelectEl) {
      courseSelectEl.addEventListener('change', (e) => {
        if (e.target.value) {
          courseSelectEl.classList.remove('form-input-error');
          const errCourse = document.getElementById('error-task-course');
          if (errCourse) {
            errCourse.style.display = 'none';
            errCourse.classList.remove('is-visible');
          }
          checkAllFieldsValidToDismissAlert();
        }
      });
    }

    const titleInputEl = document.getElementById('task-input-title');
    if (titleInputEl) {
      const handleTitleChange = (e) => {
        if (e.target.value.trim()) {
          titleInputEl.classList.remove('form-input-error');
          const errTitle = document.getElementById('error-task-title');
          if (errTitle) {
            errTitle.style.display = 'none';
            errTitle.classList.remove('is-visible');
          }
          checkAllFieldsValidToDismissAlert();
        }
      };
      titleInputEl.addEventListener('input', handleTitleChange);
      titleInputEl.addEventListener('change', handleTitleChange);
    }
  
    if (formAddAssignment) {
      formAddAssignment.addEventListener('submit', (e) => {
        handleSaveAssignment(e);
      });

      // Auto scroll active field above mobile keyboard and system gestures
      const formFields = formAddAssignment.querySelectorAll('input, select, textarea');
      formFields.forEach((field) => {
        field.addEventListener('focus', () => {
          setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 260);
        });
      });
    }

    // Course Groups Modal Backdrop & Search Listeners
    const modalCourseGroups = document.getElementById('modal-course-groups');
    if (modalCourseGroups) {
      modalCourseGroups.addEventListener('click', (e) => {
        if (e.target === modalCourseGroups) closeCourseGroupsModal();
      });
    }

    const searchCourseGroups = document.getElementById('course-groups-search-input');
    if (searchCourseGroups) {
      searchCourseGroups.addEventListener('input', (e) => {
        activeCourseGroupSearch = e.target.value;
        renderCourseGroups();
      });
    }

    // Listen to assignment updates (realtime sync / local updates)
    window.addEventListener('trjt:assignments-updated', () => {
      renderUpcomingTasksWidget();
      renderWeeklySchedule();
      if (activeCourseTaskCourse) renderCourseAssignmentsList();
      if (document.getElementById('modal-all-assignments')?.classList.contains('is-open')) {
        renderAllAssignmentsList();
      }
    });
  }

  // --- HTML sanitization helper ---
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Daftar Piket Modal & Controller System (Rotasi Mingguan: 1 Kelompok / Minggu) ---
  let activePiketFilter = 'all';

  function getCurrentWeekPiketInfo(targetDate) {
    const piketList = window.TRJT_PIKET || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.piket) || [];
    if (!piketList.length) return null;

    const rotationConfig = (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.piketRotation) || {
      referenceMonday: '2026-08-31',
      referenceGroupNumber: 2
    };

    const nowObj = targetDate ? new Date(targetDate) : (timeProvider ? timeProvider.now() : new Date());
    const day = nowObj.getDay(); // 0: Min, 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab
    const diffToMonday = (day === 0 ? -6 : 1 - day);

    // Calculate Monday of the target week
    const monday = new Date(nowObj);
    monday.setDate(nowObj.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Reference Monday
    let refMonParts = [2026, 8, 31];
    if (rotationConfig.referenceMonday) {
      const parts = rotationConfig.referenceMonday.split('-').map(Number);
      if (parts.length === 3) refMonParts = parts;
    }
    const refMonday = new Date(refMonParts[0], refMonParts[1] - 1, refMonParts[2]);
    refMonday.setHours(0, 0, 0, 0);

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.round((monday.getTime() - refMonday.getTime()) / msPerWeek);

    // Reference group index (0-based)
    const refIndex = (rotationConfig.referenceGroupNumber || 2) - 1;
    const totalGroups = piketList.length;
    const currentGroupIndex = ((refIndex + diffWeeks) % totalGroups + totalGroups) % totalGroups;
    const currentGroup = piketList[currentGroupIndex] || piketList[0];

    const isWeekend = (day === 0 || day === 6);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return {
      group: currentGroup,
      groupIndex: currentGroupIndex,
      isWeekend,
      dayOfWeek: day,
      mondayDate: monday,
      fridayDate: friday,
      weekDiff: diffWeeks
    };
  }

  function getTodayPiketGroup() {
    const info = getCurrentWeekPiketInfo();
    return info ? info.group : null;
  }

  function renderPiketBadge() {
    const info = getCurrentWeekPiketInfo();
    if (!info || !info.group) return;

    const badgeText = `Minggu ini: ${info.group.groupName}`;

    document.querySelectorAll('#badge-piket-today-chip, .badge-piket-today-chip').forEach((el) => {
      el.innerText = badgeText;
      el.style.display = 'inline-flex';
    });
  }

  function renderPiketModal(filterGroup = activePiketFilter) {
    activePiketFilter = filterGroup;
    const bannerEl = document.getElementById('piket-today-banner');
    const containerEl = document.getElementById('piket-groups-container');
    const piketList = window.TRJT_PIKET || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.piket) || [];
    const info = getCurrentWeekPiketInfo();
    const activeGroup = info ? info.group : null;
    const isWeekend = info ? info.isWeekend : false;

    // 1. Render Active Week Hero Banner
    if (bannerEl && activeGroup) {
      const statusTitle = isWeekend
        ? 'Libur Akhir Pekan · Bertugas Pekan Ini:'
        : 'Bertugas Pekan Ini (Senin – Jumat):';

      const badgeHeader = isWeekend
        ? `<span class="piket-today-badge" style="color: var(--color-text-secondary);">
             <i data-lucide="coffee" style="width: 14px; height: 14px;"></i> Bertugas Pekan Ini (Akhir Pekan)
           </span>`
        : `<span class="piket-today-badge">
             <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> Bertugas Pekan Ini (Aktif)
           </span>`;

      bannerEl.innerHTML = `
        <div class="piket-today-banner-header">
          ${badgeHeader}
          <span class="piket-today-pill" style="font-weight: 800;">${escapeHtml(activeGroup.groupName)}</span>
        </div>
        <p class="piket-today-group-name">${statusTitle}</p>
        <div class="piket-today-members-list">
          ${activeGroup.members.map((name, idx) => `
            <span class="piket-member-chip">
              <span class="piket-member-chip-num">${idx + 1}</span>
              <span>${escapeHtml(name)}</span>
            </span>
          `).join('')}
        </div>
        <div style="font-size: 11.5px; color: var(--color-text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="calendar-range" style="width: 13px; height: 13px; flex-shrink: 0;"></i>
          <span>Piket bergilir 1 kelompok per minggu penuh (Senin – Jumat).</span>
        </div>
      `;
    }

    // 2. Render Groups List
    if (containerEl) {
      let filtered = piketList;
      if (filterGroup !== 'all') {
        const num = parseInt(filterGroup, 10);
        filtered = piketList.filter(p => p.groupNumber === num);
      }

      if (filtered.length === 0) {
        containerEl.innerHTML = `
          <div class="empty-state-card" style="padding: 24px; text-align: center;">
            <p style="font-weight: 600; font-size: 13px; color: var(--color-text-secondary);">Data kelompok tidak ditemukan.</p>
          </div>
        `;
      } else {
        containerEl.innerHTML = filtered.map((g) => {
          const isCurrentWeek = activeGroup && g.groupNumber === activeGroup.groupNumber;
          return `
            <div class="piket-group-card ${isCurrentWeek ? 'is-today' : ''}">
              <div class="piket-group-header">
                <div class="piket-group-title-wrap">
                  <div class="piket-roman-box">${g.groupRoman}</div>
                  <div>
                    <h3 class="piket-group-title">${escapeHtml(g.groupName)}</h3>
                    <span class="piket-day-chip">Piket 1 Minggu (Senin – Jumat)</span>
                  </div>
                </div>
                ${isCurrentWeek
                  ? `<span class="piket-today-pill" style="font-weight: 700;">Minggu Ini</span>`
                  : `<span style="font-size: 11.5px; color: var(--color-text-secondary); font-weight: 600;">${g.members.length} Anggota</span>`
                }
              </div>

              <div class="piket-members-grid">
                ${g.members.map((name, i) => `
                  <div class="piket-member-item">
                    <div class="piket-avatar-dot">${i + 1}</div>
                    <span class="piket-member-name">${escapeHtml(name)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Update filter pills active state
    document.querySelectorAll('#modal-piket-schedule [data-piket-filter]').forEach((pill) => {
      if (pill.getAttribute('data-piket-filter') === String(filterGroup)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function openPiketModal() {
    try {
      activePiketFilter = 'all';
      renderPiketModal('all');
    } catch (err) {
      console.error('Error rendering piket modal:', err);
    }
    const modal = document.getElementById('modal-piket-schedule');
    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function closePiketModal() {
    const modal = document.getElementById('modal-piket-schedule');
    if (modal) {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }
  }

  window.openPiketModal = openPiketModal;
  window.closePiketModal = closePiketModal;
  window.renderPiketModal = renderPiketModal;

  // --- Mahasiswa (Student Directory) System ---
  let activeMahasiswaSearch = '';

  function getAllMahasiswaList() {
    const piketList = window.TRJT_PIKET || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.piket) || [];
    const students = [];
    let counter = 1;
    piketList.forEach((group) => {
      group.members.forEach((name) => {
        students.push({
          no: counter++,
          name: name,
          groupName: group.groupName,
          groupRoman: group.groupRoman,
          dayName: group.dayName
        });
      });
    });
    return students;
  }

  function renderMahasiswaModal(query = activeMahasiswaSearch) {
    activeMahasiswaSearch = query;
    const container = document.getElementById('mahasiswa-list-container');
    if (!container) return;

    const list = getAllMahasiswaList();
    const q = (query || '').toLowerCase().trim();
    const filtered = list.filter((s) => {
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.groupName.toLowerCase().includes(q) || s.dayName.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--color-text-secondary); font-size: 13px;">
          Mahasiswa tidak ditemukan dengan kata kunci "${escapeHtml(query)}".
        </div>
      `;
    } else {
      container.innerHTML = filtered.map((s) => {
        const initials = s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        return `
          <div class="mahasiswa-card-item">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
              <div class="piket-avatar-dot" style="width: 32px; height: 32px; font-size: 12px; font-weight: 800; border-radius: 10px; background: var(--color-very-light-blue); color: var(--color-primary-blue); display: flex; align-items: center; justify-content: center;">
                ${initials}
              </div>
              <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                <span style="font-size: 13.5px; font-weight: 700; color: var(--color-primary-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(s.name)}
                </span>
                <span style="font-size: 11.5px; color: var(--color-text-secondary);">
                  TRJT 3A · No. Urut ${s.no}
                </span>
              </div>
            </div>
            <span class="piket-day-chip" style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(47, 128, 237, 0.08); border: 1px solid rgba(191, 219, 254, 0.8); color: var(--color-primary-blue); font-weight: 700; white-space: nowrap;">
              ${s.groupName}
            </span>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function openMahasiswaModal() {
    activeMahasiswaSearch = '';
    const searchInput = document.getElementById('mahasiswa-search-input');
    if (searchInput) searchInput.value = '';
    renderMahasiswaModal('');
    const modal = document.getElementById('modal-mahasiswa-list');
    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function closeMahasiswaModal() {
    const modal = document.getElementById('modal-mahasiswa-list');
    if (modal) {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }
  }

  function setupDragScroll() {
    document.querySelectorAll('.quick-pill-scroll-track').forEach((slider) => {
      let isDown = false;
      let startX;
      let scrollLeft;

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider.addEventListener('mouseleave', () => {
        isDown = false;
      });
      slider.addEventListener('mouseup', () => {
        isDown = false;
      });
      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      });
    });
  }

  function setupScrollHideBottomNav() {
    let lastScrollY = (typeof window !== 'undefined' && window.scrollY) || (typeof document !== 'undefined' && document.documentElement && document.documentElement.scrollTop) || 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const bottomNav = document.querySelector('.bottom-nav');
          if (bottomNav) {
            if (currentScrollY > lastScrollY + 6 && currentScrollY > 40) {
              // Scrolling down -> hide bottom bar
              bottomNav.classList.add('nav-hidden');
            } else if (currentScrollY < lastScrollY - 6) {
              // Scrolling up -> show bottom bar
              bottomNav.classList.remove('nav-hidden');
            }
          }
          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  window.openMahasiswaModal = openMahasiswaModal;
  window.closeMahasiswaModal = closeMahasiswaModal;
  window.renderMahasiswaModal = renderMahasiswaModal;

  // --- Theme Management System (Terang, Gelap, Sistem) ---
  function applyTheme(themeName = state.settings.theme || 'light') {
    state.settings.theme = themeName;
    try {
      localStorage.setItem('trjt_theme', themeName);
    } catch (e) {}

    let effective = themeName;
    if (themeName === 'system') {
      effective = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    if (document.documentElement) {
      document.documentElement.setAttribute('data-theme', effective);
    }
    if (document.body) {
      document.body.setAttribute('data-theme', effective);
    }

    // Update settings UI text & icon
    const themeVal = document.getElementById('settings-theme-value');
    const themeIcon = document.getElementById('settings-theme-icon');
    if (themeVal) {
      themeVal.innerText = themeName === 'dark' ? 'Gelap' : (themeName === 'system' ? 'Sistem' : 'Terang');
    }
    if (themeIcon && typeof themeIcon.setAttribute === 'function') {
      themeIcon.setAttribute('data-lucide', effective === 'dark' ? 'moon' : 'sun');
    }

    // Update checkmark in modal & selected class
    ['light', 'dark', 'system'].forEach((mode) => {
      const checkEl = document.getElementById(`theme-check-${mode}`);
      if (checkEl) {
        checkEl.style.display = (mode === themeName) ? 'block' : 'none';
      }
      if (typeof document.querySelector === 'function') {
        const optBtn = document.querySelector(`.theme-option-item[data-theme-opt="${mode}"]`);
        if (optBtn) {
          if (mode === themeName) {
            optBtn.classList.add('is-selected');
          } else {
            optBtn.classList.remove('is-selected');
          }
        }
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function selectTheme(themeName) {
    applyTheme(themeName);
    closeThemeModal();
    const label = themeName === 'dark' ? 'Tema Gelap' : (themeName === 'system' ? 'Tema Sistem' : 'Tema Terang');
    showToast(`✨ ${label} diaktifkan`, 'info');
  }

  function cycleTheme() {
    const current = state.settings.theme || 'light';
    const next = current === 'light' ? 'dark' : (current === 'dark' ? 'system' : 'light');
    selectTheme(next);
  }

  function openThemeModal() {
    const modal = document.getElementById('modal-theme-selector');
    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
    }
    applyTheme(state.settings.theme);
    if (window.lucide) window.lucide.createIcons();
  }

  function closeThemeModal() {
    const modal = document.getElementById('modal-theme-selector');
    if (modal) {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }
  }

  window.selectTheme = selectTheme;
  window.openThemeModal = openThemeModal;
  window.closeThemeModal = closeThemeModal;
  window.cycleTheme = cycleTheme;
  window.applyTheme = applyTheme;

  // Listen for system color-scheme changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.settings.theme === 'system') {
          applyTheme('system');
        }
      });
    } catch (e) {}
  }

  // --- Dosen (Lecturers Directory) Controller ---
  let activeDosenSearch = '';

  // Format 18-digit NIP to standard Indonesian ASN/Dosen format: YYYYMMDD YYYYMM G NNN
  function formatNip(nip) {
    if (!nip) return '';
    const digitsOnly = String(nip).replace(/\D/g, '');
    if (digitsOnly.length === 18) {
      return `${digitsOnly.slice(0, 8)} ${digitsOnly.slice(8, 14)} ${digitsOnly.slice(14, 15)} ${digitsOnly.slice(15, 18)}`;
    }
    return nip;
  }

  function renderDosenList(query = activeDosenSearch) {
    activeDosenSearch = query;
    const container = document.getElementById('dosen-cards-container');
    if (!container) return;

    const dosenList = window.TRJT_DOSEN || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.dosen) || [];

    const q = (query || '').toLowerCase().trim();
    const qClean = q.replace(/\s+/g, '');
    const filtered = dosenList.filter((d) => {
      if (!q) return true;
      const formattedNip = formatNip(d.nip || '');
      const rawNip = (d.nip || '').replace(/\s+/g, '').toLowerCase();
      const matchName = (d.name || '').toLowerCase().includes(q);
      const matchNip = formattedNip.toLowerCase().includes(q) || (qClean && rawNip.includes(qClean));
      const matchInitial = (d.initial || '').toLowerCase().includes(q);
      const matchCourses = (d.courses || []).some(c => (c || '').toLowerCase().includes(q));
      return matchName || matchNip || matchInitial || matchCourses;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="hero-glass-card" style="padding: 24px; text-align: center; align-items: center; gap: 8px;">
          <i data-lucide="search-x" style="width: 28px; height: 28px; color: var(--color-text-muted);"></i>
          <p style="font-weight: 700; font-size: 14px; color: var(--color-primary-navy);">Dosen tidak ditemukan</p>
          <p style="font-size: 12px; color: var(--color-text-secondary);">Tidak ada dosen atau mata kuliah yang cocok dengan kata kunci "${escapeHtml(query)}".</p>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map((d) => {
        const displayNip = formatNip(d.nip);
        return `
          <div class="dosen-glass-card">
            <div class="dosen-card-top">
              <div class="dosen-avatar-squircle">${d.initial}</div>
              <div class="dosen-info-wrap">
                <h3 class="dosen-name-heading">${escapeHtml(d.name)}</h3>
                <span class="dosen-nip-badge">
                  <i data-lucide="id-card"></i>
                  <span>NIP: ${escapeHtml(displayNip)}</span>
                </span>
              </div>
            </div>

            <div class="dosen-courses-section">
              <span class="dosen-courses-label">Mata Kuliah Diampu:</span>
              <div class="dosen-courses-pills">
                ${d.courses.map((courseName) => `
                  <span class="dosen-course-pill" onclick="handleDosenCourseClick('${escapeHtml(courseName).replace(/'/g, "\\'")}', '${escapeHtml(d.name).replace(/'/g, "\\'")}')">
                    <i data-lucide="book-open"></i>
                    <span>${escapeHtml(courseName)}</span>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function handleDosenCourseClick(courseName, lecturerName) {
    if (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.classes) {
      const matchedClass = window.TRJT_SCHEDULE.classes.find(
        (c) => c.courseName.toLowerCase() === courseName.toLowerCase()
      );
      if (matchedClass) {
        window.openCourseMaterialsModal(
          matchedClass.id,
          matchedClass.courseName,
          getLecturerDisplay(matchedClass.lecturerName, matchedClass.lecturerCode, matchedClass.courseName),
          matchedClass.roomCode
        );
        return;
      }
    }
    window.openCourseMaterialsModal(
      'mat-' + courseName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      courseName,
      lecturerName,
      'Lab / Ruang Kuliah'
    );
  }

  window.renderDosenList = renderDosenList;
  window.handleDosenCourseClick = handleDosenCourseClick;

  // --- Course Materials Modal & Controller System ---
  let activeMaterialCourse = null;
  let activeMaterialFilter = 'all';
  let activeMaterialSearch = '';
  let selectedUploadFile = null;

  async function openCourseMaterialsModal(scheduleId, courseName, lecturer, room) {
    // 1. Fallback when called without arguments or empty courseName
    if (!courseName && window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.classes && window.TRJT_SCHEDULE.classes.length > 0) {
      const defaultClass = window.TRJT_SCHEDULE.classes[0];
      scheduleId = scheduleId || defaultClass.id;
      courseName = defaultClass.courseName;
      lecturer = lecturer || getLecturerDisplay(defaultClass.lecturerName, defaultClass.lecturerCode, defaultClass.courseName);
      room = room || defaultClass.roomCode;
    }

    activeMaterialCourse = {
      scheduleId: scheduleId || 'mat-default',
      courseName: courseName || 'Praktikum Antena dan Propagasi',
      lecturer: lecturer || 'Dosen Pengampu',
      room: room || '-'
    };
    activeMaterialFilter = 'all';
    activeMaterialSearch = '';

    const modal = document.getElementById('modal-course-materials');
    const titleEl = document.getElementById('mat-modal-course-name');
    const metaEl = document.getElementById('mat-modal-course-meta');
    const searchInput = document.getElementById('mat-search-input');
    const courseSelect = document.getElementById('mat-course-select');
    const container = document.getElementById('mat-list-container');
    const emptyState = document.getElementById('mat-empty-state');

    if (titleEl) titleEl.innerText = activeMaterialCourse.courseName;
    if (metaEl) metaEl.innerText = `${activeMaterialCourse.lecturer} · Ruang ${activeMaterialCourse.room}`;
    if (searchInput) searchInput.value = '';
    if (courseSelect) courseSelect.value = activeMaterialCourse.courseName;

    // 2. OPEN MODAL IMMEDIATELY
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }

    // 3. Reset Filter Pills
    document.querySelectorAll('#modal-course-materials .filter-glass-pill').forEach((pill) => {
      if (pill.getAttribute('data-filter') === 'all') pill.classList.add('active');
      else pill.classList.remove('active');
    });

    // 4. Show Skeleton loader immediately while items load
    if (emptyState) emptyState.style.display = 'none';
    if (container) {
      if (typeof getSkeletonMaterialCardHtml === 'function') {
        container.innerHTML = getSkeletonMaterialCardHtml(3);
      }
    }

    // 5. Set default Drive folder URL so it's always valid
    const btnDriveFolder = document.getElementById('btn-open-course-drive-folder');
    if (btnDriveFolder) {
      btnDriveFolder.href = 'https://drive.google.com/drive/folders/1W7F5rWsNNq-nsLUF1emnOj4eJsYSShzW?usp=drive_link';
    }

    if (window.lucide) window.lucide.createIcons();

    // 6. Asynchronously resolve specific Drive folder in background
    if (btnDriveFolder && window.TRJT_DRIVE && typeof window.TRJT_DRIVE.getFolderForCourse === 'function') {
      try {
        const folderInfo = await Promise.race([
          window.TRJT_DRIVE.getFolderForCourse(activeMaterialCourse.courseName || activeMaterialCourse.scheduleId),
          new Promise((r) => setTimeout(() => r(null), 800))
        ]);
        if (folderInfo && folderInfo.driveFolderId) {
          btnDriveFolder.href = `https://drive.google.com/drive/folders/${folderInfo.driveFolderId}?usp=drive_link`;
        }
      } catch (e) {
        console.warn('Drive folder lookup note:', e);
      }
    }

    // 7. Render course materials list with error boundary
    try {
      await renderCourseMaterialsList();
    } catch (e) {
      console.error('Error rendering course materials list:', e);
      if (container) {
        container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--color-text-secondary); font-size: 13px;">Gagal memuat materi. Silakan coba lagi.</div>`;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function closeCourseMaterialsModal() {
    const modal = document.getElementById('modal-course-materials');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  async function renderCourseMaterialsList() {
    const container = document.getElementById('mat-list-container');
    const emptyState = document.getElementById('mat-empty-state');
    const countAll = document.getElementById('count-mat-all');
    const countPhoto = document.getElementById('count-mat-photo');
    const countDoc = document.getElementById('count-mat-doc');

    if (!container || !activeMaterialCourse) return;

    let items = [];
    if (window.TRJT_MATERIALS && typeof window.TRJT_MATERIALS.getMaterialsForCourse === 'function') {
      try {
        items = await Promise.race([
          window.TRJT_MATERIALS.getMaterialsForCourse(activeMaterialCourse.courseName),
          new Promise((r) => setTimeout(() => r([]), 1500))
        ]);
      } catch (e) {
        console.warn('Fetch materials error:', e);
        items = [];
      }
    }
    if (!Array.isArray(items)) items = [];

    const photoItems = items.filter((m) => m.isImage || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(m.fileExtension));
    const docItems = items.filter((m) => !m.isImage && !['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(m.fileExtension));

    if (countAll) countAll.innerText = items.length;
    if (countPhoto) countPhoto.innerText = photoItems.length;
    if (countDoc) countDoc.innerText = docItems.length;

    let filtered = items;
    if (activeMaterialFilter === 'photo') {
      filtered = photoItems;
    } else if (activeMaterialFilter === 'doc') {
      filtered = docItems;
    }

    if (activeMaterialSearch.trim()) {
      const q = activeMaterialSearch.toLowerCase().trim();
      filtered = filtered.filter((m) => 
        (m.fileName && m.fileName.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.uploadedBy && m.uploadedBy.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = filtered.map((m) => {
      const isPhoto = m.isImage || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(m.fileExtension);
      const icon = isPhoto ? 'image' : (m.fileExtension === 'pdf' ? 'file-text' : (['doc', 'docx'].includes(m.fileExtension) ? 'file-edit' : (['xls', 'xlsx'].includes(m.fileExtension) ? 'file-spreadsheet' : 'file')));
      
      const thumbHtml = m.thumbnailUrl 
        ? `<img src="${m.thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${m.fileName}">`
        : `<i data-lucide="${icon}" style="width: 22px; height: 22px; color: var(--color-primary-blue);"></i>`;

      const dateStr = m.uploadedAt 
        ? (typeof m.uploadedAt === 'string' ? new Date(m.uploadedAt).toLocaleDateString('id-ID') : 'Baru saja')
        : 'Baru saja';

      return `
        <div class="today-class-card" style="padding: 12px 14px;">
          <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--color-very-light-blue); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
            ${thumbHtml}
          </div>
          <div style="flex: 1; min-width: 0;">
            <h4 style="font-size: 13.5px; font-weight: 700; color: var(--color-primary-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.fileName}</h4>
            <div style="display: flex; gap: 6px; font-size: 11px; color: var(--color-text-secondary); margin-top: 2px;">
              <span>${m.fileSize || '1 MB'}</span>
              <span>·</span>
              <span>${dateStr}</span>
              <span>·</span>
              <span style="color: var(--color-primary-blue); font-weight: 600;">${m.uploadedBy || 'Mahasiswa'}</span>
            </div>
          </div>
          <button type="button" class="btn-schedule-mat" onclick="window.TRJT_MATERIALS.openOrDownloadMaterial('${m.id}')" style="padding: 6px 10px;">
            <i data-lucide="external-link" style="width: 12px; height: 12px;"></i> Buka
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function openUploadModal() {
    if (!activeMaterialCourse) return;
    selectedUploadFile = null;

    const modal = document.getElementById('modal-upload-material');
    const subEl = document.getElementById('upload-modal-course-sub');
    const form = document.getElementById('form-upload-material');
    const previewBox = document.getElementById('upload-preview-box');
    const statusText = document.getElementById('upload-status-text');
    const submitBtn = document.getElementById('btn-submit-upload-mat');

    if (subEl) subEl.innerText = `Mata Kuliah: ${activeMaterialCourse.courseName}`;
    if (form) form.reset();
    if (previewBox) previewBox.style.display = 'none';
    if (statusText) statusText.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;

    if (modal) modal.classList.add('is-open');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeUploadModal() {
    const modal = document.getElementById('modal-upload-material');
    if (modal) modal.classList.remove('is-open');
  }

  function handleFileSelected(file) {
    if (!file) return;
    selectedUploadFile = file;

    const previewBox = document.getElementById('upload-preview-box');
    const previewIcon = document.getElementById('upload-preview-icon');
    const fileNameEl = document.getElementById('upload-file-name');
    const fileSizeEl = document.getElementById('upload-file-size');
    const submitBtn = document.getElementById('btn-submit-upload-mat');

    if (fileNameEl) fileNameEl.innerText = file.name;
    if (fileSizeEl && window.TRJT_MATERIALS) fileSizeEl.innerText = window.TRJT_MATERIALS.formatFileSize(file.size);

    if (previewIcon) {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        previewIcon.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        previewIcon.innerHTML = `<i data-lucide="file-text" style="width: 20px; height: 20px; color: var(--color-primary-blue);"></i>`;
      }
    }

    if (previewBox) previewBox.style.display = 'flex';
    if (submitBtn) submitBtn.disabled = false;
    if (window.lucide) window.lucide.createIcons();
  }

  window.openCourseMaterialsModal = openCourseMaterialsModal;
  window.closeCourseMaterialsModal = closeCourseMaterialsModal;

  // ==========================================
  // --- Course Assignments Controller System ---
  // ==========================================
  let activeCourseTaskCourse = null;
  window.activeCourseTaskCourse = null;
  let activeCourseTaskFilter = 'all';
  let activeAllTasksFilter = 'all';
  let activeAllTasksCourse = '';
  let activeAllTasksSearch = '';

  function clearAssignmentFormErrors() {
    const errorBox = document.getElementById('task-input-error-msg');
    const courseSelect = document.getElementById('task-input-course');
    const titleInput = document.getElementById('task-input-title');
    const dateInput = document.getElementById('task-input-due-date');
    const errCourse = document.getElementById('error-task-course');
    const errTitle = document.getElementById('error-task-title');
    const errDate = document.getElementById('error-task-due-date');

    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.classList.remove('is-visible');
    }
    if (courseSelect) courseSelect.classList.remove('form-input-error');
    if (titleInput) titleInput.classList.remove('form-input-error');
    if (dateInput) dateInput.classList.remove('form-input-error');
    if (errCourse) {
      errCourse.style.display = 'none';
      errCourse.classList.remove('is-visible');
    }
    if (errTitle) {
      errTitle.style.display = 'none';
      errTitle.classList.remove('is-visible');
    }
    if (errDate) {
      errDate.style.display = 'none';
      errDate.classList.remove('is-visible');
    }
  }
  window.clearAssignmentFormErrors = clearAssignmentFormErrors;

  function checkAllFieldsValidToDismissAlert() {
    const course = document.getElementById('task-input-course')?.value?.trim();
    const title = document.getElementById('task-input-title')?.value?.trim();
    const dueDate = document.getElementById('task-input-due-date')?.value?.trim();
    if (course && title && dueDate) {
      const errorBox = document.getElementById('task-input-error-msg');
      if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.classList.remove('is-visible');
      }
    }
  }
  window.checkAllFieldsValidToDismissAlert = checkAllFieldsValidToDismissAlert;

  function syncQuickDateButtons(selectedDateStr) {
    const chipBtns = document.querySelectorAll('#modal-add-assignment .quick-date-btn');
    if (!chipBtns.length) return;

    const formatYMD = (daysAhead) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const targetDate = selectedDateStr ? selectedDateStr.trim() : '';

    chipBtns.forEach((btn) => {
      const days = parseInt(btn.getAttribute('data-days'), 10);
      if (targetDate && formatYMD(days) === targetDate) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }
  window.syncQuickDateButtons = syncQuickDateButtons;

  function openAddAssignmentModal(defaultCourseName) {
    const modal = document.getElementById('modal-add-assignment');
    const form = document.getElementById('form-add-assignment');
    if (form) form.reset();
    clearAssignmentFormErrors();

    // Safely resolve course target (handles undefined, Event object, or string)
    let courseTarget = '';
    if (typeof defaultCourseName === 'string' && defaultCourseName.trim()) {
      courseTarget = defaultCourseName.trim();
    } else if (activeCourseTaskCourse && typeof activeCourseTaskCourse.courseName === 'string') {
      courseTarget = activeCourseTaskCourse.courseName.trim();
    }

    const courseSelect = document.getElementById('task-input-course');
    if (courseSelect) {
      if (courseTarget) {
        const normTarget = courseTarget.toLowerCase().replace(/[^a-z0-9]/g, '');
        let matchedIndex = -1;

        // Pass 1: Exact normalized match (skipping empty placeholder at index 0)
        for (let i = 1; i < courseSelect.options.length; i++) {
          const optVal = courseSelect.options[i].value;
          if (!optVal) continue;
          if (optVal.toLowerCase().replace(/[^a-z0-9]/g, '') === normTarget) {
            matchedIndex = i;
            break;
          }
        }

        // Pass 2: Substring normalized match fallback
        if (matchedIndex === -1) {
          for (let i = 1; i < courseSelect.options.length; i++) {
            const optVal = courseSelect.options[i].value;
            if (!optVal) continue;
            const normVal = optVal.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normVal.includes(normTarget) || normTarget.includes(normVal)) {
              matchedIndex = i;
              break;
            }
          }
        }

        if (matchedIndex !== -1) {
          courseSelect.selectedIndex = matchedIndex;
          courseSelect.value = courseSelect.options[matchedIndex].value;
        } else {
          courseSelect.selectedIndex = 0;
        }
      } else {
        courseSelect.selectedIndex = 0;
      }
    }

    // Default due date to 3 days ahead via quick setter
    setQuickDueDate(3);
    selectTaskType('individu');

    if (modal) modal.classList.add('is-open');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeAddAssignmentModal() {
    const modal = document.getElementById('modal-add-assignment');
    if (modal) modal.classList.remove('is-open');
    clearAssignmentFormErrors();
  }

  function selectTaskType(type) {
    const hidden = document.getElementById('task-input-type');
    const btnIndividu = document.getElementById('btn-type-individu');
    const btnKelompok = document.getElementById('btn-type-kelompok');

    const cleanType = type === 'kelompok' ? 'kelompok' : 'individu';
    if (hidden) hidden.value = cleanType;
    if (btnIndividu && btnKelompok) {
      if (cleanType === 'kelompok') {
        btnKelompok.classList.add('active');
        btnIndividu.classList.remove('active');
      } else {
        btnIndividu.classList.add('active');
        btnKelompok.classList.remove('active');
      }
    }
  }

  function setQuickDueDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + (daysAhead || 1));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('task-input-due-date');
    const dateVal = `${yyyy}-${mm}-${dd}`;
    if (dateInput) {
      dateInput.value = dateVal;
      dateInput.classList.remove('form-input-error');
      const errDate = document.getElementById('error-task-due-date');
      if (errDate) errDate.style.display = 'none';
      checkAllFieldsValidToDismissAlert();
    }
    updateDueDatePreview(dateVal);
    syncQuickDateButtons(dateVal);
  }

  function updateDueDatePreview(dateStr) {
    const previewEl = document.getElementById('task-due-date-preview-text');
    if (!previewEl) return;
    if (!dateStr) {
      previewEl.innerText = 'Pilih tanggal pengumpulan';
      return;
    }
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
          ];
          const dayName = days[dateObj.getDay()];
          const monthName = months[dateObj.getMonth()];
          previewEl.innerText = `Batas: ${dayName}, ${d} ${monthName} ${y}`;
          return;
        }
      }
    } catch (e) {}
    previewEl.innerText = `Batas: ${dateStr}`;
  }
  window.updateDueDatePreview = updateDueDatePreview;
  window.setQuickDueDate = setQuickDueDate;

  // Uiverse Multi-blade Spinner Generator
  function getUiverseSpinnerHtml(extraClass = '') {
    return `
      <div class="spinner-loader-wrap ${extraClass}">
        <div class="spinner">
          <div></div><div></div><div></div><div></div><div></div>
          <div></div><div></div><div></div><div></div><div></div>
        </div>
      </div>
    `;
  }
  window.getUiverseSpinnerHtml = getUiverseSpinnerHtml;

  let isSavingAssignment = false;
  async function handleSaveAssignment(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingAssignment) return;

    const courseSelect = document.getElementById('task-input-course');
    const titleInput = document.getElementById('task-input-title');
    const dateInput = document.getElementById('task-input-due-date');
    const errorBox = document.getElementById('task-input-error-msg');
    const errorText = document.getElementById('task-input-error-text');
    const errCourse = document.getElementById('error-task-course');
    const errTitle = document.getElementById('error-task-title');
    const errDate = document.getElementById('error-task-due-date');

    // Reset error states before validation
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.classList.remove('is-visible');
    }
    if (courseSelect) courseSelect.classList.remove('form-input-error');
    if (titleInput) titleInput.classList.remove('form-input-error');
    if (dateInput) dateInput.classList.remove('form-input-error');
    if (errCourse) {
      errCourse.style.display = 'none';
      errCourse.classList.remove('is-visible');
    }
    if (errTitle) {
      errTitle.style.display = 'none';
      errTitle.classList.remove('is-visible');
    }
    if (errDate) {
      errDate.style.display = 'none';
      errDate.classList.remove('is-visible');
    }

    const course = courseSelect?.value?.trim();
    const title = titleInput?.value?.trim();
    const dueDate = dateInput?.value?.trim();
    const dueTime = document.getElementById('task-input-due-time')?.value || '23:59';
    const type = document.getElementById('task-input-type')?.value || 'individu';
    const submissionMethod = document.getElementById('task-input-method')?.value || 'lab';
    const submissionPlace = document.getElementById('task-input-place')?.value?.trim() || '';
    const description = document.getElementById('task-input-desc')?.value?.trim() || '';
    const createdBy = document.getElementById('task-input-author')?.value || 'Mahasiswa TRJT 3A';

    // Field-specific validation
    let hasError = false;
    let firstErrorElem = null;

    if (!course) {
      hasError = true;
      if (courseSelect) courseSelect.classList.add('form-input-error');
      if (errCourse) {
        errCourse.style.display = 'flex';
        errCourse.classList.add('is-visible');
      }
      if (!firstErrorElem) firstErrorElem = courseSelect;
    }
    if (!title) {
      hasError = true;
      if (titleInput) titleInput.classList.add('form-input-error');
      if (errTitle) {
        errTitle.style.display = 'flex';
        errTitle.classList.add('is-visible');
      }
      if (!firstErrorElem) firstErrorElem = titleInput;
    }
    if (!dueDate) {
      hasError = true;
      if (dateInput) dateInput.classList.add('form-input-error');
      if (errDate) {
        errDate.style.display = 'flex';
        errDate.classList.add('is-visible');
      }
      if (!firstErrorElem) firstErrorElem = dateInput;
    }

    if (hasError) {
      const msg = 'Mohon lengkapi kolom yang wajib diisi.';
      if (errorBox && errorText) {
        errorText.innerText = msg;
        errorBox.style.display = 'flex';
        errorBox.classList.add('is-visible');
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      showToast(msg, 'warning');
      if (firstErrorElem) firstErrorElem.focus();
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (!window.TRJT_ASSIGNMENTS) {
      showToast('Sistem tugas belum siap. Mohon muat ulang halaman.', 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-task');
    let origBtnHtml = '';
    if (submitBtn) {
      origBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      submitBtn.innerHTML = `${getUiverseSpinnerHtml()}<span>Menyimpan Tugas...</span>`;
    }

    try {
      isSavingAssignment = true;
      const savePromise = window.TRJT_ASSIGNMENTS.createAssignment({
        courseName: course,
        title: title,
        dueDate: dueDate,
        dueTime: dueTime,
        type: type,
        submissionMethod: submissionMethod,
        submissionPlace: submissionPlace,
        description: description,
        createdBy: createdBy
      });

      // Provide natural visual feedback of at least 400ms for spinner animation
      await Promise.all([
        savePromise,
        new Promise((resolve) => setTimeout(resolve, 400))
      ]);

      showToast('Tugas berhasil disimpan dan disinkronkan ke seluruh kelas!', 'success');
      closeAddAssignmentModal();

      // Reset form fields only on confirmed success
      if (titleInput) titleInput.value = '';
      if (document.getElementById('task-input-place')) document.getElementById('task-input-place').value = '';
      if (document.getElementById('task-input-desc')) document.getElementById('task-input-desc').value = '';
      clearAssignmentFormErrors();

      renderUpcomingTasksWidget();
      renderWeeklySchedule();
      if (activeCourseTaskCourse) renderCourseAssignmentsList();
      if (document.getElementById('modal-all-assignments')?.classList.contains('is-open')) {
        renderAllAssignmentsList();
      }
    } catch (err) {
      console.error('Error saving assignment:', err);
      const errMsg = 'Gagal menyimpan tugas: ' + (err.message || err);
      if (errorBox && errorText) {
        errorText.innerText = errMsg;
        errorBox.style.display = 'flex';
      }
      showToast(errMsg, 'error');
      // Notice: user inputs are NOT cleared, user can retry immediately!
    } finally {
      isSavingAssignment = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.innerHTML = origBtnHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  function openCourseAssignmentsModal(courseName, lecturer, room) {
    activeCourseTaskCourse = { courseName, lecturer, room };
    window.activeCourseTaskCourse = activeCourseTaskCourse;
    activeCourseTaskFilter = 'all';

    const modal = document.getElementById('modal-course-assignments');
    const nameEl = document.getElementById('course-task-modal-name');
    const metaEl = document.getElementById('course-task-modal-meta');

    if (nameEl) nameEl.innerText = courseName;
    if (metaEl) metaEl.innerText = `${lecturer || 'Dosen Pengampu'} · Ruang ${room || '-'}`;

    const btnJumpGroups = document.getElementById('btn-course-jump-groups');
    if (btnJumpGroups) {
      const hasGroups = window.getCoursePracticalGroups ? !!window.getCoursePracticalGroups(courseName) : false;
      btnJumpGroups.style.display = hasGroups ? 'inline-flex' : 'none';
    }

    document.querySelectorAll('#modal-course-assignments .filter-glass-pill').forEach((pill) => {
      if (pill.getAttribute('data-filter') === 'all') pill.classList.add('active');
      else pill.classList.remove('active');
    });

    renderCourseAssignmentsList();

    if (modal) modal.classList.add('is-open');
    if (window.lucide) window.lucide.createIcons();
  }

  function jumpToCourseGroupsFromTaskModal() {
    if (activeCourseTaskCourse && activeCourseTaskCourse.courseName) {
      openCourseGroupsModal(activeCourseTaskCourse.courseName);
    } else {
      openCourseGroupsModal();
    }
  }

  function closeCourseAssignmentsModal() {
    const modal = document.getElementById('modal-course-assignments');
    if (modal) modal.classList.remove('is-open');
  }

  function filterCourseTasks(filter) {
    activeCourseTaskFilter = filter;
    document.querySelectorAll('#modal-course-assignments .filter-glass-pill').forEach((pill) => {
      if (pill.getAttribute('data-filter') === filter) pill.classList.add('active');
      else pill.classList.remove('active');
    });
    renderCourseAssignmentsList();
  }

  function renderCourseAssignmentsList() {
    const container = document.getElementById('course-tasks-list-container');
    const emptyState = document.getElementById('course-tasks-empty-state');
    const countAll = document.getElementById('count-course-task-all');
    const countActive = document.getElementById('count-course-task-active');
    const countCompleted = document.getElementById('count-course-task-completed');

    if (!container || !activeCourseTaskCourse || !window.TRJT_ASSIGNMENTS) return;

    const allForCourse = window.TRJT_ASSIGNMENTS.getAssignmentsForCourse(activeCourseTaskCourse.courseName);
    const activeTasks = allForCourse.filter((t) => !window.TRJT_ASSIGNMENTS.isPersonalCompleted(t.id));
    const completedTasks = allForCourse.filter((t) => window.TRJT_ASSIGNMENTS.isPersonalCompleted(t.id));

    if (countAll) countAll.innerText = allForCourse.length;
    if (countActive) countActive.innerText = activeTasks.length;
    if (countCompleted) countCompleted.innerText = completedTasks.length;

    let displayList = allForCourse;
    if (activeCourseTaskFilter === 'active') displayList = activeTasks;
    else if (activeCourseTaskFilter === 'completed') displayList = completedTasks;

    if (displayList.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = displayList.map((task) => buildAssignmentCardHtml(task, false)).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function openAllAssignmentsModal() {
    activeAllTasksFilter = 'all';
    activeAllTasksCourse = '';
    activeAllTasksSearch = '';

    const modal = document.getElementById('modal-all-assignments');
    const searchInput = document.getElementById('all-tasks-search-input');
    const courseSelect = document.getElementById('all-tasks-filter-course');

    if (searchInput) searchInput.value = '';
    if (courseSelect) courseSelect.value = '';

    document.querySelectorAll('#modal-all-assignments .filter-glass-pill').forEach((p) => {
      if (p.getAttribute('data-filter') === 'all') p.classList.add('active');
      else p.classList.remove('active');
    });

    renderAllAssignmentsList();

    if (modal) modal.classList.add('is-open');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeAllAssignmentsModal() {
    const modal = document.getElementById('modal-all-assignments');
    if (modal) modal.classList.remove('is-open');
  }

  function filterAllTasks(status) {
    activeAllTasksFilter = status;
    document.querySelectorAll('#modal-all-assignments .filter-glass-pill').forEach((p) => {
      if (p.getAttribute('data-filter') === status) p.classList.add('active');
      else p.classList.remove('active');
    });
    renderAllAssignmentsList();
  }

  function renderAllAssignmentsList() {
    const container = document.getElementById('all-tasks-list-container');
    const emptyState = document.getElementById('all-tasks-empty-state');
    const countAll = document.getElementById('count-all-tasks-all');
    const countPending = document.getElementById('count-all-tasks-pending');
    const countCompleted = document.getElementById('count-all-tasks-completed');

    if (!container || !window.TRJT_ASSIGNMENTS) return;

    let allTasks = window.TRJT_ASSIGNMENTS.getAllAssignments();

    if (activeAllTasksCourse) {
      allTasks = allTasks.filter((t) => (t.courseName || '').toLowerCase().includes(activeAllTasksCourse.toLowerCase()));
    }

    if (activeAllTasksSearch.trim()) {
      const q = activeAllTasksSearch.toLowerCase().trim();
      allTasks = allTasks.filter((t) => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.courseName && t.courseName.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    const pending = allTasks.filter((t) => !window.TRJT_ASSIGNMENTS.isPersonalCompleted(t.id));
    const completed = allTasks.filter((t) => window.TRJT_ASSIGNMENTS.isPersonalCompleted(t.id));

    if (countAll) countAll.innerText = allTasks.length;
    if (countPending) countPending.innerText = pending.length;
    if (countCompleted) countCompleted.innerText = completed.length;

    let displayList = allTasks;
    if (activeAllTasksFilter === 'pending') displayList = pending;
    else if (activeAllTasksFilter === 'completed') displayList = completed;

    if (displayList.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = displayList.map((task) => buildAssignmentCardHtml(task, true)).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function buildAssignmentCardHtml(task, showCoursePill = true) {
    if (!window.TRJT_ASSIGNMENTS) return '';
    const isDone = window.TRJT_ASSIGNMENTS.isPersonalCompleted(task.id);
    const deadlineInfo = window.TRJT_ASSIGNMENTS.formatDeadlineCountdown(task.dueDate, task.dueTime);

    const checkClass = isDone ? 'checked' : '';
    const checkIcon = isDone ? '<i data-lucide="check" style="width: 18px; height: 18px;" aria-hidden="true"></i>' : '';
    const cardDoneClass = isDone ? 'completed' : '';

    const typeIcon = task.type === 'kelompok' ? 'users' : 'user';
    const typeLabel = task.type === 'kelompok' ? 'Kelompok' : 'Individu';

    let methodIcon = 'map-pin';
    let methodLabel = task.submissionPlace || 'Kumpul Fisik';
    if (task.submissionMethod === 'classroom') {
      methodIcon = 'globe';
      if (!task.submissionPlace) methodLabel = 'Google Classroom';
    } else if (task.submissionMethod === 'email') {
      methodIcon = 'mail';
      if (!task.submissionPlace) methodLabel = 'Email Dosen';
    } else if (task.submissionMethod === 'drive') {
      methodIcon = 'hard-drive';
      if (!task.submissionPlace) methodLabel = 'Google Drive';
    }

    // Format Indonesian Full Date
    let formattedDueDateStr = deadlineInfo.fullText || task.dueDate || '';
    if (task.dueDate && task.dueDate.includes('-')) {
      try {
        const [y, m, d] = task.dueDate.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        if (!isNaN(dateObj.getTime())) {
          formattedDueDateStr = dateObj.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
      } catch (e) {}
    }

    const descHtml = task.description ? `
      <p class="assignment-card-desc" title="${escapeHtml(task.description)}">${escapeHtml(task.description)}</p>
    ` : '';

    // Deadline badge text: Ensure exact "Terlambat X hari" phrasing
    let statusText = deadlineInfo.text || '';
    if (statusText.toLowerCase().includes('lewat')) {
      statusText = statusText.replace(/lewat\s*/i, 'Terlambat ').replace(/lalu/i, '').trim();
    }
    if (isDone) {
      statusText = 'Selesai';
    }

    const badgeClass = isDone ? 'soft-badge-success deadline-completed' : (deadlineInfo.badgeClass || 'soft-badge-neutral');

    return `
      <div class="assignment-card ${cardDoneClass}" id="task-card-${task.id}">
        <!-- Top Row: Checkbox, Judul Tugas, and Delete Action -->
        <div class="assignment-card-header">
          <button type="button" class="task-check-btn ${checkClass}" onclick="toggleAssignmentTask('${task.id}')" aria-label="${isDone ? 'Tandai tugas belum selesai' : 'Tandai tugas selesai'}" title="${isDone ? 'Tandai tugas belum selesai' : 'Tandai tugas selesai'}">
            ${checkIcon}
          </button>
          
          <div class="assignment-title-wrap">
            <h3 class="assignment-card-title">${escapeHtml(task.title)}</h3>
            ${task.courseName ? `
              <div class="assignment-course-name">
                <i data-lucide="book-open" style="width: 14px; height: 14px; flex-shrink: 0;" aria-hidden="true"></i>
                <span>${escapeHtml(task.courseName)}</span>
              </div>
            ` : ''}
          </div>

          <button type="button" class="btn-task-delete" onclick="deleteAssignmentTask('${task.id}')" aria-label="Hapus tugas ${escapeHtml(task.title)}" title="Hapus tugas">
            <i data-lucide="trash-2" style="width: 18px; height: 18px;" aria-hidden="true"></i>
          </button>
        </div>

        ${descHtml}

        <!-- Middle Row: Status Deadline & Tanggal Pengumpulan -->
        <div class="assignment-deadline-row">
          <span class="badge-deadline ${badgeClass}" title="Status batas pengumpulan">
            <i data-lucide="${isDone ? 'check-circle' : 'clock'}" style="width: 13px; height: 13px; flex-shrink: 0;" aria-hidden="true"></i>
            <span>${escapeHtml(statusText)}</span>
          </span>

          <div class="assignment-due-date-text">
            <i data-lucide="calendar" style="width: 14px; height: 14px; flex-shrink: 0;" aria-hidden="true"></i>
            <span>Batas: ${escapeHtml(formattedDueDateStr)}</span>
          </div>
        </div>

        <!-- Bottom Row: Tipe Pengerjaan & Media Pengumpulan -->
        <div class="assignment-meta-footer">
          <div class="assignment-meta-details">
            <span class="assignment-meta-item">
              <i data-lucide="${typeIcon}" style="width: 13px; height: 13px; flex-shrink: 0;" aria-hidden="true"></i>
              <span>${typeLabel}</span>
            </span>
            <span class="assignment-meta-divider" aria-hidden="true">•</span>
            <span class="assignment-meta-item" title="${escapeHtml(methodLabel)}">
              <i data-lucide="${methodIcon}" style="width: 13px; height: 13px; flex-shrink: 0;" aria-hidden="true"></i>
              <span class="assignment-badge-truncate">${escapeHtml(methodLabel)}</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function renderUpcomingTasksWidget() {
    const container = document.getElementById('home-upcoming-tasks-container');
    const badgeCount = document.getElementById('badge-home-tasks-count');
    if (!container || !window.TRJT_ASSIGNMENTS) return;

    const stats = window.TRJT_ASSIGNMENTS.getAssignmentStats();
    if (badgeCount) {
      badgeCount.innerText = `${stats.pending} Tugas`;
      if (stats.pending === 0) {
        badgeCount.style.background = 'rgba(236, 253, 245, 0.9)';
        badgeCount.style.borderColor = 'rgba(167, 243, 208, 0.8)';
        badgeCount.style.color = '#059669';
      } else {
        badgeCount.style.background = 'rgba(254, 243, 199, 0.9)';
        badgeCount.style.borderColor = 'rgba(251, 191, 36, 0.8)';
        badgeCount.style.color = '#B45309';
      }
    }

    const shortcutTasksBadge = document.getElementById('badge-shortcut-tasks-count');
    if (shortcutTasksBadge) {
      if (stats.pending > 0) {
        shortcutTasksBadge.innerText = `${stats.pending} tugas aktif`;
      } else {
        shortcutTasksBadge.innerText = 'Semua selesai';
      }
    }

    const upcoming = window.TRJT_ASSIGNMENTS.getUpcomingAssignments(3);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="today-class-card" style="padding: 16px; justify-content: center; gap: 10px; cursor: default;">
          <div class="today-status-circle finished" style="width: 32px; height: 32px;">
            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
          </div>
          <div>
            <p style="font-size: 13.5px; font-weight: 700; color: var(--color-primary-navy);">Semua tugas selesai!</p>
            <p style="font-size: 11.5px; color: var(--color-text-secondary); margin-top: 1px;">Tidak ada tanggungan tugas kuliah aktif saat ini.</p>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = upcoming.map((task) => buildAssignmentCardHtml(task, true)).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function toggleAssignmentTask(taskId) {
    if (!window.TRJT_ASSIGNMENTS) return;
    const isNowDone = window.TRJT_ASSIGNMENTS.togglePersonalCompletion(taskId);
    if (isNowDone) {
      showToast('🎉 Tugas ditandai selesai!', 'success');
    } else {
      showToast('↩️ Tugas ditandai belum selesai', 'info');
    }
    renderUpcomingTasksWidget();
    renderWeeklySchedule();
    if (activeCourseTaskCourse) renderCourseAssignmentsList();
    if (document.getElementById('modal-all-assignments')?.classList.contains('is-open')) {
      renderAllAssignmentsList();
    }
  }

  async function deleteAssignmentTask(taskId) {
    if (!window.TRJT_ASSIGNMENTS) return;
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      // Optimistic instant animation and DOM removal
      const cardEl = document.getElementById(`task-card-${taskId}`);
      if (cardEl) {
        cardEl.style.transition = 'all 0.22s ease-out';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.96) translateY(-4px)';
        setTimeout(() => {
          if (cardEl && cardEl.parentNode) cardEl.remove();
        }, 220);
      }

      showToast('🗑️ Tugas berhasil dihapus.', 'info');
      await window.TRJT_ASSIGNMENTS.deleteAssignment(taskId);

      renderUpcomingTasksWidget();
      renderWeeklySchedule();
      if (activeCourseTaskCourse) renderCourseAssignmentsList();
      if (document.getElementById('modal-all-assignments')?.classList.contains('is-open')) {
        renderAllAssignmentsList();
      }
    }
  }

  let lastScheduleStatusSignature = '';

  function tick() {
    const scheduleData = evaluateScheduleState(timeProvider, window.TRJT_SCHEDULE);
    void processH10Reminder(scheduleData).catch(console.error);

    renderHeader(scheduleData);
    renderHeroCard(scheduleData);
    renderTodayTimeline(scheduleData);
    renderPiketBadge();

    // Update in-progress schedule card progress bar without full innerHTML re-render
    if (state.currentTab === 'jadwal') {
      const activeProgressBar = document.querySelector('.schedule-card-progress-fill');
      if (activeProgressBar && scheduleData && scheduleData.inProgressClass) {
        activeProgressBar.style.width = `${scheduleData.progressPercent}%`;
      }

      // Re-render schedule only when class status changes (e.g. starts or finishes)
      const currentSignature = `${scheduleData?.inProgressClass?.id || 'none'}-${scheduleData?.completedCount || 0}`;
      if (lastScheduleStatusSignature && lastScheduleStatusSignature !== currentSignature) {
        renderWeeklySchedule();
      }
      lastScheduleStatusSignature = currentSignature;
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function init() {
    setupEvents();
    applyTheme(state.settings.theme);

    const todayDay = timeProvider.now().getDay();
    state.selectedWeeklyDayId = (todayDay >= 1 && todayDay <= 5) ? todayDay : 1;

    renderWeeklySchedule();
    renderUpcomingTasksWidget();
    renderNotifications();
    renderDosenList();
    renderSettingsUI();
    renderPiketBadge();
    setupDragScroll();
    setupScrollHideBottomNav();
    tick();

    setInterval(tick, 1000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./firebase-messaging-sw.js').catch(() => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.log('SW registration error:', err);
        });
      });
    }
  }

  // ==========================================
  // --- Course Practical Groups Controller ---
  // ==========================================
  let activeCourseGroupKey = 'praktikum-teknik-instalasi-fiber-optik';
  let activeCourseGroupSearch = '';

  function openCourseGroupsModal(courseNameOrKey) {
    activeCourseGroupSearch = '';
    const searchInput = document.getElementById('course-groups-search-input');
    if (searchInput) searchInput.value = '';

    if (courseNameOrKey) {
      const found = window.getCoursePracticalGroups ? window.getCoursePracticalGroups(courseNameOrKey) : null;
      if (found) {
        const groupsObj = window.TRJT_PRACTICAL_GROUPS || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.practicalGroups) || {};
        for (const k in groupsObj) {
          if (groupsObj[k].courseName === found.courseName) {
            activeCourseGroupKey = k;
            break;
          }
        }
      } else if (window.TRJT_PRACTICAL_GROUPS && window.TRJT_PRACTICAL_GROUPS[courseNameOrKey]) {
        activeCourseGroupKey = courseNameOrKey;
      }
    }

    updateCourseGroupsPillsUI();
    renderCourseGroups();

    const modal = document.getElementById('modal-course-groups');
    if (modal) {
      modal.classList.add('is-open');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCourseGroupsModal() {
    const modal = document.getElementById('modal-course-groups');
    if (modal) modal.classList.remove('is-open');
  }

  function selectCourseGroupsTab(courseKey) {
    activeCourseGroupKey = courseKey;
    updateCourseGroupsPillsUI();
    renderCourseGroups();
  }

  function updateCourseGroupsPillsUI() {
    document.querySelectorAll('#course-groups-pills .filter-glass-pill').forEach((pill) => {
      if (pill.getAttribute('data-course-key') === activeCourseGroupKey) {
        pill.classList.add('active');
        if (typeof pill.scrollIntoView === 'function') {
          pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      } else {
        pill.classList.remove('active');
      }
    });
  }

  function renderCourseGroups() {
    const container = document.getElementById('course-groups-list-container');
    const emptyState = document.getElementById('course-groups-empty-state');
    const titleEl = document.getElementById('course-groups-modal-title');
    const metaEl = document.getElementById('course-groups-modal-meta');

    if (!container) return;

    const groupsObj = window.TRJT_PRACTICAL_GROUPS || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.practicalGroups) || {};
    const courseData = groupsObj[activeCourseGroupKey];

    if (!courseData) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-secondary);">Data kelompok tidak ditemukan.</div>';
      return;
    }

    if (titleEl) titleEl.innerText = courseData.courseName;
    if (metaEl) metaEl.innerText = `${courseData.lecturer} · ${courseData.room}`;

    const query = (activeCourseGroupSearch || '').toLowerCase().trim();
    const groups = courseData.groups || [];

    let anyGroupVisible = false;

    const html = groups.map((grp, grpIdx) => {
      const hasMatch = !query || grp.members.some((m) => m.toLowerCase().includes(query));
      if (hasMatch) anyGroupVisible = true;

      const membersHtml = grp.members.map((name, idx) => {
        const isMatched = query && name.toLowerCase().includes(query);
        const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

        return `
          <div class="practical-group-member-item ${isMatched ? 'is-matched' : ''}">
            <span class="member-idx">${idx + 1}.</span>
            <span class="member-avatar-init">${initials}</span>
            <span class="member-name">${escapeHtml(name)}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="practical-group-card" style="${hasMatch ? '' : 'display: none;'}">
          <div class="practical-group-header">
            <div class="practical-group-title-row">
              <span class="badge-group-num">${grp.groupName}</span>
              <span class="badge-group-count">${grp.members.length} Mahasiswa</span>
            </div>
            <button type="button" class="btn-copy-group" onclick="copyGroupMembers('${activeCourseGroupKey}', ${grpIdx}, this)" title="Salin daftar anggota">
              <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
              <span>Salin</span>
            </button>
          </div>
          <div class="practical-group-members">
            ${membersHtml}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    if (emptyState) {
      emptyState.style.display = (!anyGroupVisible && query) ? 'block' : 'none';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function copyGroupMembers(courseKey, groupIdx, btnElement) {
    const groupsObj = window.TRJT_PRACTICAL_GROUPS || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.practicalGroups) || {};
    const courseData = groupsObj[courseKey];
    if (!courseData || !courseData.groups[groupIdx]) return;

    const grp = courseData.groups[groupIdx];
    let copyText = `*${courseData.courseName}*\n*${grp.groupName}* (${grp.members.length} Mahasiswa)\n`;
    copyText += `Dosen: ${courseData.lecturer}\nRuang: ${courseData.room}\n\n`;
    copyText += `Anggota:\n`;
    grp.members.forEach((m, i) => {
      copyText += `${i + 1}. ${m}\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(() => {
        showToast(`✅ Anggota ${grp.groupName} berhasil disalin!`, 'success');
        if (btnElement) {
          const orig = btnElement.innerHTML;
          btnElement.classList.add('copied');
          btnElement.innerHTML = '<i data-lucide="check" style="width: 12px; height: 12px;"></i><span>Tersalin!</span>';
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => {
            btnElement.classList.remove('copied');
            btnElement.innerHTML = orig;
            if (window.lucide) window.lucide.createIcons();
          }, 2000);
        }
      }).catch(() => {
        fallbackCopyText(copyText);
      });
    } else {
      fallbackCopyText(copyText);
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('✅ Daftar anggota berhasil disalin!', 'success');
    } catch (e) {
      prompt('Salin teks di bawah ini:', text);
    }
    document.body.removeChild(textarea);
  }

  // Export engine and modals for testing & global triggers
  window.evaluateScheduleState = evaluateScheduleState;
  window.processH10Reminder = processH10Reminder;
  window.triggerH10Notification = triggerH10Notification;
  window.showToast = showToast;
  window.renderSettingsUI = renderSettingsUI;
  window.openPiketModal = openPiketModal;
  window.closePiketModal = closePiketModal;
  window.renderPiketModal = renderPiketModal;
  window.renderPiketBadge = renderPiketBadge;
  window.getCurrentWeekPiketInfo = getCurrentWeekPiketInfo;

  window.openAddAssignmentModal = openAddAssignmentModal;
  window.closeAddAssignmentModal = closeAddAssignmentModal;
  window.selectTaskType = selectTaskType;
  window.handleSaveAssignment = handleSaveAssignment;
  window.openCourseAssignmentsModal = openCourseAssignmentsModal;
  window.closeCourseAssignmentsModal = closeCourseAssignmentsModal;
  window.filterCourseTasks = filterCourseTasks;
  window.renderCourseAssignmentsList = renderCourseAssignmentsList;
  window.openAllAssignmentsModal = openAllAssignmentsModal;
  window.closeAllAssignmentsModal = closeAllAssignmentsModal;
  window.filterAllTasks = filterAllTasks;
  window.renderAllAssignmentsList = renderAllAssignmentsList;
  window.renderUpcomingTasksWidget = renderUpcomingTasksWidget;
  window.toggleAssignmentTask = toggleAssignmentTask;
  window.deleteAssignmentTask = deleteAssignmentTask;

  window.openCourseGroupsModal = openCourseGroupsModal;
  window.closeCourseGroupsModal = closeCourseGroupsModal;
  window.selectCourseGroupsTab = selectCourseGroupsTab;
  window.renderCourseGroups = renderCourseGroups;
  window.copyGroupMembers = copyGroupMembers;
  window.jumpToCourseGroupsFromTaskModal = jumpToCourseGroupsFromTaskModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
