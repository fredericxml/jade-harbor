import { createGenerationSession, type GenerationRequest } from "./generation-protocol";
const session = createGenerationSession();
self.onmessage = (
  event: MessageEvent<GenerationRequest>,
) => {
  const result = session.run(event.data);
  self.postMessage(result, { transfer: result.sections.flatMap(s=>s.data ? [s.data.buffer as ArrayBuffer] : []) });
};
