import { InputState, type InputAction, type InputContext, type InputCommand } from "./input-state";
import { DesktopInputAdapter } from "./desktop-input";
import { TouchInputAdapter } from "./touch-input";
import { GamepadInputAdapter } from "./gamepad-input";
/** One runtime input owner. Pointer lock belongs only to the desktop adapter. */
export class Input {
    readonly state = new InputState();
    readonly desktop: DesktopInputAdapter;
    readonly touch: TouchInputAdapter;
    readonly gamepad: GamepadInputAdapter;
    private wantedContext: InputContext = "gameplay";
    private focused = true;
    private disposed = false;
    private blur = () => { this.focused = false; this.clear(); this.state.setContext("suspended"); };
    private focus = () => {
        if (!document.hidden) {
            this.focused = true;
            this.clear();
            this.state.setContext(this.wantedContext);
        }
    };
    private visibility = () => {
        if (document.hidden)
            this.blur();
        else
            this.focus();
    };
    onLook?: (x: number, y: number) => void;
    onCommand?: (command: Readonly<InputCommand>) => void;
    onUnlock?: () => void;
    onClear?: () => void;
    constructor(public canvas: HTMLCanvasElement) {
        this.desktop = new DesktopInputAdapter(canvas, this.state);
        this.touch = new TouchInputAdapter(this.state);
        this.gamepad = new GamepadInputAdapter(this.state);
        this.desktop.onUnlock = () => this.onUnlock?.();
        this.desktop.onLifecycleClear = () => this.clear();
        this.state.onCommand = c => this.onCommand?.(c);
        this.state.onQueued = () => this.state.flush();
        window.addEventListener("blur", this.blur);
        window.addEventListener("pagehide", this.blur);
        window.addEventListener("focus", this.focus);
        document.addEventListener("visibilitychange", this.visibility);
    }
    get locked() { return this.desktop.locked; }
    set locked(value: boolean) { this.desktop.locked = value; }
    set mouseSensitivity(value: number) { this.desktop.mouseSensitivity = Number.isFinite(value) ? Math.max(1, Math.min(12, value)) : 4; }
    read() { this.desktop.syncKeys(); return this.state.read(); }
    readTick(useReady = true) { this.desktop.syncKeys(); this.state.flush(true, useReady); return this.state.read(); }
    held(action: InputAction) { return this.state.held(action); }
    pressed(action: InputAction) { return this.state.pressed(action); }
    consumeTick() { this.state.consumeTick(); }
    poll(dt: number) {
        if (this.disposed)
            return;
        this.gamepad.poll(dt);
        this.state.flush();
        const f = this.state.read();
        if (this.state.context === "gameplay" && (f.lookX || f.lookY))
            this.onLook?.(f.lookX, f.lookY);
        this.state.consumeLook();
    }
    clear() { this.desktop.clear(); this.touch.clear(); this.gamepad.clear(); this.state.clear(); this.onClear?.(); }
    setContext(context: InputContext) {
        this.wantedContext = context;
        if (this.state.context !== (this.focused ? context : "suspended")) {
            this.clear();
            this.state.setContext(this.focused ? context : "suspended");
        }
    }
    /** Persisted pageshow may have no separate focus event. Restores UI only. */
    restoreUIFocus() { this.focused = !document.hidden; this.setContext("ui"); this.clear(); }
    prepareResume() { this.clear(); this.setContext("gameplay"); this.desktop.prepareResume(); }
    lock() { return this.desktop.lock(); }
    unlock() { this.setContext("ui"); this.clear(); this.desktop.unlock(); }
    dispose() {
        if (this.disposed)
            return;
        this.clear();
        this.disposed = true;
        this.desktop.dispose();
        this.touch.dispose();
        this.gamepad.dispose();
        window.removeEventListener("blur", this.blur);
        window.removeEventListener("pagehide", this.blur);
        window.removeEventListener("focus", this.focus);
        document.removeEventListener("visibilitychange", this.visibility);
        this.state.onQueued = this.state.onCommand = undefined;
    }
    // Deprecated desktop QA compatibility. Gameplay never reads these fields.
    get keys() { return this.desktop.keys; }
    get left() { return this.held("primary"); }
    set left(v: boolean) { this.state.setAction("mouse", "primary", v); }
    get right() { return this.held("secondary"); }
    set right(v: boolean) { this.state.setAction("mouse", "secondary", v); }
    get leftPressed() { return this.pressed("primary"); }
    set leftPressed(v: boolean) {
        if (!v)
            this.state.consumePressed("primary");
    }
    set onKey(callback: ((code: string) => void) | undefined) { this.desktop.onKey = callback; }
}
