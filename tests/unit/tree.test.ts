import { describe, expect, test } from "bun:test";
import {
  nestFileEntries,
  writeNestedTrees,
  flattenTree,
  serializeTree,
  parseTree,
  serializeCommitBody,
  parseCommitBody,
  hashObject,
} from "../../src/utils/objects";

describe("tree pure helpers", () => {
  test("serialize/parse tree round-trip", () => {
    const body = serializeTree([
      { name: "b.txt", type: "blob", hash: "bbbbbbbbbbbb" },
      { name: "a.txt", type: "blob", hash: "aaaaaaaaaaaa" },
      { name: "src", type: "tree", hash: "cccccccccccc" },
    ]);
    // sorted by name: a.txt, b.txt, src
    expect(body.startsWith("blob aaaaaaaaaaaa a.txt\n")).toBe(true);
    const parsed = parseTree(body);
    expect(parsed.map((e) => e.name)).toEqual(["a.txt", "b.txt", "src"]);
  });

  test("nest + writeNestedTrees builds deterministic root", () => {
    const files = [
      { path: "README", hash: "r".repeat(12) },
      { path: "src/a.ts", hash: "a".repeat(12) },
      { path: "src/b.ts", hash: "b".repeat(12) },
    ];
    const nested = nestFileEntries(files);
    const store = new Map<string, string>();

    const root1 = writeNestedTrees(nested, (body) => {
      const h = hashObject("tree", body);
      store.set(h, body);
      return h;
    });
    const root2 = writeNestedTrees(nestFileEntries(files), (body) => {
      const h = hashObject("tree", body);
      store.set(h, body);
      return h;
    });
    expect(root1).toBe(root2);
    expect(store.has(root1)).toBe(true);
  });

  test("flattenTree restores flat paths", () => {
    // hashes must be hex — parseTree only accepts [0-9a-f]+
    const files = [
      { path: "README", hash: "ab".repeat(6) },
      { path: "src/a.ts", hash: "cd".repeat(6) },
    ];
    const bodies = new Map<string, string>();
    const root = writeNestedTrees(nestFileEntries(files), (body) => {
      const h = hashObject("tree", body);
      bodies.set(h, body);
      return h;
    });

    const flat = flattenTree(root, (h) => {
      const body = bodies.get(h);
      return body ? parseTree(body) : null;
    });

    const byPath = (a: { path: string }, b: { path: string }) =>
      a.path.localeCompare(b.path);
    expect([...flat].sort(byPath)).toEqual([...files].sort(byPath));
  });
});


describe("commit body", () => {
  test("serialize/parse round-trip", () => {
    const body = serializeCommitBody({
      tree: "t".repeat(12),
      parent: "p".repeat(12),
      timestamp: "2026-01-01T00:00:00.000Z",
      message: "hello\nworld",
    });
    const parsed = parseCommitBody(body);
    expect(parsed.tree).toBe("t".repeat(12));
    expect(parsed.parent).toBe("p".repeat(12));
    expect(parsed.timestamp).toBe("2026-01-01T00:00:00.000Z");
    expect(parsed.message).toBe("hello\nworld");
  });

  test("root commit has no parent line", () => {
    const body = serializeCommitBody({
      tree: "t".repeat(12),
      timestamp: "2026-01-01T00:00:00.000Z",
      message: "root",
    });
    expect(body.includes("parent ")).toBe(false);
    expect(parseCommitBody(body).parent).toBeUndefined();
  });

  test("same commit body → same content-addressed id", () => {
    const body = serializeCommitBody({
      tree: "abc",
      timestamp: "t",
      message: "m",
    });
    expect(hashObject("commit", body)).toBe(hashObject("commit", body));
  });
});
