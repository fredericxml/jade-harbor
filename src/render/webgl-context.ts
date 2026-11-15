/** WebGL2 context creation with conservative fallbacks for touch-first devices. */
export type GraphicsStartupCode =
  | "webgl2-unavailable"
  | "webgl2-context-lost"
  | "renderer-initialization-failed";

export class GraphicsStartupError extends Error {
  readonly name = "GraphicsStartupError";
  constructor(
    readonly code: GraphicsStartupCode,
    message: string,
    readonly cause?: unknown,
    readonly attempts: readonly string[] = [],
  ) {
    super(message);
  }
}

export interface WebGL2Selection {
  context: WebGL2RenderingContext;
  antialias: boolean;
  powerPreference: NonNullable<WebGLContextAttributes["powerPreference"]>;
  touchFirst: boolean;
}

export function isTouchFirstDevice(): boolean {
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const touchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
  return coarse || touchPoints > 0;
}

/**
 * Return ordered context attributes without depending on browser names.
 * Touch-first devices first retain antialiasing without forcing a discrete/high-
 * performance GPU hint, then retry without MSAA if the browser rejects it.
 */
export function webgl2ContextCandidates(touchFirst: boolean): WebGLContextAttributes[] {
  const common: Omit<WebGLContextAttributes, "antialias" | "powerPreference"> = {
    alpha: false,
    depth: true,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
  };
  if (touchFirst) {
    return [
      { ...common, antialias: true, powerPreference: "default" },
      { ...common, antialias: false, powerPreference: "default" },
      { ...common, antialias: false, powerPreference: "low-power" },
      { ...common, antialias: false, powerPreference: "high-performance" },
    ];
  }
  return [
    { ...common, antialias: true, powerPreference: "high-performance" },
    { ...common, antialias: true, powerPreference: "default" },
    { ...common, antialias: false, powerPreference: "high-performance" },
    { ...common, antialias: false, powerPreference: "default" },
  ];
}

export function createWebGL2Context(
  canvas: HTMLCanvasElement,
  touchFirst = isTouchFirstDevice(),
): WebGL2Selection {
  const attempts: string[] = [];
  for (const attributes of webgl2ContextCandidates(touchFirst)) {
    const label = `antialias=${attributes.antialias}, powerPreference=${attributes.powerPreference}`;
    let context: WebGL2RenderingContext | null;
    try {
      context = canvas.getContext("webgl2", attributes) as WebGL2RenderingContext | null;
    } catch (error) {
      attempts.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!context) {
      attempts.push(`${label}: browser returned null`);
      continue;
    }
    if (context.isContextLost()) {
      attempts.push(`${label}: context was immediately lost`);
      throw new GraphicsStartupError(
        "webgl2-context-lost",
        "The browser created a WebGL 2 context but lost it immediately during startup.",
        undefined,
        attempts,
      );
    }
    return {
      context,
      antialias: attributes.antialias ?? false,
      powerPreference: attributes.powerPreference ?? "default",
      touchFirst,
    };
  }
  throw new GraphicsStartupError(
    "webgl2-unavailable",
    "The browser did not provide a usable WebGL 2 context after the supported fallback attempts.",
    undefined,
    attempts,
  );
}
