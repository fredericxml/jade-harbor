/**
 * Create an RFC 4122 version-4 UUID without requiring the secure-context-only
 * crypto.randomUUID() API.
 *
 * LAN testing commonly uses http://192.168.x.x, which is not a secure context.
 * In that environment crypto.getRandomValues() is still available in modern
 * browsers, so it can safely provide the random bytes needed for non-secret
 * world/entity/tab identifiers.
 */
export function createId(): string {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
  } else {
    // Last-resort compatibility for very old/non-browser runtimes. These IDs
    // are identifiers, not authentication tokens or security credentials.
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  // Set RFC 4122 version (4) and variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
