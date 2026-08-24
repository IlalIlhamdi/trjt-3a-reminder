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
      h10Alert: localStorage.getItem('trjt_h10_enabled') === 'true',
      soundEnabled: localStorage.getItem('trjt_sound_enabled') !== 'false',
      vibrationEnabled: localStorage.getItem('trjt_vibration_enabled') !== 'false'
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

    // 1. Honest Notification Status Badge & Text
    const badgeEl = document.getElementById('badge-notif-status');
    const descEl = document.getElementById('desc-notif-status');
    if (badgeEl) {
      badgeEl.className = notifStatus.badgeClass || 'soft-badge-neutral';
      badgeEl.innerText = notifStatus.status;
    }
    if (descEl) {
      descEl.innerText = notifStatus.desc;
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
        renderNotifications();
        if (window.lucide) window.lucide.createIcons();
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
            const res = await window.TRJT_FIREBASE.sendTestNotification();
            showToast('✅ ' + (res.message || 'Notifikasi berhasil dikirim'), 'success');
          } else {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 Uji Notifikasi Berhasil', {
                body: 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.',
                icon: './assets/icons/app-icon.svg'
              });
              showToast('✅ Notifikasi berhasil dikirim', 'success');
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
      const newNotif = {
        id: `notif-${Date.now()}`,
        type: 'h10',
        title: detail.title || '🔔 Pengingat Kuliah',
        subject: detail.courseName || 'TRJT 3A Notification',
        lecturer: detail.lecturer || 'Dosen Pengampu',
        meta: `${detail.startTime || ''} · ${detail.room || ''}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.'),
        read: false
      };
      state.notifications.unshift(newNotif);
      renderNotifications();
      renderSettingsUI();
      if (window.lucide) window.lucide.createIcons();
    });
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
