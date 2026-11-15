import { afterEach, expect, it, vi } from "vitest";
import { createId } from "../src/core/ids";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("uses native randomUUID when the browser exposes it", () => {
  const randomUUID = vi.fn(() => "native-uuid-value");
  vi.stubGlobal("crypto", { randomUUID } as unknown as Crypto);

  expect(createId()).toBe("native-uuid-value");
  expect(randomUUID).toHaveBeenCalledOnce();
});

it("creates an RFC 4122 v4 UUID with getRandomValues when randomUUID is unavailable", () => {
  const seed = Uint8Array.from({ length: 16 }, (_, index) => index);
  const getRandomValues = vi.fn((target: Uint8Array) => {
    target.set(seed);
    return target;
  });
  vi.stubGlobal("crypto", { getRandomValues } as unknown as Crypto);

  const id = createId();
  expect(id).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
  expect(getRandomValues).toHaveBeenCalledOnce();
});

it("retains a last-resort identifier path when Web Crypto is absent", () => {
  vi.stubGlobal("crypto", undefined);
  vi.spyOn(Math, "random").mockReturnValue(0.5);

  expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
