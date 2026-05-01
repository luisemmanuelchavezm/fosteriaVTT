const UINT32_MAX_PLUS_ONE = 0x1_0000_0000;
const BASE36_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function getSecureUint32() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

export function secureRandomInt(minInclusive: number, maxInclusive: number) {
  if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
    throw new TypeError("secureRandomInt requires integer bounds");
  }

  if (maxInclusive < minInclusive) {
    throw new RangeError(
      "maxInclusive must be greater than or equal to minInclusive",
    );
  }

  const range = maxInclusive - minInclusive + 1;
  const limit = Math.floor(UINT32_MAX_PLUS_ONE / range) * range;

  let value = getSecureUint32();
  while (value >= limit) {
    value = getSecureUint32();
  }

  return minInclusive + (value % range);
}

export function secureRandomBase36(length: number) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError("length must be a positive integer");
  }

  return Array.from(
    { length },
    () => BASE36_ALPHABET[secureRandomInt(0, BASE36_ALPHABET.length - 1)],
  ).join("");
}
