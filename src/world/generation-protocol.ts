import { createGenerator, type Generator } from "./generator";
export type GenerationRequest = { cx: number; cz: number; seed: string; epoch: number; ticket: number };
/** Shared by the real worker and parity tests. Owns at most one world context. */
export function createGenerationSession() {
  let generator: Generator | undefined, seed = "";
  return {
    run(request: GenerationRequest) {
      if (!Number.isSafeInteger(request.cx) || !Number.isSafeInteger(request.cz) || Math.abs(request.cx) > 625000 || Math.abs(request.cz) > 625000 ||
        typeof request.seed !== "string" || !Number.isSafeInteger(request.epoch) || !Number.isSafeInteger(request.ticket)) throw new Error("Invalid generation request.");
      const start = performance.now();
      if (!generator || seed !== request.seed) { generator = createGenerator(request.seed); seed = request.seed; }
      return { cx: request.cx, cz: request.cz, epoch: request.epoch, ticket: request.ticket,
        sections: generator.generate(request.cx, request.cz).serialize(), elapsedMs: performance.now() - start };
    },
    dispose() { generator = undefined; seed = ""; },
    get size() { return generator ? 1 : 0; },
  };
}
