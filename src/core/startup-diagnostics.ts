import { GraphicsStartupError } from "../render/webgl-context";

export interface StartupFailurePresentation {
  title: string;
  message: string;
  code: string;
}

/** Choose wording from verified startup state, never from a catch-all guess. */
export function startupFailurePresentation(
  error: unknown,
  webgl2Status: string,
): StartupFailurePresentation {
  if (error instanceof GraphicsStartupError) {
    if (error.code === "webgl2-unavailable") {
      return {
        code: error.code,
        title: "WebGL 2 is unavailable",
        message: "This browser did not provide a usable WebGL 2 context. Update your browser, close other graphics-heavy tabs, then reload.",
      };
    }
    if (error.code === "renderer-initialization-failed") {
      return {
        code: error.code,
        title: "Jade Harbor couldn't initialize graphics",
        message: "WebGL 2 was available, but the game renderer could not finish initializing. This does not automatically mean your phone is unsupported.",
      };
    }
    return {
      code: error.code,
      title: "The graphics context was interrupted",
      message: "The browser created a WebGL 2 context, but it was lost during startup. Close other graphics-heavy tabs and reload.",
    };
  }
  return {
    code: "application-startup-failed",
    title: "Jade Harbor couldn't finish starting",
    message: webgl2Status === "available"
      ? "WebGL 2 is available in this browser. The startup failure happened elsewhere in the application, not because WebGL 2 is missing."
      : "The game stopped during startup. The technical details below will help identify the actual cause.",
  };
}
