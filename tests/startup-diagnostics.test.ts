import { describe, expect, it, vi } from "vitest";
import {
  createWebGL2Context,
  GraphicsStartupError,
  webgl2ContextCandidates,
} from "../src/render/webgl-context";
import { startupFailurePresentation } from "../src/core/startup-diagnostics";

describe("mobile WebGL2 startup compatibility", () => {
  it("preserves antialiasing on touch-first devices and falls back when needed", () => {
    const candidates = webgl2ContextCandidates(true);
    expect(candidates).toHaveLength(4);
    expect(candidates[0]).toMatchObject({
      antialias: true,
      powerPreference: "default",
      alpha: false,
      depth: true,
      failIfMajorPerformanceCaveat: false,
    });
    expect(candidates[1]).toMatchObject({ antialias: false, powerPreference: "default" });
    expect(candidates.slice(1).every((candidate) => candidate.antialias === false)).toBe(true);
  });

  it("preserves desktop antialiasing first and falls back without it", () => {
    expect(webgl2ContextCandidates(false).map((candidate) => candidate.antialias)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it("retries a failed context request with the next supported attribute set", () => {
    const context = { isContextLost: vi.fn(() => false) } as unknown as WebGL2RenderingContext;
    const calls: WebGLContextAttributes[] = [];
    const canvas = {
      getContext: vi.fn((_kind: string, attributes?: WebGLContextAttributes) => {
        if (attributes) calls.push(attributes);
        return calls.length === 1 ? null : context;
      }),
    } as unknown as HTMLCanvasElement;

    const selected = createWebGL2Context(canvas, true);
    expect(selected.context).toBe(context);
    expect(selected.touchFirst).toBe(true);
    expect(selected.antialias).toBe(false);
    expect(calls).toHaveLength(2);
    expect(calls[0].powerPreference).toBe("default");
    expect(calls[0].antialias).toBe(true);
    expect(calls[1].powerPreference).toBe("default");
    expect(calls[1].antialias).toBe(false);
  });

  it("reports unavailable WebGL2 only after all context attempts fail", () => {
    const canvas = {
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement;
    try {
      createWebGL2Context(canvas, true);
      throw new Error("Expected context creation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphicsStartupError);
      expect(error).toMatchObject({ code: "webgl2-unavailable" });
      expect((error as GraphicsStartupError).attempts).toHaveLength(4);
    }
  });

  it("distinguishes WebGL2 unavailability from renderer initialization failure", () => {
    const unsupported = startupFailurePresentation(
      new GraphicsStartupError("webgl2-unavailable", "no context"),
      "unavailable",
    );
    const renderer = startupFailurePresentation(
      new GraphicsStartupError("renderer-initialization-failed", "renderer failed"),
      "available",
    );
    expect(unsupported.title).toBe("WebGL 2 is unavailable");
    expect(renderer.title).toBe("Jade Harbor couldn't initialize graphics");
    expect(renderer.message).toContain("does not automatically mean your phone is unsupported");
  });

  it("does not blame WebGL2 for unrelated application startup exceptions", () => {
    const result = startupFailurePresentation(new TypeError("Unexpected UI state"), "available");
    expect(result.code).toBe("application-startup-failed");
    expect(result.title).toBe("Jade Harbor couldn't finish starting");
    expect(result.message).toContain("happened elsewhere in the application");
    expect(result.title).not.toContain("WebGL 2 is unavailable");
  });
});
