/**
 * Minimal benchmark hook for P0.
 *
 * Creates a synthetic tree, times stage + summ + stats, prints ms.
 * Run: bun run bench
 *
 * Not a scientific suite — a regression smoke for medium-ish trees.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(REPO_ROOT, "src", "index.ts");

const FILE_COUNT = Number(process.env.TNT_BENCH_FILES ?? 200);
const LINES_PER_FILE = Number(process.env.TNT_BENCH_LINES ?? 40);

function run(cwd: string, args: string[]): number {
  const start = performance.now();
  const result = spawnSync("bun", [CLI, ...args], {
    cwd,
    encoding: "utf-8",
    env: process.env,
  });
  const ms = performance.now() - start;
  if (result.status !== 0) {
    console.error(result.stdout, result.stderr);
    throw new Error(`tnt ${args.join(" ")} failed with status ${result.status}`);
  }
  return ms;
}

function main() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "tnt-bench-"));
  console.log(`TNT bench — files=${FILE_COUNT} lines/file=${LINES_PER_FILE}`);
  console.log(`temp: ${cwd}\n`);

  try {
    // synthetic tree
    for (let i = 0; i < FILE_COUNT; i++) {
      const dir = path.join(cwd, "src", `mod${i % 20}`);
      fs.mkdirSync(dir, { recursive: true });
      const body = Array.from(
        { length: LINES_PER_FILE },
        (_, j) => `// file ${i} line ${j}`,
      ).join("\n");
      fs.writeFileSync(path.join(dir, `f${i}.ts`), body + "\n");
    }

    const tInit = run(cwd, ["init"]);
    const tStage = run(cwd, ["stage", "."]);
    const tSumm = run(cwd, ["summ", "bench commit"]);
    const tStats = run(cwd, ["stats"]);

    // dirty a subset then stats again
    for (let i = 0; i < Math.min(20, FILE_COUNT); i++) {
      const p = path.join(cwd, "src", `mod${i % 20}`, `f${i}.ts`);
      fs.appendFileSync(p, "// changed\n");
    }
    const tStatsDirty = run(cwd, ["stats"]);

    const rows = [
      ["init", tInit],
      ["stage .", tStage],
      ["summ", tSumm],
      ["stats (clean)", tStats],
      ["stats (dirty)", tStatsDirty],
    ] as const;

    console.log("operation          ms");
    console.log("----------------  ------");
    for (const [name, ms] of rows) {
      console.log(`${name.padEnd(16)}  ${ms.toFixed(1)}`);
    }
    console.log(
      `\ntotal measured     ${(tInit + tStage + tSumm + tStats + tStatsDirty).toFixed(1)}`,
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

main();
