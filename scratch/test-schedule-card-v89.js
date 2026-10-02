import { spawn } from 'node:child_process';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9240;

async function run() {
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_card_v89',
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: 'http://127.0.0.1/TRJT%203A/index.html' });
  await new Promise((r) => setTimeout(r, 2000));

  // Navigate to Jadwal tab
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.bottom-nav .nav-item[data-tab="jadwal"]').click();`
  });
  await new Promise((r) => setTimeout(r, 500));

  // Switch to day 1 (Senin) or day 5 (Jumat)
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.day-btn-item[data-day="1"]').click();`
  });
  await new Promise((r) => setTimeout(r, 500));

  // Inspect schedule card
  const inspection = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const card = document.querySelector('.schedule-glass-card');
        if (!card) return { error: 'No card found' };

        const csCard = window.getComputedStyle(card);
        const timeCol = card.querySelector('.schedule-time-col');
        const csTimeCol = window.getComputedStyle(timeCol);
        const timeStart = card.querySelector('.schedule-time-start');
        const csStart = window.getComputedStyle(timeStart);
        const timeEnd = card.querySelector('.schedule-time-end');
        const csEnd = window.getComputedStyle(timeEnd);
        const timeDuration = card.querySelector('.schedule-time-duration');
        const csDuration = window.getComputedStyle(timeDuration);

        const heading = card.querySelector('.schedule-subject-heading');
        const csHeading = window.getComputedStyle(heading);
        const room = card.querySelector('.schedule-room-badge');
        const csRoom = window.getComputedStyle(room);
        const roomIcon = room.querySelector('svg, i');
        const csRoomIcon = roomIcon ? window.getComputedStyle(roomIcon) : null;

        const lecturerRow = card.querySelector('.schedule-lecturer-row');
        const csLecturer = window.getComputedStyle(lecturerRow);
        const lecturerIcon = lecturerRow.querySelector('svg, i');
        const csLecturerIcon = lecturerIcon ? window.getComputedStyle(lecturerIcon) : null;
        const lecturerName = lecturerRow.querySelector('.schedule-lecturer-name');
        const csLecturerName = window.getComputedStyle(lecturerName);

        const rectHeading = heading.getBoundingClientRect();
        const rectRoom = room.getBoundingClientRect();
        const rectLecturer = lecturerRow.getBoundingClientRect();
        const rectTime = timeCol.getBoundingClientRect();
        const rectMain = card.querySelector('.schedule-card-main-col').getBoundingClientRect();
        const rectLecIcon = lecturerIcon ? lecturerIcon.getBoundingClientRect() : null;
        const rectLecName = lecturerName ? lecturerName.getBoundingClientRect() : null;

        return {
          rowHtml: lecturerRow.outerHTML,
          rowStyles: {
            display: csLecturer.display,
            flexDirection: csLecturer.flexDirection,
            flexWrap: csLecturer.flexWrap
          },
          lecIconRect: rectLecIcon ? { top: rectLecIcon.top, left: rectLecIcon.left, width: rectLecIcon.width, height: rectLecIcon.height } : null,
          lecNameRect: rectLecName ? { top: rectLecName.top, left: rectLecName.left, width: rectLecName.width, height: rectLecName.height } : null,
          card: {
            bg: csCard.backgroundColor,
            border: csCard.border,
            borderRadius: csCard.borderRadius,
            padding: csCard.padding,
            boxShadow: csCard.boxShadow
          },
          timeCol: {
            width: csTimeCol.width,
            bg: csTimeCol.backgroundColor,
            border: csTimeCol.border
          },
          timeStart: {
            text: timeStart.innerText,
            fontSize: csStart.fontSize,
            fontWeight: csStart.fontWeight,
            color: csStart.color
          },
          timeEnd: {
            text: timeEnd.innerText,
            fontSize: csEnd.fontSize,
            fontWeight: csEnd.fontWeight,
            color: csEnd.color
          },
          duration: {
            text: timeDuration.innerText,
            fontSize: csDuration.fontSize,
            fontWeight: csDuration.fontWeight,
            color: csDuration.color,
            bg: csDuration.backgroundColor,
            borderRadius: csDuration.borderRadius,
            padding: csDuration.padding
          },
          heading: {
            text: heading.innerText,
            fontSize: csHeading.fontSize,
            fontWeight: csHeading.fontWeight,
            color: csHeading.color
          },
          room: {
            text: room.innerText,
            fontSize: csRoom.fontSize,
            fontWeight: csRoom.fontWeight,
            color: csRoom.color,
            bg: csRoom.backgroundColor,
            iconColor: csRoomIcon ? csRoomIcon.color : null
          },
          lecturer: {
            text: lecturerName.innerText,
            fontSize: csLecturerName.fontSize,
            fontWeight: csLecturerName.fontWeight,
            color: csLecturerName.color,
            bg: csLecturer.backgroundColor,
            iconColor: csLecturerIcon ? csLecturerIcon.color : null
          },
          gaps: {
            gapTimeColToMainCol: Math.round(rectMain.left - rectTime.right),
            gapHeadingToRoom: Math.round(rectRoom.top - rectHeading.bottom),
            gapRoomToLecturer: Math.round(rectLecturer.top - rectRoom.bottom)
          }
        };
      })()
    `,
    returnByValue: true
  });

  console.log('=== SCHEDULE CARD INSPECTION (LIGHT MODE) ===');
  console.log(JSON.stringify(inspection.result.value, null, 2));

  // Capture screenshot of light mode
  const shotLight = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_jadwal_v89.png', Buffer.from(shotLight.data, 'base64'));

  // Switch to Dark Mode
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    `
  });
  await new Promise((r) => setTimeout(r, 400));

  const darkInspection = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const card = document.querySelector('.schedule-glass-card');
        const csCard = window.getComputedStyle(card);
        const heading = card.querySelector('.schedule-subject-heading');
        const csHeading = window.getComputedStyle(heading);
        const room = card.querySelector('.schedule-room-badge');
        const csRoom = window.getComputedStyle(room);
        const lecturer = card.querySelector('.schedule-lecturer-name');
        const csLecturer = window.getComputedStyle(lecturer);
        return {
          cardBg: csCard.backgroundColor,
          headingColor: csHeading.color,
          roomColor: csRoom.color,
          lecturerColor: csLecturer.color
        };
      })()
    `,
    returnByValue: true
  });

  console.log('=== SCHEDULE CARD INSPECTION (DARK MODE) ===');
  console.log(JSON.stringify(darkInspection.result.value, null, 2));

  // Capture screenshot of dark mode
  const shotDark = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/view_dark_jadwal_v89.png', Buffer.from(shotDark.data, 'base64'));

  ws.close();
  edgeProc.kill();
}

run().catch(console.error);
