export const ACTIONS = ["jump", "sprint", "crouch", "primary", "secondary", "use", "pause", "inventory", "drop", "debug", "toggleFlight", "hotbarPrevious", "hotbarNext"] as const;
export type InputAction = typeof ACTIONS[number];
export type InputContext = "gameplay" | "ui" | "suspended";
export type InputSource = "keyboard" | "mouse" | `touch:${number}` | `gamepad:${number}`;
export type CommandAction = "jump" | "use" | "pause" | "inventory" | "drop" | "debug" | "toggleFlight" | "hotbarSelect" | "hotbarDelta";
export interface InputCommand {
    action: CommandAction;
    value: number;
}
export interface InputFrame {
    moveX: number;
    moveY: number;
    held: number;
    pressed: number;
    released: number;
    lookX: number;
    lookY: number;
}
interface SourceState {
    id: InputSource;
    x: number;
    y: number;
    held: number;
    pressed: number;
    released: number;
    lookX: number;
    lookY: number;
    retiring: boolean;
}
interface QueuedCommand extends InputCommand {
    source?: InputSource;
}
export const actionBit = (action: InputAction) => 1 << ACTIONS.indexOf(action);
export const finiteAxis = (v: number) => Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
export function keyboardAction(code: string): InputAction | undefined {
    switch (code) {
        case "Space": return "jump";
        case "ShiftLeft":
        case "ShiftRight": return "sprint";
        case "ControlLeft":
        case "ControlRight":
        case "KeyC": return "crouch";
        case "Escape": return "pause";
        case "KeyE": return "inventory";
        case "KeyQ": return "drop";
        case "F3": return "debug";
        case "KeyG": return "toggleFlight";
        case "KeyF": return "use";
    }
}
export function keyboardCommand(code: string): InputCommand | undefined {
    if (/^Digit[1-9]$/.test(code))
        return { action: "hotbarSelect", value: Number(code.slice(-1)) - 1 };
    const action = keyboardAction(code);
    if (action && !["sprint", "crouch", "primary", "secondary"].includes(action))
        return { action: action as CommandAction, value: 0 };
}
/** Bounded device-independent state. +X is right, +Y is forward. */
export class InputState {
    context: InputContext = "gameplay";
    readonly frame: InputFrame = { moveX: 0, moveY: 0, held: 0, pressed: 0, released: 0, lookX: 0, lookY: 0 };
    private sources: SourceState[] = [];
    private queue: QueuedCommand[] = Array.from({ length: 64 }, () => ({ action: "pause", value: 0 }));
    private first = 0;
    private count = 0;
    private flushing = false;
    onCommand?: (command: Readonly<InputCommand>) => void;
    onQueued?: () => void;
    register(id: InputSource) {
        if (this.sources.some(s => s.id === id))
            return true;
        if (this.sources.length === 40)
            return false;
        this.sources.push({ id, x: 0, y: 0, held: 0, pressed: 0, released: 0, lookX: 0, lookY: 0, retiring: false });
        return true;
    }
    remove(id: InputSource) {
        this.clearSource(id);
        const i = this.sources.findIndex(s => s.id === id);
        if (i >= 0)
            this.sources.splice(i, 1);
    }
    /** A completed physical tap retains its edges until a fixed tick consumes them. */
    retire(id: InputSource) {
        const s = this.source(id);
        if (!s)
            return;
        const before = this.frame.held;
        s.x = s.y = s.held = 0;
        s.retiring = true;
        let held = 0;
        for (const source of this.sources)
            held |= source.held;
        this.frame.held = held;
        s.released |= before & ~held;
        this.frame.released |= before & ~held;
    }
    removeFamily(prefix: "touch:") { for (let i = this.sources.length - 1; i >= 0; i--)
        if (this.sources[i].id.startsWith(prefix))
            this.remove(this.sources[i].id); }
    private source(id: InputSource) { return this.sources.find(s => s.id === id); }
    setMove(id: InputSource, x: number, y: number) {
        const s = this.source(id);
        if (!s)
            return;
        s.x = this.context === "gameplay" ? finiteAxis(x) : 0;
        s.y = this.context === "gameplay" ? finiteAxis(y) : 0;
    }
    private allowed(action: InputAction) { return this.context === "gameplay" || (this.context === "ui" && ["pause", "inventory", "debug"].includes(action)); }
    held(action: InputAction) { return !!(this.frame.held & actionBit(action)); }
    pressed(action: InputAction) { return !!(this.frame.pressed & actionBit(action)); }
    setAction(id: InputSource, action: InputAction, down: boolean) {
        if (!ACTIONS.includes(action))
            return;
        const s = this.source(id);
        if (!s)
            return;
        const bit = actionBit(action), before = this.frame.held, beforeSource = s.held;
        if (down && this.allowed(action))
            s.held |= bit;
        else
            s.held &= ~bit;
        let merged = 0;
        for (const source of this.sources)
            merged |= source.held;
        this.frame.held = merged;
        s.released |= before & ~merged;
        this.frame.released |= before & ~merged;
        // Each physical source owns its press. Holds remain a union, so a
        // cancelled device cannot erase another device's completed tap.
        const rise = s.held & ~beforeSource;
        s.pressed |= rise;
        this.frame.pressed |= rise;
        if (!(rise & bit))
            return;
        if (action === "secondary" || action === "use")
            this.command("use", 0, id);
        else if (action === "hotbarPrevious" || action === "hotbarNext")
            this.command("hotbarDelta", action === "hotbarNext" ? 1 : -1, id);
        else if (!["primary", "sprint", "crouch"].includes(action))
            this.command(action as CommandAction, 0, id);
    }
    command(action: CommandAction, value = 0, source?: InputSource) {
        if (!["jump", "use", "pause", "inventory", "drop", "debug", "toggleFlight", "hotbarSelect", "hotbarDelta"].includes(action))
            return;
        if (this.context === "suspended")
            return;
        if (this.context === "ui" && !["pause", "inventory", "debug", "hotbarSelect"].includes(action))
            return;
        if (!Number.isFinite(value) || this.count === this.queue.length)
            return;
        if (action === "hotbarSelect" && (!Number.isInteger(value) || value < 0 || value > 8))
            return;
        const c = this.queue[(this.first + this.count) % this.queue.length];
        c.action = action;
        c.value = action === "hotbarDelta" ? Math.sign(value) : value;
        c.source = source;
        this.count++;
        this.onQueued?.();
    }
    flush(tickEdges = false, useReady = true) {
        if (this.flushing || !this.onCommand)
            return;
        this.flushing = true;
        try {
            const pending = this.count;
            for (let n = 0; n < pending && this.count; n++) {
                const c = this.queue[this.first];
                this.first = (this.first + 1) % 64;
                this.count--;
                if ((c.action === "jump" && !tickEdges) || (c.action === "use" && (!tickEdges || !useReady))) {
                    const tail = this.queue[(this.first + this.count) % 64];
                    tail.action = c.action;
                    tail.value = c.value;
                    tail.source = c.source;
                    this.count++;
                    continue;
                }
                this.onCommand(c);
            }
        }
        finally {
            this.flushing = false;
        }
    }
    addLook(id: InputSource, x: number, y: number) {
        if (this.context !== "gameplay" || !Number.isFinite(x) || !Number.isFinite(y))
            return;
        const s = this.source(id);
        if (!s)
            return;
        s.lookX = Math.max(-Math.PI * 4, Math.min(Math.PI * 4, s.lookX + x));
        s.lookY = Math.max(-Math.PI * 4, Math.min(Math.PI * 4, s.lookY + y));
    }
    read() {
        let x = 0, y = 0, lx = 0, ly = 0;
        for (const s of this.sources) {
            x += s.x;
            y += s.y;
            lx += s.lookX;
            ly += s.lookY;
        }
        this.frame.lookX = lx;
        this.frame.lookY = ly;
        const length = Math.max(1, Math.hypot(x, y));
        this.frame.moveX = x / length;
        this.frame.moveY = y / length;
        return this.frame;
    }
    consumeTick() {
        for (let i = this.sources.length - 1; i >= 0; i--) {
            const s = this.sources[i];
            s.pressed = s.released = 0;
            if (s.retiring) {
                let pending = false;
                for (let n = 0; n < this.count; n++)
                    if (this.queue[(this.first + n) % 64].source === s.id) {
                        pending = true;
                        break;
                    }
                if (!pending && !s.lookX && !s.lookY)
                    this.sources.splice(i, 1);
            }
        }
        this.frame.pressed = this.frame.released = 0;
    }
    consumePressed(action: InputAction) {
        const bit = actionBit(action);
        for (const s of this.sources)
            s.pressed &= ~bit;
        this.frame.pressed &= ~bit;
    }
    consumeLook() {
        for (const s of this.sources)
            s.lookX = s.lookY = 0;
        this.frame.lookX = this.frame.lookY = 0;
    }
    clearSource(id: InputSource) {
        const s = this.source(id);
        if (!s)
            return;
        s.x = s.y = s.held = s.pressed = s.released = s.lookX = s.lookY = 0;
        let kept = 0;
        for (let i = 0; i < this.count; i++) {
            const from = this.queue[(this.first + i) % 64];
            if (from.source === id)
                continue;
            const to = this.queue[(this.first + kept) % 64];
            to.action = from.action;
            to.value = from.value;
            to.source = from.source;
            kept++;
        }
        this.count = kept;
        let merged = 0;
        for (const source of this.sources)
            merged |= source.held;
        this.frame.held = merged;
        // Pending commands/presses belong to the old physical state on a lifecycle clear.
        this.frame.pressed = this.frame.released = 0;
        for (const source of this.sources) {
            this.frame.pressed |= source.pressed;
            this.frame.released |= source.released;
        }
    }
    clear() {
        for (const s of this.sources)
            s.x = s.y = s.held = s.pressed = s.released = s.lookX = s.lookY = 0;
        Object.assign(this.frame, { moveX: 0, moveY: 0, held: 0, pressed: 0, released: 0, lookX: 0, lookY: 0 });
        this.first = this.count = 0;
        for (let i = this.sources.length - 1; i >= 0; i--)
            if (this.sources[i].retiring)
                this.sources.splice(i, 1);
    }
    setContext(context: InputContext) {
        if (context !== this.context) {
            this.clear();
            this.context = context;
        }
    }
}
