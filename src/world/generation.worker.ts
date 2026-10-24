import { generateChunk } from "./generator";
self.onmessage = (
  event: MessageEvent<{ cx: number; cz: number; seed: string; epoch: number; ticket: number }>,
) => {
  const { cx, cz, seed, epoch, ticket } = event.data;
  const start = performance.now();
  const blocks = generateChunk(cx, cz, seed);
  const sections = blocks.serialize();
  self.postMessage({ cx, cz, epoch, ticket, sections, elapsedMs:performance.now()-start }, { transfer: sections.flatMap(s=>s.data ? [s.data.buffer as ArrayBuffer] : []) });
};
