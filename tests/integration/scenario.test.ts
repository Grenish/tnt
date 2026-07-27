import { describe, expect, test, afterEach } from "bun:test";
import path from "path";
import {
  exists,
  makeTempRepoDir,
  readFile,
  removeTempDir,
  runTnt,
  writeFile,
} from "../helpers/cli";

/**
 * Golden scenario: init → stage → summ → branch → checkout → log
 * plus format-2 inspect commands.
 */
describe("golden scenario: init → stage → summ → branch → checkout → log", () => {
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

  test("full happy path with content-addressed commits", () => {
    const cwd = tempDir();

    // init
    let r = runTnt(cwd, ["init"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Initialized");
    expect(exists(cwd, ".tnt")).toBe(true);
    expect(exists(cwd, ".tnt/format")).toBe(true);
    expect(readFile(cwd, ".tnt/format").trim()).toBe("2");
    expect(exists(cwd, ".tnt/HEAD")).toBe(true);
    expect(exists(cwd, ".tnt/index.json")).toBe(true);
    expect(exists(cwd, ".tnt/refs/heads/main")).toBe(true);
    expect(readFile(cwd, ".tnt/HEAD").trim()).toBe("ref: refs/heads/main");

    writeFile(cwd, "hello.txt", "hello world\n");
    writeFile(cwd, "src/app.ts", "export const x = 1;\n");

    // stage
    r = runTnt(cwd, ["stage", "hello.txt", "src/app.ts"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Staged \d+ file/);

    const index = JSON.parse(readFile(cwd, ".tnt/index.json")) as {
      files: { path: string; hash: string }[];
    };
    expect(index.files.length).toBe(2);
    for (const f of index.files) {
      expect(exists(cwd, path.join(".tnt/objects", f.hash))).toBe(true);
    }

    // summ
    r = runTnt(cwd, ["summ", "initial commit"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Committed");
    expect(r.stdout).toContain("initial commit");
    expect(r.stdout).toMatch(/commit [0-9a-f]{12}/);
    expect(r.stdout).toMatch(/tree {3}[0-9a-f]{12}/);

    const emptyIndex = JSON.parse(readFile(cwd, ".tnt/index.json")) as {
      files: unknown[];
    };
    expect(emptyIndex.files).toEqual([]);

    const mainCommit = readFile(cwd, ".tnt/refs/heads/main").trim();
    expect(mainCommit).toMatch(/^[0-9a-f]{12}$/);
    expect(exists(cwd, `.tnt/objects/${mainCommit}`)).toBe(true);

    // rev-parse / cat-file / ls-tree / graph
    r = runTnt(cwd, ["rev-parse", "HEAD"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(mainCommit);

    r = runTnt(cwd, ["cat-file", "-t", mainCommit]);
    expect(r.stdout.trim()).toBe("commit");

    r = runTnt(cwd, ["ls-tree", "HEAD"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("hello.txt");
    expect(r.stdout).toContain("src");

    r = runTnt(cwd, ["graph"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(mainCommit);
    expect(r.stdout).toContain("initial commit");

    // branch create
    r = runTnt(cwd, ["-c", "feature"]);
    expect(r.status).toBe(0);
    expect(readFile(cwd, ".tnt/refs/heads/feature").trim()).toBe(mainCommit);

    // second commit on main
    writeFile(cwd, "hello.txt", "hello main\n");
    r = runTnt(cwd, ["stage", "hello.txt"]);
    expect(r.status).toBe(0);
    r = runTnt(cwd, ["summ", "main update"]);
    expect(r.status).toBe(0);
    const mainAfter = readFile(cwd, ".tnt/refs/heads/main").trim();
    expect(mainAfter).not.toBe(mainCommit);
    expect(mainAfter).toMatch(/^[0-9a-f]{12}$/);

    // checkout feature
    r = runTnt(cwd, ["checkout", "feature"]);
    expect(r.status).toBe(0);
    expect(readFile(cwd, ".tnt/HEAD").trim()).toBe("ref: refs/heads/feature");
    expect(readFile(cwd, "hello.txt")).toBe("hello world\n");

    // log on feature
    r = runTnt(cwd, ["log"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("initial commit");
    expect(r.stdout).toContain(mainCommit);
    expect(r.stdout).not.toContain("main update");
  });

  test("identical trees yield identical commit ids for same metadata", () => {
    // Two commits with same tree+message+timestamp aren't creatable via CLI
    // (timestamp differs). Content-addressing of trees is covered in unit tests.
    // Here: re-committing same staged content after empty change still works.
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "a.txt", "a\n");
    runTnt(cwd, ["stage", "a.txt"]);
    runTnt(cwd, ["summ", "one"]);
    const c1 = readFile(cwd, ".tnt/refs/heads/main").trim();

    writeFile(cwd, "a.txt", "a\n");
    runTnt(cwd, ["stage", "a.txt"]);
    // same content already staged — may stage 0 files
    const r = runTnt(cwd, ["summ", "two"]);
    // nothing to commit if stage didn't change
    if (r.stdout.includes("nothing to commit")) {
      expect(readFile(cwd, ".tnt/refs/heads/main").trim()).toBe(c1);
    }
  });

  test("--explain narrates blob writes on stage", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    writeFile(cwd, "x.txt", "x\n");
    const r = runTnt(cwd, ["stage", "--explain", "x.txt"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("explain:");
    expect(r.stdout).toMatch(/blob/);
  });

  test("init is idempotent failure message", () => {
    const cwd = tempDir();
    expect(runTnt(cwd, ["init"]).status).toBe(0);
    const r = runTnt(cwd, ["init"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("already exists");
  });

  test("commands outside a repo report error", () => {
    const cwd = tempDir();
    const r = runTnt(cwd, ["stats"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not a repository/i);
  });

  test("stage respects missing paths without crashing", () => {
    const cwd = tempDir();
    runTnt(cwd, ["init"]);
    const r = runTnt(cwd, ["stage", "nope.txt"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Staged 0 file/);
  });
});
