# AGENT.md — TNT (Tiny Node Tooling)

Guidance for AI agents and contributors working in this repository.

## What this project is

**TNT** is a small educational version control system CLI, implemented from scratch in TypeScript. It is **not** a Git replacement. It exists to explore VCS concepts (blobs, staging, commits, branches, merge, ignore files) with a minimal codebase.

- **Package:** `@grenishrai/tnt` (npm bin: `tnt`)
- **Version source of truth:** `package.json` → `version`
- **License:** MIT
- **Author / repo:** grenishrai — https://github.com/grenishrai/tnt

When explaining TNT to users, keep the tone honest: fun side project / learning tool. Prefer Git for real work; TNT can migrate history into Git via `tnt migrate -git`.

## Tech stack

| Piece | Choice |
|-------|--------|
| Language | TypeScript (strict) |
| Runtime (dev) | Bun |
| Build | `bun build src/index.ts --outdir dist --target node` |
| Ship target | Node ≥ 18 (`dist/index.js`, shebang `#!/usr/bin/env node`) |
| Module system | ESM (`"type": "module"`) |
| Dependencies | **None** at runtime — only Node built-ins (`fs`, `path`, `crypto`, `readline`, `child_process`) |
| Dev deps | `@types/bun`, `@types/node`; TypeScript as peer |

Do **not** add heavy frameworks or VCS libraries unless explicitly requested. Prefer the same zero-dependency style as the rest of the tree.

## Repository layout

```
.
├── package.json          # name, version, bin, scripts
├── tsconfig.json         # strict TS, bundler resolution, noEmit
├── bun.lock
├── README.md             # user-facing docs
├── LICENSE
├── dist/                 # build output (published files only: "dist")
└── src/
    ├── index.ts          # CLI entry: parse → switch dispatch
    ├── cli/
    │   └── parse.ts      # argv / flag parsing
    ├── commands/         # one file per command implementation
    ├── manual/           # help text per command (used by `help`)
    │   └── index.ts      # re-exports manuals
    └── utils/
        └── objects.ts    # shared VCS primitives
```

### Tests & benchmarks (P0)

| Command | Purpose |
|---------|---------|
| `bun test` | Unit + CLI integration tests |
| `bun run bench` | Synthetic tree stage/summ/stats timings |

Layout:

```
tests/
  unit/           # pure helpers (hash, parse, ignore, diff)
  integration/    # temp-dir CLI scenarios via bun src/index.ts
  helpers/cli.ts  # runTnt, temp dirs
benchmarks/
  status-commit.ts
docs/
  FORMAT.md       # v1 on-disk format + limitations
```

Do not publish tests (`files: ["dist"]` only). Prefer Bun’s test runner; keep pure logic in `src/utils/` so unit tests stay filesystem-free where possible.


## Mental model: on-disk repo

A TNT repository is a directory containing `.tnt/` (and usually `.tntignore` at the project root).

```
.tnt/
├── format               # "2" (object model v2)
├── HEAD                 # "ref: refs/heads/<branch>" or detached commit id
├── index.json           # staging area: { files: [{ path, hash }] }
├── objects/             # typed blob | tree | commit objects
└── refs/heads/          # branch name → commit id (plain text files)
```

See `docs/FORMAT.md` for the full contract (including legacy format 1 + `tnt convert`).

### Data shapes (format 2)

```ts
FileEntry { path: string; hash: string }
Commit {
  id: string;             // content-addressed (hash of commit object)
  timestamp: string;      // ISO
  message: string;
  tree?: string;          // root tree object hash
  files: FileEntry[];     // materialized via tree walk (porcelain convenience)
  parent?: string;
}
```

- **Object payload:** `type size\\0content` — hash = SHA-256 of payload, **12 hex chars** (`store.ts`).
- **Trees:** nested directory objects; commits point at a **root tree**.
- **Learner mode:** `--explain`; inspect with `cat-file`, `ls-tree`, `rev-parse`, `graph`.
- **Ignore:** `.tntignore` + always-ignore `.tnt` and `.git`.

### Git-ish command naming (deliberate)

| TNT | Rough Git analogue |
|-----|--------------------|
| `stage` | `add` |
| `summ` | `commit` |
| `stats` | `status` |
| `diff` | `diff` (`--staged` = cached) |
| `stash` | `stash` (tracked WIP only) |
| `reset --soft` | `reset --soft` |
| `summ --amend` / `amend` | `commit --amend` |
| `ls` / `list` | list/show snapshots |
| `track` | file status overview |
| `blast` | remove TNT metadata |
| `migrate -git` | export to Git |

Shell aliases (in `commands/shell.ts`) map friendlier names (`add`, `commit`, `st`, etc.) onto these.

## Command → code map

| CLI | Implementation | Manual |
|-----|----------------|--------|
| `init` | `commands/init.ts` | `manual/init.ts` |
| `stage` | `commands/stage.ts` | `manual/stage.ts` |
| `summ` | `commands/summ.ts` | `manual/summ.ts` |
| `stats` | `commands/stats.ts` | `manual/stats.ts` |
| `track` | `commands/track.ts` | `manual/track.ts` |
| `branch` / create | `commands/branch.ts` | `manual/branch.ts` |
| `delete` / `-d` | `deleteBranch` in `branch.ts` | `manual/delete.ts` |
| `checkout` / `-co` | `commands/checkout.ts` | `manual/checkout.ts` |
| `log` | `commands/log.ts` | `manual/log.ts` |
| `ls` / `list` | `commands/list.ts` | `manual/list.ts` |
| `merge` (`-m` / `-u`) | `commands/merge.ts` | `manual/merge.ts` |
| `migrate` | `commands/migrate.ts` | `manual/migrate.ts` |
| `shell` / `sh` | `commands/shell.ts` | `manual/shell.ts` |
| `blast` | `commands/blast.ts` | `manual/blast.ts` |
| `upgrade` | `commands/upgrade.ts` | `manual/upgrade.ts` |
| `version` / `-v` | `commands/version.ts` | `manual/version.ts` |
| `help` / `-h` | `commands/help.ts` | `manual/help.ts` |

**Dispatch path:** `src/index.ts` imports handlers and switches on `parseArgs(process.argv)`.

**Parsing path:** `src/cli/parse.ts`

- Positional: `tnt <action> [target]`
- Flags: `-c`, `-co`, `-cnc`, `-d`, `-m`/`-u`, `-v`/`--version`, `-h`/`--help`
- Special cases: `migrate`, `upgrade`, `version`, `delete`, `ls`/`list` (extra args)

## How to add a new command

Do all of the following; partial wiring leaves help and shell out of sync.

1. **Implement** `src/commands/<name>.ts` exporting a function (e.g. `export function foo(...)`).
2. **Manual** `src/manual/<name>.ts` exporting `manual` (same pattern as siblings: title, usage, description, examples).
3. **Export** the manual from `src/manual/index.ts`.
4. **Register** import + `case` in `src/index.ts`.
5. **Parse** new flags/args in `src/cli/parse.ts` if needed.
6. **Help catalog** update the `commands` / `flags` maps in `src/commands/help.ts`.
7. **Shell** (if interactive support is desired) handle the command and aliases in `src/commands/shell.ts`.
8. **README** user-facing docs if the feature is public.

Shared VCS logic belongs in `src/utils/objects.ts` (or a new util module if it grows large). Prefer reusing:

- `getTntDir`, `isRepo`
- `storeBlob`, `getBlob`, `hashContent`, `hashFile`
- `getCurrentBranch`, `getCurrentCommit`, `updateBranchCommit`
- `getCommit`, `collectFiles`, ignore helpers
- types `FileEntry`, `Commit`; staging type `Index` from `commands/stage.ts`

## Coding conventions

- **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, etc.). Match existing style: named exports, plain functions, little OOP.
- **Imports:** relative paths with `.ts` extensions where the project already uses them; ESM-friendly.
- **I/O:** synchronous `fs` is the norm (CLI scripts). Use `async` only where already used (e.g. merge confirmation via `readline`).
- **UX:** ANSI colors via local constants (`BOLD`, `DIM`, `RESET`, `GREEN`, `RED`, `YELLOW`, `CYAN`) — copy from a nearby command file; no chalk.
- **Errors:** print `tnt: ...` messages to stdout and `return`; do not throw for expected user mistakes (not a repo, missing branch, empty staging).
- **Repo checks:** most commands start with `isRepo(cwd)` and early-return if false.
- **Safety:** destructive ops (`blast`, merge apply, migrate) should confirm or require an explicit flag (`--confirm` for blast). Do not weaken that without a clear reason.
- **Text files:** content is generally read/written as UTF-8. Binary support is not a first-class feature today; do not silently corrupt binaries if you touch file I/O.

## Important behavioral constraints

Keep these unless the user explicitly wants a design change:

1. **Staging is content-addressed** — stage stores blobs under `objects/` and records `{ path, hash }` in `index.json`.
2. **Commits are full snapshots** of tracked paths (merge of parent files + staged overrides), not pack/delta objects.
3. **Merge strategy is source-wins** (`-u` into `-m`): overlapping paths take the source hash; target-only files are kept. Interactive y/n confirmation before apply.
4. **Checkout** restores target commit blobs and removes files present in current commit but not target. It does **not** implement full dirty-worktree conflict detection like Git.
5. **Cannot delete the current branch**; deleting `main`/`master` only warns.
6. **`migrate -git`** requires clean working tree, no existing `.git/`, then replays history and backs up `.tnt` → `.tnt.bak`.
7. **Always ignore** `.tnt` and `.git` regardless of `.tntignore`.
8. **Publish surface** is only `dist/` — source is not published to npm.

## Dev commands

```bash
bun install              # install deps
bun run dev              # run CLI from source: bun src/index.ts
bun run build            # produce dist/index.js
bun run prepublishOnly   # build before publish
```

Manual smoke (from a temp dir or sample project):

```bash
bun run dev init
bun run dev stage .
bun run dev summ "message"
bun run dev stats
bun run dev log
bun run dev ls
bun run dev track
bun run dev help stage
```

After changing CLI entry or build config, rebuild before testing the global `tnt` bin against `dist/`.

## Version and package metadata

- Bump `package.json` `version` when releasing.
- `version` / `upgrade` resolve package metadata from filesystem paths relative to the built/source file; keep `name` containing `tnt` so version detection continues to work.
- npm package name: `@grenishrai/tnt`. Upgrade flow talks to npm for latest version.

## What not to do

- Do not turn this into a full Git reimplementation (remotes, packfiles, 3-way merge, indexes like Git’s) unless asked.
- Do not add runtime dependencies for problems solvable with Node stdlib.
- Do not rewrite command names in user-facing docs without updating code, shell aliases, manuals, and README together.
- Do not commit `.tnt/` from test runs, secrets, or large generated fixtures into this git repo unless intentional.
- Do not expand scope into unrelated features (web UI, server, cloud sync) without an explicit request.

## Quick reference: flags

| Flag | Action |
|------|--------|
| `-c <name>` | Create branch |
| `-co <name>` | Checkout branch |
| `-cnc <name>` | Create + checkout |
| `-d <name>` | Delete branch |
| `-m <target> -u <source>` | Merge source into target |
| `-v` / `--version` | Version |
| `-h` / `--help` | Help |

## Orientation for common tasks

| Task | Start here |
|------|------------|
| Fix staging / blobs | `commands/stage.ts`, `utils/objects.ts` (`storeBlob`) |
| Fix commit graph / parent | `commands/summ.ts`, `getCommit` / `updateBranchCommit` |
| Status / diffs | `commands/stats.ts`, `commands/track.ts` |
| Branch pointers | `commands/branch.ts`, `HEAD` + `refs/heads` |
| Working tree restore | `commands/checkout.ts`, `getBlob` |
| Merge logic | `commands/merge.ts` |
| Git export | `commands/migrate.ts` |
| Ignore rules | `utils/objects.ts` (`parseIgnorePatterns`, `matchesPattern`) |
| CLI routing bugs | `cli/parse.ts`, `index.ts` |
| Help text wrong | `manual/*`, `commands/help.ts` |

---

*This file is for agents and maintainers. End-user documentation lives in `README.md`.*
