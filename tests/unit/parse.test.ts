import { describe, expect, test } from "bun:test";
import { parseArgs } from "../../src/cli/parse";

/** Build a fake argv: node, script, ...userArgs */
function argv(...userArgs: string[]): string[] {
  return ["bun", "src/index.ts", ...userArgs];
}

describe("parseArgs", () => {
  test("no args → help", () => {
    expect(parseArgs(argv()).action).toBe("help");
  });

  test("positional action and target", () => {
    expect(parseArgs(argv("checkout", "main"))).toEqual({
      action: "checkout",
      target: "main",
      explain: false,
    });
  });

  test("summ joins multi-word message", () => {
    expect(parseArgs(argv("summ", "hello", "world"))).toEqual({
      action: "summ",
      target: "hello world",
      args: [],
      explain: false,
    });
  });

  test("init alone", () => {
    expect(parseArgs(argv("init"))).toEqual({
      action: "init",
      target: undefined,
      explain: false,
    });
  });

  test("migrate -git", () => {
    expect(parseArgs(argv("migrate", "-git"))).toEqual({
      action: "migrate",
      target: "-git",
      explain: false,
    });
  });

  test("delete maps to delete-branch", () => {
    expect(parseArgs(argv("delete", "feature"))).toEqual({
      action: "delete-branch",
      target: "feature",
      explain: false,
    });
  });

  test("ls / list keep extra args", () => {
    expect(parseArgs(argv("ls", "-v", "-n", "5"))).toEqual({
      action: "list",
      args: ["-v", "-n", "5"],
      explain: false,
    });
    expect(parseArgs(argv("list", "abc"))).toEqual({
      action: "list",
      args: ["abc"],
      explain: false,
    });
  });

  test("stage keeps path args", () => {
    expect(parseArgs(argv("stage", "a.ts", "b.ts"))).toEqual({
      action: "stage",
      args: ["a.ts", "b.ts"],
      explain: false,
    });
  });

  test("inspect commands", () => {
    expect(parseArgs(argv("cat-file", "-t", "abc")).action).toBe("cat-file");
    expect(parseArgs(argv("ls-tree", "HEAD")).target).toBe("HEAD");
    expect(parseArgs(argv("rev-parse", "main")).action).toBe("rev-parse");
    expect(parseArgs(argv("graph")).action).toBe("graph");
    expect(parseArgs(argv("convert")).action).toBe("convert");
  });

  test("diff keeps flags and paths", () => {
    expect(parseArgs(argv("diff", "--staged", "src/"))).toEqual({
      action: "diff",
      args: ["--staged", "src/"],
      explain: false,
    });
  });

  test("stats can take --patch", () => {
    expect(parseArgs(argv("stats", "--patch"))).toEqual({
      action: "stats",
      args: ["--patch"],
      explain: false,
    });
  });

  test("summ --amend and amend alias", () => {
    expect(parseArgs(argv("summ", "--amend", "msg"))).toEqual({
      action: "summ",
      target: "msg",
      args: ["--amend"],
      explain: false,
    });
    expect(parseArgs(argv("amend", "only msg"))).toEqual({
      action: "summ",
      target: "only msg",
      args: ["--amend"],
      explain: false,
    });
  });

  test("stash and reset keep args", () => {
    expect(parseArgs(argv("stash", "pop", "1"))).toEqual({
      action: "stash",
      args: ["pop", "1"],
      explain: false,
    });
    expect(parseArgs(argv("reset", "--soft", "HEAD~1"))).toEqual({
      action: "reset",
      args: ["--soft", "HEAD~1"],
      explain: false,
    });
  });



  test("--explain is stripped and flagged", () => {
    const r = parseArgs(argv("stage", "--explain", "."));
    expect(r.explain).toBe(true);
    expect(r.action).toBe("stage");
    expect(r.args).toEqual(["."]);
  });

  test("flags: create / checkout / create-checkout / delete", () => {
    expect(parseArgs(argv("-c", "feat")).action).toBe("branch-create");
    expect(parseArgs(argv("-co", "main")).action).toBe("checkout");
    expect(parseArgs(argv("-cnc", "quick")).action).toBe(
      "branch-create-checkout",
    );
    expect(parseArgs(argv("-d", "old")).action).toBe("delete-branch");
  });

  test("merge -m target -u source", () => {
    expect(parseArgs(argv("-m", "main", "-u", "feature"))).toMatchObject({
      action: "merge",
      mergeTarget: "main",
      mergeUpcoming: "feature",
    });
  });

  test("version and help flags", () => {
    expect(parseArgs(argv("-v")).action).toBe("version");
    expect(parseArgs(argv("--version")).action).toBe("version");
    expect(parseArgs(argv("-h")).action).toBe("help");
    expect(parseArgs(argv("--help", "stage")).target).toBe("stage");
  });

  test("unknown flag falls back to help", () => {
    expect(parseArgs(argv("-xyz")).action).toBe("help");
  });
});
