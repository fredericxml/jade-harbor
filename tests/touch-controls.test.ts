import { afterEach, expect, it, vi } from "vitest";
import { joystickVector, JOYSTICK_DEADZONE, touchActionSupportsLookDrag, touchEnabled, touchMode, touchSensitivity } from "../src/ui/touch-controls";
import { Game } from "../src/core/game";
import { AdaptiveResolution } from "../src/render/adaptive-resolution";

afterEach(() => vi.unstubAllGlobals());
it.each([
  [0, 0, 0, 0], [0, -.1, 0, 0], [.12, 0, 0, 0], [0, -1, 0, 1], [0, 1, 0, -1],
  [-1, 0, -1, 0], [1, 0, 1, 0], [0, -4, 0, 1], [4, 0, 1, 0],
])("normalizes joystick offset %s / %s without changing game physics", (x, y, expectedX, expectedY) => {
  const out = { x: 77, y: 88 };
  expect(joystickVector(x, y, 0, 0, 1, out)).toBe(out);
  expect(out.x).toBeCloseTo(expectedX); expect(out.y).toBeCloseTo(expectedY);
});
it("preserves partial magnitude, radial diagonals and continuity at the deadzone", () => {
  const out = { x: 0, y: 0 };
  joystickVector(1, -1, 0, 0, 1, out);
  expect(out.x).toBeCloseTo(Math.SQRT1_2); expect(out.y).toBeCloseTo(Math.SQRT1_2);
  joystickVector(.56, 0, 0, 0, 1, out); expect(out.x).toBeCloseTo(.5);
  joystickVector(JOYSTICK_DEADZONE + 1e-7, 0, 0, 0, 1, out); expect(out.x).toBeGreaterThan(0); expect(out.x).toBeLessThan(.000001);
});
it.each([NaN, Infinity, -Infinity])("rejects invalid joystick coordinates %s", value => {
  for (const values of [[value, 0, 0, 0, 1], [0, value, 0, 0, 1], [0, 0, value, 0, 1], [0, 0, 0, value, 1], [0, 0, 0, 0, value]]) {
    const out = { x: 1, y: 1 }; joystickVector(values[0], values[1], values[2], values[3], values[4], out); expect(out).toEqual({ x: 0, y: 0 });
  }
});
it.each([0, -1, -100])("handles invalid joystick radius %s", radius => {
  expect(joystickVector(1, 1, 0, 0, radius, { x: 1, y: 1 })).toEqual({ x: 0, y: 0 });
});
it("keeps a broad deterministic offset grid finite and inside the unit circle", () => {
  const out = { x: 0, y: 0 };
  for (let x = -30; x <= 30; x++) for (let y = -30; y <= 30; y++) {
    joystickVector(x, y, 5, -4, 11, out); expect(Number.isFinite(out.x + out.y)).toBe(true); expect(Math.hypot(out.x, out.y)).toBeLessThanOrEqual(1.000000000001);
  }
  expect(joystickVector(1e308, 0, -1e308, 0, 1, out)).toEqual({ x: 0, y: 0 });
});
it.each([undefined, null, "bad", "ON", 1, {}, false])("defaults unknown touch preference %s to Auto", value => expect(touchMode(value)).toBe("auto"));
it.each(["auto", "on", "off"] as const)("retains touch preference %s", value => expect(touchMode(value)).toBe(value));
it.each([undefined, null, NaN, Infinity, -Infinity, "1.2", {}])("rejects invalid touch sensitivity %s", value => expect(touchSensitivity(value)).toBe(1));
it.each([[-4, .5], [.5, .5], [1, 1], [1.24, 1.2], [2, 2], [2.56, 2.5], [100, 2.5]])("bounds/steps touch sensitivity %s", (value, expected) => expect(touchSensitivity(value)).toBe(expected));
it("detects touch-first capability without enabling a fine-pointer hybrid by default", () => {
  expect(touchEnabled("auto", 0, true, true)).toBe(false);
  expect(touchEnabled("auto", 5, true, false)).toBe(true);
  expect(touchEnabled("auto", 5, false, true)).toBe(true);
  expect(touchEnabled("auto", 5, false, false)).toBe(false);
  expect(touchEnabled("on", 0, false, false)).toBe(true);
  expect(touchEnabled("off", 5, true, true)).toBe(false);
});
it.each([
  [undefined, undefined, "auto", 1], ["on", 1.7, "on", 1.7], ["off", .5, "off", .5], ["unknown", Infinity, "auto", 1],
] as const)("migrates touch preferences without changing existing graphics, mouse or simulation controls (%s)", (mode, sensitivity, expectedMode, expectedSensitivity) => {
  let stored = ""; vi.stubGlobal("localStorage", { setItem: (_key: string, value: string) => { stored = value; } });
  const g = Object.create(Game.prototype) as Game;
  const configure = vi.fn(), old = { graphicsQuality: "high", fov: 91, sensitivity: 7, distance: 8, simulationDistance: 5, volume: 46 };
  Object.assign(g, { adaptive: new AdaptiveResolution(), settings: { ...old, touchControls: mode, touchSensitivity: sensitivity }, ui: { touchControls: { configure } }, view: { setResolutionScale: vi.fn(), setGraphicsProfile: vi.fn(), camera: { updateProjectionMatrix: vi.fn() } }, effects: { setRainCount: vi.fn() }, audio: {} });
  g.applySettings();
  expect(g.settings).toEqual({ ...old, adaptiveResolution: false, frameRateLimit: 0, touchControls: expectedMode, touchSensitivity: expectedSensitivity });
  expect(configure).toHaveBeenCalledWith(expectedMode, expectedSensitivity); expect(JSON.parse(stored)).toEqual(g.settings);
});

it.each(["primary", "jump", "sprint", "crouch"] as const)("allows camera drag while %s remains held", action => {
  expect(touchActionSupportsLookDrag(action)).toBe(true);
});
it.each(["secondary", "drop", "toggleFlight", "inventory", "pause"] as const)("does not camera-drag from %s", action => {
  expect(touchActionSupportsLookDrag(action)).toBe(false);
});
