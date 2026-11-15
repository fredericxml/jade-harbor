import "./ui/style.css";
import { Game } from "./core/game";
import { GraphicsStartupError } from "./render/webgl-context";
import { startupFailurePresentation } from "./core/startup-diagnostics";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Jade Harbor root element #app is missing.");

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  try { return String(error); } catch { return "Unknown startup error"; }
}

function graphicsAvailability(root: HTMLElement): string {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas#game");
  if (!canvas) return "not checked (game canvas was not created)";
  try {
    const context = canvas.getContext("webgl2");
    if (!context) return "unavailable (the browser returned no WebGL 2 context)";
    if (context.isContextLost()) return "created, but currently lost";
    const attributes = context.getContextAttributes();
    return attributes
      ? `available (antialias=${attributes.antialias}, powerPreference=${attributes.powerPreference ?? "default"})`
      : "available (context attributes restricted)";
  } catch (error) {
    return `check failed (${describeError(error)})`;
  }
}

function showStartupFailure(root: HTMLElement, error: unknown): void {
  const graphics = graphicsAvailability(root);
  const typed = error instanceof GraphicsStartupError ? error : undefined;
  const presentation = startupFailurePresentation(error, graphics.startsWith("available") ? "available" : graphics);
  const title = presentation.title;
  const message = presentation.message;

  const details = [
    `Failure: ${describeError(error)}`,
    ...(error instanceof Error && error.stack ? [`Stack: ${error.stack}`] : []),
    `Graphics startup code: ${presentation.code}`,
    `WebGL 2: ${graphics}`,
    `Browser: ${navigator.userAgent}`,
    `Viewport: ${window.innerWidth} × ${window.innerHeight}`,
    `Device pixel ratio: ${window.devicePixelRatio || 1}`,
    ...(typed?.attempts ?? []).map((attempt, index) => `Context attempt ${index + 1}: ${attempt}`),
    ...(typed?.cause ? [`Renderer cause: ${describeError(typed.cause)}`] : []),
  ].join("\n");

  console.error("[Jade Harbor] Startup failed", { error, graphics, details });
  const panel = document.createElement("main");
  panel.className = "fatal-error";
  panel.dataset.startupErrorCode = presentation.code;

  const eyebrow = document.createElement("p");
  eyebrow.className = "fatal-error__eyebrow";
  eyebrow.textContent = "JADE HARBOR · STARTUP DIAGNOSTICS";
  const heading = document.createElement("h1");
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.textContent = message;
  const actions = document.createElement("div");
  actions.className = "fatal-error__actions";
  const reload = document.createElement("button");
  reload.type = "button";
  reload.textContent = "Reload game";
  reload.addEventListener("click", () => window.location.reload());
  const test = document.createElement("a");
  test.href = "https://get.webgl.org/webgl2/";
  test.target = "_blank";
  test.rel = "noopener noreferrer";
  test.textContent = "Test WebGL 2";
  actions.append(reload, test);
  const disclosure = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Technical details";
  const pre = document.createElement("pre");
  pre.textContent = details;
  disclosure.append(summary, pre);
  panel.append(eyebrow, heading, copy, actions, disclosure);
  root.replaceChildren(panel);
}

try {
  const game = new Game(root);
  if (import.meta.env.DEV) {
    (window as unknown as { __game: Game }).__game = game;
  }
} catch (error) {
  showStartupFailure(root, error);
}
