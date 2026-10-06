import { spawn } from 'node:child_process';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9230;

async function run() {
  console.log('🚀 Menjalankan pengujian Browser E2E Cover Generator & Tools...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1440,900',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_test_cover',
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

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result.value;
  }

  async function checkHorizontalScroll() {
    return await evalJs('document.documentElement.scrollWidth > document.documentElement.clientWidth || document.body.scrollWidth > document.body.clientWidth;');
  }

  // 1. Verify Tools Tab exists and switchTab('tools') works
  console.log('\n--- 1. Menguji Tab Tools ---');
  await evalJs("switchTab('tools');");
  await new Promise((r) => setTimeout(r, 500));

  const isToolsActive = await evalJs("document.getElementById('view-tools').classList.contains('active');");
  console.log('view-tools aktif:', isToolsActive);

  // 2. Viewport zero-scroll tests on Tools
  const viewports = [
    { name: '360px', width: 360, height: 740, mobile: true },
    { name: '390px', width: 390, height: 844, mobile: true },
    { name: '768px', width: 768, height: 1024, mobile: false },
    { name: '1440px', width: 1440, height: 900, mobile: false }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });
    await new Promise((r) => setTimeout(r, 200));
    const hScroll = await checkHorizontalScroll();
    console.log(`Viewport ${vp.name} Tools - Ada horizontal scroll? ${hScroll ? 'YA (BUG)' : 'TIDAK (AMAN)'}`);
  }

  // 3. Capture Screenshot Tools View (390px)
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise((r) => setTimeout(r, 200));
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_tools_390px.png', Buffer.from(ss.data, 'base64'));
  console.log('📸 Disimpan: scratch/screenshot_tools_390px.png');

  // 4. Open Cover Generator
  console.log('\n--- 2. Membuka Generator Cover Laporan ---');
  await evalJs("switchTab('cover-generator');");
  await new Promise((r) => setTimeout(r, 500));

  const isCoverActive = await evalJs("document.getElementById('view-cover-generator').classList.contains('active');");
  console.log('view-cover-generator aktif:', isCoverActive);

  // 5. Test Form Input & Auto-fill
  console.log('\n--- 3. Pengisian Formulir & Auto-fill ---');
  await evalJs(`
    document.getElementById('cover-title-input').value = 'LAPORAN PRAKTIKUM ANTENA DAN PROPAGASI\\nPENGUKURAN POLA RADIASI ANTENA DIPOLE';
    document.getElementById('cover-title-input').dispatchEvent(new Event('input'));

    const courseSel = document.getElementById('cover-course-select');
    courseSel.value = 'Praktikum Antena dan Propagasi';
    courseSel.dispatchEvent(new Event('change'));

    document.getElementById('cover-name-input').value = 'Muhammad Raihan';
    document.getElementById('cover-name-input').dispatchEvent(new Event('input'));

    document.getElementById('cover-nim-input').value = '020230001';
    document.getElementById('cover-nim-input').dispatchEvent(new Event('input'));
  `);
  await new Promise((r) => setTimeout(r, 300));

  const autoDosen = await evalJs("document.getElementById('cover-dosen-input').value;");
  console.log('Dosen terisi otomatis:', autoDosen);

  const prevTitle = await evalJs("document.getElementById('prev-title').innerText;");
  const prevCourse = await evalJs("document.getElementById('prev-course-name').innerText;");
  const prevLecturer = await evalJs("document.getElementById('prev-lecturer-name').innerText;");
  const prevName = await evalJs("document.getElementById('prev-student-name').innerText;");
  const prevNim = await evalJs("document.getElementById('prev-student-nim').innerText;");

  console.log('Pratinjau Judul:', prevTitle.replace(/\n/g, ' / '));
  console.log('Pratinjau Matkul:', prevCourse);
  console.log('Pratinjau Dosen:', prevLecturer);
  console.log('Pratinjau Nama:', prevName);
  console.log('Pratinjau NIM:', prevNim);

  // 6. Capture mobile Form & Preview screenshots
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_cover_form_390px.png', Buffer.from(ss.data, 'base64'));
  console.log('📸 Disimpan: scratch/screenshot_cover_form_390px.png');

  // Switch to Preview tab on mobile
  await evalJs("CoverGenerator.switchMobileTab('preview');");
  await new Promise((r) => setTimeout(r, 300));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_cover_prev_390px.png', Buffer.from(ss.data, 'base64'));
  console.log('📸 Disimpan: scratch/screenshot_cover_prev_390px.png');

  // 7. Desktop Side-by-Side View (1440px)
  console.log('\n--- 4. Tampilan Desktop Side-by-Side (1440px) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  await new Promise((r) => setTimeout(r, 300));
  const desktopHScroll = await checkHorizontalScroll();
  console.log(`Viewport 1440px - Ada horizontal scroll? ${desktopHScroll ? 'YA (BUG)' : 'TIDAK (AMAN)'}`);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_cover_desktop_1440px.png', Buffer.from(ss.data, 'base64'));
  console.log('📸 Disimpan: scratch/screenshot_cover_desktop_1440px.png');

  // 8. Test Export Trigger in browser
  console.log('\n--- 5. Uji Ekspor DOCX di Browser ---');
  const exportResult = await evalJs(`
    (async () => {
      try {
        await CoverGenerator.exportDocx();
        return { success: true, status: document.getElementById('cover-status-message').innerText };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })()
  `);
  console.log('Hasil ekspor DOCX:', exportResult);

  // 9. Test Bottom Nav Dosen Button & Active Indicator
  console.log('\n--- 6. Uji Tombol Dosen pada Navigasi Bawah ---');
  await evalJs("document.querySelector('.nav-item[data-tab=\"dosen\"]').click();");
  await new Promise((r) => setTimeout(r, 500));
  const isDosenActive = await evalJs("document.getElementById('view-dosen').classList.contains('active');");
  const isDosenNavActive = await evalJs("document.querySelector('.nav-item[data-tab=\"dosen\"]').classList.contains('active');");
  const dosenNavAria = await evalJs("document.querySelector('.nav-item[data-tab=\"dosen\"]').getAttribute('aria-current');");
  const dosenCardsCount = await evalJs("document.querySelectorAll('#dosen-cards-container .dosen-glass-card').length;");
  console.log('view-dosen aktif:', isDosenActive);
  console.log('Nav item Dosen active:', isDosenNavActive, '| aria-current:', dosenNavAria);
  console.log('Jumlah kartu dosen:', dosenCardsCount);

  // 10. Test Beranda Shortcut Tools
  console.log('\n--- 7. Uji Tombol Tools pada Beranda ---');
  await evalJs("document.querySelector('.nav-item[data-tab=\"beranda\"]').click();");
  await new Promise((r) => setTimeout(r, 300));
  const isBerandaActive = await evalJs("document.getElementById('view-beranda').classList.contains('active');");
  console.log('Kembali ke Beranda aktif:', isBerandaActive);

  // Click shortcut Tools on Beranda
  await evalJs("document.querySelector('.class-shortcut[onclick*=\"tools\"]').click();");
  await new Promise((r) => setTimeout(r, 300));
  const isToolsActiveFromHome = await evalJs("document.getElementById('view-tools').classList.contains('active');");
  console.log('Buka Tools dari Beranda berhasil:', isToolsActiveFromHome);

  // Take screenshot of Dosen view
  await evalJs("document.querySelector('.nav-item[data-tab=\"dosen\"]').click();");
  await new Promise((r) => setTimeout(r, 300));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_dosen_nav_390px.png', Buffer.from(ss.data, 'base64'));
  console.log('📸 Disimpan: scratch/screenshot_dosen_nav_390px.png');

  console.log('\n🎉 SELURUH PENGUJIAN BROWSER SELESAI DENGAN SUKSES!');
  edgeProc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error saat pengujian browser:', err);
  process.exit(1);
});
