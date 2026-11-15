export type FrameMode = "playing" | "paused" | "hidden";
export type FrameRateLimit = "auto" | 0 | 30 | 40 | 60;
export function frameRateLimit(value: unknown): FrameRateLimit {
  return value === "auto" || value === 30 || value === 40 || value === 60 || value === 0 ? value : 0;
}
/** Urgent redraws are for layout/resize and inactive loading only. Active-play
 * chunk/mesh queues must not bypass the user's presentation cap. */
export function frameUrgent(active:boolean, needsDrawingUpdate:boolean, backgroundWorkPending:boolean) {
  return needsDrawingUpdate || (!active && backgroundWorkPending);
}
/** Hidden render-only distant work must not keep a paused RAF urgent. */
export function hasFrameBackgroundWork(worldDirty:boolean, generationPending:boolean,
  lightingPending:boolean, distantVisible:boolean, distantReady:boolean) {
  return worldDirty || generationPending || lightingPending || (distantVisible && !distantReady);
}

const AUTO_SAMPLE_LIMIT = 90;
const AUTO_MIN_SAMPLES = 24;
const AUTO_MIN_SPAN_MS = 500;
const AUTO_REEVALUATE_MS = 1000;

/**
 * One existing RAF owns input and simulation. This clock only decides when
 * presentation work is due; it never schedules callbacks or changes fixed ticks.
 * Auto mode samples the browser's actual RAF cadence and caps high-refresh
 * displays at the nearest even divisor no higher than 60 FPS (90→45, 120→60,
 * 144→48). Slow/low-refresh devices are not throttled a second time.
 */
export class FramePacer {
  private mode?: FrameMode;
  private deadline = 0;
  private last = -Infinity;
  // Fixed-size ring storage keeps RAF sampling allocation-free. A separate
  // scratch buffer is sorted only when a new Auto estimate is due.
  private readonly cadence = new Float64Array(AUTO_SAMPLE_LIMIT);
  private readonly cadenceScratch = new Float64Array(AUTO_SAMPLE_LIMIT);
  private cadenceCount = 0;
  private cadenceWrite = 0;
  private autoStarted = -1;
  private autoEvaluated = -Infinity;
  private autoTarget: number = 60;
  private autoCandidate: number = 60;
  private autoCandidateCount = 0;
  private displayHz = 60;
  targetFps = 60;
  transitioned = false;

  private resetCadence() {
    this.cadenceCount = 0;
    this.cadenceWrite = 0;
    this.autoStarted = -1;
    this.autoEvaluated = -Infinity;
    this.autoTarget = 60;
    this.autoCandidate = 60;
    this.autoCandidateCount = 0;
    this.displayHz = 60;
  }

  private sampleCadence(now: number) {
    if (this.last > -Infinity) {
      const interval = now - this.last;
      // Ignore tab-resume gaps and pathological sub-refresh callbacks.
      if(interval>100){this.resetCadence();}
      else if (interval >= 4) {
        this.cadence[this.cadenceWrite] = interval;
        this.cadenceWrite = (this.cadenceWrite + 1) % AUTO_SAMPLE_LIMIT;
        if (this.cadenceCount < AUTO_SAMPLE_LIMIT) this.cadenceCount++;
        if (this.autoStarted < 0) this.autoStarted = now - interval;
      }
    }
    if (now - this.autoEvaluated < AUTO_REEVALUATE_MS || this.cadenceCount < AUTO_MIN_SAMPLES ||
      now - this.autoStarted < AUTO_MIN_SPAN_MS) return;
    this.autoEvaluated = now;
    // The ring's physical order does not affect a median. Copy into retained
    // scratch storage and sort it in place; Infinity sentinels keep the unused
    // tail out of the selected median without allocating a subarray.
    for (let i = 0; i < this.cadenceCount; i++) this.cadenceScratch[i] = this.cadence[i];
    this.cadenceScratch.fill(Infinity, this.cadenceCount);
    this.cadenceScratch.sort();
    const median = this.cadenceScratch[Math.floor(this.cadenceCount * .5)];
    const refreshHz = 1000 / median;
    if (!Number.isFinite(refreshHz) || refreshHz < 29 || refreshHz > 300) return;
    this.displayHz=Math.round(refreshHz);
    let candidate=0;
    if(refreshHz>60.5){
      const stableHz=Math.round(refreshHz);
      const divisor = Math.max(1, Math.ceil((stableHz-.001) / 60));
      candidate=Math.max(30, Math.min(60, stableHz / divisor));
    }
    // Require two consecutive estimates before changing cadence. A temporary
    // CPU stall must not make Auto bounce between refresh-rate targets.
    if(candidate===this.autoTarget){this.autoCandidate=candidate;this.autoCandidateCount=0;}
    else if(candidate===this.autoCandidate)this.autoCandidateCount++;
    else{this.autoCandidate=candidate;this.autoCandidateCount=1;}
    if(this.autoCandidateCount>=2){this.autoTarget=candidate;this.autoCandidateCount=0;}
  }

  ready(now: number, mode: FrameMode, limit: FrameRateLimit = 0, urgent = false) {
    this.transitioned = false;
    if (!Number.isFinite(now)) return false;
    if (now < this.last) this.reset();
    if (mode !== this.mode) {
      this.mode = mode;
      this.deadline = now;
      this.transitioned = true;
      if (mode === "hidden") this.resetCadence();
    }
    if (mode === "hidden") {
      this.last = now;
      this.targetFps = 0;
      return false;
    }
    this.sampleCadence(now);
    this.last = now;
    const selected = limit === "auto" ? this.autoTarget : limit;
    this.targetFps = selected || this.displayHz;
    // Settled modal/menu scenery needs only a low-rate background refresh.
    // Loading, viewport and settings changes still request an immediate draw.
    const interval = mode === "paused" ? 500 : selected ? 1000 / selected : 0;
    if (!interval || urgent || this.transitioned) {
      this.deadline = now + interval;
      return true;
    }
    if (now + .25 < this.deadline) return false;
    // Preserve fractional cadence without replaying missed presentation work.
    this.deadline += (Math.floor((Math.max(0, now - this.deadline) + .25) / interval) + 1) * interval;
    return true;
  }

  reset() {
    this.mode = undefined;
    this.deadline = 0;
    this.last = -Infinity;
    this.targetFps = 60;
    this.transitioned = false;
    this.resetCadence();
  }
}
