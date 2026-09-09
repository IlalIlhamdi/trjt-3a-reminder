import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n======================================================');
console.log('🧪 RUNTIME SIMULATION: FULL ASSIGNMENT LIFECYCLE');
console.log('======================================================\n');

// Mock localStorage
const mockStorage = {};
const localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

// Mock browser globals
globalThis.localStorage = localStorage;
globalThis.window = globalThis;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};
globalThis.dispatchEvent = () => {};

// Evaluate js/assignment-service.js
const serviceCode = fs.readFileSync('js/assignment-service.js', 'utf8');
eval(serviceCode);

const service = globalThis.window.TRJT_ASSIGNMENTS;
assert.ok(service, 'TRJT_ASSIGNMENTS must be initialized on window');

// Test 1: Clean initial state (no dummy tasks)
const initialList = service.getAllAssignments();
console.log(`📦 Loaded ${initialList.length} initial assignments.`);
assert.strictEqual(initialList.length, 0, 'Clean initial state should have 0 assignments');

// Test 3: Create a new assignment
console.log('➕ Creating a new assignment for Teknik Instalasi Fiber Optik...');
const newTask = await service.createAssignment({
  courseName: 'Teknik Instalasi Fiber Optik',
  title: 'Laporan Splicing Kabel FO Core 12',
  dueDate: '2026-09-15',
  dueTime: '23:59',
  type: 'individu',
  submissionMethod: 'lab',
  submissionPlace: 'Lab. Transmisi L23',
  description: 'Format laporan resmi, lampirkan data redaman hasil OTDR.',
  createdBy: 'Mahasiswa TRJT 3A'
});

assert.ok(newTask && newTask.id, 'New task must have an ID');
assert.strictEqual(newTask.title, 'Laporan Splicing Kabel FO Core 12');

const foTasks = service.getAssignmentsForCourse('Teknik Instalasi Fiber Optik');
assert.ok(foTasks.some(t => t.id === newTask.id), 'New task must be present in course query');
console.log('✅ PASS: Assignment creation & course querying verified.');

// Test 4: Upcoming tasks sorting
const upcoming = service.getUpcomingAssignments(5);
console.log(`⏰ Upcoming active tasks count: ${upcoming.length}`);
assert.ok(upcoming.length > 0, 'Should have upcoming tasks');

// Test 5: Personal task completion toggle
assert.strictEqual(service.isPersonalCompleted(newTask.id), false, 'Initially not completed');
const nowDone = service.togglePersonalCompletion(newTask.id);
assert.strictEqual(nowDone, true, 'Toggled to true');
assert.strictEqual(service.isPersonalCompleted(newTask.id), true, 'Is marked completed');

// Verify it is excluded from upcoming active tasks
const upcomingAfter = service.getUpcomingAssignments(5);
assert.ok(!upcomingAfter.some(t => t.id === newTask.id), 'Completed task must be excluded from upcoming widget');
console.log('✅ PASS: Personal task completion toggle & persistence verified.');

// Toggle back to incomplete
service.togglePersonalCompletion(newTask.id);
assert.strictEqual(service.isPersonalCompleted(newTask.id), false, 'Toggled back to incomplete');

// Test 6: Delete assignment
console.log('🗑️ Deleting task...');
const deleted = await service.deleteAssignment(newTask.id);
assert.strictEqual(deleted, true, 'Delete returns true');
const foTasksAfterDelete = service.getAssignmentsForCourse('Teknik Instalasi Fiber Optik');
assert.ok(!foTasksAfterDelete.some(t => t.id === newTask.id), 'Task should no longer exist after delete');
console.log('✅ PASS: Assignment deletion verified.');

// Test 7: Deadline format calculation test
const deadlineToday = service.formatDeadlineCountdown(new Date().toISOString().split('T')[0], '23:59');
console.log(`📅 Today deadline formatting: "${deadlineToday.text}" (Urgency: ${deadlineToday.urgency})`);
assert.strictEqual(deadlineToday.urgency, 'critical');

console.log('\n======================================================');
console.log('🎉 RUNTIME SIMULATION TEST PASSED COMPLETELY (100%)!');
console.log('======================================================\n');
