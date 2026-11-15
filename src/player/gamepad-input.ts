import { InputState, finiteAxis, type InputAction, type InputSource } from "./input-state";
export const GAMEPAD_DEADZONE = .18;
export const GAMEPAD_LOOK_RADIANS_PER_SECOND = 2.5;
const BUTTONS: ReadonlyArray<readonly [
    number,
    InputAction
]> = [[0, "jump"], [1, "crouch"], [2, "use"], [3, "inventory"], [4, "sprint"], [6, "secondary"], [7, "primary"], [9, "pause"], [11, "toggleFlight"], [14, "hotbarPrevious"], [15, "hotbarNext"]];
const EMPTY_GAMEPADS: readonly (Gamepad | null)[] = Object.freeze([]);
export interface Stick {
    x: number;
    y: number;
}
export function radialStick(x: number, y: number, out: Stick, deadzone = GAMEPAD_DEADZONE) {
    x = finiteAxis(x);
    y = finiteAxis(y);
    const length = Math.hypot(x, y);
    const magnitude = Math.max(0, (Math.min(1, length) - deadzone) / (1 - deadzone));
    out.x = length ? x / length * magnitude : 0;
    out.y = length ? y / length * magnitude : 0;
    return out;
}
export class GamepadInputAdapter {
    private source: InputSource | undefined;
    private buttons = new Uint8Array(17);
    private move: Stick = { x: 0, y: 0 };
    private look: Stick = { x: 0, y: 0 };
    private requireNeutral = false;
    private disposed = false;
    activeIndex = -1;
    status = "unavailable";
    constructor(private state: InputState, private getPads: () => ArrayLike<Gamepad | null> = () => typeof navigator !== "undefined" && typeof navigator.getGamepads === "function" ? navigator.getGamepads() : EMPTY_GAMEPADS) { }
    clear() { if (this.source)
        this.state.clearSource(this.source); this.requireNeutral = true; }
    poll(dt: number) {
        if (this.disposed)
            return;
        let pads: ArrayLike<Gamepad | null>;
        try {
            pads = this.getPads();
        }
        catch (error) {
            if (error instanceof DOMException && (error.name === "SecurityError" || error.name === "NotAllowedError")) {
                this.disconnect();
                this.status = "restricted";
                return;
            }
            throw error;
        }
        let pad: Gamepad | null = null, index = -1, unsupported = false;
        for (let i = 0; i < Math.min(32, pads.length); i++) {
            const p = pads[i];
            if (!p || p.connected === false)
                continue;
            if (p.mapping !== "standard") {
                unsupported = true;
                continue;
            }
            pad = p;
            index = i;
            break;
        }
        if (!pad) {
            this.disconnect();
            this.status = unsupported ? "unsupported mapping" : "no standard controller";
            return;
        }
        if (index !== this.activeIndex) {
            this.disconnect();
            this.activeIndex = index;
            this.source = `gamepad:${index}`;
            this.state.register(this.source);
            this.requireNeutral = true;
        }
        if (this.status !== `standard controller ${index}`)
            this.status = `standard controller ${index}`;
        this.state.register(this.source!);
        radialStick(pad.axes?.[0] ?? 0, -(pad.axes?.[1] ?? 0), this.move);
        radialStick(pad.axes?.[2] ?? 0, pad.axes?.[3] ?? 0, this.look);
        let neutral = this.move.x === 0 && this.move.y === 0 && this.look.x === 0 && this.look.y === 0;
        for (const [i, action] of BUTTONS) {
            const b = pad.buttons?.[i], value = b && Number.isFinite(b.value) ? Math.max(0, Math.min(1, b.value)) : 0;
            const down = i === 6 || i === 7 ? value >= (this.buttons[i] ? .35 : .55) : !!b?.pressed || value >= .5;
            const changed = down !== !!this.buttons[i];
            this.buttons[i] = Number(down);
            const ui = action === "pause" || action === "inventory";
            if (!ui && down)
                neutral = false;
            if (changed && (!down || ui || !this.requireNeutral))
                this.state.setAction(this.source!, action, down);
        }
        if (this.requireNeutral) {
            if (neutral)
                this.requireNeutral = false;
            this.state.setMove(this.source!, 0, 0);
            return;
        }
        this.state.setMove(this.source!, this.move.x, this.move.y);
        const seconds = Number.isFinite(dt) ? Math.max(0, Math.min(.2, dt)) : 0, curve = Math.hypot(this.look.x, this.look.y);
        this.state.addLook(this.source!, this.look.x * curve * GAMEPAD_LOOK_RADIANS_PER_SECOND * seconds, this.look.y * curve * GAMEPAD_LOOK_RADIANS_PER_SECOND * seconds);
    }
    private disconnect() { if (this.source)
        this.state.remove(this.source); this.source = undefined; this.activeIndex = -1; this.buttons.fill(0); }
    dispose() { this.disconnect(); this.disposed = true; }
}
