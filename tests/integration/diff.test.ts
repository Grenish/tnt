import { describe, expect, test, afterEach } from "bun:test";
import {
  makeTempRepoDir,
  removeTempDir,
  runTnt,
  writeFile,
} from "../helpers/cli";

describe("tnt diff", () => {
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

  test("unstaged worktree vs index shows unified patch", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "note.txt", "line1\n");
    runTnt(cwd, ["stage", "note.txt"]);
    runTnt(cwd, ["summ", "add note"]);

    writeFile(cwd, "note.txt", "line1\nline2\n");

    const r = runTnt(cwd, ["diff", "--no-pager", "--no-color"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--- a/note.txt");
    expect(r.stdout).toContain("+++ b/note.txt");
    expect(r.stdout).toContain("+line2");
  });

  test("--staged shows index vs HEAD", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "a.txt", "v1\n");
    runTnt(cwd, ["stage", "a.txt"]);
    runTnt(cwd, ["summ", "first"]);

    writeFile(cwd, "a.txt", "v2\n");
    runTnt(cwd, ["stage", "a.txt"]);

    const staged = runTnt(cwd, ["diff", "--staged", "--no-pager", "--no-color"]);
    expect(staged.status).toBe(0);
    expect(staged.stdout).toContain("--- a/a.txt");
    expect(staged.stdout).toContain("-v1");
    expect(staged.stdout).toContain("+v2");

    // unstaged should be empty (worktree matches index)
    const unstaged = runTnt(cwd, ["diff", "--no-pager", "--no-color"]);
    expect(unstaged.stdout.trim()).toBe("");
  });

  test("path filter limits output", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "keep.txt", "k\n");
    writeFile(cwd, "skip.txt", "s\n");
    runTnt(cwd, ["stage", "."]);
    runTnt(cwd, ["summ", "both"]);

    writeFile(cwd, "keep.txt", "k2\n");
    writeFile(cwd, "skip.txt", "s2\n");

    const r = runTnt(cwd, ["diff", "--no-pager", "--no-color", "keep.txt"]);
    expect(r.stdout).toContain("keep.txt");
    expect(r.stdout).not.toContain("skip.txt");
  });

  test("--stat prints summary", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "f.txt", "a\n");
    runTnt(cwd, ["stage", "f.txt"]);
    runTnt(cwd, ["summ", "x"]);
    writeFile(cwd, "f.txt", "a\nb\n");

    const r = runTnt(cwd, ["diff", "--stat"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("f.txt");
    expect(r.stdout).toMatch(/file\(s\) changed/);
  });

  test("clean tree prints nothing", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "f.txt", "a\n");
    runTnt(cwd, ["stage", "f.txt"]);
    runTnt(cwd, ["summ", "x"]);

    const r = runTnt(cwd, ["diff", "--no-pager"]);
    expect(r.stdout.trim()).toBe("");
  });
});
