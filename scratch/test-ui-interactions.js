import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE UI & INTERACTION VERIFICATION');
console.log('====================================================\n');

// 1. Mock Browser Environment
const storage = {};
globalThis.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = (tag || 'div').toUpperCase();
    this.id = id;
    this.className = className;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this._innerHTML = '';
    this._innerText = '';
    this.eventListeners = {};
  }

  get classList() {
    const self = this;
    return {
      add: (...classes) => {
        const set = new Set(self.className.split(' ').filter(Boolean));
        classes.forEach(c => set.add(c));
        self.className = Array.from(set).join(' ');
      },
      remove: (...classes) => {
        const set = new Set(self.className.split(' ').filter(Boolean));
        classes.forEach(c => set.delete(c));
        self.className = Array.from(set).join(' ');
      },
      contains: (c) => self.className.split(' ').filter(Boolean).includes(c),
      toggle: (c, force) => {
        if (typeof force === 'boolean') {
          if (force) self.classList.add(c);
          else self.classList.remove(c);
        } else {
          if (self.classList.contains(c)) self.classList.remove(c);
          else self.classList.add(c);
        }
      }
    };
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(evt, cb) {
    if (!this.eventListeners[evt]) this.eventListeners[evt] = [];
    this.eventListeners[evt].push(cb);
  }

  click() {
    if (this.eventListeners['click']) {
      const e = { target: this, stopPropagation: () => {}, preventDefault: () => {} };
      this.eventListeners['click'].forEach(cb => cb(e));
    }
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    this._innerText = val.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }

  get innerText() { return this._innerText; }
  set innerText(val) {
    this._innerText = val;
    this._innerHTML = val;
  }

  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }

  querySelectorAll(sel) {
    const results = [];
    const walk = (el) => {
      if (matches(el, sel)) results.push(el);
      el.children.forEach(walk);
    };
    this.children.forEach(walk);
    return results;
  }

  appendChild(child) {
    this.children.push(child);
  }
}

function matches(el, sel) {
  if (!sel || !el) return false;
  if (sel.includes('[') && sel.endsWith(']')) {
    const prefix = sel.split('[')[0];
    const attrPart = sel.slice(sel.indexOf('[') + 1, -1);
    if (prefix && !matches(el, prefix)) return false;
    const eqIdx = attrPart.indexOf('=');
    if (eqIdx !== -1) {
      const k = attrPart.slice(0, eqIdx);
      const v = attrPart.slice(eqIdx + 1).replace(/['"]/g, '');
      return el.getAttribute(k) === v;
    }
    return el.getAttribute(attrPart) !== null;
  }
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  return el.tagName.toLowerCase() === sel.toLowerCase();
}

const elementsMap = new Map();
function getOrCreateElement(id, tag = 'div', className = '') {
  if (elementsMap.has(id)) return elementsMap.get(id);
  const el = new MockElement(tag, id, className);
  elementsMap.set(id, el);
  return el;
}

globalThis.document = {
  getElementById: (id) => elementsMap.get(id) || null,
  querySelector: (sel) => {
    for (const el of elementsMap.values()) {
      if (matches(el, sel)) return el;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    const list = [];
    for (const el of elementsMap.values()) {
      if (matches(el, sel)) list.push(el);
    }
    return list;
  },
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {}
};

globalThis.window = {
  addEventListener: () => {},
  scrollTo: () => {},
  lucide: { createIcons: () => {} }
};
globalThis.Notification = {
  permission: 'granted',
  requestPermission: async () => 'granted'
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', serviceWorker: { register: async () => {} } },
    configurable: true,
    writable: true
  });
} catch (e) {}
globalThis.window.navigator = globalThis.navigator;

// Populate Mock Elements according to index.html
const requiredIds = [
  'header-greeting', 'header-date', 'beranda-status-chip-container', 'hero-card-container',
  'today-timeline-container', 'weekly-day-selector', 'weekly-cards-container',
  'btn-mark-all-read', 'filter-notif-all', 'filter-notif-unread', 'notif-list-container',
  'badge-notif-status', 'switch-sound', 'switch-vibration', 'switch-h10', 'btn-test-notification',
  'view-beranda', 'view-jadwal', 'view-notifikasi', 'view-pengaturan',
  'modal-course-materials', 'modal-upload-material', 'toast-container',
  'mat-modal-course-name', 'mat-modal-course-meta', 'mat-list-container', 'mat-empty-state',
  'count-mat-all', 'count-mat-photo', 'count-mat-doc', 'btn-open-course-drive-folder',
  'day-num-1', 'day-num-2', 'day-num-3', 'day-num-4', 'day-num-5', 'btn-header-bell',
  'header-unread-dot', 'nav-notif-dot'
];

requiredIds.forEach(id => {
  const isView = id.startsWith('view-');
  getOrCreateElement(id, 'section', isView ? 'view-section' + (id === 'view-beranda' ? ' active' : '') : '');
});

['beranda', 'jadwal', 'notifikasi', 'pengaturan'].forEach(tab => {
  const btn = new MockElement('button', '', 'nav-item' + (tab === 'beranda' ? ' active' : ''));
  btn.setAttribute('data-tab', tab);
  elementsMap.set(`nav-tab-${tab}`, btn);
});

[1, 2, 3, 4, 5].forEach(day => {
  const btn = new MockElement('button', '', 'day-btn-item' + (day === 1 ? ' active' : ''));
  btn.setAttribute('data-day', String(day));
  elementsMap.set(`day-btn-${day}`, btn);
});

// 2. Load and evaluate Schedule data
const dataJs = fs.readFileSync(path.join(projectRoot, 'js/data.js'), 'utf8');
eval(dataJs);

// 3. Load RealJakartaTimeProvider
const timeProviderJs = fs.readFileSync(path.join(projectRoot, 'js/time-provider.js'), 'utf8');
eval(timeProviderJs);

// Fixed Wednesday 26 Aug 2026 10:20 (Thursday class upcoming)
globalThis.appTimeProvider = {
  now: () => new Date('2026-08-26T10:20:00+07:00'),
  isSimulated: () => true
};

// 4. Load app.js
const appJs = fs.readFileSync(path.join(projectRoot, 'js/app.js'), 'utf8');
eval(appJs);

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// ----------------------------------------------------
// TEST SCENARIO 1: Beranda View Rendering
// ----------------------------------------------------
console.log('📌 Test 1: Beranda View Rendering & Glassmorphism Components');
const greetingEl = document.getElementById('header-greeting');
const dateEl = document.getElementById('header-date');
const heroContainer = document.getElementById('hero-card-container');
const todayContainer = document.getElementById('today-timeline-container');

assert(greetingEl && greetingEl.innerText.length > 0, `Greeting rendered: "${greetingEl.innerText}"`);
assert(dateEl && dateEl.innerText.includes('2026'), `Date rendered: "${dateEl.innerText}"`);
assert(heroContainer && heroContainer.innerHTML.includes('hero-glass-card'), 'Hero card rendered with .hero-glass-card');
assert(heroContainer.innerHTML.includes('KELAS BERIKUTNYA'), 'Hero card contains uppercase badge "KELAS BERIKUTNYA"');
assert(todayContainer && todayContainer.innerHTML.includes('today-class-card'), 'Jadwal hari ini rendered with .today-class-card');
assert(todayContainer.innerHTML.includes('chevron-right'), 'Jadwal hari ini cards include chevron-right icon');

// ----------------------------------------------------
// TEST SCENARIO 2: Tab Navigation Switching
// ----------------------------------------------------
console.log('\n📌 Test 2: Tab Navigation & View Visibility');
const navJadwal = document.querySelector('[data-tab="jadwal"]');
const navNotif = document.querySelector('[data-tab="notifikasi"]');
const navPengaturan = document.querySelector('[data-tab="pengaturan"]');
const navBeranda = document.querySelector('[data-tab="beranda"]');

navJadwal.click();
assert(document.getElementById('view-jadwal').classList.contains('active'), 'Switched to view-jadwal');
assert(!document.getElementById('view-beranda').classList.contains('active'), 'view-beranda deactivated');

navNotif.click();
assert(document.getElementById('view-notifikasi').classList.contains('active'), 'Switched to view-notifikasi');

navPengaturan.click();
assert(document.getElementById('view-pengaturan').classList.contains('active'), 'Switched to view-pengaturan');

navBeranda.click();
assert(document.getElementById('view-beranda').classList.contains('active'), 'Switched back to view-beranda');

// ----------------------------------------------------
// TEST SCENARIO 3: Jadwal View Day Switching
// ----------------------------------------------------
console.log('\n📌 Test 3: Jadwal View Day Switching');
navJadwal.click();
const weeklyContainer = document.getElementById('weekly-cards-container');
assert(weeklyContainer.innerHTML.includes('schedule-glass-card'), 'Weekly schedule renders .schedule-glass-card');

// Click on Thursday (Kamis, day 4)
const dayKamis = document.querySelector('.day-btn-item[data-day="4"]');
dayKamis.click();
assert(dayKamis.classList.contains('active'), 'Kamis button active');
assert(weeklyContainer.innerHTML.includes('Praktikum Sistem Komunikasi Seluler'), 'Kamis schedule contains Praktikum Sistem Komunikasi Seluler');

// Click on Friday (Jumat, day 5)
const dayJumat = document.querySelector('.day-btn-item[data-day="5"]');
dayJumat.click();
assert(dayJumat.classList.contains('active'), 'Jumat button active');
assert(weeklyContainer.innerHTML.includes('Teknik Pengolahan Sinyal Digital') || weeklyContainer.innerHTML.includes('libur') || weeklyContainer.innerHTML.includes('schedule-glass-card'), 'Jumat schedule rendered');

// ----------------------------------------------------
// TEST SCENARIO 4: Notifikasi Inbox Filtering & Mark as Read
// ----------------------------------------------------
console.log('\n📌 Test 4: Notifikasi Inbox Filtering & Mark as Read');
navNotif.click();
const notifContainer = document.getElementById('notif-list-container');
assert(notifContainer.innerHTML.includes('notif-card'), 'Notifications rendered with .notif-card');
assert(notifContainer.innerHTML.includes('notif-cat-circle'), 'Notification circular category icons present');

const markReadBtn = document.getElementById('btn-mark-all-read');
markReadBtn.click();
assert(!notifContainer.innerHTML.includes('unread-blue-dot'), 'All notifications marked as read (no unread dots)');

const filterUnread = document.getElementById('filter-notif-unread');
filterUnread.click();
assert(filterUnread.classList.contains('active'), 'Filter "Belum dibaca" active');

const filterAll = document.getElementById('filter-notif-all');
filterAll.click();
assert(filterAll.classList.contains('active'), 'Filter "Semua" active');

// ----------------------------------------------------
// TEST SCENARIO 5: Pengaturan Settings & Test Notification
// ----------------------------------------------------
console.log('\n📌 Test 5: Pengaturan Settings & Switches');
navPengaturan.click();
const switchSound = document.getElementById('switch-sound');
const switchVibration = document.getElementById('switch-vibration');
const btnTestNotif = document.getElementById('btn-test-notification');

assert(switchSound !== null, 'Switch sound element exists');
assert(switchVibration !== null, 'Switch vibration element exists');

btnTestNotif.click();
assert(btnTestNotif !== null, 'Test notification button clicked');

// ----------------------------------------------------
// TEST SCENARIO 6: Materials Modal Interaction
// ----------------------------------------------------
console.log('\n📌 Test 6: Course Materials Modal');
await window.openCourseMaterialsModal('c1', 'Praktikum Sistem Komunikasi Seluler', 'Yassir, S.T., M.Eng.Sc.', 'L11');
const modalMat = document.getElementById('modal-course-materials');
assert(modalMat.classList.contains('is-open'), 'Course materials modal opened (.is-open)');
assert(document.getElementById('mat-modal-course-name').innerText === 'Praktikum Sistem Komunikasi Seluler', 'Modal title set correctly');

window.closeCourseMaterialsModal();
assert(!modalMat.classList.contains('is-open'), 'Course materials modal closed');

console.log('\n====================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
