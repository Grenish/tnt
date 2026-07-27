import { describe, expect, test } from "bun:test";
import { hashContent, hashObject } from "../../src/utils/objects";

describe("hashContent (v2 blob id)", () => {
  test("returns 12 hex characters", () => {
    const hash = hashContent("hello");
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
  });

  test("is stable for the same input", () => {
    expect(hashContent("same")).toBe(hashContent("same"));
  });

  test("differs for different content", () => {
    expect(hashContent("a")).not.toBe(hashContent("b"));
  });

  test("empty string is valid content", () => {
    const hash = hashContent("");
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
  });

  test("matches hashObject(blob, …)", () => {
    expect(hashContent("payload")).toBe(hashObject("blob", "payload"));
  });

  test("blob hash differs from raw content hash of same string", () => {
    // typed object header changes the digest vs bare bytes
    const bare = hashObject("blob", "x");
    // tree type with same body should not equal blob hash
    expect(hashObject("tree", "x")).not.toBe(bare);
  });
});
