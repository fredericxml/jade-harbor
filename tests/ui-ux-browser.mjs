import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { devApp, chromiumArgs, continueInBrowser } from './browser-harness.mjs';

const server = await devApp(4197);
let browser;
const errors = [];
try {
  browser = await chromium.launch({ headless: true, args: chromiumArgs });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await context.addInitScript(() => localStorage.removeItem('jade-harbor-settings'));
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url);
  await page.waitForFunction(() => !!window.__game);
  assert.equal(await page.evaluate(() => window.__game.settings.graphicsQuality), 'high', 'new installs default to High');
  await page.locator('[data-install-welcome="continue"]').tap();
  assert.equal(await page.locator('.install-welcome').count(), 0, 'accepted mobile welcome closes through Continue in browser');

  await page.evaluate(async () => {
    const game = window.__game;
    game.ui.pointerType = 'touch';
    const { freshWorld } = await import('/src/persistence/saves.ts');
    await game.start(freshWorld('UI UX QA', 'jade-harbor', 'creative'));
    game.resume(false);
  });
  await page.waitForFunction(() => window.__game.active && window.__game.ui.screen === 'none');

  await page.evaluate(() => window.__game.ui.settings(window.__game.settings));
  const dialog = page.locator('.dialog[role="dialog"][aria-modal="true"]');
  assert(await dialog.isVisible(), 'settings uses an accessible modal dialog');
  assert.equal(await page.evaluate(() => document.activeElement?.matches('.dialog .close')), true, 'new dialog moves focus to its close control');
  const focusLoop = await page.evaluate(() => {
    const dialog = document.querySelector('.dialog[aria-modal="true"]');
    const nodes = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    nodes.at(-1).focus();
    nodes.at(-1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    return document.activeElement === nodes[0];
  });
  assert(focusLoop, 'modal Tab navigation wraps to its first control');
  await page.evaluate(() => window.__game.resume(false));
  await page.waitForFunction(() => window.__game.ui.screen === 'none');

  await page.evaluate(() => {
    const game = window.__game;
    game.performanceRecommendation = 'medium';
    game.ui.showPerformanceAdvisor('high', 'medium', 22);
  });
  const advisor = page.locator('#performance-advisor');
  assert(await advisor.isVisible(), 'performance advice appears without pausing gameplay');
  assert.match(await advisor.innerText(), /22 FPS/);
  assert.equal(await page.evaluate(() => window.__game.ui.screen), 'none', 'performance advice is non-modal');
  await page.locator('[data-performance-action="lower"]').tap();
  assert.equal(await page.evaluate(() => window.__game.settings.graphicsQuality), 'medium', 'accepting advice applies the next lower preset');
  assert.equal(await page.evaluate(() => window.__game.settings.adaptiveResolution), true, 'accepting a preset recommendation preserves the independent Adaptive setting');
  assert.equal(await advisor.isVisible(), false, 'advisor closes after accepting');

  // A pending recommendation must move into the pause dialog instead of being lost.
  await page.evaluate(() => {
    const game = window.__game;
    game.settings.graphicsQuality = 'high';
    game.settings.adaptiveResolution = true;
    game.applySettings();
    game.performanceAdvisor.reset(performance.now());
    game.performanceRecommendation = 'medium';
    game.performanceRecommendationFps = 4;
    game.ui.showPerformanceAdvisor('high', 'medium', 4);
  });
  await page.locator('.touch-pause').tap();
  const pausedAdvice = page.locator('.pause-performance-advisor');
  assert(await pausedAdvice.isVisible(), 'pending recommendation is preserved inside the pause dialog');
  assert.match(await pausedAdvice.innerText(), /4 FPS/);
  assert.equal(await advisor.isVisible(), false, 'floating advisor is hidden while its pause-menu copy is visible');
  const pausedActionBoxes = await pausedAdvice.locator('button').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
  }));
  assert.equal(pausedActionBoxes.length, 2, 'pause recommendation exposes both touch actions');
  for (const box of pausedActionBoxes) {
    assert(box.height >= 48, 'mobile pause recommendation actions meet the 48px touch target');
    assert(box.x >= 0 && box.y >= 0 && box.right <= 391 && box.bottom <= 845, 'mobile pause recommendation action stays inside the viewport');
  }
  await pausedAdvice.locator('[data-performance-action="keep"]').tap();
  assert.equal(await page.evaluate(() => window.__game.settings.graphicsQuality), 'high', 'Keep High works from the pause dialog');
  assert.equal(await pausedAdvice.count(), 0, 'pause recommendation is removed after the player answers');

  // Touch users can return to gameplay and still tap the preserved recommendation.
  await page.evaluate(() => {
    const game = window.__game;
    game.performanceAdvisor.reset(performance.now());
    game.performanceRecommendation = 'medium';
    game.performanceRecommendationFps = 4;
    game.ui.pause(game.meta.name, game.mode, game.hardcoreEnded, { current: 'high', next: 'medium', fps: 4 });
  });
  await page.locator('.pause-grid [data-action="resume"]').tap();
  await page.waitForFunction(() => window.__game.ui.screen === 'none');
  assert(await advisor.isVisible(), 'pending advice returns to the gameplay overlay after resume');
  await advisor.locator('[data-performance-action="lower"]').tap();
  assert.equal(await page.evaluate(() => window.__game.settings.graphicsQuality), 'medium', 'touch can accept the recommendation directly after resume');
  assert.equal(await advisor.isVisible(), false, 'floating recommendation closes after touch acceptance');

  await page.evaluate(() => {
    const game = window.__game;
    game.settings.graphicsQuality = 'high';
    game.applySettings();
    game.performanceAdvisor.reset(performance.now());
    game.performanceRecommendation = 'medium';
    game.ui.showPerformanceAdvisor('high', 'medium', 24);
  });
  await page.locator('[data-performance-action="keep"]').last().tap();
  assert.equal(await page.evaluate(() => window.__game.settings.graphicsQuality), 'high', 'Keep High does not change quality');
  assert.equal(await page.evaluate(() => window.__game.settings.adaptiveResolution), true, 'Keep High leaves Adaptive enabled');
  assert.equal(await advisor.isVisible(), false, 'keeping current quality dismisses the advisor');

  await page.evaluate(() => window.__game.ui.toast('First toast'));
  await page.waitForTimeout(2200);
  await page.evaluate(() => { window.__toastStarted=performance.now(); window.__game.ui.toast('Second toast'); });
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => document.querySelector('#toast').classList.contains('visible') && Number(getComputedStyle(document.querySelector('#toast')).opacity) === 1), true, 'a previous toast timer cannot fade a newer toast');
  assert.equal(await page.locator('#toast').innerText(), 'Second toast');
  await page.waitForFunction(() => { const el=document.querySelector('#toast'); return !el.classList.contains('visible') && Number(getComputedStyle(el).opacity) === 0; }, {}, {timeout:6000});
  const expiry=await page.evaluate(() => ({elapsed:performance.now()-window.__toastStarted,opacity:Number(getComputedStyle(document.querySelector('#toast')).opacity),text:document.querySelector('#toast').textContent}));
  assert(expiry.elapsed>=3200 && expiry.elapsed<8000, 'latest toast retains its3200ms lifetime plus fade');
  assert.equal(expiry.text,'Second toast');assert.equal(expiry.opacity,0,'latest toast fades out normally');
  console.log('TOAST EXPIRY',JSON.stringify(expiry));

  // Desktop regression: a real Pointer Lock session can be paused with Escape,
  // and the recommendation remains actionable in the modal after lock release.
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false });
  await desktopContext.addInitScript(() => localStorage.removeItem('jade-harbor-settings'));
  const desktopPage = await desktopContext.newPage();
  desktopPage.setDefaultTimeout(120_000);
  desktopPage.on('pageerror', error => errors.push(error.message));
  await desktopPage.goto(server.url);
  await continueInBrowser(desktopPage);
  await desktopPage.evaluate(async () => {
    const game = window.__game;
    game.ui.pointerType = 'mouse';
    const { freshWorld } = await import('/src/persistence/saves.ts');
    await game.start(freshWorld('Desktop advisor QA', 'jade-harbor', 'creative'));
  });
  await desktopPage.waitForFunction(() => window.__game.active && window.__game.ui.screen === 'none');
  await desktopPage.locator('#game').click();
  await desktopPage.waitForFunction(() => document.pointerLockElement === document.querySelector('#game'));
  await desktopPage.evaluate(() => {
    const game = window.__game;
    game.performanceRecommendation = 'medium';
    game.performanceRecommendationFps = 4;
    game.ui.showPerformanceAdvisor('high', 'medium', 4);
  });
  await desktopPage.keyboard.press('Escape');
  await desktopPage.waitForFunction(() => window.__game.ui.screen === 'pause' && !!document.querySelector('.pause-performance-advisor'));
  assert.equal(await desktopPage.evaluate(() => document.pointerLockElement), null, 'Escape releases Pointer Lock before pause-menu interaction');
  assert.match(await desktopPage.locator('.pause-performance-advisor').innerText(), /4 FPS/);
  await desktopPage.locator('.pause-performance-advisor [data-performance-action="lower"]').click();
  assert.equal(await desktopPage.evaluate(() => window.__game.settings.graphicsQuality), 'medium', 'desktop can accept the recommendation after Escape releases Pointer Lock');
  assert.equal(await desktopPage.locator('.pause-performance-advisor').count(), 0, 'desktop pause recommendation closes after acceptance');
  await desktopContext.close();

  assert.deepEqual(errors, []);
  console.log('UI UX BROWSER PASSED: touch one-tap advice, pause persistence, desktop Pointer Lock Escape recovery, accessible modal focus and recommendation actions');
} finally {
  await browser?.close();
  await server.close();
}
