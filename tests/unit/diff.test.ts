import { describe, expect, test } from "bun:test";
import {
  computeLineDiff,
  splitLines,
  diffLines,
  formatUnifiedDiff,
} from "../../src/utils/diff";

describe("splitLines", () => {
  test("empty string is zero lines", () => {
    expect(splitLines("")).toEqual([]);
  });

  test("single line without newline", () => {
    expect(splitLines("a")).toEqual(["a"]);
  });

  test("trailing newline yields trailing empty line", () => {
    expect(splitLines("a\n")).toEqual(["a", ""]);
  });
});

describe("computeLineDiff", () => {
  test("identical content → no changes", () => {
    expect(computeLineDiff("a\nb\n", "a\nb\n")).toEqual({
      added: 0,
      removed: 0,
    });
  });

  test("added lines only", () => {
    expect(computeLineDiff("a\n", "a\nb\nc\n")).toEqual({
      added: 2,
      removed: 0,
    });
  });

  test("removed lines only", () => {
    expect(computeLineDiff("a\nb\nc\n", "a\n")).toEqual({
      added: 0,
      removed: 2,
    });
  });

  test("replaced line counts as remove + add", () => {
    expect(computeLineDiff("hello\n", "world\n")).toEqual({
      added: 1,
      removed: 1,
    });
  });

  test("duplicate lines use multiset counts", () => {
    expect(computeLineDiff("x\nx\n", "x\n")).toEqual({
      added: 0,
      removed: 1,
    });
  });

  test("empty to content is pure adds", () => {
    const result = computeLineDiff("", "one\ntwo");
    expect(result.added).toBe(2);
    expect(result.removed).toBe(0);
  });
});

describe("diffLines / formatUnifiedDiff", () => {
  test("identical → empty patch", () => {
    expect(
      formatUnifiedDiff("same\n", "same\n", {
        oldPath: "a/x",
        newPath: "b/x",
      }),
    ).toBe("");
  });

  test("simple replacement produces unified hunk", () => {
    const patch = formatUnifiedDiff("hello\nworld\n", "hello\nthere\n", {
      oldPath: "a/f.txt",
      newPath: "b/f.txt",
    });
    expect(patch).toContain("--- a/f.txt");
    expect(patch).toContain("+++ b/f.txt");
    expect(patch).toContain("@@");
    expect(patch).toContain("-world");
    expect(patch).toContain("+there");
    expect(patch).toContain(" hello");
  });

  test("diffLines marks add/remove/equal", () => {
    const ops = diffLines("a\nb\n", "a\nc\n");
    expect(ops.filter((o) => o.type === "equal").map((o) => o.line)).toContain(
      "a",
    );
    expect(ops.some((o) => o.type === "remove" && o.line === "b")).toBe(true);
    expect(ops.some((o) => o.type === "add" && o.line === "c")).toBe(true);
  });

  test("all-new file", () => {
    const patch = formatUnifiedDiff("", "one\ntwo\n", {
      oldPath: "/dev/null",
      newPath: "b/new.txt",
    });
    expect(patch).toContain("+++ b/new.txt");
    expect(patch).toContain("+one");
    expect(patch).toContain("+two");
  });
});
