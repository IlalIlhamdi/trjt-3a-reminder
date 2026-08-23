/**
 * TRJT 3A REMINDER — Core Application Controller v2.2
 * Production Mode: Clean Asia/Jakarta Time Provider & Official Schedule Engine
 */

(function () {
  'use strict';

  // Instantiate time provider (RealJakartaTimeProvider in production)
  const timeProvider = window.appTimeProvider || new (window.RealJakartaTimeProvider || function () {
    this.now = function () { return new Date(); };
    this.isSimulated = function () { return false; };
  })();

  // --- Application State ---
  const state = {
    currentTab: 'beranda',
    selectedWeeklyDayId: 1, // Default Senin (1)
    notifications: [...(window.TRJT_SCHEDULE?.initialNotifications || [])],
    settings: {
      h10Alert: true,
      soundEnabled: true,
      vibrationEnabled: true
    }
  };

  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsMap = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function getGreeting(hour) {
    if (hour >= 4 && hour < 11) return 'Selamat pagi 👋';
    if (hour >= 11 && hour < 15) return 'Selamat siang 👋';
    if (hour >= 15 && hour < 18) return 'Selamat sore 👋';
    return 'Selamat malam 👋';
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

  // --- Production UI Renderers ---
  function renderHeader(data) {
    if (!data) return;
    const greetingEl = document.getElementById('header-greeting');
    const dateEl = document.getElementById('header-date');
    if (greetingEl) greetingEl.innerHTML = `${getGreeting(data.now.getHours())}`;
    if (dateEl) dateEl.innerText = formatFormattedDate(data.now);
  }

  function renderHeroCard(data) {
    const heroContainer = document.getElementById('hero-card-container');
    if (!heroContainer || !data) return;

    // Case 1: In Progress
    if (data.inProgressClass) {
      const item = data.inProgressClass;
      heroContainer.innerHTML = `
        <div class="hero-class-card state-in-progress">
          <div class="hero-card-header">
            <div class="hero-label-badge in-progress">
              <span class="pulse-indicator"></span>
              Sedang Berlangsung
            </div>
            <span class="room-badge">${item.roomCode}</span>
          </div>

          <div>
            <h2 class="hero-subject-name">${item.courseName}</h2>
            <div class="hero-lecturer-name">
              <i data-lucide="user-round" style="width: 16px; height: 16px;"></i>
              ${getLecturerDisplay(item.lecturerName)}
            </div>
          </div>

          <div class="hero-pill-bar">
            <div class="pill-item">
              <i data-lucide="clock" style="width: 15px; height: 15px;"></i>
              ${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}
            </div>
            <span class="pill-divider"></span>
            <div class="pill-item">
              <i data-lucide="map-pin" style="width: 15px; height: 15px;"></i>
              ${getRoomDisplay(item.roomCode, item.roomName)}
            </div>
          </div>

          <div class="hero-countdown-panel">
            <div class="countdown-sub-label">Selesai dalam</div>
            <div class="countdown-digits-text">${formatCountdown(data.countdownMs)}</div>
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

      heroContainer.innerHTML = `
        <div class="hero-class-card ${isH10 ? 'state-h10' : ''}">
          <div class="hero-card-header">
            <div class="hero-label-badge ${isH10 ? 'h10' : ''}">
              ${isH10 ? '<i data-lucide="bell" style="width: 14px; height: 14px;"></i> 10 MENIT LAGI' : 'KELAS BERIKUTNYA'}
            </div>
            <span class="room-badge">${item.roomCode}</span>
          </div>

          <div>
            <h2 class="hero-subject-name">${item.courseName}</h2>
            <div class="hero-lecturer-name">
              <i data-lucide="user-round" style="width: 16px; height: 16px;"></i>
              ${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}
            </div>
          </div>

          <div class="hero-pill-bar">
            <div class="pill-item">
              <i data-lucide="clock" style="width: 15px; height: 15px;"></i>
              ${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}
            </div>
            <span class="pill-divider"></span>
            <div class="pill-item">
              <i data-lucide="map-pin" style="width: 15px; height: 15px;"></i>
              ${getRoomDisplay(item.roomCode, item.roomName)}
            </div>
          </div>

          <div class="hero-countdown-panel">
            <div class="countdown-sub-label">Mulai dalam</div>
            <div class="countdown-digits-text">${formatCountdown(data.countdownMs)}</div>
          </div>
        </div>
      `;
      return;
    }

    // Case 3: Empty State (Weekend or Finished Today)
    heroContainer.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon-circle">
          <i data-lucide="calendar" style="width: 30px; height: 30px;"></i>
        </div>
        <h2 class="empty-title">Tidak Ada Kelas Hari Ini</h2>
        <p class="empty-desc">
          Nikmati waktu luangmu. Jadwal berikutnya sudah kami siapkan.
        </p>
        ${
          data.nextDayUpcomingClass
            ? `
          <div class="nested-highlight-card" onclick="document.querySelector('[data-tab=jadwal]').click()">
            <div class="nested-content">
              <span class="nested-badge">KELAS BERIKUTNYA</span>
              <span class="nested-time">${data.nextDayName} · ${data.nextDayUpcomingClass.startTime.replace(':', '.')}</span>
              <span class="nested-subject">${data.nextDayUpcomingClass.courseName}</span>
              <span class="nested-meta">${data.nextDayUpcomingClass.roomCode} · ${getLecturerDisplay(data.nextDayUpcomingClass.lecturerName)}</span>
            </div>
            <i data-lucide="chevron-right" style="width: 20px; height: 20px; color: var(--color-primary-blue);"></i>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  function renderQuickStats(data) {
    if (!data) return;
    const totalEl = document.getElementById('quick-stat-total');
    const completedEl = document.getElementById('quick-stat-completed');
    if (totalEl) totalEl.innerText = `${data.totalCount} Kelas`;
    if (completedEl) completedEl.innerText = `${data.completedCount} / ${data.totalCount}`;
  }

  function renderTodayTimeline(data) {
    const timelineContainer = document.getElementById('today-timeline-container');
    if (!timelineContainer || !data) return;

    if (data.todayClasses.length === 0) {
      timelineContainer.innerHTML = `
        <div class="empty-state-card" style="padding: 24px; box-shadow: var(--shadow-subtle);">
          <i data-lucide="coffee" style="width: 28px; height: 28px; color: var(--color-secondary-text);"></i>
          <p style="font-size: var(--font-size-body); color: var(--color-secondary-text); margin-top: 4px;">Tidak ada agenda perkuliahan hari ini.</p>
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

        let statusClass = '';
        let statusBadge = '';

        if (isActive) {
          statusClass = 'is-ongoing';
          statusBadge = `<span class="soft-badge-success">● Sedang Berlangsung</span>`;
        } else if (isPast) {
          statusClass = 'is-finished';
          statusBadge = `<span class="soft-badge-neutral">Selesai</span>`;
        } else {
          statusBadge = `<span class="soft-badge-info">Akan Datang</span>`;
        }

        return `
          <div class="timeline-item">
            <div class="timeline-time-block">
              <span class="timeline-time-start">${item.startTime.replace(':', '.')}</span>
              <span class="timeline-time-end">${item.endTime.replace(':', '.')}</span>
            </div>
            <div class="timeline-card ${statusClass}">
              <div class="timeline-subject">${item.courseName}</div>
              <div class="timeline-lecturer">
                <i data-lucide="user-round" style="width: 14px; height: 14px;"></i>
                ${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}
              </div>
              <div class="timeline-footer">
                <span class="room-badge">
                  <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
                  ${getRoomDisplay(item.roomCode, item.roomName)}
                </span>
                ${statusBadge}
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderWeeklySchedule() {
    const listContainer = document.getElementById('weekly-cards-container');
    if (!listContainer || !window.TRJT_SCHEDULE) return;

    const dayClasses = window.TRJT_SCHEDULE.classes
      .filter((c) => c.dayOfWeek === state.selectedWeeklyDayId)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    if (dayClasses.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state-card" style="padding: 32px 20px;">
          <i data-lucide="sun" style="width: 32px; height: 32px; color: var(--color-primary-blue);"></i>
          <p style="font-weight: 700; font-size: var(--font-size-base); color: var(--color-primary-text);">Tidak ada jadwal kuliah</p>
          <p style="font-size: var(--font-size-body); color: var(--color-secondary-text);">Hari ini libur / tidak ada perkuliahan.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = dayClasses
      .map((item) => {
        return `
          <div class="schedule-card">
            <div class="schedule-card-top">
              <span class="schedule-time-label">
                <i data-lucide="clock" style="width: 15px; height: 15px;"></i>
                ${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}
              </span>
              <span class="room-badge">
                <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
                ${item.roomCode}
              </span>
            </div>
            
            <h3 class="schedule-course-title">${item.courseName}</h3>
            
            <div class="schedule-lecturer-name">
              <i data-lucide="user-round" style="width: 14px; height: 14px;"></i>
              ${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}
            </div>

            <div class="schedule-card-bottom">
              <span>${item.roomName ? item.roomName : 'Gedung III Teknik Elektro Lt. 2'}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderNotifications() {
    const container = document.getElementById('notif-list-container');
    const badgeEl = document.getElementById('notif-unread-count-badge');
    const headerDot = document.getElementById('header-unread-dot');
    const navDot = document.getElementById('nav-notif-dot');
    if (!container) return;

    const unreadCount = state.notifications.filter((n) => !n.read).length;
    if (badgeEl) {
      badgeEl.innerText = unreadCount > 0 ? `${unreadCount} Baru` : 'Semua Terbaca';
      badgeEl.style.display = 'inline-block';
      badgeEl.className = unreadCount > 0 ? 'soft-badge-info' : 'soft-badge-neutral';
    }
    if (headerDot) {
      headerDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    if (navDot) {
      navDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    if (state.notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 44px 20px;">
          <div class="empty-icon-circle">
            <i data-lucide="bell-off" style="width: 28px; height: 28px; color: var(--color-muted-text);"></i>
          </div>
          <p style="font-weight: 700; font-size: var(--font-size-base); color: var(--color-primary-text); margin-top: 12px;">Belum Ada Notifikasi</p>
          <p style="font-size: var(--font-size-body); color: var(--color-secondary-text); margin-top: 4px;">Pemberitahuan pengingat H-10 dan info jadwal kelas TRJT 3A akan tampil di sini.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.notifications
      .map((item, index) => {
        const isH10 = item.type === 'h10';
        const isCancel = item.type === 'cancel';
        const typeClass = isH10 ? 'type-h10' : (isCancel ? 'type-cancel' : 'type-info');
        const iconName = isH10 ? 'bell' : (isCancel ? 'alert-triangle' : 'map-pin');
        const tagLabel = isH10 ? '🔔 Pengingat H-10' : (isCancel ? '⚠️ Dibatalkan' : '📍 Info Ruang');

        return `
          <div class="notif-card ${item.read ? 'read' : 'unread'}" data-index="${index}">
            <div class="notif-circle-icon ${typeClass}">
              <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="notif-body">
              <div class="notif-top-row">
                <span class="notif-badge-tag ${typeClass}">
                  ${tagLabel}
                </span>
                <span class="notif-time-text">
                  ${!item.read ? '<span class="unread-indicator-dot"></span>' : ''}
                  ${item.time}
                </span>
              </div>
              <h3 class="notif-course-title">${item.subject}</h3>
              ${item.lecturer ? `
                <div class="notif-lecturer-row">
                  <i data-lucide="user-round" style="width: 13px; height: 13px; color: var(--color-primary-blue);"></i>
                  <span>${item.lecturer}</span>
                </div>` : ''
              }
              <div class="notif-footer-row">
                <span class="notif-meta-pill">
                  <i data-lucide="clock" style="width: 12px; height: 12px; color: var(--color-primary-blue);"></i>
                  ${item.meta}
                </span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.notif-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = card.getAttribute('data-index');
        if (idx !== null && state.notifications[idx]) {
          state.notifications[idx].read = true;
          renderNotifications();
          if (window.lucide) window.lucide.createIcons();
        }
      });
    });
  }

  function triggerH10Notification(courseName, roomCode, startTime, lecturerName) {
    // Only internal mock push if not simulated
    const newNotif = {
      id: `notif-${Date.now()}`,
      type: 'h10',
      title: 'Kelas 10 Menit Lagi',
      subject: courseName,
      lecturer: getLecturerDisplay(lecturerName),
      meta: `${startTime.replace(':', '.')} · ${roomCode}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.'),
      read: false
    };
    state.notifications.unshift(newNotif);
    renderNotifications();

    if (!timeProvider.isSimulated() && 'Notification' in window && Notification.permission === 'granted' && state.settings.h10Alert) {
      new Notification(`🔔 Kelas 10 Menit Lagi: ${courseName}`, {
        body: `Ruangan: ${roomCode} | Dosen: ${getLecturerDisplay(lecturerName)} | Jam: ${startTime}`,
        icon: './assets/icons/app-icon.svg',
        vibrate: [200, 100, 200]
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function switchTab(tabId) {
    state.currentTab = tabId;

    document.querySelectorAll('.nav-item').forEach((btn) => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.view-section').forEach((view) => {
      if (view.id === `view-${tabId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    const greetingWrap = document.querySelector('.header-greeting-wrap');
    if (greetingWrap) {
      greetingWrap.style.display = (tabId === 'beranda') ? 'flex' : 'none';
    }

    if (tabId === 'jadwal') {
      renderWeeklySchedule();
    } else if (tabId === 'notifikasi') {
      renderNotifications();
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

    // Weekly Segmented Control
    document.querySelectorAll('.segmented-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.segmented-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedWeeklyDayId = parseInt(btn.getAttribute('data-day'), 10);
        renderWeeklySchedule();
        if (window.lucide) window.lucide.createIcons();
      });
    });

    // Mark all notifications read
    const markAllReadBtn = document.getElementById('btn-mark-all-read');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        state.notifications.forEach((n) => (n.read = true));
        renderNotifications();
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Switches
    const notifSwitch = document.getElementById('switch-h10');
    if (notifSwitch) {
      notifSwitch.addEventListener('change', (e) => {
        state.settings.h10Alert = e.target.checked;
        if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission();
        }
      });
    }
  }

  function tick() {
    const scheduleData = evaluateScheduleState(timeProvider, window.TRJT_SCHEDULE);
    renderHeader(scheduleData);
    renderHeroCard(scheduleData);
    renderQuickStats(scheduleData);
    renderTodayTimeline(scheduleData);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function init() {
    setupEvents();

    const todayDay = timeProvider.now().getDay();
    state.selectedWeeklyDayId = (todayDay >= 1 && todayDay <= 5) ? todayDay : 1;
    const initialBtn = document.querySelector(`.segmented-btn[data-day="${state.selectedWeeklyDayId}"]`);
    if (initialBtn) {
      document.querySelectorAll('.segmented-btn').forEach((b) => b.classList.remove('active'));
      initialBtn.classList.add('active');
    }

    renderWeeklySchedule();
    renderNotifications();
    tick();

    setInterval(tick, 1000);

    setTimeout(() => {
      const splash = document.getElementById('app-splash');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        setTimeout(() => splash.remove(), 450);
      }
    }, 600);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('SW registration error:', err);
      });
    }
  }

  // Export engine for developer testing
  window.evaluateScheduleState = evaluateScheduleState;
  window.triggerH10Notification = triggerH10Notification;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
