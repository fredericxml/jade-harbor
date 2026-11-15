import { InputState, keyboardAction } from "./input-state";
export class DesktopInputAdapter {
    keys = new Set<string>();
    mouseSensitivity = 5;
    private lastJump = -Infinity;
    private cleanup: Array<() => void> = [];
    private disposed = false;
    onLifecycleClear?: () => void;
    locked = false;
    // A deliberate UI transition must not be mistaken for an unexpected lock loss.
    private pendingIntentionalUnlock = false;
    private lockRequestNumber = 0;
    private externalUnlockTimer: ReturnType<typeof setTimeout> | null = null;
    // Closing a modal is not a fresh gameplay lock acquisition. In particular,
    // Escape may release pointer lock *after* its keyboard event has fired.
    private suppressUnexpectedUnlock = false;
    private ignoreNativeEscapeUntil = 0;
    private lockAcquiredAt = 0;
    onKey?: (key: string) => void;
    onUnlock?: () => void;
    constructor(public canvas: HTMLCanvasElement, private state: InputState) {
        this.listen(document, "pointerlockchange", () => {
            const wasLocked = this.locked;
            this.locked = document.pointerLockElement === canvas;
            if (this.locked) {
                this.pendingIntentionalUnlock = false;
                this.suppressUnexpectedUnlock = false;
                this.lockAcquiredAt = performance.now();
                return;
            }
            this.clear();
            this.onLifecycleClear?.();
            if (this.pendingIntentionalUnlock) {
                this.pendingIntentionalUnlock = false;
                return;
            }
            if (this.suppressUnexpectedUnlock || performance.now() - this.lockAcquiredAt < 450)
                return;
            // Ignore redundant unlock events and late events after opening/closing UI.
            // Only an actual unexpected transition out of an acquired lock can pause.
            if (wasLocked) {
                // Some browsers report Escape's implicit pointer unlock before its
                // keydown event. Give the keyboard toggle a chance to handle it first.
                this.cancelExternalUnlock();
                this.externalUnlockTimer = setTimeout(() => {
                    this.externalUnlockTimer = null;
                    if (!this.locked && !this.suppressUnexpectedUnlock) {
                        // Some browsers deliver the native Escape keydown after unlocking.
                        // It belongs to this Pause, not a request to close it again.
                        this.ignoreNativeEscapeUntil = performance.now() + 250;
                        this.onUnlock?.();
                    }
                }, 80);
            }
        });
        this.listen(document, "mousemove", (e) => {
            if (this.locked && this.state.context === "gameplay") {
                this.state.addLook("mouse", e.movementX * .0005 * this.mouseSensitivity, e.movementY * .0005 * this.mouseSensitivity);
            }
        });
        this.state.register("keyboard");
        this.state.register("mouse");
        this.listen(document, "keydown", (e) => {
            if (e.code === "Escape") {
                if (performance.now() < this.ignoreNativeEscapeUntil) {
                    e.preventDefault();
                    return;
                }
                this.cancelExternalUnlock();
                e.preventDefault();
                if (!e.repeat) {
                    this.state.setAction("keyboard", "pause", true);
                    this.onKey?.("Escape");
                }
                return;
            }
            const target = e.target as HTMLElement | null;
            if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement || target?.isContentEditable)
                return;
            if (e.repeat || e.metaKey || e.altKey || (e.ctrlKey && e.code !== "ControlLeft" && e.code !== "ControlRight"))
                return;
            if (!keyboardAction(e.code) && !["KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code) && !/^Digit[1-9]$/.test(e.code))
                return;
            if (this.state.context === "gameplay" && ["Space", "F3"].includes(e.code))
                e.preventDefault();
            if (this.locked && this.state.context === "gameplay")
                this.keys.add(e.code);
            this.syncKeys();
            const action = keyboardAction(e.code);
            if (action && !["jump", "sprint", "crouch"].includes(action))
                this.state.setAction("keyboard", action, true);
            if (e.code === "Space" && this.state.context === "gameplay") {
                if (!this.locked)
                    this.state.command("jump",0,"keyboard");
                const now = performance.now();
                if (now - this.lastJump < 280)
                    this.state.command("toggleFlight",0,"keyboard");
                this.lastJump = now;
            }
            if (/^Digit[1-9]$/.test(e.code))
                this.state.command("hotbarSelect", Number(e.code.slice(-1)) - 1,"keyboard");
            this.onKey?.(e.code);
        });
        this.listen(document, "keyup", e => {
            this.keys.delete(e.code);
            this.syncKeys();
            const action = keyboardAction(e.code);
            if (action && !["jump", "sprint", "crouch"].includes(action))
                this.state.setAction("keyboard", action, false);
        });
        this.listen(canvas, "mousedown", (e) => {
            if (!this.locked || this.state.context !== "gameplay")
                return;
            if (e.button === 0) {
                this.state.setAction("mouse", "primary", true);
            }
            if (e.button === 2) {
                this.state.setAction("mouse", "secondary", true);
            }
        });
        this.listen(document, "mouseup", (e) => {
            if (e.button === 0)
                this.state.setAction("mouse", "primary", false);
            if (e.button === 2)
                this.state.setAction("mouse", "secondary", false);
        });
        this.listen(canvas, "contextmenu", (e) => { if (this.locked && this.state.context === "gameplay")
            e.preventDefault(); });
        this.listen(canvas, "wheel", (e) => {
            if (this.locked && this.state.context === "gameplay") {
                e.preventDefault();
                const delta = Math.sign(e.deltaY);
                if (Number.isFinite(delta) && delta)
                    this.state.command("hotbarDelta", delta, "mouse");
            }
        }, { passive: false });
    }
    private cancelExternalUnlock() {
        if (this.externalUnlockTimer !== null) {
            clearTimeout(this.externalUnlockTimer);
            this.externalUnlockTimer = null;
        }
    }
    // Called when the UI closes. A delayed native pointer-unlock must never
    // reopen it while the player is waiting to click back into the game.
    prepareResume() {
        this.cancelExternalUnlock();
        this.suppressUnexpectedUnlock = true;
    }
    async lock() {
        if (this.disposed)
            return;
        this.prepareResume();
        const request = ++this.lockRequestNumber;
        try {
            if (typeof this.canvas.requestPointerLock !== "function")
                return;
            await this.canvas.requestPointerLock();
            if (this.disposed) {
                document.exitPointerLock?.();
                return;
            }
            if (request === this.lockRequestNumber &&
                document.pointerLockElement === this.canvas) {
                this.locked = true;
                this.pendingIntentionalUnlock = false;
                this.suppressUnexpectedUnlock = false;
                this.lockAcquiredAt = performance.now();
            }
        }
        catch {
            // Browsers may reject a lock immediately after Escape. Keep the pause
            // dialog closed; a normal click on the game canvas can acquire the lock.
        }
    }
    unlock() {
        this.cancelExternalUnlock();
        ++this.lockRequestNumber;
        if (document.pointerLockElement === this.canvas || this.locked) {
            this.pendingIntentionalUnlock = true;
            document.exitPointerLock?.();
        }
        this.clear();
    }
    clear() {
        this.keys.clear();
        this.lastJump = -Infinity;
        this.state.clearSource("keyboard");
        this.state.clearSource("mouse");
    }
    syncKeys() {
        const k = this.keys;
        this.state.setMove("keyboard", Number(k.has("KeyD")) - Number(k.has("KeyA")), Number(k.has("KeyW")) - Number(k.has("KeyS")));
        this.state.setAction("keyboard", "jump", k.has("Space"));
        this.state.setAction("keyboard", "sprint", k.has("ShiftLeft") || k.has("ShiftRight"));
        this.state.setAction("keyboard", "crouch", k.has("ControlLeft") || k.has("ControlRight") || k.has("KeyC"));
    }
    private listen<K extends keyof DocumentEventMap>(target: Document | HTMLCanvasElement, type: K, fn: (e: DocumentEventMap[K]) => void, options?: AddEventListenerOptions) {
        target.addEventListener(type, fn as EventListener, options);
        this.cleanup.push(() => target.removeEventListener(type, fn as EventListener, options));
    }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.unlock(); for (const remove of this.cleanup)
        remove(); this.cleanup.length = 0; }
}
