import { describe, expect, test, afterEach } from "bun:test";
import fs from "fs";
import {
  makeTempRepoDir,
  removeTempDir,
  runTnt,
  writeFile,
  readFile,
} from "../helpers/cli";
import { resolveRevision, getCommit } from "../../src/utils/objects";

describe("resolveRevision ancestry", () => {
  const temps: string[] = [];

  afterEach(() => {
    while (temps.length) {
      const dir = temps.pop();
      if (dir) removeTempDir(dir);
    }
  });

  test("HEAD~1 walks parent", () => {
    const cwd = makeTempRepoDir();
    temps.push(cwd);

    runTnt(cwd, ["init"]);
    writeFile(cwd, "a.txt", "1\n");
    runTnt(cwd, ["stage", "a.txt"]);
    runTnt(cwd, ["summ", "one"]);
    const first = readFile(cwd, ".tnt/refs/heads/main").trim();

    writeFile(cwd, "a.txt", "2\n");
    runTnt(cwd, ["stage", "a.txt"]);
    runTnt(cwd, ["summ", "two"]);
    const second = readFile(cwd, ".tnt/refs/heads/main").trim();

    const prev = process.cwd();
    try {
      process.chdir(cwd);
      expect(resolveRevision("HEAD")).toBe(second);
      expect(resolveRevision("HEAD~1")).toBe(first);
      expect(resolveRevision("HEAD~2")).toBeNull();
      const c = getCommit(second!);
      expect(c?.parent).toBe(first);
    } finally {
      process.chdir(prev);
    }
  });
});
