import { describe, expect, test } from "bun:test";
import { matchesPattern, shouldIgnore } from "../../src/utils/objects";

describe("matchesPattern", () => {
  test("exact file name as path component", () => {
    expect(matchesPattern("src/app.ts", "app.ts")).toBe(true);
    expect(matchesPattern("app.ts", "app.ts")).toBe(true);
    expect(matchesPattern("src/other.ts", "app.ts")).toBe(false);
  });

  test("directory prefix", () => {
    expect(matchesPattern("node_modules/pkg/index.js", "node_modules")).toBe(
      true,
    );
    expect(matchesPattern("node_modules/pkg/index.js", "node_modules/")).toBe(
      true,
    );
  });

  test("path prefix match", () => {
    expect(matchesPattern("dist/index.js", "dist")).toBe(true);
    expect(matchesPattern("build/out/x", "build/out")).toBe(true);
  });

  test("simple glob *", () => {
    expect(matchesPattern("secret.key", "*.key")).toBe(true);
    expect(matchesPattern("dir/secret.key", "*.key")).toBe(true);
    expect(matchesPattern("secret.pem", "*.key")).toBe(false);
  });

  test("globstar ** matches nested paths", () => {
    expect(matchesPattern("a/b/c.log", "**/*.log")).toBe(true);
  });

  test("single-segment glob matches root file", () => {
    expect(matchesPattern("c.log", "*.log")).toBe(true);
  });
});


describe("shouldIgnore", () => {
  test("matches any pattern in the list", () => {
    const patterns = [".tnt", ".git", "node_modules/", "*.log"];
    expect(shouldIgnore("node_modules/x", patterns)).toBe(true);
    expect(shouldIgnore("app.log", patterns)).toBe(true);
    expect(shouldIgnore("src/index.ts", patterns)).toBe(false);
  });

  test("empty patterns never ignore", () => {
    expect(shouldIgnore("anything", [])).toBe(false);
  });
});
