import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/ui/style.css", "utf8");
const ui = readFileSync("src/ui/ui.ts", "utf8");
const touch = readFileSync("src/ui/touch-controls.ts", "utf8");
const experience = readFileSync("src/browser/experience.ts", "utf8");

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing CSS rule: ${selector}`);
  return match[1];
}

test("dialog headers scroll with their modal content instead of sticking", () => {
  const head = rule(".dialog-head");
  assert.match(head, /position:\s*static/);
  assert.doesNotMatch(head, /position:\s*sticky/);
});

test("inventory dialog is the single scroll container", () => {
  const dialog = rule(".dialog.inventory-dialog");
  assert.match(dialog, /overflow-y:\s*auto/);
  assert.match(dialog, /overflow-x:\s*hidden/);
  const inner = rule(".inventory-scroll-area");
  assert.match(inner, /overflow:\s*visible/);
  assert.doesNotMatch(inner, /overflow-y:\s*auto/);
  assert.match(css, /\.dialog\.inventory-dialog \.catalog \{[^}]*max-height:\s*none;[^}]*overflow:\s*visible/s);
});

test("only the inventory hotbar dock is sticky", () => {
  const dock = rule(".inventory-hotbar-dock");
  assert.match(dock, /position:\s*sticky/);
  assert.match(dock, /bottom:\s*0/);
  assert.doesNotMatch(css, /\.dialog-head[^}]*position:\s*sticky/);
});

test("inventory redraw preserves the single dialog scroll position", () => {
  assert.match(ui, /querySelector<HTMLElement>\(\"\.inventory-dialog\"\)/);
  assert.match(ui, /nextDialog\) nextDialog\.scrollTop = dialogScroll/);
  assert.doesNotMatch(ui, /previousDialog[\s\S]{0,160}inventory-scroll-area/);
});

test("camera drag is supported while jump, sprint, crouch and mine remain held", () => {
  assert.match(touch, /CAMERA_DRAG_ACTIONS = new Set<InputAction>\(\[\"primary\", \"jump\", \"sprint\", \"crouch\"\]\)/);
  assert.match(touch, /this\.listen\(window, \"pointermove\", this\.move\)/);
  assert.doesNotMatch(touch, /this\.listen\(element, \"pointermove\", this\.move\)/);
  assert.match(touch, /p\.role === \"action\" && p\.action !== undefined && touchActionSupportsLookDrag\(p\.action\)/);
  assert.match(touch, /if \(p\.action\) this\.port\.release\(id, p\.action\)/);
});

test("inventory layout includes narrow-phone and short-landscape responsive rules", () => {
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?\.dialog\.inventory-dialog \.catalog/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.dialog\.inventory-dialog \.hotbar-slots/);
  assert.match(css, /@media \(max-height: 520px\)[\s\S]*?\.dialog\.inventory-dialog/);
  assert.match(css, /grid-template-columns: repeat\(9, minmax\(0, 1fr\)\)/);
});


test("one labeled fullscreen control is retained; the floating duplicate is removed", () => {
  assert.match(touch, /className = "touch-button touch-fullscreen"/);
  assert.match(touch, /dataset\.browserAction = "fullscreen"/);
  assert.match(experience, /small\.textContent=s\.fullscreen\?'Exit':s\.fullscreenAvailable\?'Full'/);
  assert.match(css, /\.touch-top > \.touch-fullscreen\s*\{[^}]*right:calc\(var\(--touch-edge\) \+ var\(--touch-action\) \+ var\(--touch-gap\)\)/s);
  assert.doesNotMatch(experience, /game-fullscreen-reentry|createFullscreenButton|fullscreenButton/);
  assert.doesNotMatch(css, /\.game-fullscreen-reentry/);
});

test("joystick keeps its accessible name without a decorative MOVE label", () => {
  assert.match(touch, /aria-label="Movement joystick"/);
  assert.doesNotMatch(touch, /<small>MOVE<\/small>/);
  assert.doesNotMatch(css, /\.touch-joystick\s*>\s*small/);
});

test("touch controls share a symmetric safe-area-aware horizontal edge", () => {
  const root = rule("#touch-controls");
  assert.match(root, /position:\s*absolute/);
  assert.match(root, /inset:\s*0/);
  assert.match(root, /--touch-edge:\s*max\(12px, env\(safe-area-inset-left, 0px\), env\(safe-area-inset-right, 0px\)\)/);
  assert.match(rule(".touch-joystick"), /left:\s*var\(--touch-edge\)/);
  assert.match(rule(".touch-actions"), /right:\s*var\(--touch-edge\)/);
});

test("short landscape viewports compact the right action cluster before it can collide with top controls", () => {
  assert.match(css, /@media \(max-height: 340px\) and \(orientation: landscape\)[\s\S]*?--touch-action: 42px[\s\S]*?--touch-gap: 5px[\s\S]*?--touch-band: 54px/);
});


test("landscape HUD title and clock share a centered control-height row", () => {
  const block = css.slice(css.indexOf('/* HUD alignment and viewport safe-area layout.'));
  assert.match(block, /\.touch-mode \.hud-top\s*\{[^}]*top:\s*var\(--hud-touch-edge-y\)/s);
  assert.match(block, /left:\s*calc\(var\(--hud-touch-edge-x\) \+ var\(--hud-touch-size\) \+ var\(--hud-touch-gap\)\)/);
  assert.match(block, /right:\s*calc\(var\(--hud-touch-edge-x\) \+ var\(--hud-touch-size\) \+ var\(--hud-touch-size\) \+ var\(--hud-touch-gap\) \+ var\(--hud-touch-gap\)\)/);
  assert.match(block, /height:\s*var\(--hud-touch-size\)/);
  assert.match(block, /align-items:\s*center/);
  assert.match(block, /\.touch-mode \.world-clock\s*\{[^}]*align-items:\s*flex-end[^}]*justify-content:\s*center/s);
  assert.match(block, /\.touch-mode \.location > div\s*\{[^}]*justify-content:\s*center/s);
});

test("HUD spacing tracks the compact and tablet touch-control breakpoints", () => {
  const block = css.slice(css.indexOf('/* HUD alignment and viewport safe-area layout.'));
  assert.match(block, /max-height:\s*430px[\s\S]*?--hud-touch-size:\s*48px[\s\S]*?--hud-touch-gap:\s*6px/);
  assert.match(block, /max-height:\s*340px[\s\S]*?--hud-touch-size:\s*42px[\s\S]*?--hud-touch-gap:\s*5px/);
  assert.match(block, /min-width:\s*700px[\s\S]*?--hud-touch-size:\s*60px[\s\S]*?--hud-touch-gap:\s*10px/);
});

test("pause and inventory modals use symmetric safe-area gutters and visible-viewport centering", () => {
  const overlay = rule("#overlay.modal-wrap");
  const dialog = rule("#overlay.modal-wrap > .dialog");
  const keyboard = rule(".keyboard-open #overlay.modal-wrap");
  assert.match(overlay, /--modal-safe-block:\s*max\(12px, var\(--safe-top\), var\(--safe-bottom\)\)/);
  assert.match(overlay, /--modal-safe-inline:\s*max\(10px, var\(--safe-left\), var\(--safe-right\)\)/);
  assert.match(overlay, /padding:\s*var\(--modal-safe-block\) var\(--modal-safe-inline\)/);
  assert.match(overlay, /align-items:\s*center/);
  assert.match(overlay, /justify-content:\s*center/);
  assert.match(dialog, /max-height:\s*calc\(var\(--visible-height, 100dvh\) - var\(--modal-safe-block\) - var\(--modal-safe-block\)\)/);
  assert.match(keyboard, /--modal-safe-block:\s*max\(8px/);
});

test("touch action icon and Mine SVG are centered independently of inline baselines", () => {
  const wrapper = rule(".touch-button > span");
  const svg = rule(".touch-button > span > svg");
  assert.match(wrapper, /display:\s*flex/);
  assert.match(wrapper, /justify-content:\s*center/);
  assert.match(wrapper, /width:\s*100%/);
  assert.match(svg, /display:\s*block/);
  assert.match(svg, /margin:\s*0 auto/);
  assert.match(touch, /const PICKAXE = '<svg viewBox="0 0 24 24"/);
});


test("pending performance advice stays actionable in the pause dialog on touch layouts", () => {
  const game = readFileSync("src/core/game.ts", "utf8");
  assert.match(ui, /private pausedPerformanceAdvice\(current: GraphicsQuality, next: GraphicsQuality, fps: number\)/);
  assert.match(ui, /data-performance-action=\"lower\"/);
  assert.match(ui, /data-performance-action=\"keep\"/);
  assert.match(ui, /this\.pausedPerformanceAdvice\(performanceAdvice\.current/);
  assert.match(game, /this\.performanceAdvisor\.resume\(performance\.now\(\)\)/);
  assert.match(game, /this\.performanceRecommendationFps = this\.fps/);
  assert.match(game, /this\.performanceRecommendation\s*\?\s*\{ current: this\.settings\.graphicsQuality, next: this\.performanceRecommendation, fps: this\.performanceRecommendationFps \}/);
  const recommendationHandler = game.match(/this\.ui\.onPerformanceAction = action => \{[\s\S]*?\n    \};/)?.[0] ?? "";
  const presetHandler = game.match(/if\(el\.id === "graphicsQuality"\) \{[\s\S]*?if\(el\.id === "adaptiveResolution"\)/)?.[0] ?? "";
  assert.ok(recommendationHandler && presetHandler, "both preset-choice handlers remain present");
  assert.doesNotMatch(recommendationHandler, /adaptiveResolution\s*=\s*false/);
  assert.doesNotMatch(presetHandler, /adaptiveResolution\s*=\s*false|adaptiveSelect\.value\s*=\s*"off"/);
  const pauseActions = rule(".pause-performance-advisor__actions button");
  assert.match(pauseActions, /min-height:\s*44px/);
  assert.match(css, /\.touch-mode \.pause-performance-advisor__actions button\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /@media\s*\(max-width:\s*520px\)[\s\S]*?\.pause-performance-advisor__actions\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.touch-mode #performance-advisor\s*\{[^}]*bottom:\s*calc\(112px \+ var\(--safe-bottom\)\)/);
});
