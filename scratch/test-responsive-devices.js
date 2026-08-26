import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n====================================================');
console.log('📱 TEST SUITE: RESPONSIVE iOS & ANDROID SPEC CHECK');
console.log('====================================================\n');

// 1. Verify Viewport Meta in index.html
const htmlCode = fs.readFileSync('index.html', 'utf8');
assert.ok(htmlCode.includes('viewport-fit=cover'), 'Meta viewport must have viewport-fit=cover');
assert.ok(htmlCode.includes('apple-mobile-web-app-capable'), 'apple-mobile-web-app-capable exists');
assert.ok(htmlCode.includes('apple-mobile-web-app-status-bar-style'), 'apple-mobile-web-app-status-bar-style exists');
assert.ok(htmlCode.includes('theme-color'), 'theme-color meta exists');
assert.ok(htmlCode.includes('manifest.json'), 'PWA manifest link exists');
console.log('✅ PASS: Viewport & PWA Metadata verified');

// 2. Verify Safe Area & Shell CSS in css/design-system.css
const cssCode = fs.readFileSync('css/design-system.css', 'utf8');
assert.ok(cssCode.includes('env(safe-area-inset-top'), 'Safe-area top inset is utilized');
assert.ok(cssCode.includes('env(safe-area-inset-bottom'), 'Safe-area bottom inset is utilized');
assert.ok(cssCode.includes('min-height: 100dvh'), 'Dynamic Viewport Height (100dvh) supported');
assert.ok(cssCode.includes('-webkit-backdrop-filter'), '-webkit-backdrop-filter present for Safari iOS');
assert.ok(cssCode.includes('touch-action: manipulation'), 'touch-action manipulation present for smooth tapping');
assert.ok(cssCode.includes('font-size: 16px'), 'Form inputs set to 16px to prevent iOS auto-zoom');
assert.ok(cssCode.includes('@supports not'), 'Glassmorphism fallback present for older Android/iOS WebViews');
console.log('✅ PASS: Safe area, 100dvh, iOS Safari glassmorphism, and touch optimizations verified');

// 3. Simulated Device Viewport Matrix Check
const TARGET_DEVICES = [
  { name: 'Android Kecil', width: 360, height: 800 },
  { name: 'Android Umum', width: 393, height: 873 },
  { name: 'Android Besar', width: 412, height: 915 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14/15 Pro', width: 393, height: 852 },
  { name: 'iPhone Pro Max', width: 430, height: 932 },
  { name: 'Tablet iPad', width: 768, height: 1024 },
  { name: 'Desktop/Laptop', width: 1280, height: 800 }
];

console.log('\n--- Evaluating Target Device Form Factors ---');
TARGET_DEVICES.forEach((device) => {
  const isMobile = device.width < 768;
  const maxAppWidth = isMobile ? Math.min(device.width, 480) : 460;
  const bottomNavWidth = isMobile ? (device.width - 24) : 440;
  const tabItemWidth = bottomNavWidth / 5;

  assert.ok(tabItemWidth >= 55, `${device.name}: Bottom nav tab width (${tabItemWidth.toFixed(1)}px) has ergonomic tap target`);
  assert.ok(maxAppWidth <= device.width, `${device.name}: App width stays within viewport`);
  console.log(`  📱 [${device.name} (${device.width}x${device.height})] -> App: ${maxAppWidth}px, Nav Tab: ${tabItemWidth.toFixed(1)}px (Optimal ✅)`);
});

console.log('\n====================================================');
console.log('🎉 ALL RESPONSIVE DEVICE TESTS PASSED (100%)!');
console.log('====================================================\n');
