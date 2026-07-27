import { describe, expect, test, afterEach } from "bun:test";
import {
  makeTempRepoDir,
  removeTempDir,
  runTnt,
  writeFile,
  readFile,
  exists,
} from "../helpers/cli";

describe("P3 recovery: stash, amend, soft reset", () => {
  const temps: string[] = [];

  afterEach(() => {
    while (temps.length) {
      const dir = temps.pop();
      if (dir) removeTempDir(dir);
    }
  });

  function tempDir(): string {
    const dir = makeTempRepoDir();
    temps.push(dir);
    return dir;
  }

  function setupCommit(cwd: string, content = "v1\n") {
    runTnt(cwd, ["init"]);
    writeFile(cwd, "f.txt", content);
    runTnt(cwd, ["stage", "f.txt"]);
    runTnt(cwd, ["summ", "first"]);
  }

  test("stash push then pop restores WIP", () => {
    const cwd = tempDir();
    setupCommit(cwd);

    writeFile(cwd, "f.txt", "v2-wip\n");
    const push = runTnt(cwd, ["stash", "push", "my wip"]);
    expect(push.status).toBe(0);
    expect(push.stdout).toContain("stash@{0}");
    expect(readFile(cwd, "f.txt")).toBe("v1\n");
    expect(exists(cwd, ".tnt/stash.json")).toBe(true);

    const list = runTnt(cwd, ["stash", "list"]);
    expect(list.stdout).toContain("my wip");

    const pop = runTnt(cwd, ["stash", "pop"]);
    expect(pop.status).toBe(0);
    expect(readFile(cwd, "f.txt")).toBe("v2-wip\n");

    const list2 = runTnt(cwd, ["stash", "list"]);
    expect(list2.stdout).toMatch(/No stash/i);
  });

  test("stash apply keeps entry", () => {
    const cwd = tempDir();
    setupCommit(cwd);
    writeFile(cwd, "f.txt", "stashed\n");
    runTnt(cwd, ["stash"]);
    expect(readFile(cwd, "f.txt")).toBe("v1\n");

    runTnt(cwd, ["stash", "apply"]);
    expect(readFile(cwd, "f.txt")).toBe("stashed\n");

    const list = runTnt(cwd, ["stash", "list"]);
    expect(list.stdout).toContain("stash@{0}");
  });

  test("summ --amend changes message and keeps parent root", () => {
    const cwd = tempDir();
    setupCommit(cwd);
    const before = readFile(cwd, ".tnt/refs/heads/main").trim();

    const r = runTnt(cwd, ["summ", "--amend", "fixed message"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Amended");
    expect(r.stdout).toContain("fixed message");

    const after = readFile(cwd, ".tnt/refs/heads/main").trim();
    expect(after).not.toBe(before);

    const log = runTnt(cwd, ["log"]);
    expect(log.stdout).toContain("fixed message");
    expect(log.stdout).not.toContain("first");
  });

  test("amend with staged file updates tree", () => {
    const cwd = tempDir();
    setupCommit(cwd);
    writeFile(cwd, "f.txt", "v2\n");
    runTnt(cwd, ["stage", "f.txt"]);

    const r = runTnt(cwd, ["amend"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Amended");

    // clean index
    writeFile(cwd, "f.txt", "v2\n");
    const diff = runTnt(cwd, ["diff", "--no-pager", "--no-color"]);
    expect(diff.stdout.trim()).toBe("");
  });

  test("reset --soft HEAD~1 moves tip, keeps worktree", () => {
    const cwd = tempDir();
    setupCommit(cwd);
    writeFile(cwd, "f.txt", "v2\n");
    runTnt(cwd, ["stage", "f.txt"]);
    runTnt(cwd, ["summ", "second"]);

    const tip = readFile(cwd, ".tnt/refs/heads/main").trim();
    writeFile(cwd, "f.txt", "dirty\n");

    const r = runTnt(cwd, ["reset", "--soft", "HEAD~1"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Soft reset");

    const now = readFile(cwd, ".tnt/refs/heads/main").trim();
    expect(now).not.toBe(tip);
    // worktree untouched
    expect(readFile(cwd, "f.txt")).toBe("dirty\n");

    const log = runTnt(cwd, ["log"]);
    expect(log.stdout).toContain("first");
    expect(log.stdout).not.toContain("second");
  });

  test("reset without --soft explains usage", () => {
    const cwd = tempDir();
    setupCommit(cwd);
    const r = runTnt(cwd, ["reset", "HEAD~1"]);
    expect(r.stdout).toMatch(/--soft/i);
  });
});
