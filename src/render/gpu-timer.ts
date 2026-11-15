export type GpuTimingSample = { timeMs: number; completedAt: number };
type TimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };
type PendingQuery = { query: WebGLQuery; submittedAt: number };
const QUERY_TIMEOUT_MS = 1000;

/** Non-blocking WebGL2 GPU timer queries. Results are read only after the
 * driver reports availability; disjoint/context-loss and stale samples are
 * discarded. A stalled driver cannot permanently fill the pending queue. */
export class GpuTimer {
  private extension: TimerExtension | null = null;
  private active: WebGLQuery | null = null;
  private activeStartedAt = -1;
  private pending: PendingQuery[] = [];
  private frame = 0;
  private latest: GpuTimingSample | null = null;
  private disabled = false;
  private disposed = false;
  readonly supported: boolean;

  constructor(private readonly gl: WebGL2RenderingContext) {
    try {
      this.extension = gl.getExtension("EXT_disjoint_timer_query_webgl2") as unknown as TimerExtension | null;
    } catch {
      this.extension = null;
    }
    this.supported = !!this.extension && typeof gl.createQuery === "function" &&
      typeof gl.beginQuery === "function" && typeof gl.getQueryParameter === "function";
  }

  begin() {
    if (this.disposed || !this.supported || this.disabled || this.active || this.pending.length >= 4) return false;
    this.frame++;
    // Sampling every fourth rendered frame keeps query overhead bounded.
    if (this.frame % 4 !== 0) return false;
    let query: WebGLQuery | null = null;
    try {
      query = this.gl.createQuery();
      if (!query) return false;
      this.gl.beginQuery(this.extension!.TIME_ELAPSED_EXT, query);
      this.active = query;
      this.activeStartedAt = performance.now();
      return true;
    } catch {
      if (query) {
        try { this.gl.deleteQuery(query); } catch { /* Context may be lost. */ }
      }
      this.activeStartedAt = -1;
      this.disabled = true;
      this.clearQueries();
      return false;
    }
  }

  end() {
    if (!this.active) return;
    const query = this.active;
    const submittedAt = this.activeStartedAt;
    this.active = null;
    this.activeStartedAt = -1;
    try {
      this.gl.endQuery(this.extension!.TIME_ELAPSED_EXT);
      this.pending.push({ query, submittedAt });
    } catch {
      try { this.gl.deleteQuery(query); } catch { /* Context may be lost. */ }
      this.disabled = true;
      this.clearQueries();
    }
  }

  poll(completedAt: number): GpuTimingSample | null {
    if (this.disposed || !this.supported || this.disabled || !this.extension) return null;
    const polledAt = Number.isFinite(completedAt) ? completedAt : performance.now();
    try {
      if (this.gl.getParameter(this.extension.GPU_DISJOINT_EXT)) {
        this.clearQueries();
        this.latest = null;
        return null;
      }
      let newest: GpuTimingSample | null = null;
      for (let i = this.pending.length - 1; i >= 0; i--) {
        const pending = this.pending[i];
        // Some drivers can leave availability false forever. Drop stale queries
        // without disabling timing so future frames can retry asynchronously.
        if (polledAt - pending.submittedAt > QUERY_TIMEOUT_MS) {
          this.gl.deleteQuery(pending.query);
          this.pending.splice(i, 1);
          continue;
        }
        if (!this.gl.getQueryParameter(pending.query, this.gl.QUERY_RESULT_AVAILABLE)) continue;
        const nanoseconds = Number(this.gl.getQueryParameter(pending.query, this.gl.QUERY_RESULT));
        this.gl.deleteQuery(pending.query);
        this.pending.splice(i, 1);
        if (Number.isFinite(nanoseconds) && nanoseconds > 0) {
          const sample = { timeMs: nanoseconds / 1_000_000, completedAt: polledAt };
          // pending is ordered by submission. We scan newest-to-oldest, so
          // the first available result is the newest completed query.
          if (!newest) newest = sample;
        }
      }
      if (newest) this.latest = newest;
      const result = this.latest;
      this.latest = null;
      return result;
    } catch {
      this.disabled = true;
      this.clearQueries();
      return null;
    }
  }

  reset() {
    if (this.disposed) return;
    this.clearQueries();
    this.frame = 0;
    this.latest = null;
    this.disabled = false;
  }

  dispose() {
    if (this.disposed) return;
    this.clearQueries();
    this.latest = null;
    this.disabled = true;
    this.disposed = true;
  }

  private clearQueries() {
    if (this.active) {
      try { this.gl.endQuery(this.extension!.TIME_ELAPSED_EXT); } catch { /* Context may be lost. */ }
      try { this.gl.deleteQuery(this.active); } catch { /* Context may be lost. */ }
      this.active = null;
    }
    this.activeStartedAt = -1;
    for (const pending of this.pending) {
      try { this.gl.deleteQuery(pending.query); } catch { /* Context may be lost. */ }
    }
    this.pending.length = 0;
  }
}
