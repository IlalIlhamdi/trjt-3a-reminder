import { spawn } from 'node:child_process';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9242;

async function run() {
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_responsive',
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
  await new Promise((r) => setTimeout(r, 2000));

  await send('Runtime.evaluate', {
    expression: `
      document.querySelector('.bottom-nav .nav-item[data-tab="jadwal"]').click();
      document.querySelector('.day-btn-item[data-day="1"]').click();
    `
  });
  await new Promise((r) => setTimeout(r, 500));

  const viewports = [320, 360, 375, 390, 414, 430];
  const results = {};

  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 300));

    const check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const card = document.querySelector('.schedule-glass-card');
          const timeCol = card.querySelector('.schedule-time-col');
          const mainCol = card.querySelector('.schedule-card-main-col');
          const room = card.querySelector('.schedule-room-badge');
          const lecturer = card.querySelector('.schedule-lecturer-row');
          return {
            viewport: ${w},
            hasHorizontalScroll: docWidth > winWidth,
            docWidth,
            winWidth,
            timeColWidth: timeCol.getBoundingClientRect().width,
            mainColWidth: mainCol.getBoundingClientRect().width,
            roomOverflows: room.scrollWidth > room.clientWidth,
            cardHeight: card.getBoundingClientRect().height
          };
        })()
      `,
      returnByValue: true
    });

    results[w] = check.result.value;

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/schedule_card_${w}px.png`, Buffer.from(shot.data, 'base64'));
  }

  console.log(JSON.stringify(results, null, 2));

  // Also capture dark mode 390px
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    `
  });
  await new Promise((r) => setTimeout(r, 300));
  const shotDark = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`scratch/schedule_card_dark_390px.png`, Buffer.from(shotDark.data, 'base64'));

  ws.close();
  edgeProc.kill();
}

run().catch(console.error);
