import { describe, expect, it } from "vitest";
import {
  GraphicsPerformanceAdvisor,
  LOW_FPS_THRESHOLD,
  LOW_FPS_SAMPLES_REQUIRED,
  PERFORMANCE_WARMUP_MS,
  RECOVERED_FPS_THRESHOLD,
  RECOVERY_SAMPLES_REQUIRED,
  lowerGraphicsQuality,
} from "../src/render/performance-advisor";

describe("user-controlled graphics performance advice", () => {
  it("waits through startup warmup and requires sustained low FPS", () => {
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(1000);
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED + 2; i++) {
      expect(advisor.sample(18, "high", true, 1000 + i * 1000)).toBeNull();
    }
    const firstEligible = 1000 + PERFORMANCE_WARMUP_MS + 1000;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED - 1; i++) {
      expect(advisor.sample(18, "high", true, firstEligible + i * 1000)).toBeNull();
    }
    expect(advisor.sample(18, "high", true, firstEligible + (LOW_FPS_SAMPLES_REQUIRED - 1) * 1000)).toBe("medium");
    expect(advisor.isVisible).toBe(true);
  });

  it("uses hysteresis and hides a visible recommendation after sustained recovery", () => {
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(0);
    const start = PERFORMANCE_WARMUP_MS + 1;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED; i++) {
      const result = advisor.sample(LOW_FPS_THRESHOLD - 1, "high", true, start + i * 1000);
      if (i === LOW_FPS_SAMPLES_REQUIRED - 1) expect(result).toBe("medium");
    }
    for (let i = 0; i < RECOVERY_SAMPLES_REQUIRED - 1; i++) {
      expect(advisor.sample(RECOVERED_FPS_THRESHOLD, "high", true, start + 10_000 + i * 1000)).toBeNull();
      expect(advisor.isVisible).toBe(true);
    }
    expect(advisor.sample(RECOVERED_FPS_THRESHOLD, "high", true, start + 20_000)).toBe("recovered");
    expect(advisor.isVisible).toBe(false);
  });

  it("does not nag after Keep Current until performance has recovered", () => {
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(0);
    const start = PERFORMANCE_WARMUP_MS + 1;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED; i++) advisor.sample(20, "high", true, start + i * 1000);
    advisor.dismiss();
    for (let i = 0; i < 12; i++) expect(advisor.sample(20, "high", true, start + 10_000 + i * 1000)).toBeNull();
    for (let i = 0; i < RECOVERY_SAMPLES_REQUIRED; i++) advisor.sample(36, "high", true, start + 30_000 + i * 1000);
    let recommendation = null;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED; i++) recommendation = advisor.sample(20, "high", true, start + 50_000 + i * 1000);
    expect(recommendation).toBe("medium");
  });

  it("recommends one step down from High or Medium, never from Low", () => {
    expect(lowerGraphicsQuality("high")).toBe("medium");
    expect(lowerGraphicsQuality("medium")).toBe("low");
    expect(lowerGraphicsQuality("low")).toBeNull();
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(0);
    const start = PERFORMANCE_WARMUP_MS + 1;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED - 1; i++) {
      expect(advisor.sample(20, "medium", true, start + i * 1000)).toBeNull();
    }
    expect(advisor.sample(20, "medium", true, start + (LOW_FPS_SAMPLES_REQUIRED - 1) * 1000)).toBe("low");
    expect(advisor.sample(20, "medium", true, start + 5000)).toBeNull();
    advisor.accept(start + 6000);
    for (let i = 0; i < 30; i++) expect(advisor.sample(10, "low", true, start + 7000 + i * 1000)).toBeNull();
  });

  it("preserves a pending recommendation across pause and resume", () => {
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(0);
    const start = PERFORMANCE_WARMUP_MS + 1;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED; i++) {
      advisor.sample(18, "high", true, start + i * 1000);
    }
    expect(advisor.isVisible).toBe(true);

    advisor.suspend();
    expect(advisor.isVisible).toBe(true);
    advisor.resume(start + 10_000);
    expect(advisor.isVisible).toBe(true);

    // Resume starts a fresh warmup and does not erase the player's pending choice.
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED - 1; i++) {
      expect(advisor.sample(18, "high", true, start + 10_001 + i * 1000)).toBeNull();
    }
    expect(advisor.isVisible).toBe(true);
  });

  it("keeps a pending recommendation visible until the player dismisses or accepts it", () => {
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(0);
    const start = PERFORMANCE_WARMUP_MS + 1;
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED; i++) advisor.sample(18, "high", true, start + i * 1000);
    advisor.suspend();
    expect(advisor.isVisible).toBe(true);
    advisor.dismiss();
    expect(advisor.isVisible).toBe(false);
  });

  it("does not accumulate low-FPS evidence in menus or during invalid samples", () => {
    const advisor = new GraphicsPerformanceAdvisor();
    advisor.begin(0);
    const start = PERFORMANCE_WARMUP_MS + 1;
    advisor.sample(18, "high", true, start);
    advisor.sample(18, "high", true, start + 1000);
    advisor.sample(18, "high", false, start + 2000);
    for (let i = 0; i < LOW_FPS_SAMPLES_REQUIRED - 1; i++) expect(advisor.sample(18, "high", true, start + 3000 + i * 1000)).toBeNull();
    expect(advisor.sample(18, "high", true, start + 9000)).toBe("medium");
    advisor.reset(start + 10_000);
    expect(advisor.sample(0, "high", true, start + 30_000)).toBeNull();
  });
});
