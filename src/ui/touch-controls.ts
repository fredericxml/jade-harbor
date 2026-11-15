import type { InputAction } from "../player/input-state";
import type { Stack } from "../game/stack";
import type { Mode } from "../persistence/saves";

export type TouchMode = "auto" | "on" | "off";
export interface TouchInputPort {
  setMove(id: number, x: number, y: number): void;
  addLookDelta(id: number, dx: number, dy: number): void;
  press(id: number, action: InputAction): void;
  release(id: number, action: InputAction): void;
  selectHotbar(id: number, slot: number): void;
  releasePointer(id: number, cancel?: boolean): void;
  pointerCancel(id: number): void;
  lostPointerCapture(id: number): void;
  clear(): void;
}
export interface TouchControlOptions {
  mouseLock(): void;
  renderItem(stack: Readonly<Stack>, counts: boolean): string;
  itemName(stack: Readonly<Stack>): string;
}
export interface TouchVector { x: number; y: number }
export const JOYSTICK_DEADZONE = 0.12;
const ACCESSIBLE_POINTER = 2147483647;
const MAX_POINTERS = 16;
const PICKAXE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5c6-3 12-1 16 5M13 6 5 21"/></svg>';
const ACTION_CONTROLS = [
  ["pause", "Pause", "Pause game", "Ⅱ", "top"],
  ["inventory", "Items", "Open inventory", "▦", "top"],
  ["primary", "Mine", "Hold to mine or attack; drag to look around", PICKAXE, "cluster"],
  ["jump", "Jump", "Jump, swim or fly up", "↑", "cluster"],
  ["secondary", "Use", "Hold to use, place or interact", "+", "cluster"],
  ["sprint", "Sprint", "Hold to sprint", "»", "cluster"],
  ["crouch", "Crouch", "Crouch or fly down", "↓", "cluster"],
  ["drop", "Drop", "Drop selected item", "↧", "utility"],
  ["toggleFlight", "Flight", "Toggle Creative flight", "◇", "utility"],
] as const satisfies readonly (readonly [InputAction, string, string, string, string])[];
const HELD_ACTIONS = new Set<InputAction>(["jump", "primary", "secondary", "sprint", "crouch", "drop"]);
// These held controls may also steer the camera while the same pointer remains down.
// The action stays pressed until pointerup/cancel/lost capture.
const CAMERA_DRAG_ACTIONS = new Set<InputAction>(["primary", "jump", "sprint", "crouch"]);
export function touchActionSupportsLookDrag(action: InputAction): boolean {
  return CAMERA_DRAG_ACTIONS.has(action);
}

export function touchMode(value: unknown): TouchMode {
  return value === "on" || value === "off" ? value : "auto";
}
export function touchSensitivity(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(Math.max(.5, Math.min(2.5, value)) * 10) / 10 : 1;
}
export function touchEnabled(mode: TouchMode, points: number, coarse: boolean, noHover: boolean): boolean {
  return mode === "on" || (mode === "auto" && Number.isFinite(points) && points > 0 && (coarse || noHover));
}
/** Reuses out. Screen up becomes forward; a radial deadzone preserves analog magnitude. */
export function joystickVector(x: number, y: number, cx: number, cy: number, radius: number, out: TouchVector): TouchVector {
  out.x = out.y = 0;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(radius) || radius <= 0) return out;
  const dx = (x - cx) / radius, dy = (cy - y) / radius, length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length <= JOYSTICK_DEADZONE) return out;
  const scale = (Math.min(1, length) - JOYSTICK_DEADZONE) / ((1 - JOYSTICK_DEADZONE) * length);
  out.x = dx * scale; out.y = dy * scale;
  return out;
}
type Role = "joystick" | "look" | "action" | "slot" | "utility";
interface Contact {
  element: HTMLElement;
  role: Role;
  action?: InputAction;
  key?: string;
  x: number;
  y: number;
}

/** Persistent presentation only. The existing adapter and Game own all input/gameplay rules. */
export class TouchControls {
  private contacts = new Map<number, Contact>();
  private listeners: Array<() => void> = [];
  private coarse?: MediaQueryList;
  private noHover?: MediaQueryList;
  private mode: TouchMode = "auto";
  private sensitivity = 1;
  private gameplay = false;
  private screenAllows = false;
  private shown = false;
  private disposed = false;
  private auto = false;
  private gameMode: Mode = "creative";
  private trayOpen = false;
  private joystickId?: number;
  private lookId?: number;
  private vector: TouchVector = { x: 0, y: 0 };
  private geometry = { x: 0, y: 0, radius: 1 };
  private signatures: string[] = Array(9).fill("");
  private selected = -1;
  private heldName = "";
  readonly joystick: HTMLElement;
  readonly lookSurface: HTMLElement;
  readonly hotbar: HTMLElement;
  readonly slots: readonly HTMLButtonElement[];
  private knob: HTMLElement;
  private selectedLabel: HTMLElement;
  private tray: HTMLElement;
  private more: HTMLButtonElement;
  private actions = new Map<InputAction, HTMLButtonElement>();
  /** Not a gameplay input: BrowserExperience handles this delegated browser action. */
  readonly fullscreenButton: HTMLButtonElement;
  onVisibilityChange?: (visible: boolean) => void;

  constructor(readonly element: HTMLElement, private port: TouchInputPort, private options: TouchControlOptions) {
    element.hidden = true;
    element.innerHTML = '<div class="touch-look" data-touch-control="look" aria-label="Swipe to look around"></div>' +
      '<div class="touch-joystick" data-touch-control="joystick" role="group" aria-label="Movement joystick"><span class="touch-joystick-ring"></span><span class="touch-knob"></span></div>' +
      '<div class="touch-top"></div><div class="touch-actions"></div>' +
      '<div class="touch-utility" id="touch-utility-tray" role="group" aria-label="More actions" hidden></div>' +
      '<div class="touch-hotbar-wrap"><div class="touch-selected-name"></div><div class="touch-hotbar" role="group" aria-label="Select hotbar slot"></div></div>';
    this.joystick = element.querySelector(".touch-joystick")!;
    this.lookSurface = element.querySelector(".touch-look")!;
    this.knob = element.querySelector(".touch-knob")!;
    this.tray = element.querySelector(".touch-utility")!;
    this.hotbar = element.querySelector(".touch-hotbar")!;
    this.selectedLabel = element.querySelector(".touch-selected-name")!;
    for (const [action, text, label, glyph, region] of ACTION_CONTROLS) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "touch-button touch-" + action;
      button.dataset.touchAction = action; button.setAttribute("aria-label", label);
      button.innerHTML = `<span aria-hidden="true">${glyph}</span><small>${text}</small>`;
      if (HELD_ACTIONS.has(action) || action === "toggleFlight") button.setAttribute("aria-pressed", "false");
      element.querySelector(region === "top" ? ".touch-top" : region === "cluster" ? ".touch-actions" : ".touch-utility")!.append(button);
      this.actions.set(action, button);
    }
    this.more = document.createElement("button");
    this.more.type = "button"; this.more.className = "touch-button touch-more"; this.more.dataset.touchControl = "utility";
    this.more.setAttribute("aria-label", "More actions"); this.more.setAttribute("aria-expanded", "false");
    this.more.setAttribute("aria-controls", "touch-utility-tray"); this.more.innerHTML = '<span aria-hidden="true">···</span><small>More</small>';
    element.querySelector(".touch-actions")!.append(this.more);
    this.fullscreenButton = document.createElement("button");
    this.fullscreenButton.type = "button";
    this.fullscreenButton.className = "touch-button touch-fullscreen";
    this.fullscreenButton.dataset.browserAction = "fullscreen";
    this.fullscreenButton.dataset.browserCompact = "true";
    this.fullscreenButton.setAttribute("aria-label", "Enter fullscreen");
    this.fullscreenButton.title = "Enter fullscreen";
    this.fullscreenButton.innerHTML = '<span aria-hidden="true">⛶</span><small>Full</small>';
    element.querySelector(".touch-top")!.append(this.fullscreenButton);
    const slots: HTMLButtonElement[] = [];
    for (let i = 0; i < 9; i++) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "touch-slot"; button.dataset.touchSlot = String(i);
      button.setAttribute("aria-label", `Hotbar slot ${i + 1}, empty`); button.setAttribute("aria-pressed", "false");
      this.hotbar.append(button); slots.push(button);
    }
    this.slots = slots;
    this.listen(element, "pointerdown", this.down);
    this.listen(element, "pointerup", this.up);
    this.listen(element, "pointercancel", this.cancel);
    this.listen(element, "lostpointercapture", this.lost);
    this.listen(element, "click", this.click);
    this.listen(element, "keydown", this.keyDown);
    this.listen(window, "keydown", this.utilityEscape);
    this.listen(element, "focusout", this.focusOut);
    this.listen(element, "contextmenu", this.contextMenu);
    this.listen(window, "keyup", this.keyUp);
    // One window-level listener handles both captured and uncaptured contacts.
    // Do not also listen on the element: captured pointer events bubble to window,
    // and dual listeners would apply each camera delta twice.
    this.listen(window, "pointermove", this.move);
    this.listen(window, "pointerup", this.up);
    this.listen(window, "pointercancel", this.cancel);
    if(element.parentElement?.dataset.viewportManaged==="true"){this.listen(element.parentElement,"jade-viewport-cancel",()=>this.clear());this.listen(element.parentElement,"jade-viewport-change",this.resize);}
    else {this.listen(window,"resize",this.resize);this.listen(window,"orientationchange",this.resize);}
    this.listen(document, "pointerdown", this.outside);
    this.coarse = window.matchMedia?.("(pointer: coarse)");
    this.noHover = window.matchMedia?.("(hover: none)");
    for (const media of [this.coarse, this.noHover]) if (media) {
      if (media.addEventListener) { media.addEventListener("change", this.capabilities); this.listeners.push(() => media.removeEventListener("change", this.capabilities)); }
      else { media.addListener(this.capabilities); this.listeners.push(() => media.removeListener(this.capabilities)); }
    }
    this.capabilities();
  }

  get enabled() { return !this.disposed && typeof PointerEvent !== "undefined" && (this.mode === "on" || this.mode === "auto" && this.auto); }
  get visible() { return this.shown; }
  get pointerCount() { return this.contacts.size; }
  get utilityOpen() { return this.trayOpen; }
  get listenerCount() { return this.listeners.length; }
  configure(mode: unknown, sensitivity: unknown) {
    const next = touchMode(mode), value = touchSensitivity(sensitivity);
    if (next !== this.mode || value !== this.sensitivity) this.clear();
    this.mode = next; this.sensitivity = value; this.visibility();
  }
  setScreen(gameplay: boolean) {
    if (this.screenAllows === gameplay) return;
    this.screenAllows = gameplay; this.visibility();
  }
  setGameplay(eligible: boolean, mode: Mode) {
    if (this.disposed) return;
    if (mode !== this.gameMode) {
      this.gameMode = mode; this.setTray(false);
      this.actions.get("toggleFlight")!.hidden = mode !== "creative";
      this.actions.get("drop")!.hidden = mode === "spectator";
      this.more.hidden = mode === "spectator";
    }
    if (this.gameplay === eligible) return;
    this.gameplay = eligible; this.visibility();
  }
  /** Input's existing lifecycle calls this; it owns blur/visibility/world policy. */
  suspend() { this.gameplay = false; this.visibility(); this.clear(); }
  private visibility() {
    const enabled = this.enabled, visible = enabled && this.gameplay && this.screenAllows;
    this.element.parentElement?.classList.toggle("touch-mode", enabled);
    this.element.parentElement?.classList.toggle("touch-layout", this.auto || this.mode === "on");
    if (visible === this.shown) return;
    this.shown = visible; this.element.hidden = !visible;
    if (!visible) this.clear(); else this.measure();
    this.onVisibilityChange?.(visible);
  }
  private capabilities = () => {
    this.auto = touchEnabled("auto", navigator.maxTouchPoints, !!this.coarse?.matches, !!this.noHover?.matches);
    this.visibility();
  };
  private listen(target: EventTarget, name: string, handler: EventListener) {
    target.addEventListener(name, handler); this.listeners.push(() => target.removeEventListener(name, handler));
  }
  private capture(element: HTMLElement, id: number, release = false) {
    try {
      if (release) { if (element.hasPointerCapture?.(id)) element.releasePointerCapture(id); }
      else element.setPointerCapture?.(id);
    } catch (error) {
      if (!(error instanceof DOMException && (error.name === "NotFoundError" || error.name === "InvalidStateError"))) throw error;
    }
  }
  private measure() {
    const rect = this.joystick.getBoundingClientRect();
    this.geometry.x = rect.x + rect.width / 2; this.geometry.y = rect.y + rect.height / 2;
    this.geometry.radius = Math.max(1, rect.width * .34);
  }
  private visual(element: HTMLElement) {
    let pressed = false;
    for (const p of this.contacts.values()) if (p.element === element) { pressed = true; break; }
    element.classList.toggle("is-pressed", pressed);
    const action = element.dataset.touchAction as InputAction | undefined;
    if (action && HELD_ACTIONS.has(action)) element.setAttribute("aria-pressed", String(pressed));
  }
  private joystickMove(id: number, x: number, y: number) {
    const g = this.geometry, v = joystickVector(x, y, g.x, g.y, g.radius, this.vector);
    this.knob.style.transform = `translate(calc(-50% + ${v.x * g.radius}px), calc(-50% + ${-v.y * g.radius}px))`;
    this.port.setMove(id, v.x, v.y);
  }
  private down: EventListener = raw => {
    const e = raw as PointerEvent;
    if (!this.shown || this.disposed || e.button !== 0 || !Number.isSafeInteger(e.pointerId) || e.pointerId < 0 || e.pointerId >= ACCESSIBLE_POINTER || !Number.isFinite(e.clientX + e.clientY)) return;
    const target = (e.target as Element).closest<HTMLElement>("[data-touch-control], [data-touch-action], [data-touch-slot]");
    if (!target || !this.element.contains(target) || target.closest("[hidden]") || target instanceof HTMLButtonElement && target.disabled) return;
    e.preventDefault(); e.stopPropagation();
    if (this.trayOpen && !this.tray.contains(target) && target !== this.more) this.setTray(false);
    if (this.contacts.has(e.pointerId) || this.contacts.size >= MAX_POINTERS) return;
    let role: Role;
    if (target.dataset.touchAction) role = "action";
    else if (target.dataset.touchSlot !== undefined) role = "slot";
    else role = target.dataset.touchControl as Role;
    if (role === "look" && e.pointerType === "mouse") { this.options.mouseLock(); return; }
    if ((role === "joystick" || role === "look") && e.pointerType !== "touch" && e.pointerType !== "pen") return;
    if (role === "joystick" && this.joystickId !== undefined || role === "look" && this.lookId !== undefined) return;
    if (role === "joystick") { this.joystickId = e.pointerId; this.measure(); }
    if (role === "look") this.lookId = e.pointerId;
    const action = target.dataset.touchAction as InputAction | undefined;
    this.contacts.set(e.pointerId, { element: target, role, action, x: e.clientX, y: e.clientY });
    this.capture(target, e.pointerId); this.visual(target);
    if (role === "joystick") this.joystickMove(e.pointerId, e.clientX, e.clientY);
    else if (role === "action") { this.port.press(e.pointerId, action!); this.visual(target); }
    else if (role === "slot") this.port.selectHotbar(e.pointerId, Number(target.dataset.touchSlot));
    else if (role === "utility") this.setTray(!this.trayOpen);
  };
  private move: EventListener = raw => {
    const e = raw as PointerEvent, p = this.contacts.get(e.pointerId);
    if (!p || !this.shown || !Number.isFinite(e.clientX + e.clientY)) return;
    e.preventDefault(); e.stopPropagation();
    if (p.role === "joystick") this.joystickMove(e.pointerId, e.clientX, e.clientY);
    else if (p.role === "look" || p.role === "action" && p.action !== undefined && touchActionSupportsLookDrag(p.action)) {
      // The held action keeps ownership of this pointer until release. The
      // same contact can steer the camera for Mine, Jump, Sprint and Crouch,
      // without releasing the gameplay action or losing its pressed state.
      this.port.addLookDelta(e.pointerId, (e.clientX - p.x) * this.sensitivity, (e.clientY - p.y) * this.sensitivity);
      p.x = e.clientX; p.y = e.clientY;
    }
  };
  private finish(id: number, reason: "up" | "cancel" | "lost") {
    const p = this.contacts.get(id); if (!p) return;
    // Remove before releasing capture: implicit lostcapture after pointerup is not cancellation.
    this.contacts.delete(id);
    if (p.role === "joystick") { this.joystickId = undefined; this.knob.style.transform = ""; }
    if (p.role === "look") this.lookId = undefined;
    if (reason === "up") {
      if (p.role === "joystick") this.port.setMove(id, 0, 0);
      if (p.action) this.port.release(id, p.action);
      this.port.releasePointer(id);
    } else if (reason === "lost") this.port.lostPointerCapture(id);
    else this.port.pointerCancel(id);
    this.capture(p.element, id, true); this.visual(p.element);
    // Utility actions are one-shot choices. Close the More tray after the
    // chosen action is released; a held action elsewhere is left untouched.
    if (p.role === "action" && this.tray.contains(p.element)) this.setTray(false);
  }
  private up: EventListener = e => this.finish((e as PointerEvent).pointerId, "up");
  private cancel: EventListener = e => this.finish((e as PointerEvent).pointerId, "cancel");
  private lost: EventListener = e => this.finish((e as PointerEvent).pointerId, "lost");
  private click: EventListener = raw => {
    const e = raw as MouseEvent;
    const button = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("button") : null;
    // Browser actions must bubble to BrowserExperience; this surface only owns
    // gameplay controls and must not swallow the fullscreen button's click.
    if (button?.dataset.browserAction) return;
    if (!button || (button !== this.more && button.dataset.touchSlot === undefined && !button.dataset.touchAction)) return;
    e.preventDefault(); e.stopPropagation();
    if (!this.shown || e.detail !== 0 || "pointerType" in e && (e as PointerEvent).pointerType) return;
    if (button.disabled || button.closest("[hidden]")) return;
    if (button === this.more) this.setTray(!this.trayOpen);
    else if (button.dataset.touchSlot !== undefined) {
      this.port.selectHotbar(ACCESSIBLE_POINTER, Number(button.dataset.touchSlot)); this.port.releasePointer(ACCESSIBLE_POINTER);
    } else if (button.dataset.touchAction) {
      const action = button.dataset.touchAction as InputAction;
      this.port.press(ACCESSIBLE_POINTER, action); this.visual(button);
      this.port.release(ACCESSIBLE_POINTER, action); this.visual(button); this.port.releasePointer(ACCESSIBLE_POINTER);
      if (this.tray.contains(button)) this.setTray(false);
    }
  };
  private keyDown: EventListener = raw => {
    const e = raw as KeyboardEvent;
    if (!this.shown || !["Space", "Enter"].includes(e.code) || e.ctrlKey || e.metaKey || e.altKey) return;
    const button = (e.target as Element).closest<HTMLButtonElement>("button");
    if (!button || button.disabled || button.closest("[hidden]")) return;
    e.stopPropagation();
    const action = button.dataset.touchAction as InputAction | undefined;
    if (!action) return; // Native accessible click handles More and slots.
    e.preventDefault(); if (e.repeat || this.contacts.has(ACCESSIBLE_POINTER) || this.contacts.size >= MAX_POINTERS) return;
    this.contacts.set(ACCESSIBLE_POINTER, { element: button, role: "action", action, x: 0, y: 0, key: e.code });
    this.visual(button); this.port.press(ACCESSIBLE_POINTER, action);
  };
  private keyUp: EventListener = raw => {
    const e = raw as KeyboardEvent, p = this.contacts.get(ACCESSIBLE_POINTER);
    if (p?.key === e.code) { e.preventDefault(); this.finish(ACCESSIBLE_POINTER, "up"); }
  };
  private focusOut: EventListener = raw => {
    if (this.contacts.get(ACCESSIBLE_POINTER)?.element === raw.target) this.finish(ACCESSIBLE_POINTER, "cancel");
  };
  private utilityEscape: EventListener = raw => {
    const e = raw as KeyboardEvent;
    if (e.key !== "Escape" || !this.shown || !this.trayOpen) return;
    e.preventDefault(); e.stopPropagation(); this.setTray(false); this.more.focus({ preventScroll: true });
  };
  private contextMenu: EventListener = e => { if (this.shown) e.preventDefault(); };
  private outside: EventListener = e => {
    if (this.shown && this.trayOpen && e.target instanceof Node && !this.tray.contains(e.target) && !this.more.contains(e.target)) this.setTray(false);
  };
  private resize: EventListener = () => { this.clear(); if (this.shown) this.measure(); };
  private setTray(open: boolean) {
    if (open === this.trayOpen) return;
    if (!open) for (const [id, p] of this.contacts) if (this.tray.contains(p.element)) this.finish(id, "cancel");
    this.element.parentElement?.classList.toggle("touch-utility-open",open);
    this.trayOpen = open; this.tray.hidden = !open; this.more.setAttribute("aria-expanded", String(open));
  }
  clear() {
    for (const id of this.contacts.keys()) this.finish(id, "cancel");
    this.port.clear(); this.setTray(false); this.knob.style.transform = "";
  }
  setFlightState(flying: boolean) {
    const button = this.actions.get("toggleFlight");
    button?.setAttribute("aria-pressed", String(flying));
    button?.setAttribute("aria-label", `Creative flight ${flying ? "on" : "off"}`);
  }
  updateHotbar(inv: { selected: number; slots: readonly (Stack | null)[] }, mode: Mode, flying: boolean) {
    if (this.disposed || !this.enabled) return;
    for (let i = 0; i < 9; i++) {
      const stack = inv.slots[i], signature = stack ? `${stack.id}:${stack.count}:${stack.durability ?? ""}:${mode}` : "empty";
      const button = this.slots[i];
      if (signature !== this.signatures[i]) {
        button.innerHTML = stack ? this.options.renderItem(stack, mode !== "creative") : '<span class="touch-empty" aria-hidden="true">·</span>';
        button.setAttribute("aria-label", `Hotbar slot ${i + 1}, ${stack ? this.options.itemName(stack) + ", " + stack.count : "empty"}`);
        this.signatures[i] = signature;
      }
      if (this.selected !== inv.selected) {
        button.classList.toggle("selected", i === inv.selected); button.setAttribute("aria-pressed", String(i === inv.selected));
      }
    }
    this.selected = inv.selected;
    const selected = inv.slots[inv.selected], name = selected ? this.options.itemName(selected) : "Empty hand";
    if (name !== this.heldName) { this.selectedLabel.textContent = name; this.heldName = name; }
    this.setFlightState(flying);
  }
  dispose() {
    if (this.disposed) return;
    this.suspend(); this.disposed = true;
    for (const remove of this.listeners) remove(); this.listeners.length = 0;
    this.element.parentElement?.classList.remove("touch-mode", "touch-layout"); this.element.remove();
  }
}
