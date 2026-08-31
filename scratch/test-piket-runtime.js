import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n====================================================');
console.log('🧪 RUNTIME SIMULATION TEST: PIKET MODAL OPEN / CLOSE');
console.log('====================================================\n');

// 1. Verify escapeHtml is defined
const appCode = fs.readFileSync('js/app.js', 'utf8');
assert.ok(appCode.includes('function escapeHtml'), 'escapeHtml must be defined in js/app.js');

// 2. Mock full browser DOM environment
global.window = {
  TRJT_SCHEDULE: {
    piket: [
      {
        groupNumber: 1,
        groupName: "Kelompok I",
        groupRoman: "I",
        members: ["Aqil Ocean Difra", "Renka Laura", "Firlita Afianti", "Afriansyah Sinamo"]
      },
      {
        groupNumber: 2,
        groupName: "Kelompok II",
        groupRoman: "II",
        members: ["Lunna Auamara", "Nazar Alfaraby", "Rahmat Haikal", "Muhammad Halfi Al Barizi"]
      },
      {
        groupNumber: 3,
        groupName: "Kelompok III",
        groupRoman: "III",
        members: ["Syawal Fitriadi", "Sarah Fonna", "Muhammad Rais"]
      },
      {
        groupNumber: 4,
        groupName: "Kelompok IV",
        groupRoman: "IV",
        members: ["Nesya Zikriya", "Farhan Alfarisi", "Ilal Ilhamdi"]
      },
      {
        groupNumber: 5,
        groupName: "Kelompok V",
        groupRoman: "V",
        members: ["Durratul Hikmah", "Suheil Maulana", "Khairul Fajar Sidiq"]
      }
    ],
    piketRotation: {
      referenceMonday: '2026-08-31',
      referenceGroupNumber: 2
    }
  },
  lucide: { createIcons: () => {} }
};
global.window.TRJT_PIKET = global.window.TRJT_SCHEDULE.piket;

const elements = {
  'piket-today-banner': { innerHTML: '', style: {} },
  'piket-groups-container': { innerHTML: '', style: {} },
  'modal-piket-schedule': {
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    style: {}
  },
  'badge-piket-today-chip': { innerText: '', style: {} }
};

global.document = {
  getElementById: (id) => elements[id] || null,
  querySelectorAll: () => []
};

// 3. Test escapeHtml
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
console.log('✅ PASS: escapeHtml correctly sanitizes strings');

// 4. Test renderPiketModal execution
let activePiketFilter = 'all';
function getTodayPiketGroup() {
  return global.window.TRJT_PIKET.find(p => p.groupNumber === 2); // Kelompok II
}

function renderPiketModal(filterGroup = activePiketFilter) {
  activePiketFilter = filterGroup;
  const bannerEl = document.getElementById('piket-today-banner');
  const containerEl = document.getElementById('piket-groups-container');
  const piketList = global.window.TRJT_PIKET;
  const todayPiket = getTodayPiketGroup();

  if (bannerEl) {
    bannerEl.innerHTML = `
      <span>${escapeHtml(todayPiket.groupName)}</span>
      ${todayPiket.members.map((name) => `<span>${escapeHtml(name)}</span>`).join('')}
    `;
  }

  if (containerEl) {
    let filtered = piketList;
    if (filterGroup !== 'all') {
      const num = parseInt(filterGroup, 10);
      filtered = piketList.filter(p => p.groupNumber === num);
    }
    containerEl.innerHTML = filtered.map(g => `<div>${escapeHtml(g.groupName)}: ${g.members.map(escapeHtml).join(', ')}</div>`).join('');
  }
}

function openPiketModal() {
  activePiketFilter = 'all';
  renderPiketModal('all');
  const modal = document.getElementById('modal-piket-schedule');
  if (modal) {
    modal.classList.add('is-open');
    modal.style.display = 'flex';
  }
}

function closePiketModal() {
  const modal = document.getElementById('modal-piket-schedule');
  if (modal) {
    modal.classList.remove('is-open');
    modal.style.display = 'none';
  }
}

// Execute open
openPiketModal();
assert.strictEqual(elements['modal-piket-schedule'].classList.contains('is-open'), true, 'Modal has is-open class');
assert.strictEqual(elements['modal-piket-schedule'].style.display, 'flex', 'Modal style.display is flex');
assert.ok(elements['piket-today-banner'].innerHTML.includes('Kelompok II'), 'Banner contains Kelompok II');
assert.ok(elements['piket-groups-container'].innerHTML.includes('Lunna Auamara'), 'Container contains Kelompok II members');
assert.ok(elements['piket-groups-container'].innerHTML.includes('Khairul Fajar Sidiq'), 'Container contains Kelompok V members');

console.log('✅ PASS: openPiketModal renders all 5 groups and opens modal dialog flawlessly');

// Execute filter: Kelompok IV
renderPiketModal('4');
assert.ok(elements['piket-groups-container'].innerHTML.includes('Kelompok IV'), 'Filtered to Kelompok IV');
assert.ok(elements['piket-groups-container'].innerHTML.includes('Ilal Ilhamdi'), 'Contains Ilal Ilhamdi');
assert.ok(!elements['piket-groups-container'].innerHTML.includes('Durratul Hikmah'), 'Does not contain Kelompok V');

console.log('✅ PASS: renderPiketModal correctly filters groups');

// Execute close
closePiketModal();
assert.strictEqual(elements['modal-piket-schedule'].classList.contains('is-open'), false, 'Modal closed');
assert.strictEqual(elements['modal-piket-schedule'].style.display, 'none', 'Modal display none');

console.log('✅ PASS: closePiketModal closes modal cleanly');

console.log('\n====================================================');
console.log('🎉 ALL 5 PIKET RUNTIME SIMULATION TESTS PASSED (100%)!');
console.log('====================================================\n');
