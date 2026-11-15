import type { GraphicsQuality } from "./graphics";

export const LOW_FPS_THRESHOLD = 28;
export const RECOVERED_FPS_THRESHOLD = 32;
export const LOW_FPS_SAMPLES_REQUIRED = 5;
export const RECOVERY_SAMPLES_REQUIRED = 8;
export const PERFORMANCE_WARMUP_MS = 12_000;

export type PerformanceAdvice = GraphicsQuality | "recovered" | null;

export function lowerGraphicsQuality(current: GraphicsQuality): GraphicsQuality | null {
  return current === "high" ? "medium" : current === "medium" ? "low" : null;
}

/**
 * A non-invasive, user-controlled graphics advisor. It never changes quality
 * automatically: it only recommends one lower preset after sustained low FPS.
 */
export class GraphicsPerformanceAdvisor {
  private lowSamples = 0;
  private recoverySamples = 0;
  private suppressedUntilRecovery = false;
  private visible = false;
  private warmupUntil = 0;

  get isVisible() { return this.visible; }

  begin(now: number) {
    this.lowSamples = 0;
    this.recoverySamples = 0;
    this.visible = false;
    this.warmupUntil = now + PERFORMANCE_WARMUP_MS;
  }

  /**
   * Pause/menu transitions clear transient evidence without discarding a
   * recommendation that the player has not answered yet.
   */
  suspend() {
    this.lowSamples = 0;
    this.recoverySamples = 0;
  }

  /** Start a fresh observation window while preserving pending advice. */
  resume(now: number) {
    this.lowSamples = 0;
    this.recoverySamples = 0;
    this.warmupUntil = now + PERFORMANCE_WARMUP_MS;
  }

  sample(fps: number, quality: GraphicsQuality, gameplay: boolean, now: number): PerformanceAdvice {
    if (!gameplay || quality === "low" || !Number.isFinite(fps) || fps <= 0) {
      this.lowSamples = 0;
      this.recoverySamples = 0;
      return null;
    }
    if (now < this.warmupUntil) return null;

    if (fps < LOW_FPS_THRESHOLD) {
      this.lowSamples++;
      this.recoverySamples = 0;
    } else if (fps >= RECOVERED_FPS_THRESHOLD) {
      this.lowSamples = 0;
      this.recoverySamples++;
      if (this.recoverySamples >= RECOVERY_SAMPLES_REQUIRED) {
        const wasVisible = this.visible;
        this.visible = false;
        this.suppressedUntilRecovery = false;
        this.recoverySamples = RECOVERY_SAMPLES_REQUIRED;
        if (wasVisible) return "recovered";
      }
    } else {
      // A borderline sample weakens, rather than immediately erases, evidence.
      this.lowSamples = Math.max(0, this.lowSamples - 1);
      this.recoverySamples = 0;
    }

    if (this.lowSamples >= LOW_FPS_SAMPLES_REQUIRED && !this.suppressedUntilRecovery && !this.visible) {
      this.visible = true;
      return lowerGraphicsQuality(quality);
    }
    return null;
  }

  dismiss() {
    this.visible = false;
    this.suppressedUntilRecovery = true;
    this.lowSamples = 0;
  }

  accept(now: number) {
    this.visible = false;
    this.suppressedUntilRecovery = false;
    this.lowSamples = 0;
    this.recoverySamples = 0;
    this.warmupUntil = now + PERFORMANCE_WARMUP_MS;
  }

  /** A manual quality choice starts a fresh observation window. */
  reset(now: number) {
    this.suppressedUntilRecovery = false;
    this.begin(now);
  }
}
