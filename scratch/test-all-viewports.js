import { spawn } from 'node:child_process';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9229;

async function run() {
  console.log('🚀 Menjalankan pengujian multi-viewport dan multi-view di Edge headless...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,900',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_test_all',
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
    console.error('Target page tidak ditemukan');
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
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1/TRJT%203A/index.html' });
  await new Promise((r) => setTimeout(r, 2000));

  async function checkHorizontalScroll() {
    const res = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollWidth > document.documentElement.clientWidth || document.body.scrollWidth > document.body.clientWidth;',
      returnByValue: true
    });
    return res.result.value;
  }

  const viewports = [
    { name: '360px', width: 360, height: 740, mobile: true },
    { name: '390px', width: 390, height: 844, mobile: true },
    { name: '430px', width: 430, height: 932, mobile: true },
    { name: '768px', width: 768, height: 1024, mobile: false },
    { name: '1280px', width: 1280, height: 900, mobile: false }
  ];

  // 1. Capture Beranda across all viewports
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });
    await new Promise((r) => setTimeout(r, 300));

    const hasHScroll = await checkHorizontalScroll();
    console.log(`Viewport ${vp.name} - Ada horizontal scroll? ${hasHScroll ? 'YA (BUG)' : 'TIDAK (AMAN)'}`);

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/view_beranda_${vp.name}.png`, Buffer.from(ss.data, 'base64'));
    console.log(`📸 Disimpan: scratch/view_beranda_${vp.name}.png`);
  }

  // Set back to 390px for detailed view inspections
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 300));

  // 2. Click Jadwal tab
  console.log('📱 Menguji tab Jadwal...');
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=jadwal]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssJadwal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_jadwal_390px.png', Buffer.from(ssJadwal.data, 'base64'));
  console.log('📸 Disimpan: scratch/view_jadwal_390px.png');

  // Test 360px on Jadwal
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 740,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 300));
  const hasHScrollJadwal360 = await checkHorizontalScroll();
  console.log(`Jadwal 360px - Ada horizontal scroll? ${hasHScrollJadwal360 ? 'YA (BUG)' : 'TIDAK (AMAN)'}`);
  const ssJadwal360 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_jadwal_360px.png', Buffer.from(ssJadwal360.data, 'base64'));
  console.log('📸 Disimpan: scratch/view_jadwal_360px.png');

  // Reset to 390px for further tests
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 300));

  // Test selecting day 2 (Selasa) and day 3 (Rabu)
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-day=\"3\"]').click();"
  });
  await new Promise((r) => setTimeout(r, 400));
  const ssJadwalRab = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_jadwal_rabu_390px.png', Buffer.from(ssJadwalRab.data, 'base64'));

  // 3. Click Notifikasi tab
  console.log('📱 Menguji tab Notifikasi...');
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=notifikasi]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssNotif = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_notifikasi_390px.png', Buffer.from(ssNotif.data, 'base64'));

  // 4. Click Dosen tab
  console.log('📱 Menguji tab Dosen...');
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=dosen]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssDosen = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_dosen_390px.png', Buffer.from(ssDosen.data, 'base64'));

  // 5. Click Pengaturan tab
  console.log('📱 Menguji tab Pengaturan...');
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=pengaturan]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssPengaturan = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_pengaturan_390px.png', Buffer.from(ssPengaturan.data, 'base64'));

  // 6. Test Dark Mode
  console.log('🌙 Menguji tema Dark Mode...');
  await send('Runtime.evaluate', {
    expression: "document.documentElement.setAttribute('data-theme', 'dark');"
  });
  await new Promise((r) => setTimeout(r, 400));
  const ssDarkSettings = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_dark_pengaturan_390px.png', Buffer.from(ssDarkSettings.data, 'base64'));

  // Dark Mode Beranda
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=beranda]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssDarkBeranda = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_dark_beranda_390px.png', Buffer.from(ssDarkBeranda.data, 'base64'));

  // Dark Mode Jadwal
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=jadwal]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssDarkJadwal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_dark_jadwal_390px.png', Buffer.from(ssDarkJadwal.data, 'base64'));

  // 7. Test Desktop Jadwal (1280px)
  await send('Runtime.evaluate', {
    expression: "document.documentElement.setAttribute('data-theme', 'light');"
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssDesktopJadwal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_desktop_jadwal_1280px.png', Buffer.from(ssDesktopJadwal.data, 'base64'));

  // Desktop Beranda (1280px)
  await send('Runtime.evaluate', {
    expression: "document.querySelector('[data-tab=beranda]').click();"
  });
  await new Promise((r) => setTimeout(r, 500));
  const ssDesktopBeranda = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_desktop_beranda_1280px.png', Buffer.from(ssDesktopBeranda.data, 'base64'));

  ws.close();
  edgeProc.kill();
  console.log('✅ Semua pengujian selesai!');
}

run().catch(console.error);
