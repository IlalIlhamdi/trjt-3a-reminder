import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9251;

async function run() {
  console.log('🚀 Running Comprehensive TRJT 3A Galeri Test in Edge Headless...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_gallery_test_v2',
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
    console.error('Target page not found in Edge debugging session');
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

  const results = [];
  function assert(title, condition, details = '') {
    results.push({ title, pass: !!condition, details });
    const mark = condition ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${title} ${details ? '(' + details + ')' : ''}`);
  }

  // TEST 1: Bottom Navigation structure
  const navEvaluation = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const navItems = Array.from(document.querySelectorAll('.bottom-nav .nav-item')).map(btn => ({
        tab: btn.getAttribute('data-tab'),
        label: btn.querySelector('.nav-label')?.innerText.trim(),
        isPrimary: btn.classList.contains('nav-primary'),
        icon: btn.querySelector('svg')?.getAttribute('data-lucide') || btn.querySelector('i')?.getAttribute('data-lucide')
      }));
      return navItems;
    })()`
  });

  const navs = navEvaluation.result.value || [];
  assert('Bottom Navigation has 5 items', navs.length === 5, `found ${navs.length}`);
  const centerItem = navs[2];
  assert('Center navigation tab is galeri', centerItem?.tab === 'galeri', centerItem?.tab);
  assert('Center navigation label is Galeri', centerItem?.label === 'Galeri', centerItem?.label);
  assert('Center navigation has nav-primary floating style', centerItem?.isPrimary === true);

  // TEST 2: Switching to Galeri Tab
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.bottom-nav .nav-item[data-tab="galeri"]').click();`
  });
  await new Promise((r) => setTimeout(r, 500));

  const galeriTabActive = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const viewGaleri = document.getElementById('view-galeri');
      const galeriBtn = document.querySelector('.bottom-nav .nav-item[data-tab="galeri"]');
      return {
        viewActive: viewGaleri?.classList.contains('active'),
        btnActive: galeriBtn?.classList.contains('active')
      };
    })()`
  });
  assert('View Galeri is active when center tab is tapped', galeriTabActive.result.value?.viewActive);
  assert('Center button is marked active', galeriTabActive.result.value?.btnActive);

  // TEST 3: Galeri Header, Title, Subtitle, and Upload Button
  const galeriHeader = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const title = document.querySelector('#view-galeri .view-page-title')?.innerText.trim();
      const subtitle = document.querySelector('#view-galeri .notif-subtitle-text')?.innerText.trim();
      const uploadBtn = document.getElementById('btn-gallery-upload-trigger');
      const btnStyle = uploadBtn ? window.getComputedStyle(uploadBtn) : null;
      return {
        title,
        subtitle,
        hasUploadBtn: !!uploadBtn,
        uploadBtnBg: btnStyle?.backgroundColor,
        uploadBtnColor: btnStyle?.color
      };
    })()`
  });
  assert('Header title is "Galeri Kelas"', galeriHeader.result.value?.title === 'Galeri Kelas', galeriHeader.result.value?.title);
  assert('Header subtitle is "Dokumentasi kegiatan TRJT 3A"', galeriHeader.result.value?.subtitle === 'Dokumentasi kegiatan TRJT 3A');
  assert('Header has Upload button', galeriHeader.result.value?.hasUploadBtn);

  // TEST 4: Schedule preservation test
  await send('Runtime.evaluate', {
    expression: `window.switchTab('jadwal');`
  });
  await new Promise((r) => setTimeout(r, 400));
  const jadwalCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const viewJadwal = document.getElementById('view-jadwal');
      const weeklyCards = document.querySelectorAll('#weekly-cards-container .schedule-glass-card');
      return {
        jadwalActive: viewJadwal?.classList.contains('active'),
        cardsCount: weeklyCards.length
      };
    })()`
  });
  assert('Switching to jadwal retains schedule view', jadwalCheck.result.value?.jadwalActive);
  assert('Weekly schedule cards rendered properly', jadwalCheck.result.value?.cardsCount > 0, `${jadwalCheck.result.value?.cardsCount} cards`);

  // Switch back to Galeri
  await send('Runtime.evaluate', {
    expression: `window.switchTab('galeri');`
  });
  await new Promise((r) => setTimeout(r, 400));

  // TEST 5: Test Empty State (0 Photos)
  await send('Runtime.evaluate', {
    expression: `window.TRJT_GALLERY.clearPhotos();`
  });
  await new Promise((r) => setTimeout(r, 300));
  const emptyCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const empty = document.getElementById('gallery-empty-state');
      const grid = document.getElementById('gallery-grid-container');
      const emptyTitle = empty?.querySelector('.gallery-empty-title')?.innerText.trim();
      const emptyDesc = empty?.querySelector('.gallery-empty-desc')?.innerText.trim();
      const uploadEmptyBtn = document.getElementById('btn-gallery-empty-upload');
      return {
        emptyVisible: empty && window.getComputedStyle(empty).display !== 'none',
        gridHidden: grid && window.getComputedStyle(grid).display === 'none',
        emptyTitle,
        emptyDesc,
        hasEmptyUploadBtn: !!uploadEmptyBtn
      };
    })()`
  });
  assert('0 photos triggers empty state', emptyCheck.result.value?.emptyVisible);
  assert('Empty state title is "Belum ada foto"', emptyCheck.result.value?.emptyTitle === 'Belum ada foto');
  assert('Empty state description is "Dokumentasi kelas akan tampil di sini."', emptyCheck.result.value?.emptyDesc === 'Dokumentasi kelas akan tampil di sini.');
  assert('Empty state has "+ Upload Foto" button', emptyCheck.result.value?.hasEmptyUploadBtn);

  // TEST 6: Test 5 Photos Rendering in 2-Column Mobile Grid
  await send('Runtime.evaluate', {
    expression: `
      window.TRJT_GALLERY.setPhotos([
        { id: 'p1', name: 'TRJT3A_20261001_01.jpg', caption: 'Praktikum Antena Rooftop', createdAt: '2026-10-01T10:00:00Z', thumbnailUrl: './assets/images/campus-inspired-banner.png', imageUrl: './assets/images/campus-inspired-banner.png' },
        { id: 'p2', name: 'TRJT3A_20261001_02.jpg', caption: 'Splicing Fiber Optic', createdAt: '2026-10-01T11:00:00Z', thumbnailUrl: './assets/images/campus-inspired-banner.png', imageUrl: './assets/images/campus-inspired-banner.png' },
        { id: 'p3', name: 'TRJT3A_20261001_03.jpg', caption: 'Stasiun Bumi Satelit', createdAt: '2026-10-01T12:00:00Z', thumbnailUrl: './assets/images/campus-inspired-banner.png', imageUrl: './assets/images/campus-inspired-banner.png' },
        { id: 'p4', name: 'TRJT3A_20261001_04.jpg', caption: 'Routing BGP Jarkom', createdAt: '2026-10-01T13:00:00Z', thumbnailUrl: './assets/images/campus-inspired-banner.png', imageUrl: './assets/images/campus-inspired-banner.png' },
        { id: 'p5', name: 'TRJT3A_20261001_05.jpg', caption: 'Pengukuran Gelombang Mikro', createdAt: '2026-10-01T14:00:00Z', thumbnailUrl: './assets/images/campus-inspired-banner.png', imageUrl: './assets/images/campus-inspired-banner.png' }
      ]);
    `
  });
  await new Promise((r) => setTimeout(r, 400));

  const fivePhotosCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const cards = document.querySelectorAll('#gallery-grid-container .gallery-card');
      const grid = document.getElementById('gallery-grid-container');
      const gridStyle = grid ? window.getComputedStyle(grid) : null;
      const firstImg = cards[0]?.querySelector('img');
      const imgStyle = firstImg ? window.getComputedStyle(firstImg) : null;
      return {
        cardsCount: cards.length,
        gridDisplay: gridStyle?.display,
        gridColumns: gridStyle?.gridTemplateColumns?.split(' ').length,
        imgAspectRatio: imgStyle?.aspectRatio,
        imgObjectFit: imgStyle?.objectFit
      };
    })()`
  });
  assert('5 photos rendered in gallery grid', fivePhotosCheck.result.value?.cardsCount === 5, `${fivePhotosCheck.result.value?.cardsCount} cards`);
  assert('Grid has 2 columns on smartphone', fivePhotosCheck.result.value?.gridColumns === 2, `${fivePhotosCheck.result.value?.gridColumns} columns`);
  assert('Images have object-fit cover', fivePhotosCheck.result.value?.imgObjectFit === 'cover');

  // TEST 7: Lightbox Open, Content, and Close
  await send('Runtime.evaluate', {
    expression: `window.openGalleryLightbox('p1');`
  });
  await new Promise((r) => setTimeout(r, 400));

  const lightboxCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const lb = document.getElementById('gallery-lightbox-modal');
      const img = document.getElementById('gallery-lightbox-img');
      const caption = document.getElementById('gallery-lightbox-caption');
      const lbStyle = lb ? window.getComputedStyle(lb) : null;
      return {
        isOpen: lb?.classList.contains('is-open') && lbStyle?.display !== 'none',
        hasImgSrc: !!img?.src,
        captionText: caption?.innerText.trim()
      };
    })()`
  });
  assert('Tapping thumbnail opens fullscreen lightbox', lightboxCheck.result.value?.isOpen);
  assert('Lightbox displays photo caption', lightboxCheck.result.value?.captionText === 'Praktikum Antena Rooftop');

  // Close lightbox
  await send('Runtime.evaluate', {
    expression: `window.closeGalleryLightbox();`
  });
  await new Promise((r) => setTimeout(r, 300));

  const lightboxClosedCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const lb = document.getElementById('gallery-lightbox-modal');
      return !lb?.classList.contains('is-open') || window.getComputedStyle(lb).display === 'none';
    })()`
  });
  assert('Closing lightbox hides modal', lightboxClosedCheck.result.value);

  // TEST 8: Validation Tests (Non-image rejection and >10MB limit)
  const validationTest = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      let nonImageError = null;
      try {
        const dummyPdf = new File(['%PDF-1.4 dummy'], 'document.pdf', { type: 'application/pdf' });
        await window.TRJT_GALLERY.compressImage(dummyPdf);
      } catch (err) {
        nonImageError = err.message;
      }

      let largeFileError = null;
      try {
        // Mock large file > 10MB
        const largeFile = {
          name: 'huge_photo.jpg',
          type: 'image/jpeg',
          size: 11 * 1024 * 1024
        };
        await window.TRJT_GALLERY.compressImage(largeFile);
      } catch (err) {
        largeFileError = err.message;
      }

      return { nonImageError, largeFileError };
    })()`
  });
  assert('Non-image file is rejected with clear message', validationTest.result.value?.nonImageError?.includes('bukan gambar'));
  assert('File >10MB is rejected with 10 MB limit message', validationTest.result.value?.largeFileError?.includes('10 MB'));

  // TEST 9: Test Client-Side Upload Flow with valid canvas JPEG image
  const uploadResult = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#173F7A';
      ctx.fillRect(0, 0, 120, 120);

      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
      const file = new File([blob], 'TRJT3A_Dokumentasi_Praktikum.jpg', { type: 'image/jpeg' });

      const res = await window.TRJT_GALLERY.uploadPhoto(file, 'Dokumentasi Praktikum Rooftop Terbaru');
      return res;
    })()`
  });
  assert('Upload photo succeeds', uploadResult.result.value?.success === true);

  // Verify new photo is rendered at the top of gallery
  const newestPhotoCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const firstCard = document.querySelector('#gallery-grid-container .gallery-card');
      const pill = firstCard?.querySelector('.gallery-card-caption-pill')?.innerText.trim();
      return pill;
    })()`
  });
  assert('Newly uploaded photo is placed at top of gallery', newestPhotoCheck.result.value === 'Dokumentasi Praktikum Rooftop Terbaru', newestPhotoCheck.result.value);

  // TEST 10: Viewport Responsiveness across mandatory widths (320, 360, 375, 390, 414, 430)
  const viewports = [320, 360, 375, 390, 414, 430];
  for (const w of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 200));

    const vpCheck = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const grid = document.getElementById('gallery-grid-container');
        const gridCols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
        return {
          hasHorizontalScroll: docWidth > winWidth + 1,
          gridCols: gridCols
        };
      })()`
    });
    assert(`Viewport ${w}px has 2-column grid and no horizontal overflow`, !vpCheck.result.value?.hasHorizontalScroll && vpCheck.result.value?.gridCols === 2, `cols=${vpCheck.result.value?.gridCols}, hScroll=${vpCheck.result.value?.hasHorizontalScroll}`);
  }

  // Reset viewport to 390px for artifact screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 500));

  // Capture screenshot of Galeri Kelas
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.data) {
    const screenshotPath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\91c40c4f-3f5b-476b-9b44-d6e599cef7dd\\screenshot_galeri_kelas_390px.png';
    fs.writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'));
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  }

  // Summary
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n========================================`);
  console.log(`TRJT 3A GALERI TEST SUMMARY: ${passed}/${results.length} PASSED`);
  console.log(`========================================`);

  ws.close();
  edgeProc.kill();

  if (passed === results.length) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
