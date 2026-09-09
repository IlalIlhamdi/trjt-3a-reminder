import fs from 'fs';
import assert from 'assert';

console.log('Testing DOM button bindings and version alignments in index.html and app.js...');

const indexHtml = fs.readFileSync('c:/laragon/www/TRJT 3A/index.html', 'utf-8');
const appJs = fs.readFileSync('c:/laragon/www/TRJT 3A/js/app.js', 'utf-8');
const css = fs.readFileSync('c:/laragon/www/TRJT 3A/css/design-system.css', 'utf-8');

// 1. Check btn-course-task-add onclick
assert.ok(!indexHtml.includes('activeCourseTaskCourse ?'), 'No dangerous inline activeCourseTaskCourse reference in index.html');
assert.ok(indexHtml.includes('id="btn-course-task-add" class="btn-schedule-tugas" style="padding: 6px 10px; font-size: 12px;" onclick="openAddAssignmentModal()"'), 'btn-course-task-add has clean openAddAssignmentModal() call');

// 2. Check modal z-index
assert.ok(css.includes('#modal-add-assignment') && css.includes('z-index: 150 !important;'), 'CSS sets z-index 150 !important for modal-add-assignment');
assert.ok(indexHtml.includes('#modal-add-assignment') && indexHtml.includes('z-index: 150 !important;'), 'Inline CSS sets z-index 150 for modal-add-assignment');

// 3. Check toast-container position
const viewPengaturanEnd = indexHtml.indexOf('</section>') !== -1 
  ? indexHtml.indexOf('</section>', indexHtml.indexOf('id="view-pengaturan"')) 
  : -1;
const toastPos = indexHtml.indexOf('id="toast-container"');
assert.ok(viewPengaturanEnd !== -1 && toastPos > viewPengaturanEnd, 'toast-container is placed AFTER view-pengaturan');

// 4. Check versions are bumped to 6.0
assert.ok(indexHtml.includes('design-system.css?v=6.0'), 'design-system.css uses v=6.0');
assert.ok(indexHtml.includes('app.js?v=6.0'), 'app.js uses v=6.0');
assert.ok(indexHtml.includes('assignment-service.js?v=6.0'), 'assignment-service.js uses v=6.0');
assert.ok(!indexHtml.includes('?v=5.4') && !indexHtml.includes('?v=5.5') && !indexHtml.includes('?v=5.6') && !indexHtml.includes('?v=5.7') && !indexHtml.includes('?v=5.8') && !indexHtml.includes('?v=5.9'), 'No old versions remaining in index.html');

// 5. Check app.js declarations
assert.ok(appJs.includes('window.activeCourseTaskCourse = null;'), 'window.activeCourseTaskCourse initialized in app.js');
assert.ok(appJs.includes('isSavingAssignment'), 'isSavingAssignment lock exists in app.js');

console.log('✅ ALL DOM AND BINDING CHECKS PASSED PERFECTLY!');
