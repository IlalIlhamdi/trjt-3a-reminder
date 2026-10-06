/**
 * ==========================================================================
 * TRJT 3A REMINDER — COVER LAPORAN GENERATOR CONTROLLER
 * Handles form validation, identity persistence, reactive preview,
 * template DOCX generation with JSZip, and clean PDF print export.
 * ==========================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'trjt_cover_identity_v1';
  const COURSES_CACHE_KEY = 'trjt_cover_courses_cache_v1';
  const DOSEN_CACHE_KEY = 'trjt_cover_dosen_cache_v1';
  const DRAFT_KEY = 'trjt_cover_draft_v1';
  const TEMPLATE_URL = './assets/templates/cover-template.docx';

  let cachedTemplateBuffer = null;
  let cachedCourses = [];
  let retryCount = 0;
  let isEventsSetup = false;

  const state = {
    judul: '',
    selectedCourseId: '',
    mataKuliah: '',
    isManualCourse: false,
    manualCourseText: '',
    selectedDosenId: '',
    dosen: '',
    isManualDosen: false,
    manualDosenText: '',
    nama: '',
    nim: '',
    tahun: new Date().getFullYear().toString(),
    rememberIdentity: false,
    zoomLevel: 1.0,
    activeMobileTab: 'form', // 'form' | 'preview'
    isBusy: false
  };

  /**
   * Helper: Slugify string for stable IDs
   */
  function slugify(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Helper: Format NIP standard (8-6-1-3)
   */
  function formatNip(nip) {
    if (!nip) return '';
    const digits = String(nip).replace(/\D/g, '');
    if (digits.length === 18) {
      return `${digits.slice(0, 8)} ${digits.slice(8, 14)} ${digits.slice(14, 15)} ${digits.slice(15)}`;
    }
    return String(nip);
  }

  /**
   * Escape XML entities for safe Word DOCX insertion
   */
  function escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Escape HTML entities for safe DOM rendering
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Sanitize string for cross-platform safe file names
   */
  function sanitizeFilename(str) {
    if (!str) return 'Laporan';
    return str
      .replace(/[\/\\?%*:|"<>]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 40)
      .replace(/^_|_$/g, '');
  }

  /**
   * Dynamically ensure JSZip library is available
   */
  function ensureJSZip() {
    return new Promise((resolve, reject) => {
      if (window.JSZip) {
        return resolve(window.JSZip);
      }
      const script = document.createElement('script');
      script.src = './lib/jszip.min.js';
      script.onload = () => {
        if (window.JSZip) resolve(window.JSZip);
        else reject(new Error('JSZip tidak dapat dimuat'));
      };
      script.onerror = () => reject(new Error('Gagal memuat pustaka jszip.min.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Fetch and cache docx template buffer
   */
  async function getTemplateBuffer() {
    if (cachedTemplateBuffer) {
      return cachedTemplateBuffer;
    }
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) {
      throw new Error(`Gagal memuat template dokumen (${response.status})`);
    }
    cachedTemplateBuffer = await response.arrayBuffer();
    return cachedTemplateBuffer;
  }

  /**
   * Helper: Clean name for robust title/punctuation insensitive matching
   */
  function cleanName(str) {
    return (str || '').toLowerCase().replace(/[^a-z]/g, '');
  }

  /**
   * Retrieve lecturer list from available sources with normalized IDs
   */
  function getDosenList() {
    let rawList = [];
    if (window.TRJT_DOSEN && Array.isArray(window.TRJT_DOSEN) && window.TRJT_DOSEN.length > 0) {
      rawList = window.TRJT_DOSEN;
      try {
        localStorage.setItem(DOSEN_CACHE_KEY, JSON.stringify(window.TRJT_DOSEN));
      } catch (e) {}
    } else if (window.TRJT_SCHEDULE && Array.isArray(window.TRJT_SCHEDULE.dosen) && window.TRJT_SCHEDULE.dosen.length > 0) {
      rawList = window.TRJT_SCHEDULE.dosen;
    } else {
      try {
        const raw = localStorage.getItem(DOSEN_CACHE_KEY);
        if (raw) rawList = JSON.parse(raw);
      } catch (e) {}
    }

    return rawList.map((d, idx) => ({
      id: d.id || ('dosen-' + (d.initial ? slugify(d.initial) : (d.no || idx + 1))),
      no: d.no || idx + 1,
      name: d.name || '',
      initial: d.initial || 'DS',
      nip: d.nip || '',
      courses: Array.isArray(d.courses) ? d.courses : []
    }));
  }

  /**
   * Extract unique courses from schedule classes and map to lecturers
   */
  function extractCoursesFromClasses(classes) {
    const map = new Map();
    const dosenList = getDosenList();

    classes.forEach((c) => {
      const name = (c.courseName || '').trim();
      if (!name) return;
      const id = 'mk-' + slugify(name);

      if (!map.has(id)) {
        const matchingDosen = [];

        // 1. Check from class lecturer (fuzzy name / initial matching)
        if (c.lecturerName) {
          const found = dosenList.find(
            (d) =>
              cleanName(d.name) === cleanName(c.lecturerName) ||
              (c.lecturerCode && d.initial && d.initial.toLowerCase() === c.lecturerCode.toLowerCase())
          );
          if (found) {
            matchingDosen.push({ id: found.id, name: found.name, nip: found.nip, initial: found.initial });
          } else {
            matchingDosen.push({ id: 'dosen-' + slugify(c.lecturerName), name: c.lecturerName, nip: '', initial: 'DS' });
          }
        }

        // 2. Check from dosen list course mappings
        dosenList.forEach((d) => {
          if (Array.isArray(d.courses)) {
            const hasCourse = d.courses.some((cn) => cn.trim().toLowerCase() === name.toLowerCase());
            if (hasCourse && !matchingDosen.some((m) => m.id === d.id)) {
              matchingDosen.push({ id: d.id, name: d.name, nip: d.nip, initial: d.initial });
            }
          }
        });

        map.set(id, {
          id,
          name,
          lecturers: matchingDosen
        });
      }
    });

    return Array.from(map.values());
  }

  /**
   * Asynchronously load and populate Courses dropdown with retry & fallback
   */
  function loadCourses(forceRetry = false) {
    const select = document.getElementById('cover-course-select');
    const loadingEl = document.getElementById('cover-course-loading');
    const errorBox = document.getElementById('cover-course-error-box');

    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorBox) errorBox.style.display = 'none';
    if (select) {
      select.disabled = true;
      select.innerHTML = '<option value="">Memuat mata kuliah…</option>';
    }

    const classes = (window.TRJT_SCHEDULE && window.TRJT_SCHEDULE.classes) || null;

    if (!classes && retryCount < 5 && !forceRetry) {
      retryCount++;
      setTimeout(() => loadCourses(), 350);
      return;
    }

    if (classes && classes.length > 0) {
      cachedCourses = extractCoursesFromClasses(classes);
      try {
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(cachedCourses));
      } catch (e) {}
    } else {
      cachedCourses = [];
      // Fallback 1: localStorage cache
      try {
        const raw = localStorage.getItem(COURSES_CACHE_KEY);
        if (raw) cachedCourses = JSON.parse(raw);
      } catch (e) {}

      // Fallback 2: derive from TRJT_DOSEN if still empty
      if (cachedCourses.length === 0) {
        const dosenList = getDosenList();
        if (dosenList.length > 0) {
          const map = new Map();
          dosenList.forEach((d) => {
            (d.courses || []).forEach((cName) => {
              const id = 'mk-' + slugify(cName);
              if (!map.has(id)) {
                map.set(id, {
                  id,
                  name: cName,
                  lecturers: [{ id: d.id, name: d.name, nip: d.nip, initial: d.initial }]
                });
              } else {
                const item = map.get(id);
                if (!item.lecturers.some((l) => l.id === d.id)) {
                  item.lecturers.push({ id: d.id, name: d.name, nip: d.nip, initial: d.initial });
                }
              }
            });
          });
          cachedCourses = Array.from(map.values());
        }
      }
    }

    if (loadingEl) loadingEl.style.display = 'none';

    if (!cachedCourses || cachedCourses.length === 0) {
      if (select) {
        select.disabled = true;
        select.innerHTML = '<option value="">-- Gagal memuat mata kuliah --</option>';
      }
      if (errorBox) errorBox.style.display = 'flex';
      return;
    }

    // Populate Select
    if (select) {
      select.disabled = false;
      select.innerHTML = '';

      const defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = '-- Pilih Mata Kuliah --';
      select.appendChild(defOpt);

      cachedCourses.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
      });

      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = '✏️ Isi Manual (Mata Kuliah Lain)';
      select.appendChild(customOpt);

      if (state.selectedCourseId) {
        select.value = state.selectedCourseId;
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /**
   * Set Dosen Selection state and update UI
   */
  function setDosenSelection(dosenId, dosenName) {
    state.selectedDosenId = dosenId;
    state.dosen = dosenName;

    const trigger = document.getElementById('cover-dosen-trigger');
    const triggerText = document.getElementById('cover-dosen-trigger-text');
    const hiddenSelect = document.getElementById('cover-dosen-select');
    const manualGroup = document.getElementById('cover-manual-dosen-group');
    const manualInput = document.getElementById('cover-manual-dosen-input');
    const dosenErr = document.getElementById('error-cover-dosen');

    if (dosenId === '__custom__') {
      state.isManualDosen = true;
      state.dosen = state.manualDosenText || '';
      if (triggerText) {
        triggerText.textContent = state.manualDosenText || '✏️ Dosen Lain (Ketik Manual)';
        triggerText.classList.remove('placeholder');
      }
      if (manualGroup) manualGroup.style.display = 'block';
      if (manualInput) {
        manualInput.value = state.manualDosenText || '';
        manualInput.focus();
      }
    } else if (dosenId && dosenName) {
      state.isManualDosen = false;
      if (triggerText) {
        triggerText.textContent = dosenName;
        triggerText.classList.remove('placeholder');
      }
      if (manualGroup) manualGroup.style.display = 'none';
    } else {
      state.isManualDosen = false;
      state.dosen = '';
      if (triggerText) {
        triggerText.textContent = 'Pilih dosen pengampu';
        triggerText.classList.add('placeholder');
      }
      if (manualGroup) manualGroup.style.display = 'none';
    }

    if (hiddenSelect) hiddenSelect.value = dosenId;
    if (trigger) trigger.classList.remove('has-error');
    if (dosenErr) dosenErr.classList.remove('visible');

    renderDosenComboboxOptions();
    updatePreview();
    saveDraft();
  }

  /**
   * Render options inside the Dosen combobox list
   */
  function renderDosenComboboxOptions(filterQuery = '') {
    const listEl = document.getElementById('cover-dosen-options-list');
    if (!listEl) return;

    const dosenList = getDosenList();
    const q = (filterQuery || '').toLowerCase().trim();
    const currentCourse = cachedCourses.find((c) => c.id === state.selectedCourseId);
    const linkedDosenIds = new Set(
      currentCourse && currentCourse.lecturers ? currentCourse.lecturers.map((l) => l.id) : []
    );

    const filtered = dosenList.filter((d) => {
      if (!q) return true;
      const nameMatch = (d.name || '').toLowerCase().includes(q);
      const nipMatch = (d.nip || '').toLowerCase().includes(q);
      const initialMatch = (d.initial || '').toLowerCase().includes(q);
      const courseMatch = (d.courses || []).some((c) => (c || '').toLowerCase().includes(q));
      return nameMatch || nipMatch || initialMatch || courseMatch;
    });

    // Sort linked lecturers for currently selected course at top
    filtered.sort((a, b) => {
      const aLinked = linkedDosenIds.has(a.id);
      const bLinked = linkedDosenIds.has(b.id);
      if (aLinked && !bLinked) return -1;
      if (!aLinked && bLinked) return 1;
      return a.name.localeCompare(b.name);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="cover-combobox-empty">
          <p>Tidak ada dosen yang cocok dengan "${escapeHtml(filterQuery)}"</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach((d) => {
      const isSelected = state.selectedDosenId === d.id;
      const isLinked = linkedDosenIds.has(d.id);
      const displayNip = d.nip && d.nip !== 'NIP Belum Tercatat' ? `NIP: ${formatNip(d.nip)}` : 'NIP: Belum Tercatat';

      html += `
        <div class="cover-combobox-option ${isSelected ? 'is-selected' : ''}"
             role="option"
             tabindex="0"
             data-id="${d.id}"
             data-name="${escapeHtml(d.name)}"
             aria-selected="${isSelected ? 'true' : 'false'}">
          <div class="combobox-opt-avatar">${escapeHtml(d.initial || 'DS')}</div>
          <div class="combobox-opt-info">
            <span class="combobox-opt-name">${escapeHtml(d.name)}</span>
            <span class="combobox-opt-sub">${escapeHtml(displayNip)}</span>
          </div>
          ${isLinked ? '<span class="combobox-opt-badge">Pengampu MK</span>' : ''}
          <span class="combobox-opt-check"><i data-lucide="check"></i></span>
        </div>
      `;
    });

    // Custom external lecturer option
    const isCustomSelected = state.selectedDosenId === '__custom__';
    html += `
      <div class="cover-combobox-option ${isCustomSelected ? 'is-selected' : ''}"
           role="option"
           tabindex="0"
           data-id="__custom__"
           data-name="✏️ Dosen Lain (Ketik Manual)"
           aria-selected="${isCustomSelected ? 'true' : 'false'}"
           style="border-top: 1px dashed rgba(191, 219, 254, 0.8); margin-top: 4px; padding-top: 10px;">
        <div class="combobox-opt-avatar" style="background: rgba(47, 128, 237, 0.1);"><i data-lucide="edit-3" style="width: 14px; height: 14px;"></i></div>
        <div class="combobox-opt-info">
          <span class="combobox-opt-name">✏️ Dosen Lain (Ketik Manual)</span>
          <span class="combobox-opt-sub">Masukkan nama pengampu eksternal</span>
        </div>
        <span class="combobox-opt-check"><i data-lucide="check"></i></span>
      </div>
    `;

    listEl.innerHTML = html;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    listEl.querySelectorAll('.cover-combobox-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = opt.getAttribute('data-id');
        const name = opt.getAttribute('data-name');
        setDosenSelection(id, id === '__custom__' ? '' : name);
        closeDosenCombobox();
      });
    });
  }

  function openDosenCombobox() {
    const trigger = document.getElementById('cover-dosen-trigger');
    const dropdown = document.getElementById('cover-dosen-dropdown');
    const searchInput = document.getElementById('cover-dosen-search-input');
    if (!dropdown) return;

    renderDosenComboboxOptions();
    dropdown.style.display = 'flex';
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (searchInput) {
      searchInput.value = '';
      const clearBtn = document.getElementById('cover-dosen-search-clear');
      if (clearBtn) clearBtn.style.display = 'none';
      setTimeout(() => searchInput.focus(), 40);
    }
  }

  function closeDosenCombobox() {
    const trigger = document.getElementById('cover-dosen-trigger');
    const dropdown = document.getElementById('cover-dosen-dropdown');
    if (!dropdown) return;

    dropdown.style.display = 'none';
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleDosenCombobox() {
    const dropdown = document.getElementById('cover-dosen-dropdown');
    if (!dropdown) return;
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
      openDosenCombobox();
    } else {
      closeDosenCombobox();
    }
  }

  /**
   * Handle course selection change: auto-select lecturer or reset consistently
   */
  function onCourseSelected(courseId) {
    state.selectedCourseId = courseId;

    if (courseId === '__custom__') {
      state.isManualCourse = true;
      state.mataKuliah = state.manualCourseText || '';
      const manualGroup = document.getElementById('cover-manual-course-group');
      const manualInput = document.getElementById('cover-manual-course-input');
      if (manualGroup) manualGroup.style.display = 'block';
      if (manualInput) {
        manualInput.value = state.manualCourseText || '';
        manualInput.focus();
      }
      setDosenSelection('', '');
    } else if (courseId) {
      state.isManualCourse = false;
      const manualGroup = document.getElementById('cover-manual-course-group');
      if (manualGroup) manualGroup.style.display = 'none';

      const courseObj = cachedCourses.find((c) => c.id === courseId);
      if (courseObj) {
        state.mataKuliah = courseObj.name;
        const linked = courseObj.lecturers || [];
        if (linked.length === 1) {
          // Exactly 1 linked lecturer -> auto-select
          setDosenSelection(linked[0].id, linked[0].name);
        } else {
          // Multiple or none -> reset consistently so prior lecturer is not retained
          setDosenSelection('', '');
        }
      }
    } else {
      state.isManualCourse = false;
      state.mataKuliah = '';
      const manualGroup = document.getElementById('cover-manual-course-group');
      if (manualGroup) manualGroup.style.display = 'none';
      setDosenSelection('', '');
    }

    const courseSelect = document.getElementById('cover-course-select');
    const courseErr = document.getElementById('error-cover-course');
    if (courseSelect) courseSelect.classList.remove('has-error');
    if (courseErr) courseErr.classList.remove('visible');

    renderDosenComboboxOptions();
    updatePreview();
    saveDraft();
  }

  /**
   * Update Title Counter and multiline indicator
   */
  function updateTitleCounter() {
    const titleInput = document.getElementById('cover-title-input');
    const counterEl = document.getElementById('cover-title-counter');
    const warnEl = document.getElementById('cover-title-warning');
    if (!counterEl) return;

    const rawVal = titleInput ? titleInput.value : (state.judul || '');
    state.judul = rawVal;

    const charCount = rawVal.length;
    const lines = rawVal.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const lineCount = rawVal.trim().length > 0 ? Math.max(1, lines.length) : (rawVal.length > 0 ? 1 : 0);

    counterEl.textContent = `${charCount} karakter · ${lineCount} baris`;

    if (warnEl) {
      if (charCount > 140 || lineCount > 3) {
        warnEl.style.display = 'inline-flex';
      } else {
        warnEl.style.display = 'none';
      }
    }
  }

  /**
   * Load saved identity from localStorage
   */
  function loadSavedIdentity() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.nama || parsed.nim) {
          state.nama = parsed.nama || '';
          state.nim = parsed.nim || '';
          state.rememberIdentity = true;

          const nameInput = document.getElementById('cover-name-input');
          const nimInput = document.getElementById('cover-nim-input');
          const rememberCb = document.getElementById('cover-remember-identity');
          const clearBtn = document.getElementById('cover-clear-identity-btn');

          if (nameInput) nameInput.value = state.nama;
          if (nimInput) nimInput.value = state.nim;
          if (rememberCb) rememberCb.checked = true;
          if (clearBtn) clearBtn.style.display = 'inline-block';
        }
      }
    } catch (e) {
      console.warn('Gagal membaca identitas tersimpan:', e);
    }
  }

  /**
   * Save identity to localStorage if checkbox is checked
   */
  function persistIdentityIfNeeded() {
    try {
      if (state.rememberIdentity && (state.nama || state.nim)) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            nama: state.nama.trim(),
            nim: state.nim.trim()
          })
        );
        const clearBtn = document.getElementById('cover-clear-identity-btn');
        if (clearBtn) clearBtn.style.display = 'inline-block';
      } else if (!state.rememberIdentity) {
        localStorage.removeItem(STORAGE_KEY);
        const clearBtn = document.getElementById('cover-clear-identity-btn');
        if (clearBtn) clearBtn.style.display = 'none';
      }
    } catch (e) {
      console.warn('Gagal menyimpan identitas:', e);
    }
  }

  /**
   * Clear saved identity from localStorage
   */
  function clearSavedIdentity() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      state.rememberIdentity = false;
      const rememberCb = document.getElementById('cover-remember-identity');
      const clearBtn = document.getElementById('cover-clear-identity-btn');
      if (rememberCb) rememberCb.checked = false;
      if (clearBtn) clearBtn.style.display = 'none';
    } catch (e) {
      console.warn('Gagal menghapus identitas:', e);
    }
  }

  /**
   * Save form draft to sessionStorage for tab retention
   */
  function saveDraft() {
    try {
      const draft = {
        judul: state.judul,
        selectedCourseId: state.selectedCourseId,
        mataKuliah: state.mataKuliah,
        isManualCourse: state.isManualCourse,
        manualCourseText: state.manualCourseText,
        selectedDosenId: state.selectedDosenId,
        dosen: state.dosen,
        isManualDosen: state.isManualDosen,
        manualDosenText: state.manualDosenText,
        nama: state.nama,
        nim: state.nim,
        tahun: state.tahun
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {}
  }

  /**
   * Restore form draft from sessionStorage
   */
  function restoreDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft) return false;

      if (draft.judul !== undefined) {
        state.judul = draft.judul;
        const titleInput = document.getElementById('cover-title-input');
        if (titleInput) titleInput.value = draft.judul;
        updateTitleCounter();
      }
      if (draft.selectedCourseId) {
        state.selectedCourseId = draft.selectedCourseId;
        state.mataKuliah = draft.mataKuliah || '';
        state.isManualCourse = !!draft.isManualCourse;
        state.manualCourseText = draft.manualCourseText || '';

        const courseSelect = document.getElementById('cover-course-select');
        if (courseSelect) courseSelect.value = draft.selectedCourseId;
        const manualGroup = document.getElementById('cover-manual-course-group');
        const manualInput = document.getElementById('cover-manual-course-input');
        if (manualGroup) manualGroup.style.display = draft.isManualCourse ? 'block' : 'none';
        if (manualInput && draft.manualCourseText) manualInput.value = draft.manualCourseText;
      }
      if (draft.selectedDosenId || draft.dosen) {
        setDosenSelection(draft.selectedDosenId || '__custom__', draft.dosen || '');
        if (draft.isManualDosen) {
          state.isManualDosen = true;
          state.manualDosenText = draft.manualDosenText || draft.dosen || '';
          const manualDosenGroup = document.getElementById('cover-manual-dosen-group');
          const manualDosenInput = document.getElementById('cover-manual-dosen-input');
          if (manualDosenGroup) manualDosenGroup.style.display = 'block';
          if (manualDosenInput) manualDosenInput.value = state.manualDosenText;
        }
      }
      if (draft.nama && !state.nama) {
        state.nama = draft.nama;
        const nameInput = document.getElementById('cover-name-input');
        if (nameInput) nameInput.value = draft.nama;
      }
      if (draft.nim && !state.nim) {
        state.nim = draft.nim;
        const nimInput = document.getElementById('cover-nim-input');
        if (nimInput) nimInput.value = draft.nim;
      }
      if (draft.tahun) {
        state.tahun = draft.tahun;
        const yearInput = document.getElementById('cover-year-input');
        if (yearInput) yearInput.value = draft.tahun;
      }
      updatePreview();
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sync Print Container with the exact same academic cover document structure
   */
  function syncPrintContainer() {
    const printContainer = document.getElementById('cover-print-container');
    if (!printContainer) return;

    const lines = (state.judul || '').trim().split(/\r?\n/).filter(Boolean);
    const titleHtml = lines.length > 0
      ? lines.map((l) => escapeHtml(l.toUpperCase())).join('<br>')
      : 'INPUT JUDUL LAPORAN';

    const activeCourse = state.isManualCourse ? (state.manualCourseText || state.mataKuliah) : state.mataKuliah;
    const activeDosen = state.isManualDosen ? (state.manualDosenText || state.dosen) : state.dosen;
    const courseText = (activeCourse && activeCourse.trim()) ? escapeHtml(activeCourse.trim()) : 'Input Mata Kuliah';
    const dosenText = (activeDosen && activeDosen.trim()) ? escapeHtml(activeDosen.trim()) : 'Input Nama Dosen';
    const studentName = (state.nama && state.nama.trim()) ? escapeHtml(state.nama.trim().toUpperCase()) : 'INPUT NAMA MAHASISWA';
    const studentNim = (state.nim && state.nim.trim()) ? `(NIM : ${escapeHtml(state.nim.trim())})` : '(NIM : INPUT NIM)';
    const yearText = (state.tahun && state.tahun.trim()) ? escapeHtml(state.tahun.trim()) : new Date().getFullYear().toString();

    printContainer.innerHTML = `
      <!-- 1. Header Section: Judul, Matkul, Dosen -->
      <div class="cover-block-header">
        <h1 class="cover-title">${titleHtml}</h1>
        <div class="cover-spacing-title-subhead"></div>
        <p class="cover-subhead">Laporan ini disusun untuk memenuhi tugas mata kuliah:</p>
        <p class="cover-course">${courseText}</p>
        <div class="cover-spacing-course-dosen"></div>
        <p class="cover-dosen-lbl">Dosen Pengampu:</p>
        <p class="cover-dosen-name">${dosenText}</p>
      </div>

      <!-- 6. Logo TRJT (Center, proporsional, object-fit contain) -->
      <div class="cover-block-logo-trjt">
        <img src="./assets/images/cover/logo-prodi.jpeg" alt="Logo TRJT" class="cover-logo-trjt">
      </div>

      <!-- 7-9. Identitas Mahasiswa -->
      <div class="cover-block-student">
        <p class="cover-oleh">Oleh:</p>
        <p class="cover-student-name">${studentName}</p>
        <p class="cover-student-nim">${studentNim}</p>
      </div>

      <!-- 10-14. Logo PNL & Identitas Institusi -->
      <div class="cover-block-footer">
        <div class="cover-block-logo-pnl">
          <img src="./assets/images/cover/logo-pnl.png" alt="Logo Politeknik Negeri Lhokseumawe" class="cover-logo-pnl">
        </div>
        <div class="cover-inst-text">
          <p class="cover-inst-line">PRODI DIV TEKNOLOGI REKAYASA JARINGAN TELEKOMUNIKASI</p>
          <p class="cover-inst-line">JURUSAN TEKNIK ELEKTRO</p>
          <p class="cover-inst-line">POLITEKNIK NEGERI LHOKSEUMAWE</p>
        </div>
        <p class="cover-year">${yearText}</p>
      </div>
    `;
  }

  /**
   * Reactive Preview and Counter Update
   */
  function updatePreview() {
    // 1. Title
    const titleEl = document.getElementById('prev-title');
    const titleInput = document.getElementById('cover-title-input');
    const rawTitle = (titleInput ? titleInput.value : state.judul).trim();
    state.judul = titleInput ? titleInput.value : state.judul;

    const lines = rawTitle.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (titleEl) {
      if (rawTitle) {
        titleEl.innerHTML = lines.map((l) => escapeHtml(l.toUpperCase())).join('<br>');
        titleEl.classList.remove('prev-placeholder');
      } else {
        titleEl.innerHTML = 'INPUT JUDUL LAPORAN';
        titleEl.classList.add('prev-placeholder');
      }
    }

    // 2. Course
    const courseEl = document.getElementById('prev-course-name');
    const activeCourse = state.isManualCourse ? (state.manualCourseText || state.mataKuliah) : state.mataKuliah;
    if (courseEl) {
      if (activeCourse && activeCourse.trim()) {
        courseEl.textContent = activeCourse.trim();
        courseEl.classList.remove('prev-placeholder');
      } else {
        courseEl.textContent = 'Input Mata Kuliah';
        courseEl.classList.add('prev-placeholder');
      }
    }

    // 3. Lecturer
    const dosenEl = document.getElementById('prev-lecturer-name');
    const activeDosen = state.isManualDosen ? (state.manualDosenText || state.dosen) : state.dosen;
    if (dosenEl) {
      if (activeDosen && activeDosen.trim()) {
        dosenEl.textContent = activeDosen.trim();
        dosenEl.classList.remove('prev-placeholder');
      } else {
        dosenEl.textContent = 'Input Nama Dosen';
        dosenEl.classList.add('prev-placeholder');
      }
    }

    // 4. Student Name
    const nameEl = document.getElementById('prev-student-name');
    if (nameEl) {
      if (state.nama && state.nama.trim()) {
        nameEl.textContent = state.nama.trim().toUpperCase();
        nameEl.classList.remove('prev-placeholder');
      } else {
        nameEl.textContent = 'INPUT NAMA MAHASISWA';
        nameEl.classList.add('prev-placeholder');
      }
    }

    // 5. NIM
    const nimEl = document.getElementById('prev-student-nim');
    if (nimEl) {
      if (state.nim && state.nim.trim()) {
        nimEl.textContent = `(NIM : ${state.nim.trim()})`;
        nimEl.classList.remove('prev-placeholder');
      } else {
        nimEl.textContent = '(NIM : INPUT NIM)';
        nimEl.classList.add('prev-placeholder');
      }
    }

    // 6. Year
    const yearEl = document.getElementById('prev-year');
    if (yearEl) {
      if (state.tahun && state.tahun.trim()) {
        yearEl.textContent = state.tahun.trim();
        yearEl.classList.remove('prev-placeholder');
      } else {
        yearEl.textContent = new Date().getFullYear().toString();
      }
    }

    // Continuous real-time WYSIWYG synchronization for Print Container
    syncPrintContainer();
  }

  /**
   * Set form feedback status banner
   */
  function setStatus(type, message) {
    const banner = document.getElementById('cover-status-banner');
    const msgEl = document.getElementById('cover-status-message');
    const spinner = document.getElementById('cover-status-spinner');
    if (!banner || !msgEl) return;

    banner.className = 'cover-status-banner';
    if (!type) {
      banner.style.display = 'none';
      return;
    }

    banner.classList.add(type);
    banner.style.display = 'flex';
    msgEl.textContent = message;

    if (spinner) {
      spinner.style.display = type === 'busy' ? 'inline-block' : 'none';
    }
  }

  /**
   * Form validation with field-level indicators
   */
  function validateForm() {
    let isValid = true;

    function checkField(el, errorEl, condition, msg) {
      if (!el) return;
      if (condition) {
        el.classList.remove('has-error');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('visible');
        }
      } else {
        isValid = false;
        el.classList.add('has-error');
        if (errorEl) {
          errorEl.textContent = msg;
          errorEl.classList.add('visible');
        }
      }
    }

    // 1. Judul
    const titleInput = document.getElementById('cover-title-input');
    const titleErr = document.getElementById('error-cover-title');
    checkField(titleInput, titleErr, state.judul.trim().length > 0, 'Judul laporan wajib diisi');

    // 2. Mata Kuliah
    const courseSelect = document.getElementById('cover-course-select');
    const courseErr = document.getElementById('error-cover-course');
    if (state.isManualCourse) {
      const manualCourseInput = document.getElementById('cover-manual-course-input');
      checkField(manualCourseInput, courseErr, (state.manualCourseText || '').trim().length > 0, 'Nama mata kuliah manual wajib diisi');
    } else {
      checkField(courseSelect, courseErr, !!state.selectedCourseId && (state.mataKuliah || '').trim().length > 0, 'Silakan pilih mata kuliah');
    }

    // 3. Dosen Pengampu
    const dosenTrigger = document.getElementById('cover-dosen-trigger');
    const dosenErr = document.getElementById('error-cover-dosen');
    if (state.isManualDosen) {
      const manualDosenInput = document.getElementById('cover-manual-dosen-input');
      checkField(manualDosenInput, dosenErr, (state.dosen || state.manualDosenText || '').trim().length > 0, 'Nama dosen pengampu manual wajib diisi');
    } else {
      checkField(dosenTrigger, dosenErr, (state.dosen || '').trim().length > 0, 'Silakan pilih dosen pengampu');
    }

    // 4. Nama Mahasiswa
    const nameInput = document.getElementById('cover-name-input');
    const nameErr = document.getElementById('error-cover-name');
    checkField(nameInput, nameErr, (state.nama || '').trim().length > 0, 'Nama mahasiswa wajib diisi');

    // 5. NIM Mahasiswa
    const nimInput = document.getElementById('cover-nim-input');
    const nimErr = document.getElementById('error-cover-nim');
    checkField(nimInput, nimErr, (state.nim || '').trim().length > 0, 'NIM mahasiswa wajib diisi');

    // 6. Tahun
    const yearInput = document.getElementById('cover-year-input');
    const yearErr = document.getElementById('error-cover-year');
    checkField(yearInput, yearErr, /^\d{4}$/.test((state.tahun || '').trim()), 'Tahun wajib 4 digit (misal: 2026)');

    return isValid;
  }

  /**
   * Reset form with confirmation
   */
  function resetForm() {
    const hasData = state.judul || state.selectedCourseId || state.dosen;
    if (hasData) {
      const confirmed = window.confirm('Apakah Anda yakin ingin mereset formulir? Data yang belum diunduh akan dibersihkan.');
      if (!confirmed) return;
    }

    state.judul = '';
    state.selectedCourseId = '';
    state.mataKuliah = '';
    state.isManualCourse = false;
    state.manualCourseText = '';
    state.selectedDosenId = '';
    state.dosen = '';
    state.isManualDosen = false;
    state.manualDosenText = '';
    state.tahun = new Date().getFullYear().toString();

    const titleInput = document.getElementById('cover-title-input');
    const courseSelect = document.getElementById('cover-course-select');
    const manualCourseGroup = document.getElementById('cover-manual-course-group');
    const manualCourseInput = document.getElementById('cover-manual-course-input');
    const manualDosenGroup = document.getElementById('cover-manual-dosen-group');
    const manualDosenInput = document.getElementById('cover-manual-dosen-input');
    const yearInput = document.getElementById('cover-year-input');

    if (titleInput) titleInput.value = '';
    if (courseSelect) courseSelect.value = '';
    if (manualCourseGroup) manualCourseGroup.style.display = 'none';
    if (manualCourseInput) manualCourseInput.value = '';
    if (manualDosenGroup) manualDosenGroup.style.display = 'none';
    if (manualDosenInput) manualDosenInput.value = '';
    if (yearInput) yearInput.value = state.tahun;

    setDosenSelection('', '');

    if (!state.rememberIdentity) {
      state.nama = '';
      state.nim = '';
      const nameInput = document.getElementById('cover-name-input');
      const nimInput = document.getElementById('cover-nim-input');
      if (nameInput) nameInput.value = '';
      if (nimInput) nimInput.value = '';
    }

    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (e) {}

    document.querySelectorAll('.cover-field-error').forEach((el) => el.classList.remove('visible'));
    document.querySelectorAll('.cover-input, .cover-select, .cover-textarea, .cover-combobox-trigger').forEach((el) => el.classList.remove('has-error'));

    updateTitleCounter();
    updatePreview();
    setStatus(null, '');
  }

  /**
   * Calculate Auto-Fit Zoom Scale
   */
  function calculateFitZoom() {
    const container = document.querySelector('.cover-canvas-container');
    const containerWidth = container && container.clientWidth > 0 ? container.clientWidth : 500;
    const vpWidth = window.innerWidth || document.documentElement.clientWidth || 500;
    const padding = 24;
    const availableWidth = Math.max(200, Math.min(containerWidth - padding, vpWidth - 56));
    // Base A4 width in px at 96 DPI: 793.7px (~794px)
    const baseWidth = 794;
    const fitScale = Math.min(1.0, Math.max(0.25, availableWidth / baseWidth));
    return Math.round(fitScale * 100) / 100;
  }

  /**
   * Set Zoom Level for Preview Sheet
   */
  function setZoom(level) {
    if (level === 'fit') {
      state.zoomLevel = calculateFitZoom();
    } else {
      const numLevel = typeof level === 'number' ? level : parseFloat(level);
      state.zoomLevel = Math.max(0.3, Math.min(1.5, Math.round(numLevel * 100) / 100));
    }

    const scaler = document.getElementById('cover-sheet-scaler');
    const scaleWrapper = document.getElementById('cover-scale-wrapper');
    const indicator = document.getElementById('cover-zoom-text');

    const s = state.zoomLevel;
    const baseWidth = 794;
    const baseHeight = 1123;

    if (scaler) {
      scaler.style.transform = `scale(${s})`;
      scaler.style.width = `${baseWidth}px`;
      scaler.style.height = `${baseHeight}px`;
    }

    if (scaleWrapper) {
      scaleWrapper.style.width = `${Math.round(baseWidth * s)}px`;
      scaleWrapper.style.height = `${Math.round(baseHeight * s)}px`;
    }

    if (indicator) {
      indicator.textContent = `${Math.round(s * 100)}%`;
    }
  }

  /**
   * Switch mobile tab between 'form' and 'preview'
   */
  function switchMobileTab(tab) {
    state.activeMobileTab = tab;
    const formPanel = document.querySelector('.cover-panel-form');
    const prevPanel = document.querySelector('.cover-panel-preview');
    const btnForm = document.getElementById('btn-tab-form');
    const btnPrev = document.getElementById('btn-tab-prev');

    if (tab === 'preview') {
      if (formPanel) formPanel.classList.add('mobile-hidden');
      if (prevPanel) prevPanel.classList.remove('mobile-hidden');
      if (btnForm) btnForm.classList.remove('active');
      if (btnPrev) btnPrev.classList.add('active');
      updatePreview();
      setTimeout(() => setZoom('fit'), 30);
    } else {
      if (formPanel) formPanel.classList.remove('mobile-hidden');
      if (prevPanel) prevPanel.classList.add('mobile-hidden');
      if (btnForm) btnForm.classList.add('active');
      if (btnPrev) btnPrev.classList.remove('active');
    }
  }

  /**
   * Generate DOCX using template and filled state
   */
  async function generateDocxBlob() {
    const JSZip = await ensureJSZip();
    const templateBuffer = await getTemplateBuffer();
    const zip = await JSZip.loadAsync(templateBuffer);
    let docXml = await zip.file('word/document.xml').async('text');

    const judul = (state.judul || '').trim();
    const mataKuliah = (state.mataKuliah || '').trim();
    const dosen = (state.dosen || '').trim();
    const nama = (state.nama || '').trim().toUpperCase();
    const nim = (state.nim || '').trim();
    const tahun = (state.tahun || '').trim() || new Date().getFullYear().toString();

    // 1. Title replacement (support multiline)
    const judulLines = judul.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const extraJudulLines = Math.max(0, judulLines.length - 1);

    const judulXmlRuns = judulLines
      .map((line, idx) => {
        const escaped = escapeXml(line.toUpperCase());
        if (idx === 0) {
          return `<w:t xml:space="preserve">${escaped}</w:t>`;
        }
        return `<w:br/><w:t xml:space="preserve">${escaped}</w:t>`;
      })
      .join('');

    docXml = docXml.replace(/<w:t>INPUT JUDUL<\/w:t>/, judulXmlRuns);

    // 2. Course replacement
    docXml = docXml.replace(/<w:t>Input Mk<\/w:t>/, `<w:t xml:space="preserve">${escapeXml(mataKuliah)}</w:t>`);

    // 3. Lecturer replacement
    docXml = docXml.replace(/<w:t xml:space="preserve">Input Dosen <\/w:t>/, `<w:t xml:space="preserve">${escapeXml(dosen)}</w:t>`);

    // 4. Student name replacement
    docXml = docXml.replace(/<w:t>INPUT NAMA<\/w:t>/, `<w:t xml:space="preserve">${escapeXml(nama)}</w:t>`);

    // 5. NIM replacement (string preserving leading zero)
    docXml = docXml.replace(/<w:t>INPUT NIM<\/w:t>/, `<w:t xml:space="preserve">${escapeXml(nim)}</w:t>`);

    // 6. Year replacement (replaces both runs 202 and 6)
    docXml = docXml.replace(
      /<w:t>202<\/w:t><\/w:r><w:r><w:rPr><w:rFonts w:eastAsia="Calibri" w:cs="Times New Roman"\/><w:b\/><w:bCs\/><w:color w:val="000000"\/><w:szCs w:val="24"\/><\/w:rPr><w:t>6<\/w:t>/,
      `<w:t xml:space="preserve">${escapeXml(tahun)}</w:t>`
    );

    // 7. Spacer paragraph balancing for multiline titles (guarantees exactly 1 page)
    if (extraJudulLines > 0) {
      const spacersToRemove = Math.min(extraJudulLines, 3);
      const drawingP17Idx = docXml.indexOf('r:embed="rId9"');
      if (drawingP17Idx !== -1) {
        const beforeDrawing = docXml.slice(0, drawingP17Idx);
        const afterDrawing = docXml.slice(drawingP17Idx);

        const prodiIdx = afterDrawing.indexOf('PRODI DIV TEKNOLOGI');
        if (prodiIdx !== -1) {
          let spacerSection = afterDrawing.slice(0, prodiIdx);
          const restSection = afterDrawing.slice(prodiIdx);

          const pRegex = /<w:p[\s\S]*?<\/w:p>/g;
          let match;
          const emptyParagraphs = [];
          while ((match = pRegex.exec(spacerSection)) !== null) {
            if (!match[0].includes('<w:t') && !match[0].includes('<w:drawing')) {
              emptyParagraphs.push(match[0]);
            }
          }

          for (let i = 0; i < Math.min(spacersToRemove, emptyParagraphs.length); i++) {
            spacerSection = spacerSection.replace(emptyParagraphs[i], '');
          }
          docXml = beforeDrawing + spacerSection + restSection;
        }
      }
    }

    zip.file('word/document.xml', docXml);
    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    return blob;
  }

  /**
   * Export Word (.docx) Handler
   */
  async function exportDocx() {
    if (state.isBusy) return;

    if (!validateForm()) {
      setStatus('error', 'Mohon lengkapi seluruh kolom yang wajib diisi.');
      return;
    }

    persistIdentityIfNeeded();
    saveDraft();

    try {
      state.isBusy = true;
      setStatus('busy', 'Sedang menyusun dokumen DOCX sesuai template resmi...');

      const blob = await generateDocxBlob();
      const safeCourse = sanitizeFilename(state.mataKuliah || 'Laporan');
      const safeName = sanitizeFilename(state.nama || 'Mahasiswa');
      const fileName = `Cover_${safeCourse}_${safeName}.docx`;

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
      setStatus('success', `Dokumen berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error('Error saat ekspor DOCX:', err);
      setStatus('error', `Gagal membuat dokumen: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      state.isBusy = false;
    }
  }

  /**
   * Trigger Clean Print / PDF Export
   */
  function printPdf() {
    if (!validateForm()) {
      setStatus('error', 'Mohon lengkapi data formulir sebelum mencetak cover.');
      return;
    }

    persistIdentityIfNeeded();
    saveDraft();
    syncPrintContainer();

    window.print();
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    if (isEventsSetup) return;
    isEventsSetup = true;

    // 1. Judul Input
    const titleInput = document.getElementById('cover-title-input');
    if (titleInput) {
      ['input', 'change', 'keyup', 'cut'].forEach((evt) => {
        titleInput.addEventListener(evt, () => {
          updateTitleCounter();
          updatePreview();
          saveDraft();
        });
      });
      titleInput.addEventListener('paste', () => {
        setTimeout(() => {
          updateTitleCounter();
          updatePreview();
          saveDraft();
        }, 10);
      });
    }

    // 2. Course Select
    const courseSelect = document.getElementById('cover-course-select');
    if (courseSelect) {
      courseSelect.addEventListener('change', () => {
        onCourseSelected(courseSelect.value);
      });
    }

    // Retry course load button
    const retryCourseBtn = document.getElementById('btn-retry-course');
    if (retryCourseBtn) {
      retryCourseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadCourses(true);
      });
    }

    // Manual Course Input
    const manualCourseInput = document.getElementById('cover-manual-course-input');
    if (manualCourseInput) {
      manualCourseInput.addEventListener('input', () => {
        state.manualCourseText = manualCourseInput.value;
        if (state.isManualCourse) {
          state.mataKuliah = manualCourseInput.value;
          updatePreview();
          saveDraft();
        }
      });
    }

    // 3. Dosen Combobox Trigger
    const dosenTrigger = document.getElementById('cover-dosen-trigger');
    if (dosenTrigger) {
      dosenTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDosenCombobox();
      });
      dosenTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openDosenCombobox();
        }
      });
    }

    // Dosen Combobox Search Input
    const dosenSearchInput = document.getElementById('cover-dosen-search-input');
    const dosenSearchClear = document.getElementById('cover-dosen-search-clear');

    if (dosenSearchInput) {
      dosenSearchInput.addEventListener('input', () => {
        const val = dosenSearchInput.value;
        if (dosenSearchClear) dosenSearchClear.style.display = val ? 'flex' : 'none';
        renderDosenComboboxOptions(val);
      });

      dosenSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeDosenCombobox();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const firstOption = document.querySelector('#cover-dosen-options-list .cover-combobox-option');
          if (firstOption) firstOption.click();
        }
      });
    }

    if (dosenSearchClear) {
      dosenSearchClear.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dosenSearchInput) {
          dosenSearchInput.value = '';
          dosenSearchClear.style.display = 'none';
          dosenSearchInput.focus();
          renderDosenComboboxOptions('');
        }
      });
    }

    // Close combobox when clicking outside
    document.addEventListener('click', (e) => {
      const combobox = document.getElementById('cover-dosen-combobox');
      const dropdown = document.getElementById('cover-dosen-dropdown');
      if (combobox && dropdown && !combobox.contains(e.target)) {
        if (dropdown.style.display !== 'none') {
          closeDosenCombobox();
        }
      }
    });

    // Manual Dosen Input
    const manualDosenInput = document.getElementById('cover-manual-dosen-input');
    if (manualDosenInput) {
      manualDosenInput.addEventListener('input', () => {
        state.manualDosenText = manualDosenInput.value;
        if (state.isManualDosen) {
          state.dosen = manualDosenInput.value;
          updatePreview();
          saveDraft();
        }
      });
    }

    // 4. Nama Input
    const nameInput = document.getElementById('cover-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        state.nama = nameInput.value;
        updatePreview();
        saveDraft();
      });
    }

    // 5. NIM Input
    const nimInput = document.getElementById('cover-nim-input');
    if (nimInput) {
      nimInput.addEventListener('input', () => {
        state.nim = nimInput.value;
        updatePreview();
        saveDraft();
      });
    }

    // 6. Tahun Input
    const yearInput = document.getElementById('cover-year-input');
    if (yearInput) {
      yearInput.addEventListener('input', () => {
        state.tahun = yearInput.value;
        updatePreview();
        saveDraft();
      });
    }

    // 7. Remember Identity Checkbox
    const rememberCb = document.getElementById('cover-remember-identity');
    if (rememberCb) {
      rememberCb.addEventListener('change', () => {
        state.rememberIdentity = rememberCb.checked;
        persistIdentityIfNeeded();
      });
    }

    // 8. Clear Saved Identity Button
    const clearIdBtn = document.getElementById('cover-clear-identity-btn');
    if (clearIdBtn) {
      clearIdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearSavedIdentity();
      });
    }

    // 9. Action Buttons
    const downloadBtn = document.getElementById('btn-download-docx');
    if (downloadBtn) downloadBtn.addEventListener('click', exportDocx);

    const printBtn = document.getElementById('btn-print-cover');
    if (printBtn) printBtn.addEventListener('click', printPdf);

    const resetBtn = document.getElementById('btn-reset-cover');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);

    // 10. Zoom Controls
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomFitBtn = document.getElementById('btn-zoom-fit');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(state.zoomLevel + 0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(state.zoomLevel - 0.1));
    if (zoomFitBtn) zoomFitBtn.addEventListener('click', () => setZoom('fit'));

    window.addEventListener('resize', () => {
      if (state.activeMobileTab === 'preview' || window.innerWidth > 900) {
        setZoom('fit');
      }
    });

    // 11. Mobile Tabs Switcher
    const btnTabForm = document.getElementById('btn-tab-form');
    const btnTabPrev = document.getElementById('btn-tab-prev');

    if (btnTabForm) btnTabForm.addEventListener('click', () => switchMobileTab('form'));
    if (btnTabPrev) btnTabPrev.addEventListener('click', () => switchMobileTab('preview'));
  }

  /**
   * Main Initialize function called on page load and tab switch
   */
  function init() {
    setupEventListeners();
    loadSavedIdentity();
    loadCourses();
    renderDosenComboboxOptions();
    restoreDraft();
    updateTitleCounter();
    updatePreview();
    setZoom('fit');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Automatic init on DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  // Expose public API
  window.CoverGenerator = {
    init,
    loadCourses,
    onCourseSelected,
    setDosenSelection,
    updateTitleCounter,
    updatePreview,
    exportDocx,
    printPdf,
    resetForm,
    switchMobileTab,
    setZoom,
    state
  };
})(window);
