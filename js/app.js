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
  const CURRENT_APP_VERSION = '4.7';
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

  // --- Production UI Renderers (Glassmorphism White-Blue UI) ---
  function renderHeader(data) {
    if (!data) return;
    const greetingEl = document.getElementById('header-greeting');
    const dateEl = document.getElementById('header-date');
    const chipContainer = document.getElementById('beranda-status-chip-container');

    if (greetingEl) greetingEl.innerText = getGreeting(data.now.getHours());
    if (dateEl) dateEl.innerText = formatFormattedDate(data.now);

    if (chipContainer) {
      if (data.inProgressClass) {
        chipContainer.innerHTML = `<span class="status-pill-chip in-progress"><i data-lucide="play" style="width: 12px; height: 12px;"></i> Sedang berlangsung</span>`;
      } else if (data.isH10) {
        chipContainer.innerHTML = `<span class="status-pill-chip starting-soon"><i data-lucide="bell" style="width: 12px; height: 12px;"></i> 10 menit lagi</span>`;
      } else if (data.totalCount > 0 && data.completedCount === data.totalCount) {
        chipContainer.innerHTML = `<span class="status-pill-chip"><i data-lucide="check" style="width: 12px; height: 12px;"></i> Semua kelas hari ini selesai</span>`;
      } else if (data.nextUpcomingClass) {
        chipContainer.innerHTML = `<span class="status-pill-chip in-progress"><i data-lucide="clock" style="width: 12px; height: 12px;"></i> Belum dimulai</span>`;
      } else {
        chipContainer.innerHTML = `<span class="status-pill-chip neutral"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> Libur / Tidak ada kelas</span>`;
      }
    }
  }

  function renderHeroCard(data) {
    const heroContainer = document.getElementById('hero-card-container');
    if (!heroContainer || !data) return;

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
        <div class="hero-glass-card" onclick="document.querySelector('[data-tab=jadwal]').click()" style="cursor: pointer;">
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

        let circleClass = '';
        let iconName = 'clock';

        if (isActive) {
          circleClass = 'ongoing';
          iconName = 'play';
        } else if (isPast) {
          circleClass = 'finished';
          iconName = 'check';
        }

        return `
          <div class="today-class-card" onclick="window.openCourseMaterialsModal('${item.id}', '${item.courseName.replace(/'/g, "\\'")}', '${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName).replace(/'/g, "\\'")}', '${item.roomCode}')">
            <div class="today-card-left">
              <div class="today-status-circle ${circleClass}">
                <i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i>
              </div>
              <div class="today-card-info">
                <span class="today-card-time">${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}</span>
                <span class="today-card-title">${item.courseName}</span>
              </div>
            </div>
            <i data-lucide="chevron-right" class="today-card-chevron"></i>
          </div>
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
      return;
    }

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

        return `
          <div class="schedule-glass-card">
            <div class="schedule-top-meta-row">
              <div class="schedule-time-badge">
                <i data-lucide="clock"></i>
                <span>${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}</span>
              </div>
              <div class="schedule-room-badge">
                <i data-lucide="map-pin"></i>
                <span>${roomDisplay}</span>
              </div>
            </div>
            
            <h3 class="schedule-subject-heading">${item.courseName}</h3>
            
            <div class="schedule-lecturer-row">
              <div class="schedule-lecturer-info">
                <i data-lucide="user"></i>
                <span>${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
              </div>
              <button class="btn-schedule-mat" onclick="window.openCourseMaterialsModal('${item.id}', '${item.courseName.replace(/'/g, "\\'")}', '${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName).replace(/'/g, "\\'")}', '${item.roomCode}')">
                <i data-lucide="folder" style="width: 13px; height: 13px;"></i> Materi
              </button>
            </div>
          </div>
        `;
      })
      .join('');
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

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let iconHtml = '<i data-lucide="info" style="width: 18px; height: 18px; flex-shrink: 0;"></i>';
    if (type === 'success') {
      iconHtml = '<i data-lucide="check-circle" style="width: 18px; height: 18px; flex-shrink: 0; color: #4ADE80;"></i>';
    } else if (type === 'error') {
      iconHtml = '<i data-lucide="alert-circle" style="width: 18px; height: 18px; flex-shrink: 0; color: #F87171;"></i>';
    }

    toast.innerHTML = `${iconHtml}<span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 320);
    }, 4000);
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

    // Auto-hide bell button on Notifikasi view to avoid redundancy
    const headerBell = document.getElementById('btn-header-bell');
    if (headerBell) {
      headerBell.style.display = (tabId === 'notifikasi') ? 'none' : 'inline-flex';
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
    document.querySelectorAll('.btn-piket-action, #btn-open-piket-modal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openPiketModal();
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

  // --- Daftar Piket Modal & Controller System ---
  let activePiketFilter = 'all';

  function getTodayPiketGroup() {
    const todayDay = timeProvider.now().getDay(); // 0: Min, 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab
    const piketList = window.TRJT_PIKET || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.piket) || [];
    return piketList.find(p => p.dayOfWeek === todayDay) || null;
  }

  function renderPiketBadge() {
    const todayPiket = getTodayPiketGroup();
    const badgeText = todayPiket ? `Hari ini: ${todayPiket.groupName}` : 'Libur piket';

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
    const todayPiket = getTodayPiketGroup();
    const todayDay = timeProvider.now().getDay();

    // 1. Render Today's Banner
    if (bannerEl) {
      if (todayPiket) {
        bannerEl.innerHTML = `
          <div class="piket-today-banner-header">
            <span class="piket-today-badge">
              <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> Bertugas Hari Ini (${todayPiket.dayName})
            </span>
            <span class="piket-today-pill">${todayPiket.groupName}</span>
          </div>
          <p class="piket-today-group-name">Petugas Piket Hari Ini:</p>
          <div class="piket-today-members-list">
            ${todayPiket.members.map((name, idx) => `
              <span class="piket-member-chip">
                <span class="piket-member-chip-num">${idx + 1}</span>
                <span>${escapeHtml(name)}</span>
              </span>
            `).join('')}
          </div>
        `;
      } else {
        bannerEl.innerHTML = `
          <div class="piket-today-banner-header">
            <span class="piket-today-badge" style="color: var(--color-text-secondary);">
              <i data-lucide="coffee" style="width: 14px; height: 14px;"></i> Akhir Pekan / Libur
            </span>
          </div>
          <p class="piket-today-group-name" style="font-size: 13px; font-weight: 500; color: var(--color-text-secondary);">
            Tidak ada jadwal piket kelas untuk hari ini. Jadwal piket aktif Senin s/d Jumat.
          </p>
        `;
      }
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
          const isToday = g.dayOfWeek === todayDay;
          return `
            <div class="piket-group-card ${isToday ? 'is-today' : ''}">
              <div class="piket-group-header">
                <div class="piket-group-title-wrap">
                  <div class="piket-roman-box">${g.groupRoman}</div>
                  <div>
                    <h3 class="piket-group-title">${escapeHtml(g.groupName)}</h3>
                    <span class="piket-day-chip">Hari ${g.dayName}</span>
                  </div>
                </div>
                ${isToday ? `<span class="piket-today-pill">Hari Ini</span>` : ''}
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

    if (window.lucide) window.lucide.createIcons();
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
    if (window.lucide) window.lucide.createIcons();
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

    // Update checkmark in modal
    ['light', 'dark', 'system'].forEach((mode) => {
      const checkEl = document.getElementById(`theme-check-${mode}`);
      if (checkEl) {
        checkEl.style.display = (mode === themeName) ? 'block' : 'none';
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

  function renderDosenList(query = activeDosenSearch) {
    activeDosenSearch = query;
    const container = document.getElementById('dosen-cards-container');
    if (!container) return;

    const dosenList = window.TRJT_DOSEN || (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.dosen) || [];

    const q = (query || '').toLowerCase().trim();
    const filtered = dosenList.filter((d) => {
      if (!q) return true;
      const matchName = (d.name || '').toLowerCase().includes(q);
      const matchNip = (d.nip || '').toLowerCase().includes(q);
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
        return `
          <div class="dosen-glass-card">
            <div class="dosen-card-top">
              <div class="dosen-avatar-squircle">${d.initial}</div>
              <div class="dosen-info-wrap">
                <h3 class="dosen-name-heading">${escapeHtml(d.name)}</h3>
                <span class="dosen-nip-badge">
                  <i data-lucide="id-card"></i>
                  <span>NIP: ${escapeHtml(d.nip)}</span>
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
    activeMaterialCourse = { scheduleId, courseName, lecturer, room };
    activeMaterialFilter = 'all';
    activeMaterialSearch = '';

    const modal = document.getElementById('modal-course-materials');
    const titleEl = document.getElementById('mat-modal-course-name');
    const metaEl = document.getElementById('mat-modal-course-meta');
    const searchInput = document.getElementById('mat-search-input');

    if (titleEl) titleEl.innerText = courseName;
    if (metaEl) metaEl.innerText = `${lecturer || 'Dosen Pengampu'} · Ruang ${room || '-'}`;
    if (searchInput) searchInput.value = '';

    const btnDriveFolder = document.getElementById('btn-open-course-drive-folder');
    if (btnDriveFolder && window.TRJT_DRIVE) {
      const folderInfo = await window.TRJT_DRIVE.getFolderForCourse(courseName || scheduleId);
      if (folderInfo && folderInfo.driveFolderId) {
        btnDriveFolder.href = `https://drive.google.com/drive/folders/${folderInfo.driveFolderId}?usp=drive_link`;
      } else {
        btnDriveFolder.href = `https://drive.google.com/drive/folders/1W7F5rWsNNq-nsLUF1emnOj4eJsYSShzW?usp=drive_link`;
      }
    }

    document.querySelectorAll('#modal-course-materials .filter-glass-pill').forEach((pill) => {
      if (pill.getAttribute('data-filter') === 'all') pill.classList.add('active');
      else pill.classList.remove('active');
    });

    await renderCourseMaterialsList();

    if (modal) modal.classList.add('is-open');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCourseMaterialsModal() {
    const modal = document.getElementById('modal-course-materials');
    if (modal) modal.classList.remove('is-open');
  }

  async function renderCourseMaterialsList() {
    const container = document.getElementById('mat-list-container');
    const emptyState = document.getElementById('mat-empty-state');
    const countAll = document.getElementById('count-mat-all');
    const countPhoto = document.getElementById('count-mat-photo');
    const countDoc = document.getElementById('count-mat-doc');

    if (!container || !activeMaterialCourse) return;

    let items = [];
    if (window.TRJT_MATERIALS) {
      items = await window.TRJT_MATERIALS.getMaterialsForCourse(activeMaterialCourse.courseName);
    }

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

  function tick() {
    const scheduleData = evaluateScheduleState(timeProvider, window.TRJT_SCHEDULE);
    void processH10Reminder(scheduleData).catch(console.error);

    renderHeader(scheduleData);
    renderHeroCard(scheduleData);
    renderTodayTimeline(scheduleData);
    renderPiketBadge();

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
    renderNotifications();
    renderDosenList();
    renderSettingsUI();
    renderPiketBadge();
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

  // Export engine for developer testing
  window.evaluateScheduleState = evaluateScheduleState;
  window.processH10Reminder = processH10Reminder;
  window.triggerH10Notification = triggerH10Notification;
  window.showToast = showToast;
  window.renderSettingsUI = renderSettingsUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
