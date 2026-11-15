const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName: file,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);

const { AdaptiveResolution, adaptivePixelRatio, resolutionScale } = require('../src/render/adaptive-resolution.ts');
const { FramePacer, frameUrgent, hasFrameBackgroundWork } = require('../src/render/frame-pacer.ts');

function feed(controller, start, duration, gap, cpu = 4, renderCpu = 0, gpuMs = null, targetFps = 60) {
  let now = start;
  for (; now < start + duration; now += gap) controller.observe(now, gap, cpu, renderCpu, gpuMs, targetFps);
  return now;
}

test('fixed presentation limits remain accurate on a 144 Hz callback clock', () => {
  for (const limit of [30, 40, 60]) {
    const pacer = new FramePacer();
    let draws = 0;
    for (let frame = 0; frame < 1440; frame++) if (pacer.ready(frame * 1000 / 144, 'playing', limit)) draws++;
    assert.ok(draws >= limit * 10 - 1 && draws <= limit * 10 + 1, `${limit} FPS produced ${draws} draws`);
  }
});

test('Auto follows low-refresh displays and caps high-refresh displays at an even divisor <=60', () => {
  const expected = new Map([[30, 30], [40, 40], [50, 50], [60, 60], [90, 45], [120, 60], [144, 48]]);
  for (const [hz, target] of expected) {
    const pacer = new FramePacer();
    for (let frame = 0; frame < hz * 10; frame++) pacer.ready(frame * 1000 / hz, 'playing', 'auto');
    assert.equal(pacer.targetFps, target, `${hz} Hz display target`);
  }
});

test('paused and hidden modes avoid unnecessary presentation work but retain urgent redraws', () => {
  const paused = new FramePacer();
  let pausedDraws = 0;
  for (let frame = 0; frame < 600; frame++) if (paused.ready(frame * 1000 / 60, 'paused')) pausedDraws++;
  assert.equal(pausedDraws, 20);
  assert.equal(paused.ready(10001, 'paused', 0, true), true);
  const hidden = new FramePacer();
  for (let frame = 0; frame < 20; frame++) assert.equal(hidden.ready(frame * 1000, 'hidden', 0, true), false);
  assert.equal(frameUrgent(true, true, false), true);
  assert.equal(frameUrgent(true, false, true), false, 'active-play background work does not bypass the cap');
  assert.equal(hasFrameBackgroundWork(false, false, false, false, false), false);
  assert.equal(hasFrameBackgroundWork(false, false, false, true, false), true);
});

test('adaptive resolution remains opt-in and does not reduce scale for CPU-update pressure', () => {
  const controller = new AdaptiveResolution();
  feed(controller, 0, 30000, 100, 20, 0, null, 60);
  assert.equal(controller.scale, 1);
  assert.equal(controller.state, 'off');
  controller.configure(true, 60);
  feed(controller, 0, 19000, 40, 20, 0, null, 60);
  assert.equal(controller.scale, 1);
  assert.equal(controller.bottleneck, 'cpu');
  assert.match(controller.decision, /CPU update pressure/);
});

test('measured GPU pressure is distinguished from CPU render-submission pressure', () => {
  const gpu = new AdaptiveResolution();
  gpu.configure(true, 60);
  feed(gpu, 0, 19000, 40, 5, 1, 28, 60);
  assert.ok(gpu.scale < 1);
  assert.equal(gpu.bottleneck, 'gpu');
  const renderCpu = new AdaptiveResolution();
  renderCpu.configure(true, 60);
  feed(renderCpu, 0, 19000, 40, 14, 12, null, 60);
  assert.equal(renderCpu.scale, 1);
  assert.equal(renderCpu.bottleneck, 'render-cpu');
  assert.match(renderCpu.decision, /resolution unchanged/);
});

test('adaptive recovery is slower than reductions and remains within the 70–100% bounds', () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 0);
  let now = feed(controller, 0, 19000, 100);
  assert.equal(controller.scale, .95);
  now = feed(controller, now, 25000, 1000 / 60, 4, 0, null, 60);
  assert.equal(controller.scale, .975);
  assert.ok(controller.scale >= .7 && controller.scale <= 1);
});

test('adaptive sampling resets on clock discontinuity and uses the effective Auto target', () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 'auto');
  let now = 0;
  for (; now < 19000; now += 100) controller.observe(now, 23, 5, 1, null, 45);
  assert.equal(controller.scale, 1, '23 ms is within a 45 FPS target budget');
  controller.observe(now, 5000, 1, 0, null, 45);
  assert.equal(controller.sampleCount, 0);
  assert.equal(controller.scale, 1);
});

test('resolution scaling respects base DPR, minimum scale and hardware renderbuffer limits', () => {
  for (const base of [.25, .5, .7, .88, 1, 1.6]) {
    for (const scale of [-10, .7, .8, 1, 100, NaN]) {
      const ratio = adaptivePixelRatio(base, scale, 1920, 1080);
      assert.ok(ratio > 0 && ratio <= base && ratio >= Math.min(base, .7));
    }
    assert.equal(adaptivePixelRatio(base, 1, 1920, 1080), base);
  }
  assert.equal(adaptivePixelRatio(1.6, 1, 8192, 2048, 8192), 1);
  assert.equal(resolutionScale('.7'), 1);
});
