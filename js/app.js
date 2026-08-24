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
    settings: {
      h10Alert: localStorage.getItem('trjt_h10_enabled') === 'true',
      soundEnabled: localStorage.getItem('trjt_sound_enabled') !== 'false',
      vibrationEnabled: localStorage.getItem('trjt_vibration_enabled') !== 'false'
    }
  };

  function saveNotificationsState() {
    try {
      localStorage.setItem('trjt_notifications_v3', JSON.stringify(state.notifications));
    } catch (e) {}
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
              Sedang berlangsung
            </div>
            <span class="room-badge">${item.roomCode}</span>
          </div>

          <div>
            <h2 class="hero-subject-name">${item.courseName}</h2>
            <div class="hero-lecturer-name">
              <i data-lucide="user-round" style="width: 14px; height: 14px;"></i>
              ${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}
            </div>
          </div>

          <div class="hero-pill-bar">
            <div class="pill-item">
              <i data-lucide="clock" style="width: 13px; height: 13px;"></i>
              ${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}
            </div>
            <span class="pill-divider"></span>
            <div class="pill-item">
              <i data-lucide="map-pin" style="width: 13px; height: 13px;"></i>
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
              ${isH10 ? '<i data-lucide="bell" style="width: 13px; height: 13px;"></i> 10 menit lagi' : 'Kelas berikutnya'}
            </div>
            <span class="room-badge">${item.roomCode}</span>
          </div>

          <div>
            <h2 class="hero-subject-name">${item.courseName}</h2>
            <div class="hero-lecturer-name">
              <i data-lucide="user-round" style="width: 14px; height: 14px;"></i>
              ${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}
            </div>
          </div>

          <div class="hero-pill-bar">
            <div class="pill-item">
              <i data-lucide="clock" style="width: 13px; height: 13px;"></i>
              ${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}
            </div>
            <span class="pill-divider"></span>
            <div class="pill-item">
              <i data-lucide="map-pin" style="width: 13px; height: 13px;"></i>
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

    // Case 3 (B): All Classes Finished Today (e.g. 2 of 2 Completed)
    if (data.totalCount > 0 && data.completedCount === data.totalCount) {
      heroContainer.innerHTML = `
        <div class="empty-state-card" style="padding: 16px 14px; gap: 8px;">
          <div class="empty-icon-circle success" style="width: 44px; height: 44px; margin-bottom: 0;">
            <i data-lucide="check-circle-2" style="width: 24px; height: 24px; color: var(--color-status-in-progress);"></i>
          </div>
          <h2 class="empty-title" style="font-size: 16px; margin: 0;">Semua kelas hari ini selesai</h2>
          ${
            data.nextDayUpcomingClass
              ? `
            <div class="nested-highlight-card" style="margin-top: 4px; padding: 10px 12px;" onclick="document.querySelector('[data-tab=jadwal]').click()">
              <div class="nested-content">
                <span class="nested-badge">Kelas berikutnya</span>
                <span class="nested-time">${data.nextDayName} · ${data.nextDayUpcomingClass.startTime.replace(':', '.')}</span>
                <span class="nested-subject">${data.nextDayUpcomingClass.courseName}</span>
                <span class="nested-meta">${data.nextDayUpcomingClass.roomCode} · ${getLecturerDisplay(data.nextDayUpcomingClass.lecturerName, data.nextDayUpcomingClass.lecturerCode, data.nextDayUpcomingClass.courseName)}</span>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
      return;
    }

    // Case 4 (A): No Classes Today (Weekend or Academic Holiday)
    heroContainer.innerHTML = `
      <div class="empty-state-card" style="padding: 18px 14px; gap: 8px;">
        <div class="empty-icon-circle" style="width: 44px; height: 44px; margin-bottom: 0;">
          <i data-lucide="calendar" style="width: 24px; height: 24px; color: var(--color-primary-blue);"></i>
        </div>
        <h2 class="empty-title" style="font-size: 16px; margin: 0;">Tidak ada kelas hari ini</h2>
        <p class="empty-desc" style="font-size: 12px; margin: 0; color: var(--color-secondary-text);">
          Nikmati waktu luangmu. Jadwal berikutnya sudah kami siapkan.
        </p>
        ${
          data.nextDayUpcomingClass
            ? `
          <div class="nested-highlight-card" style="margin-top: 4px; padding: 10px 12px;" onclick="document.querySelector('[data-tab=jadwal]').click()">
            <div class="nested-content">
              <span class="nested-badge">Kelas berikutnya</span>
              <span class="nested-time">${data.nextDayName} · ${data.nextDayUpcomingClass.startTime.replace(':', '.')}</span>
              <span class="nested-subject">${data.nextDayUpcomingClass.courseName}</span>
              <span class="nested-meta">${data.nextDayUpcomingClass.roomCode} · ${getLecturerDisplay(data.nextDayUpcomingClass.lecturerName, data.nextDayUpcomingClass.lecturerCode, data.nextDayUpcomingClass.courseName)}</span>
            </div>
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
    if (completedEl) {
      completedEl.innerText = `${data.completedCount} / ${data.totalCount}`;
      completedEl.style.color = (data.completedCount > 0 && data.completedCount === data.totalCount) 
        ? 'var(--color-status-in-progress)' 
        : 'var(--color-primary-blue)';
    }
  }

  function renderTodayTimeline(data) {
    const timelineContainer = document.getElementById('today-timeline-container');
    if (!timelineContainer || !data) return;

    if (data.todayClasses.length === 0) {
      timelineContainer.innerHTML = `
        <div class="empty-state-card" style="padding: 24px; box-shadow: var(--shadow-subtle);">
          <i data-lucide="coffee" style="width: 26px; height: 26px; color: var(--color-secondary-text);"></i>
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
          statusBadge = `<span class="timeline-status-tag ongoing">● Berlangsung</span>`;
        } else if (isPast) {
          statusClass = 'is-finished';
          statusBadge = `<span class="timeline-status-tag finished">Selesai</span>`;
        } else {
          statusBadge = `<span class="timeline-status-tag upcoming">Akan datang</span>`;
        }

        const cleanRoomName = item.roomName 
          ? item.roomName.split('(')[0].replace('Gedung III Teknik Elektro Lt. 2', 'Gd. III Lt. 2').trim()
          : '';

        return `
          <div class="timeline-item">
            <div class="timeline-time-block">
              <span class="timeline-time-start">${item.startTime.replace(':', '.')}</span>
              <span class="timeline-time-end">${item.endTime.replace(':', '.')}</span>
            </div>
            <div class="timeline-card ${statusClass}">
              <div class="timeline-card-header">
                <h3 class="timeline-subject">${item.courseName}</h3>
                ${statusBadge}
              </div>
              <div class="timeline-lecturer">
                <i data-lucide="user-round" style="width: 13px; height: 13px;"></i>
                <span>${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
              </div>
              <div class="timeline-card-bottom">
                <span class="room-badge" title="${item.roomName ? item.roomName : item.roomCode}">
                  <i data-lucide="map-pin" style="width: 11px; height: 11px;"></i>
                  ${item.roomCode}${cleanRoomName ? ` · ${cleanRoomName}` : ''}
                </span>
                <button class="btn-course-material" onclick="window.openCourseMaterialsModal('${item.id}', '${item.courseName.replace(/'/g, "\\'")}', '${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName).replace(/'/g, "\\'")}', '${item.roomCode}')">
                  <i data-lucide="folder" style="width: 12px; height: 12px;"></i> Materi
                </button>
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
        <div class="empty-state-card" style="padding: 24px 16px;">
          <i data-lucide="sun" style="width: 28px; height: 28px; color: var(--color-primary-blue);"></i>
          <p style="font-weight: 700; font-size: 14px; color: var(--color-primary-text);">Tidak ada jadwal kuliah</p>
          <p style="font-size: 12px; color: var(--color-secondary-text);">Hari ini libur / tidak ada agenda perkuliahan.</p>
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
                <i data-lucide="clock" style="width: 13px; height: 13px;"></i>
                ${item.startTime.replace(':', '.')} – ${item.endTime.replace(':', '.')}
              </span>
              <span class="room-badge">
                <i data-lucide="map-pin" style="width: 11px; height: 11px;"></i>
                ${item.roomCode}
              </span>
            </div>
            
            <h3 class="schedule-course-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.courseName}</h3>
            
            <div class="schedule-lecturer-name">
              <i data-lucide="user-round" style="width: 13px; height: 13px;"></i>
              <span>${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName)}</span>
            </div>

            <div class="schedule-card-bottom" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
              <span style="font-size: 11px; color: #475569; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 80px);">${item.roomName ? item.roomName.replace('Gedung III Teknik Elektro Lt. 2', 'Gd. III Teknik Elektro Lt. 2') : 'Gedung III Teknik Elektro Lt. 2'}</span>
              <button class="btn-course-material" onclick="window.openCourseMaterialsModal('${item.id}', '${item.courseName.replace(/'/g, "\\'")}', '${getLecturerDisplay(item.lecturerName, item.lecturerCode, item.courseName).replace(/'/g, "\\'")}', '${item.roomCode}')">
                <i data-lucide="folder" style="width: 12px; height: 12px;"></i> Materi
              </button>
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
    const markAllReadBtn = document.getElementById('btn-mark-all-read');
    const clearAllBtn = document.getElementById('btn-clear-all-notifs');
    if (!container) return;

    const unreadCount = state.notifications.filter((n) => !n.read).length;
    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.innerText = `${unreadCount} belum dibaca`;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
    if (markAllReadBtn) {
      markAllReadBtn.style.display = (unreadCount > 0) ? 'inline-flex' : 'none';
    }
    if (clearAllBtn) {
      clearAllBtn.style.display = (state.notifications.length > 0) ? 'inline-flex' : 'none';
    }
    if (headerDot) {
      headerDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    if (navDot) {
      navDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    if (state.notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 32px 16px;">
          <div class="empty-icon-circle" style="width: 44px; height: 44px;">
            <i data-lucide="bell-off" style="width: 22px; height: 22px; color: var(--color-muted-text);"></i>
          </div>
          <p style="font-weight: 600; font-size: 14px; color: var(--color-primary-text); margin-top: 8px;">Belum ada notifikasi</p>
          <p style="font-size: 12px; color: var(--color-secondary-text); margin-top: 2px;">Pemberitahuan pengingat kelas dan informasi perkuliahan TRJT 3A akan tampil di sini.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.notifications
      .map((item, index) => {
        const isH10 = item.type === 'h10';
        const isCancel = item.type === 'cancel';
        const isRoom = item.type === 'room' || item.type === 'info';
        const isMat = item.type === 'material';
        const isTest = item.type === 'test';

        let typeClass = 'type-h10';
        let iconName = 'bell';
        let categoryLabel = 'Pengingat kelas';

        if (isTest) {
          typeClass = 'type-h10';
          iconName = 'bell-ring';
          categoryLabel = 'Uji notifikasi';
        } else if (isCancel) {
          typeClass = 'type-cancel';
          iconName = 'alert-triangle';
          categoryLabel = 'Dibatalkan';
        } else if (isRoom) {
          typeClass = 'type-info';
          iconName = 'map-pin';
          categoryLabel = 'Perubahan ruangan';
        } else if (isMat) {
          typeClass = 'type-info';
          iconName = 'folder';
          categoryLabel = 'Materi baru';
        }

        const title = item.subject || item.title || 'Pengingat perkuliahan';
        const desc = item.desc || (isH10 ? 'Dimulai 10 menit lagi' : (isTest ? 'Perangkat ini siap menerima pengingat kelas.' : ''));
        const info = item.meta ? item.meta : (item.lecturer ? item.lecturer : '');

        return `
          <div class="notif-card ${item.read ? 'read' : 'unread'}" data-index="${index}">
            <div class="notif-circle-icon ${typeClass}">
              <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
            </div>
            <div class="notif-body">
              <div class="notif-top-row">
                <span class="notif-badge-tag ${typeClass}">
                  ${categoryLabel}
                </span>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="notif-time-text">
                    ${!item.read ? '<span class="unread-indicator-dot"></span>' : ''}
                    ${item.time}
                  </span>
                  <button class="btn-delete-single-notif" onclick="window.deleteSingleNotification('${item.id || index}', event)" title="Hapus pesan ini" aria-label="Hapus notifikasi">
                    <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                  </button>
                </div>
              </div>
              <h3 class="notif-course-title">${title}</h3>
              ${desc ? `<div class="notif-desc-text">${desc}</div>` : ''}
              ${info ? `<div class="notif-info-line">${info}</div>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.notif-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-single-notif')) return;
        const idx = card.getAttribute('data-index');
        if (idx !== null && state.notifications[idx]) {
          const notif = state.notifications[idx];
          notif.read = true;
          saveNotificationsState();
          renderNotifications();
          if (window.lucide) window.lucide.createIcons();

          // Quick open course materials if course matches
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

  window.deleteSingleNotification = function (idOrIndex, e) {
    if (e) e.stopPropagation();
    state.notifications = state.notifications.filter((n, idx) => n.id !== idOrIndex && String(idx) !== String(idOrIndex));
    saveNotificationsState();
    renderNotifications();
    showToast('🗑️ Pesan notifikasi dihapus', 'info');
    if (window.lucide) window.lucide.createIcons();
  };

  window.clearAllNotifications = function () {
    if (state.notifications.length === 0) return;
    if (!confirm('Apakah Anda yakin ingin menghapus semua riwayat notifikasi?')) return;
    state.notifications = [];
    saveNotificationsState();
    renderNotifications();
    showToast('🗑️ Semua riwayat notifikasi telah dihapus', 'info');
    if (window.lucide) window.lucide.createIcons();
  };

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
    saveNotificationsState();
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
    if (!window.TRJT_FIREBASE) return;
    const notifStatus = window.TRJT_FIREBASE.getNotificationStatus();

    // 1. Honest Notification Status Badge & Text (User-Friendly)
    const badgeEl = document.getElementById('badge-notif-status');
    const descEl = document.getElementById('desc-notif-status');
    if (badgeEl) {
      if (notifStatus.code === 'active') {
        badgeEl.className = 'soft-badge-success';
        badgeEl.innerText = 'Aktif & Siap';
      } else {
        badgeEl.className = 'soft-badge-warning';
        badgeEl.innerHTML = '<span style="cursor: pointer;">Coba perbaiki</span>';
      }
    }
    if (descEl) {
      descEl.innerText = (notifStatus.code === 'active')
        ? 'Perangkat terhubung dan siap menerima pengingat perkuliahan.'
        : 'Aplikasi belum dapat menerima pengingat di perangkat ini.';
    }

    // 2. Switches synchronization
    const switchH10 = document.getElementById('switch-h10');
    if (switchH10) {
      switchH10.checked = notifStatus.reminderEnabled && notifStatus.code === 'active';
      if (notifStatus.code === 'blocked') {
        switchH10.checked = false;
        switchH10.disabled = true;
      } else {
        switchH10.disabled = false;
      }
    }

    const switchSound = document.getElementById('switch-sound');
    if (switchSound) {
      switchSound.checked = localStorage.getItem('trjt_sound_enabled') !== 'false';
    }

    // 3. System Status Badges
    const fcmBadge = document.getElementById('badge-fcm-status');
    if (fcmBadge) {
      if (notifStatus.code === 'active') {
        fcmBadge.className = 'soft-badge-success';
        fcmBadge.innerText = 'Aktif & Siap';
      } else if (notifStatus.code === 'blocked') {
        fcmBadge.className = 'soft-badge-danger';
        fcmBadge.innerText = 'Izin Ditolak';
      } else {
        fcmBadge.className = 'soft-badge-neutral';
        fcmBadge.innerText = 'Siap Digunakan';
      }
    }

    const swBadge = document.getElementById('badge-sw-status');
    if (swBadge) {
      if ('serviceWorker' in navigator) {
        swBadge.className = 'soft-badge-success';
        swBadge.innerText = 'Aktif';
      } else {
        swBadge.className = 'soft-badge-neutral';
        swBadge.innerText = 'Tidak Didukung';
      }
    }

    // iOS Safari PWA helper tip
    const iosTip = document.getElementById('ios-pwa-tip');
    if (iosTip) {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      iosTip.style.display = (isIos && !isStandalone) ? 'flex' : 'none';
    }

    // 4. Diagnostics Table
    const diagPerm = document.getElementById('diag-permission');
    const diagSw = document.getElementById('diag-sw');
    const diagToken = document.getElementById('diag-token');
    const diagPlatform = document.getElementById('diag-platform');
    const diagLast = document.getElementById('diag-last-notif');

    if (diagPerm) {
      const perm = notifStatus.permission;
      diagPerm.innerText = perm === 'granted' ? 'Disetujui (Granted)' : (perm === 'denied' ? 'Diblokir (Denied)' : 'Belum Ditentukan (Default)');
      diagPerm.style.color = perm === 'granted' ? '#15803D' : (perm === 'denied' ? '#DC2626' : '#64748B');
    }
    if (diagSw) {
      diagSw.innerText = 'serviceWorker' in navigator ? 'Terdaftar (Active Scope)' : 'Tidak Didukung';
    }
    if (diagToken) {
      diagToken.innerText = notifStatus.tokenMasked || 'Belum Dibuat';
    }
    if (diagPlatform) {
      diagPlatform.innerText = notifStatus.platform || 'Web';
    }
    if (diagLast) {
      if (notifStatus.lastNotification) {
        const d = new Date(notifStatus.lastNotification);
        diagLast.innerText = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('id-ID') + ')';
      } else {
        diagLast.innerText = 'Belum Ada';
      }
    }
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

    // Auto-hide bell button on Notifikasi view to avoid redundancy
    const headerBell = document.getElementById('btn-header-bell');
    if (headerBell) {
      headerBell.style.display = (tabId === 'notifikasi') ? 'none' : 'inline-flex';
    }

    const greetingWrap = document.querySelector('.header-greeting-wrap');
    if (greetingWrap) {
      greetingWrap.style.display = (tabId === 'beranda') ? 'flex' : 'none';
    }

    if (tabId === 'jadwal') {
      renderWeeklySchedule();
    } else if (tabId === 'notifikasi') {
      renderNotifications();
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
        saveNotificationsState();
        renderNotifications();
        showToast('✅ Semua notifikasi telah ditandai dibaca', 'success');
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Clear all notifications
    const clearAllNotifsBtn = document.getElementById('btn-clear-all-notifs');
    if (clearAllNotifsBtn) {
      clearAllNotifsBtn.addEventListener('click', () => {
        window.clearAllNotifications();
      });
    }

    // Row Notification Status click to request/fix
    const rowNotifStatus = document.getElementById('row-notif-status');
    if (rowNotifStatus) {
      rowNotifStatus.addEventListener('click', async () => {
        if (window.TRJT_FIREBASE) {
          const status = window.TRJT_FIREBASE.getNotificationStatus();
          if (status.code !== 'active') {
            try {
              await window.TRJT_FIREBASE.requestNotificationPermission(true);
              showToast('✅ Notifikasi berhasil diaktifkan!', 'success');
              renderSettingsUI();
            } catch (err) {
              showToast('⚠️ ' + err.message, 'error');
            }
          }
        }
      });
    }

    // Toggle: Pengingat H-10 Menit
    const switchH10 = document.getElementById('switch-h10');
    if (switchH10) {
      switchH10.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        state.settings.h10Alert = isChecked;

        if (isChecked) {
          try {
            if (window.TRJT_FIREBASE) {
              await window.TRJT_FIREBASE.requestNotificationPermission(true);
              showToast('✅ Pengingat H-10 berhasil diaktifkan', 'success');
            } else {
              if ('Notification' in window) await Notification.requestPermission();
              localStorage.setItem('trjt_h10_enabled', 'true');
              showToast('✅ Pengingat H-10 diaktifkan (Mode Lokal)', 'success');
            }
          } catch (err) {
            e.target.checked = false;
            state.settings.h10Alert = false;
            showToast('⚠️ ' + err.message, 'error');
          }
        } else {
          if (window.TRJT_FIREBASE) {
            await window.TRJT_FIREBASE.updateDeviceSetting('reminderEnabled', false);
          } else {
            localStorage.setItem('trjt_h10_enabled', 'false');
          }
          showToast('ℹ️ Pengingat H-10 dinonaktifkan', 'info');
        }

        renderSettingsUI();
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Toggle: Suara & Getar
    const switchSound = document.getElementById('switch-sound');
    if (switchSound) {
      switchSound.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        state.settings.soundEnabled = isChecked;
        state.settings.vibrationEnabled = isChecked;
        localStorage.setItem('trjt_sound_enabled', isChecked ? 'true' : 'false');
        localStorage.setItem('trjt_vibration_enabled', isChecked ? 'true' : 'false');

        if (window.TRJT_FIREBASE) {
          window.TRJT_FIREBASE.updateDeviceSetting('soundEnabled', isChecked);
          window.TRJT_FIREBASE.updateDeviceSetting('vibrationEnabled', isChecked);
          if (isChecked) {
            window.TRJT_FIREBASE.playNotificationChime();
          }
        }
        showToast(isChecked ? '🔊 Efek suara & getar diaktifkan' : '🔇 Efek suara & getar dimatikan', 'info');
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

    // Diagnostics Toggle
    const btnToggleDiag = document.getElementById('btn-toggle-diagnostics');
    const panelDiag = document.getElementById('panel-diagnostics');
    if (btnToggleDiag && panelDiag) {
      btnToggleDiag.addEventListener('click', () => {
        const isHidden = panelDiag.style.display === 'none' || panelDiag.style.display === '';
        panelDiag.style.display = isHidden ? 'flex' : 'none';
        renderSettingsUI();
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Listen to Push Notification event (Foreground & Test Dispatch)
    window.addEventListener('trjt:push-notification', (event) => {
      const detail = event.detail || {};
      const isTest = detail.type === 'test' || (detail.title && detail.title.toLowerCase().includes('uji'));
      const timeFormatted = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

      if (isTest) {
        // Find existing test notif to merge
        const existingTestIdx = state.notifications.findIndex((n) => n.type === 'test' || (n.title && n.title.toLowerCase().includes('uji')));
        if (existingTestIdx !== -1) {
          const prev = state.notifications[existingTestIdx];
          const count = (prev.testCount || 1) + 1;
          prev.testCount = count;
          prev.subject = 'Notifikasi berhasil diterima';
          prev.desc = 'Perangkat ini siap menerima pengingat kelas.';
          prev.meta = `Uji notifikasi TRJT 3A · ${count} kali`;
          prev.time = timeFormatted;
          prev.read = false;
          state.notifications.splice(existingTestIdx, 1);
          state.notifications.unshift(prev);
        } else {
          state.notifications.unshift({
            id: `notif-test-${Date.now()}`,
            type: 'test',
            testCount: 1,
            title: 'Uji notifikasi',
            subject: 'Notifikasi berhasil diterima',
            desc: 'Perangkat ini siap menerima pengingat kelas.',
            meta: 'Uji notifikasi TRJT 3A · 1 kali',
            time: timeFormatted,
            read: false
          });
        }
      } else {
        const newNotif = {
          id: `notif-${Date.now()}`,
          type: detail.type || 'h10',
          title: detail.title || 'Pengingat kelas',
          subject: detail.courseName || detail.title || 'TRJT 3A Notification',
          desc: detail.body || (detail.type === 'h10' ? 'Dimulai 10 menit lagi' : ''),
          lecturer: detail.lecturer || '',
          meta: detail.startTime && detail.room ? `${detail.startTime.replace(':', '.')} · ${detail.room}` : (detail.room || ''),
          time: timeFormatted,
          read: false
        };
        state.notifications.unshift(newNotif);
      }

      saveNotificationsState();
      renderNotifications();
      renderSettingsUI();
      if (window.lucide) window.lucide.createIcons();
    });

    // Realtime Material Updates
    window.addEventListener('trjt:materials-updated', () => {
      if (activeMaterialCourse) {
        renderCourseMaterialsList();
      }
    });

    // Material Modal Close
    const btnCloseMat = document.getElementById('btn-close-materials-modal');
    if (btnCloseMat) btnCloseMat.addEventListener('click', closeCourseMaterialsModal);

    const modalMat = document.getElementById('modal-course-materials');
    if (modalMat) {
      modalMat.addEventListener('click', (e) => {
        if (e.target === modalMat) closeCourseMaterialsModal();
      });
    }

    // Material Category Pills
    document.querySelectorAll('#modal-course-materials .filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#modal-course-materials .filter-pill').forEach((p) => p.classList.remove('active'));
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
            submitBtn.innerHTML = '<i data-lucide="cloud-upload" style="width: 18px; height: 18px;"></i> <span>Simpan ke Google Drive</span>';
          }
          if (statusText) statusText.style.display = 'none';
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }
  }

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

    // Update Drive button link to open this specific course's Google Drive folder
    const btnDriveFolder = document.getElementById('btn-open-course-drive-folder');
    if (btnDriveFolder && window.TRJT_DRIVE) {
      const folderInfo = await window.TRJT_DRIVE.getFolderForCourse(courseName || scheduleId);
      if (folderInfo && folderInfo.driveFolderId) {
        btnDriveFolder.href = `https://drive.google.com/drive/folders/${folderInfo.driveFolderId}?usp=drive_link`;
      } else {
        btnDriveFolder.href = `https://drive.google.com/drive/folders/1W7F5rWsNNq-nsLUF1emnOj4eJsYSShzW?usp=drive_link`;
      }
    }

    document.querySelectorAll('#modal-course-materials .filter-pill').forEach((pill) => {
      if (pill.getAttribute('data-filter') === 'all') pill.classList.add('active');
      else pill.classList.remove('active');
    });

    await renderCourseMaterialsList();

    if (modal) {
      modal.classList.add('is-open');
    }
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
        ? `<img src="${m.thumbnailUrl}" class="material-thumb-img" alt="${m.fileName}">`
        : `<i data-lucide="${icon}" style="width: 24px; height: 24px; color: var(--color-primary-blue);"></i>`;

      const dateStr = m.uploadedAt 
        ? (typeof m.uploadedAt === 'string' ? new Date(m.uploadedAt).toLocaleDateString('id-ID') : 'Baru saja')
        : 'Baru saja';

      return `
        <div class="material-card">
          <div class="material-thumb-box">
            ${thumbHtml}
          </div>
          <div class="material-info">
            <h4 class="material-filename">${m.fileName}</h4>
            <div class="material-meta-row">
              <span><i data-lucide="hard-drive" style="width: 11px; height: 11px; vertical-align: middle;"></i> ${m.fileSize || '1 MB'}</span>
              <span>·</span>
              <span><i data-lucide="calendar" style="width: 11px; height: 11px; vertical-align: middle;"></i> ${dateStr}</span>
              <span>·</span>
              <span style="color: var(--color-deep-blue); font-weight: 600;">${m.uploadedBy || 'Mahasiswa'}</span>
            </div>
            ${m.description ? `<div class="material-note">${m.description}</div>` : ''}
            <div class="material-actions-row">
              <button type="button" class="btn-mat-action btn-mat-open" onclick="window.TRJT_MATERIALS.openOrDownloadMaterial('${m.id}')">
                <i data-lucide="external-link" style="width: 12px; height: 12px;"></i> Buka File
              </button>
              <button class="btn-mat-action btn-mat-delete" onclick="window.confirmDeleteMaterial('${m.id}')" title="Hapus materi">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.confirmDeleteMaterial = async function (materialId) {
    if (!confirm('Apakah Anda yakin ingin menghapus file materi ini?')) return;
    try {
      if (window.TRJT_MATERIALS) {
        await window.TRJT_MATERIALS.deleteCourseMaterial(materialId);
        showToast('🗑️ Materi berhasil dihapus', 'info');
        renderCourseMaterialsList();
      }
    } catch (e) {
      showToast('❌ Gagal menghapus: ' + e.message, 'error');
    }
  };

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
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="cloud-upload" style="width: 18px; height: 18px;"></i> <span>Simpan ke Google Drive</span>';
    }

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
        previewIcon.innerHTML = `<i data-lucide="file-text" style="width: 22px; height: 22px; color: var(--color-primary-blue);"></i>`;
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
    renderSettingsUI();
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
      navigator.serviceWorker.register('./firebase-messaging-sw.js').catch(() => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.log('SW registration error:', err);
        });
      });
    }
  }

  // Export engine for developer testing
  window.evaluateScheduleState = evaluateScheduleState;
  window.triggerH10Notification = triggerH10Notification;
  window.showToast = showToast;
  window.renderSettingsUI = renderSettingsUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
