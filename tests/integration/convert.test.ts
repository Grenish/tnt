import { describe, expect, test, afterEach } from "bun:test";
import fs from "fs";
import path from "path";
import {
  exists,
  makeTempRepoDir,
  readFile,
  removeTempDir,
  runTnt,
  writeFile,
} from "../helpers/cli";
import { hashBytes } from "../../src/utils/store";

/**
 * Build a synthetic v1 repo (raw blobs + commits/*.json) and convert.
 */
describe("tnt convert v1 → v2", () => {
  const temps: string[] = [];

  afterEach(() => {
    while (temps.length) {
      const dir = temps.pop();
      if (dir) removeTempDir(dir);
    }
  });

  test("rewrites legacy commit into content-addressed commit + tree", () => {
    const cwd = makeTempRepoDir();
    temps.push(cwd);

    // Minimal v1 layout
    const tnt = path.join(cwd, ".tnt");
    fs.mkdirSync(path.join(tnt, "objects"), { recursive: true });
    fs.mkdirSync(path.join(tnt, "commits"), { recursive: true });
    fs.mkdirSync(path.join(tnt, "refs", "heads"), { recursive: true });
    fs.writeFileSync(path.join(tnt, "HEAD"), "ref: refs/heads/main");
    fs.writeFileSync(
      path.join(tnt, "index.json"),
      JSON.stringify({ files: [] }, null, 2),
    );

    const content = "legacy\n";
    const oldBlob = hashBytes(content); // v1 used raw content hash
    fs.writeFileSync(path.join(tnt, "objects", oldBlob), content);

    const oldId = "1700000000000";
    const legacyCommit = {
      id: oldId,
      timestamp: "2024-01-01T00:00:00.000Z",
      message: "legacy commit",
      files: [{ path: "legacy.txt", hash: oldBlob }],
    };
    fs.writeFileSync(
      path.join(tnt, "commits", `${oldId}.json`),
      JSON.stringify(legacyCommit, null, 2),
    );
    fs.writeFileSync(path.join(tnt, "refs", "heads", "main"), oldId);
    writeFile(cwd, "legacy.txt", content);

    const r = runTnt(cwd, ["convert"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Converted");

    expect(readFile(cwd, ".tnt/format").trim()).toBe("2");
    expect(exists(cwd, ".tnt/commits.bak")).toBe(true);

    const newId = readFile(cwd, ".tnt/refs/heads/main").trim();
    expect(newId).toMatch(/^[0-9a-f]{12}$/);
    expect(newId).not.toBe(oldId);
    expect(exists(cwd, `.tnt/objects/${newId}`)).toBe(true);

    const cat = runTnt(cwd, ["cat-file", "-t", newId]);
    expect(cat.stdout.trim()).toBe("commit");

    const tree = runTnt(cwd, ["ls-tree", "HEAD"]);
    expect(tree.stdout).toContain("legacy.txt");
  });
});
