import { it, expect, afterEach, vi } from "vitest";
import { InputState, keyboardAction, keyboardCommand } from "../src/player/input-state";
import { TouchInputAdapter } from "../src/player/touch-input";
import { GamepadInputAdapter, radialStick, GAMEPAD_DEADZONE, GAMEPAD_LOOK_RADIANS_PER_SECOND } from "../src/player/gamepad-input";
import { Input } from "../src/player/input";
import { Game } from "../src/core/game";
afterEach(() => vi.unstubAllGlobals());
it("clearing one overlapping primary source preserves another source's completed tap",()=>{const s=state();s.setAction("mouse","primary",true);s.setAction("gamepad:0","primary",true);s.setAction("gamepad:0","primary",false);s.clearSource("mouse");expect(s.held("primary")).toBe(false);expect(s.pressed("primary")).toBe(true);s.consumeTick();expect(s.pressed("primary")).toBe(false);});
it("clearing one overlapping jump source leaves the other pending press owned and consumable",()=>{const s=state(),events:string[]=[];s.onCommand=c=>events.push(c.action);s.setAction("keyboard","jump",true);s.setAction("gamepad:0","jump",true);s.setAction("gamepad:0","jump",false);s.clearSource("keyboard");s.flush(true);expect(events).toEqual(["jump"]);});
it("retains a completed touch primary tap until the fixed tick, while cancellation drops it",()=>{const s=state(),t=new TouchInputAdapter(s);t.press(1,"primary");t.release(1,"primary");t.releasePointer(1);expect(t.pointerCount).toBe(0);expect(s.held("primary")).toBe(false);expect(s.pressed("primary")).toBe(true);s.consumeTick();expect(s.pressed("primary")).toBe(false);t.press(2,"primary");t.pointerCancel(2);expect(s.pressed("primary")).toBe(false);});
it("defers jump/use edges to the tick and clears only a disconnected source's pending actions",()=>{const s=state(),events:string[]=[];s.onCommand=c=>events.push(c.action);s.setAction("gamepad:0","jump",true);s.setAction("gamepad:0","secondary",true);s.setAction("keyboard","use",true);s.flush();expect(events).toEqual([]);s.remove("gamepad:0");s.flush(true);expect(events).toEqual(["use"]);});
it("retains a released touch use edge during cooldown without dispatching it early",()=>{const s=state(),t=new TouchInputAdapter(s),events:string[]=[];s.onCommand=c=>events.push(c.action);t.press(1,"use");t.releasePointer(1);s.flush(true,false);s.consumeTick();expect(events).toEqual([]);s.flush(true,true);s.consumeTick();expect(events).toEqual(["use"]);s.flush(true);expect(events).toEqual(["use"]);});
it("keeps completed and cancelled contacts separate when a browser pointer ID is reused",()=>{const s=state(),t=new TouchInputAdapter(s),events:string[]=[];s.onCommand=c=>events.push(c.action);t.press(1,"jump");t.releasePointer(1);t.press(1,"primary");t.pointerCancel(1);s.flush(true);expect(events).toEqual(["jump"]);expect(s.pressed("primary")).toBe(false);});
it("touch clear/dispose drops retired edges but retains another source's intent",()=>{const s=state(),t=new TouchInputAdapter(s),events:string[]=[];s.onCommand=c=>events.push(c.action);t.press(1,"use");t.releasePointer(1);s.setAction("keyboard","jump",true);t.dispose();s.flush(true);expect(events).toEqual(["jump"]);});
function state() { const s = new InputState(); for (const id of ["keyboard", "mouse", "gamepad:0"] as const)
    s.register(id); return s; }
function pad() { return { connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })) } as unknown as Gamepad; }
function setButton(p: Gamepad, index: number, value: number) { Object.assign(p.buttons[index], { value, pressed: value >= .5 }); }
it.each(["jump", "sprint", "crouch", "primary", "secondary", "use"] as const)("aggregates %s by source through release and disconnect", action => {
    const s = state();
    s.setAction("keyboard", action, true);
    s.setAction("gamepad:0", action, true);
    expect(s.held(action)).toBe(true);
    s.setAction("keyboard", action, false);
    expect(s.held(action)).toBe(true);
    s.remove("gamepad:0");
    expect(s.held(action)).toBe(false);
});
it("preserves quick primary taps until exactly one fixed tick", () => { const s = state(); s.setAction("mouse", "primary", true); s.setAction("mouse", "primary", false); expect(s.pressed("primary")).toBe(true); expect(s.held("primary")).toBe(false); s.clearSource("keyboard"); expect(s.pressed("primary")).toBe(true); s.consumeTick(); expect(s.pressed("primary")).toBe(false); });
it("combines axes, preserves analog magnitude and cancels exact opposition", () => { const s = state(), frame = s.read(); s.setMove("keyboard", .3, .4); expect(s.read()).toBe(frame); expect(Math.hypot(frame.moveX, frame.moveY)).toBe(.5); s.setMove("gamepad:0", 1, 1); expect(Math.hypot(s.read().moveX, s.read().moveY)).toBeCloseTo(1); s.setMove("keyboard", -1, -1); expect(s.read().moveX).toBe(0); expect(s.read().moveY).toBe(0); s.setMove("keyboard", 0, 0); expect(s.read().moveY).toBeCloseTo(Math.SQRT1_2); });
it("adds look exactly once and removes only a cleared source's look and commands", () => { const s = state(), events: string[] = []; s.onCommand = c => events.push(c.action); s.addLook("mouse", .1, .2); s.addLook("gamepad:0", .3, .4); s.setAction("gamepad:0", "inventory", true); s.command("hotbarDelta", 1, "mouse"); s.clearSource("gamepad:0"); expect(s.read().lookX).toBe(.1); s.flush(); expect(events).toEqual(["hotbarDelta"]); s.consumeLook(); expect(s.read().lookX).toBe(0); });
it("fires each genuine source press once, retains releases, and bounds the queue", () => { const s = state(), events: string[] = []; s.onCommand = c => events.push(c.action); s.setAction("keyboard", "inventory", true); s.setAction("gamepad:0", "inventory", true); s.flush(); expect(events).toEqual(["inventory","inventory"]); s.setAction("keyboard", "inventory", false); s.setAction("gamepad:0", "inventory", false); s.setAction("gamepad:0", "inventory", true); s.flush(); expect(events).toHaveLength(3); for (let i = 0; i < 1000; i++)
    s.command("hotbarDelta", 1); s.flush(); expect(events).toHaveLength(67); });
it("gates UI/suspended actions and discards pending input on context changes", () => { const s = state(), events: string[] = []; s.onCommand = c => events.push(c.action); s.setAction("mouse", "primary", true); s.addLook("mouse", 2, 2); s.setContext("ui"); s.setAction("keyboard", "jump", true); s.command("drop"); s.setMove("keyboard", 1, 1); expect(s.read().held).toBe(0); expect(s.read().lookX).toBe(0); expect(s.read().moveX).toBe(0); s.setAction("keyboard", "pause", true); s.flush(); expect(events).toEqual(["pause"]); s.setContext("suspended"); s.command("pause"); s.flush(); expect(events).toEqual(["pause"]); });
it.each(["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "Space", "KeyC", "KeyE", "KeyQ", "KeyG", "KeyF", "Escape", "F3"])("maps keyboard code %s", code => { expect(keyboardAction(code)).toBeDefined(); });
it("validates direct hotbar semantics", () => { const s = state(), slots: number[] = []; s.onCommand = c => slots.push(c.value); for (const slot of [-1, 9, NaN, Infinity, .5])
    s.command("hotbarSelect", slot); s.command("hotbarSelect", 8); s.flush(); expect(slots).toEqual([8]); expect(keyboardCommand("Digit1")).toEqual({ action: "hotbarSelect", value: 0 }); expect(keyboardCommand("Digit9")).toEqual({ action: "hotbarSelect", value: 8 }); expect(keyboardCommand("KeyW")).toBeUndefined(); });
it("supports independent touch movement, look, jump and held primary pointers", () => { const s = state(), t = new TouchInputAdapter(s), events: string[] = []; s.onCommand = c => events.push(c.action); t.setMove(1, 0, 1); t.addLookDelta(2, 20, -10); t.press(3, "jump"); t.press(4, "primary"); t.press(5, "primary"); s.flush(true); expect(t.pointerCount).toBe(5); expect(s.read().moveY).toBe(1); expect(s.read().lookX).toBe(.15); expect(events).toEqual(["jump"]); t.releasePointer(2); expect(s.read().moveY).toBe(1); t.release(4, "primary"); expect(s.held("primary")).toBe(true); t.pointerCancel(5); expect(s.held("primary")).toBe(false); t.lostPointerCapture(1); expect(s.read().moveY).toBe(0); });
it("maps a 100px touch camera swipe to a responsive 0.75-radian look delta", () => { const s = state(), t = new TouchInputAdapter(s); t.addLookDelta(9, 100, 0); expect(s.read().lookX).toBeCloseTo(.75); t.dispose(); });
it("bounds touch pointers, validates IDs, cancels stale IDs and disposes without listeners", () => { const s = state(), t = new TouchInputAdapter(s); for (const id of [-1, NaN, Infinity, .5, 2 ** 40])
    t.setMove(id, 1, 1); expect(t.pointerCount).toBe(0); for (let i = 0; i < 40; i++)
    t.setMove(i, 1, 1); expect(t.pointerCount).toBe(16); expect(Math.hypot(s.read().moveX, s.read().moveY)).toBeCloseTo(1); t.clear(); t.setMove(1, 1, 1); expect(t.pointerCount).toBe(0); t.releasePointer(1); t.setMove(1, 1, 1); expect(t.pointerCount).toBe(1); for (let i = 100; i < 300; i++) {
    t.setMove(i, 1, 1);
    t.clear();
} expect((t as unknown as {
    cancelled: Set<number>;
}).cancelled.size).toBeLessThanOrEqual(32); t.dispose(); t.setMove(900, 1, 1); expect(t.pointerCount).toBe(0); expect(s.read().moveX).toBe(0); });
it.each([0, .1, GAMEPAD_DEADZONE, GAMEPAD_DEADZONE + .0001, .5, 1, NaN, Infinity])("radial deadzone handles %s", value => { const r = radialStick(value, 0, { x: 0, y: 0 }); expect(Number.isFinite(r.x + r.y)).toBe(true); expect(Math.hypot(r.x, r.y)).toBeLessThanOrEqual(1); if (!Number.isFinite(value) || value <= GAMEPAD_DEADZONE)
    expect(r.x).toBe(0);
else
    expect(r.x).toBeGreaterThan(0); });
it("radially bounds diagonals and remaps small input continuously", () => { expect(Math.hypot(...Object.values(radialStick(1, 1, { x: 0, y: 0 })))).toBeCloseTo(1); expect(radialStick(.59, 0, { x: 0, y: 0 }).x).toBeCloseTo(.5); });
it("handles optional, null, unsupported, multiple and disconnected pads without cancelling keyboard", () => { const s = state(), a = pad(), b = pad(); let pads: Array<Gamepad | null> = []; const g = new GamepadInputAdapter(s, () => pads); g.poll(.05); expect(g.activeIndex).toBe(-1); pads = [null, { ...a, mapping: "" }, b]; g.poll(.05); expect(g.activeIndex).toBe(2); b.axes[0]; (b.axes as number[])[0] = 1; g.poll(.05); expect(s.read().moveX).toBe(1); s.setAction("keyboard", "sprint", true); setButton(b, 4, 1); g.poll(.05); pads = []; g.poll(.05); expect(s.held("sprint")).toBe(true); expect(s.read().moveX).toBe(0); pads = [a, b]; g.poll(.05); expect(g.activeIndex).toBe(0); g.dispose(); expect(g.activeIndex).toBe(-1); });
it.each([[0, "jump"], [1, "crouch"], [2, "use"], [3, "inventory"], [4, "sprint"], [6, "secondary"], [7, "primary"], [9, "pause"], [11, "toggleFlight"], [14, "hotbarPrevious"], [15, "hotbarNext"]] as const)("maps standard button %s to %s with one rising edge", (i, action) => { const s = state(), p = pad(), g = new GamepadInputAdapter(s, () => [p]), events: string[] = []; s.onCommand = c => events.push(c.action); g.poll(.05); setButton(p, i, 1); g.poll(.05); s.flush(true); const count = events.length; expect(count).toBe(["primary","sprint","crouch"].includes(action)?0:1); for (let n = 0; n < 10; n++)
    g.poll(.05); s.flush(true); expect(events).toHaveLength(count); expect(s.held(action)).toBe(true); setButton(p, i, 0); g.poll(.05); expect(s.held(action)).toBe(false); });
it("uses trigger hysteresis, ignores invalid values and requires neutral after clearing", () => { const s = state(), p = pad(), g = new GamepadInputAdapter(s, () => [p]); g.poll(.05); setButton(p, 7, .54); g.poll(.05); expect(s.held("primary")).toBe(false); setButton(p, 7, .56); g.poll(.05); expect(s.held("primary")).toBe(true); setButton(p, 7, .4); g.poll(.05); expect(s.held("primary")).toBe(true); g.clear(); g.poll(.05); expect(s.held("primary")).toBe(false); setButton(p, 7, 0); g.poll(.05); setButton(p, 7, .8); g.poll(.05); expect(s.held("primary")).toBe(true); setButton(p, 7, NaN); g.poll(.05); expect(s.held("primary")).toBe(false); });
it.each([15, 30, 60, 120])("integrates analog look in radians per second at %s FPS", fps => { const s = state(), p = pad(), g = new GamepadInputAdapter(s, () => [p]); g.poll(0); (p.axes as number[])[2] = 1; let angle = 0; for (let i = 0; i < fps; i++) {
    g.poll(1 / fps);
    angle += s.read().lookX;
    s.consumeLook();
} expect(angle).toBeCloseTo(GAMEPAD_LOOK_RADIANS_PER_SECOND, 10); });
function dom() {
    class Element extends EventTarget {
        isContentEditable = false;
    }
    class Doc extends EventTarget {
        hidden = false;
        pointerLockElement: EventTarget | null = null;
        exitPointerLock() { this.pointerLockElement = null; this.dispatchEvent(new Event("pointerlockchange")); }
    }
    const d = new Doc(), w = new EventTarget(), canvas = new Element() as Element & {
        requestPointerLock: () => Promise<void>;
    };
    canvas.requestPointerLock = async () => { d.pointerLockElement = canvas; d.dispatchEvent(new Event("pointerlockchange")); };
    vi.stubGlobal("document", d);
    vi.stubGlobal("window", w);
    vi.stubGlobal("HTMLInputElement", class extends Element {
    });
    vi.stubGlobal("HTMLTextAreaElement", class extends Element {
    });
    vi.stubGlobal("HTMLSelectElement", class extends Element {
    });
    vi.stubGlobal("navigator", {});
    const input = new Input(canvas as unknown as HTMLCanvasElement), events: string[] = [];
    input.onCommand = c => events.push(c.action);
    const emit = (target: EventTarget, type: string, props: Record<string, unknown> = {}) => { const e = new Event(type, { cancelable: true }); for (const [k, v] of Object.entries(props))
        Object.defineProperty(e, k, { value: v }); target.dispatchEvent(e); return e; };
    return { d, w, canvas, input, events, emit };
}
it("preserves keyboard holds, both modifier sides, repeated key safety and form/browser focus", async () => { const { d, canvas, input, events, emit } = dom(); await input.lock(); emit(d, "keydown", { code: "KeyW" }); emit(d, "keydown", { code: "ShiftRight" }); emit(d, "keydown", { code: "ShiftLeft" }); emit(d, "keyup", { code: "ShiftLeft" }); expect(input.read().moveY).toBe(1); expect(input.held("sprint")).toBe(true); emit(d, "keydown", { code: "KeyE" }); emit(d, "keydown", { code: "KeyE", repeat: true }); expect(events).toEqual(["inventory"]); emit(d, "keydown", { code: "KeyQ", ctrlKey: true }); expect(events).toEqual(["inventory"]); const field = new HTMLInputElement(); emit(d, "keydown", { code: "KeyQ", target: field }); expect(events).toEqual(["inventory"]); expect(emit(d, "keydown", { code: "Tab" }).defaultPrevented).toBe(false); input.dispose(); emit(canvas, "mousedown", { button: 0 }); expect(input.held("primary")).toBe(false); });
it("preserves mouse quick taps, right-use once, wheel and source-aware blur/visibility clearing", async () => { const { d, w, canvas, input, events, emit } = dom(); await input.lock(); emit(canvas, "mousedown", { button: 0 }); emit(d, "mouseup", { button: 0 }); expect(input.pressed("primary")).toBe(true); emit(canvas, "mousedown", { button: 2 }); input.readTick(); expect(events).toEqual(["use"]); emit(canvas, "wheel", { deltaY: 1 }); expect(events).toEqual(["use", "hotbarDelta"]); let angle = 0; input.onLook = x => angle += x; emit(d, "mousemove", { movementX: 20, movementY: 0 }); input.poll(.05); expect(angle).toBe(.05); input.touch.setMove(20, 1, 0); emit(w, "blur"); expect(input.read().moveX).toBe(0); expect(input.held("secondary")).toBe(false); emit(w, "focus"); input.touch.releasePointer(20); input.touch.setMove(20, 1, 0); d.hidden = true; emit(d, "visibilitychange"); expect(input.read().moveX).toBe(0); input.dispose(); });
it("routes legacy developer key calls into the same semantic consumer", () => { const g = Object.create(Game.prototype) as Game, commands: unknown[] = []; g.command = c => commands.push({ ...c }); g.key("Digit3"); g.key("Escape"); g.key("KeyQ"); expect(commands).toEqual([{ action: "hotbarSelect", value: 2 }, { action: "pause", value: 0 }, { action: "drop", value: 0 }]); });
it.each([["KeyW", 0, 1], ["KeyS", 0, -1], ["KeyA", -1, 0], ["KeyD", 1, 0]] as const)("preserves %s movement direction", async (code, x, y) => { const { d, input, emit } = dom(); await input.lock(); emit(d, "keydown", { code }); expect(input.read().moveX).toBe(x); expect(input.read().moveY).toBe(y); emit(d, "keyup", { code }); expect(input.read().moveX + input.read().moveY).toBe(0); input.dispose(); });
it("keeps the full mouse sensitivity range and independent touch angular scale", async () => { const { d, input, emit } = dom(); await input.lock(); input.mouseSensitivity = 12; let angle = 0; input.onLook = x => angle += x; emit(d, "mousemove", { movementX: 20, movementY: 0 }); input.poll(.05); expect(angle).toBe(.12); input.touch.addLookDelta(40, 20, 0); input.poll(.05); expect(angle).toBeCloseTo(.27); input.dispose(); });
it("clears the keyboard double-Space gesture with context and never uses held repeat", async () => { const { d, input, events, emit } = dom(); let clock = 1000; vi.spyOn(performance, "now").mockImplementation(() => clock); await input.lock(); emit(d, "keydown", { code: "Space" }); emit(d, "keyup", { code: "Space" }); clock += 200; emit(d, "keydown", { code: "Space" }); emit(d, "keydown", { code: "Space", repeat: true }); expect(events.filter(x => x === "toggleFlight")).toHaveLength(1); emit(d, "keyup", { code: "Space" }); input.clear(); clock += 50; emit(d, "keydown", { code: "Space" }); expect(events.filter(x => x === "toggleFlight")).toHaveLength(1); input.dispose(); vi.restoreAllMocks(); });
it("safely handles absent button/axis data and restricted Gamepad access", () => { const s = state(), p = pad(); Object.assign(p, { axes: [NaN, Infinity], buttons: [] }); const g = new GamepadInputAdapter(s, () => [p]); g.poll(.05); expect(s.read().moveX + s.read().moveY).toBe(0); s.setAction("keyboard", "sprint", true); const restricted = new GamepadInputAdapter(s, () => { throw new DOMException("denied", "SecurityError"); }); expect(() => restricted.poll(.05)).not.toThrow(); expect(s.held("sprint")).toBe(true); expect(restricted.status).toBe("restricted"); });
