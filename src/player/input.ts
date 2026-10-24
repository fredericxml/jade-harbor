export class Input {
  keys = new Set<string>();
  left = false;
  right = false;
  leftPressed = false;
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
  onLook?: (x: number, y: number) => void;
  onKey?: (key: string) => void;
  onWheel?: (delta: number) => void;
  onUnlock?: () => void;
  onUse?: () => void;
  constructor(public canvas: HTMLCanvasElement) {
    document.addEventListener("pointerlockchange", () => {
      const wasLocked = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (this.locked) {
        this.pendingIntentionalUnlock = false;
        this.suppressUnexpectedUnlock = false;
        this.lockAcquiredAt = performance.now();
        return;
      }
      this.clear();
      if (this.pendingIntentionalUnlock) {
        this.pendingIntentionalUnlock = false;
        return;
      }
      if (this.suppressUnexpectedUnlock || performance.now() - this.lockAcquiredAt < 450) return;
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
    document.addEventListener("mousemove", (e) => {
      if (this.locked) this.onLook?.(e.movementX, e.movementY);
    });
    document.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        if (performance.now() < this.ignoreNativeEscapeUntil) {
          e.preventDefault();
          return;
        }
        this.cancelExternalUnlock();
        e.preventDefault();
        if (!e.repeat) this.onKey?.("Escape");
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (["Space", "Tab", "F3", "F5"].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.onKey?.(e.code);
      if (this.locked) this.keys.add(e.code);
    });
    document.addEventListener("keyup", (e) => this.keys.delete(e.code));
    canvas.addEventListener("mousedown", (e) => {
      if (!this.locked) return;
      if (e.button === 0) {
        this.left = true;
        this.leftPressed = true;
      }
      if (e.button === 2) {
        this.right = true;
        this.onUse?.();
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.left = false;
      if (e.button === 2) this.right = false;
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (this.locked) this.onWheel?.(Math.sign(e.deltaY));
      },
      { passive: false },
    );
    addEventListener("blur", () => this.clear());
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
    this.prepareResume();
    const request = ++this.lockRequestNumber;
    try {
      await this.canvas.requestPointerLock();
      if (request === this.lockRequestNumber &&
          document.pointerLockElement === this.canvas) {
        this.locked = true;
        this.pendingIntentionalUnlock = false;
        this.suppressUnexpectedUnlock = false;
        this.lockAcquiredAt = performance.now();
      }
    } catch {
      // Browsers may reject a lock immediately after Escape. Keep the pause
      // dialog closed; a normal click on the game canvas can acquire the lock.
    }
  }
  unlock() {
    this.cancelExternalUnlock();
    ++this.lockRequestNumber;
    if (document.pointerLockElement === this.canvas || this.locked) {
      this.pendingIntentionalUnlock = true;
      document.exitPointerLock();
    }
    this.clear();
  }
  clear() {
    this.keys.clear();
    this.left = this.right = this.leftPressed = false;
  }
}
