import { ACTIONS, InputState, actionBit, type InputAction, type InputSource } from "./input-state";
const MAX_POINTERS = 16;
export const TOUCH_LOOK_RADIANS_PER_PIXEL = .0075;
interface PointerState {
    id: number;
    source: InputSource;
    down: number;
}
/** No DOM surfaces or synthetic events. The UI owns pointer capture and layout. */
export class TouchInputAdapter {
    private pointers: PointerState[] = [];
    private cancelled = new Set<number>();
    private disposed = false;
    private nextContact = 0;
    constructor(private state: InputState) { }
    get pointerCount() { return this.pointers.length; }
    private pointer(id: number) {
        if (this.disposed || this.cancelled.has(id) || !Number.isSafeInteger(id) || id < 0 || id > 2147483647)
            return;
        let p = this.pointers.find(p => p.id === id);
        if (!p && this.pointers.length < MAX_POINTERS) {
            p = { id, source: `touch:${this.nextContact++}`, down: 0 };
            if (!this.state.register(p.source))
                return;
            this.pointers.push(p);
        }
        return p;
    }
    setMove(id: number, x: number, y: number) {
        if (this.state.context !== "gameplay")
            return;
        const p = this.pointer(id);
        if (p)
            this.state.setMove(p.source, x, y);
    }
    addLookDelta(id: number, dx: number, dy: number) {
        if (this.state.context !== "gameplay")
            return;
        const p = this.pointer(id);
        if (p)
            this.state.addLook(p.source, dx * TOUCH_LOOK_RADIANS_PER_PIXEL, dy * TOUCH_LOOK_RADIANS_PER_PIXEL);
    }
    press(id: number, action: InputAction) {
        const p = this.pointer(id);
        if (!p || !ACTIONS.includes(action))
            return;
        const bit = actionBit(action);
        if (p.down & bit)
            return;
        p.down |= bit;
        this.state.setAction(p.source, action, true);
    }
    release(id: number, action: InputAction) {
        const p = this.pointers.find(p => p.id === id);
        if (!p || !ACTIONS.includes(action))
            return;
        p.down &= ~actionBit(action);
        this.state.setAction(p.source, action, false);
    }
    selectHotbar(id: number, slot: number) {
        const p = this.pointer(id);
        if (p)
            this.state.command("hotbarSelect", slot, p.source);
    }
    releasePointer(id: number, cancel = false) {
        this.cancelled.delete(id);
        const i = this.pointers.findIndex(p => p.id === id);
        if (i < 0)
            return;
        if (cancel)
            this.state.remove(this.pointers[i].source);
        else
            this.state.retire(this.pointers[i].source);
        this.pointers.splice(i, 1);
    }
    pointerCancel(id: number) { this.releasePointer(id, true); }
    lostPointerCapture(id: number) { this.releasePointer(id, true); }
    clear() {
        for (const p of this.pointers) {
            if (this.cancelled.size === 32 && !this.cancelled.has(p.id))
                this.cancelled.delete(this.cancelled.values().next().value!);
            this.cancelled.add(p.id);
            this.state.remove(p.source);
        }
        this.pointers.length = 0;
        this.state.removeFamily("touch:");
        this.nextContact = 0;
    }
    dispose() { this.clear(); this.cancelled.clear(); this.disposed = true; }
}
