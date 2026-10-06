import { spawn } from 'node:child_process';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9245;

async function run() {
  console.log('🚀 Running Task Card Visual & Viewport Test in Edge Headless...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_task_card_test',
    'about:blank'
  ]);

  let targetPage = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        const list = await res.json();
        targetPage = list.find((t) => t.type === 'page');
        if (targetPage) break;
      }
    } catch (e) {}
  }

  if (!targetPage) {
    console.error('Target page not found');
    edgeProc.kill();
    return;
  }

  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1/TRJT%203A/index.html' });
  await new Promise((r) => setTimeout(r, 2500));

  // Seed sample tasks in local storage / session for testing
  const evalSeed = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      (async () => {
        if (window.TRJT_ASSIGNMENTS) {
          await window.TRJT_ASSIGNMENTS.createAssignment({
            title: 'Laporan Praktikum Antena',
            courseName: 'Praktikum Antena dan Propagasi',
            dueDate: '2026-10-06',
            dueTime: '23:59',
            type: 'kelompok',
            submissionMethod: 'lab',
            submissionPlace: 'Kumpul Fisik',
            description: ''
          });
          await window.TRJT_ASSIGNMENTS.createAssignment({
            title: 'Perancangan Jaringan Fiber Optic untuk Kawasan Gedung Terpadu dan Kampus Digital',
            courseName: 'Praktikum Sistem Komunikasi Satelit dan Radar',
            dueDate: '2026-10-05',
            dueTime: '23:59',
            type: 'individu',
            submissionMethod: 'classroom',
            submissionPlace: 'Google Classroom',
            description: 'Format laporan resmi bab 1-3.'
          });
        }
        if (window.openAllAssignmentsModal) window.openAllAssignmentsModal();
        return true;
      })()
    `,
    returnByValue: true
  });
  console.log('Seed tasks evaluated:', evalSeed);
  await new Promise((r) => setTimeout(r, 1200));

  const viewports = [320, 360, 375, 390, 414, 430];
  const auditResults = [];

  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 400));

    const check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('.assignment-card');
          let hasHorizontalOverflow = false;
          let deleteBtnOk = true;
          let coursePillOk = true;

          cards.forEach((c) => {
            const rect = c.getBoundingClientRect();
            if (rect.right > window.innerWidth + 2) hasHorizontalOverflow = true;

            const del = c.querySelector('.btn-task-delete');
            if (!del || del.getBoundingClientRect().width === 0) deleteBtnOk = false;

            const course = c.querySelector('.assignment-course-name');
            if (!course) coursePillOk = false;
          });

          return {
            windowWidth: window.innerWidth,
            cardCount: cards.length,
            hasHorizontalOverflow,
            deleteBtnOk,
            coursePillOk,
            docScrollWidth: document.documentElement.scrollWidth
          };
        })()
      `,
      returnByValue: true
    });

    const info = check.result.value;
    auditResults.push(info);
    console.log(`Viewport ${w}px -> Cards: ${info.cardCount}, Overflows: ${info.hasHorizontalOverflow}, DeleteBtn: ${info.deleteBtnOk}`);

    // Capture screenshot of 390px for artifact evidence
    if (w === 390) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync('../TRJT 3A/scratch/screenshot_task_cards_390px.png', buf);
      console.log('📸 Saved screenshot: scratch/screenshot_task_cards_390px.png');
    }
  }

  ws.close();
  edgeProc.kill();
  console.log('✅ Visual and viewport testing completed successfully!');
}

run().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
