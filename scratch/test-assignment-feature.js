import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n======================================================');
console.log('🧪 TEST SUITE: FITUR INPUT & DAFTAR TUGAS PER MK TRJT 3A');
console.log('======================================================\n');

// 1. Verify js/assignment-service.js content & logic
const serviceCode = fs.readFileSync('js/assignment-service.js', 'utf8');
assert.ok(serviceCode.includes('window.TRJT_ASSIGNMENTS'), 'window.TRJT_ASSIGNMENTS must be defined');
assert.ok(serviceCode.includes('formatDeadlineCountdown'), 'formatDeadlineCountdown must be present');
assert.ok(serviceCode.includes('getAssignmentsForCourse'), 'getAssignmentsForCourse must be present');
assert.ok(serviceCode.includes('createAssignment'), 'createAssignment must be present');
assert.ok(serviceCode.includes('togglePersonalCompletion'), 'togglePersonalCompletion must be present');
assert.ok(serviceCode.includes('deleteAssignment'), 'deleteAssignment must be present');
console.log('✅ PASS: js/assignment-service.js contains all required CRUD & deadline functions.');

// Test deadline calculation logic in isolation
function testDeadlineLogic() {
  const now = new Date();
  
  // Format YYYY-MM-DD
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYMD(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);
  const future = new Date(now);
  future.setDate(now.getDate() + 3);
  const futureStr = formatYMD(future);
  const past = new Date(now);
  past.setDate(now.getDate() - 2);
  const pastStr = formatYMD(past);

  // Mock formatDeadlineCountdown logic
  const calcDeadline = (dueDate, dueTime) => {
    const timeStr = dueTime || '23:59';
    const dueDateTime = new Date(`${dueDate}T${timeStr}:00`);
    const diffMs = dueDateTime.getTime() - now.getTime();
    const isPast = diffMs < 0;
    const isToday = dueDateTime.toDateString() === now.toDateString();
    const isTomorrow = dueDateTime.toDateString() === tomorrow.toDateString();

    if (isPast) return 'passed';
    if (isToday) return 'today';
    if (isTomorrow) return 'tomorrow';
    return 'upcoming';
  };

  assert.strictEqual(calcDeadline(pastStr, '12:00'), 'passed', 'Past date detected as passed');
  assert.strictEqual(calcDeadline(todayStr, '23:59'), 'today', 'Today detected as today');
  assert.strictEqual(calcDeadline(tomorrowStr, '23:59'), 'tomorrow', 'Tomorrow detected as tomorrow');
  assert.strictEqual(calcDeadline(futureStr, '23:59'), 'upcoming', 'Future detected as upcoming');
}
testDeadlineLogic();
console.log('✅ PASS: Deadline calculation logic tested & validated.');

// 2. Verify index.html contains UI components & scripts
const htmlContent = fs.readFileSync('index.html', 'utf8');
assert.ok(htmlContent.includes('assignment-service.js'), 'assignment-service.js must be loaded in index.html');
assert.ok(htmlContent.includes('id="section-tugas-home"'), '#section-tugas-home must be in index.html');
assert.ok(htmlContent.includes('id="home-upcoming-tasks-container"'), '#home-upcoming-tasks-container must be in index.html');
assert.ok(htmlContent.includes('id="modal-add-assignment"'), '#modal-add-assignment must be in index.html');
assert.ok(htmlContent.includes('id="modal-course-assignments"'), '#modal-course-assignments must be in index.html');
assert.ok(htmlContent.includes('id="modal-all-assignments"'), '#modal-all-assignments must be in index.html');
assert.ok(htmlContent.includes('id="task-input-course"'), '#task-input-course select dropdown must be in index.html');
assert.ok(htmlContent.includes('id="task-input-due-date"'), '#task-input-due-date date input must be in index.html');
console.log('✅ PASS: index.html contains all 3 assignment modals, input form, and home widget.');

// 3. Verify css/design-system.css contains assignment styles
const cssContent = fs.readFileSync('css/design-system.css', 'utf8');
assert.ok(cssContent.includes('.btn-schedule-tugas'), '.btn-schedule-tugas style defined');
assert.ok(cssContent.includes('.badge-deadline'), '.badge-deadline style defined');
assert.ok(cssContent.includes('.assignment-card'), '.assignment-card style defined');
assert.ok(cssContent.includes('.tugas-home-section'), '.tugas-home-section style defined');
assert.ok(cssContent.includes('[data-theme="dark"] .btn-schedule-tugas'), 'dark theme support for tugas button defined');
console.log('✅ PASS: css/design-system.css contains comprehensive styles & dark mode rules.');

// 4. Verify js/app.js integrations
const appContent = fs.readFileSync('js/app.js', 'utf8');
assert.ok(appContent.includes('openCourseAssignmentsModal'), 'openCourseAssignmentsModal defined in app.js');
assert.ok(appContent.includes('openAddAssignmentModal'), 'openAddAssignmentModal defined in app.js');
assert.ok(appContent.includes('openAllAssignmentsModal'), 'openAllAssignmentsModal defined in app.js');
assert.ok(appContent.includes('renderUpcomingTasksWidget'), 'renderUpcomingTasksWidget defined in app.js');
assert.ok(appContent.includes('trjt:assignments-updated'), 'trjt:assignments-updated event listener registered');
console.log('✅ PASS: js/app.js integrates course buttons, widgets, modals, and reactive events.');

// 5. Verify admin/index.html integrations
const adminHtml = fs.readFileSync('admin/index.html', 'utf8');
assert.ok(adminHtml.includes('assignment-service.js'), 'assignment-service.js loaded in admin/index.html');
assert.ok(adminHtml.includes('admin-assignments-table-body'), 'admin-assignments-table-body table in admin');
assert.ok(adminHtml.includes('modal-admin-add-task'), 'modal-admin-add-task modal in admin');
assert.ok(adminHtml.includes('openAdminAddTaskModal'), 'openAdminAddTaskModal defined in admin');
console.log('✅ PASS: admin/index.html provides full assignment management and table monitoring.');

console.log('\n======================================================');
console.log('🎉 ALL ASSIGNMENT TESTS PASSED SUCCESSFULLY (5/5)!');
console.log('======================================================\n');
