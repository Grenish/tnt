<p align="center">
  <pre>
    _         _   
   | |       | |  
   | |_ _ __ | |_ 
   | __| '_ \| __|
   | |_| | | | |_ 
    \__|_| |_|\__|
  </pre>
</p>

<h3 align="center">Tiny Node Tooling</h3>
<p align="center">A lightweight version control system — just for fun 💥</p>

---

## What is TNT?

TNT is a fun side project that implements a simple version control system from scratch using TypeScript and Bun. It's not meant to replace Git — it's a learning project and playground for exploring how VCS systems work under the hood.

## Features

- 📁 **Repository initialization** with `.tnt` directory structure
- 📝 **File staging** with content-addressed blob storage
- 💾 **Commits** with SHA-based hashing and parent tracking
- 🌿 **Branching** — create and switch between branches
- 🔀 **Merging** — simple version-based merge strategy
- 📊 **Status tracking** — see staged, modified, untracked, and deleted files
- 📜 **Commit history** — view linear commit log
- 🐚 **Interactive shell** — REPL mode for faster workflows
- 🚀 **Git migration** — export your TNT repo to a real Git repository
- 🙈 **Ignore patterns** — `.tntignore` file support

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tnt.git
cd tnt

# Install dependencies
bun install

# Build the project
bun run build

# Link globally (optional)
bun link
```

## Quick Start

```bash
# Initialize a new repository
tnt init

# Stage files
tnt stage .
tnt stage src/app.ts README.md

# Commit changes
tnt summ "Initial commit"

# Check status
tnt stats

# View history
tnt log
```

## Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `init` | Initialize a new repository | `tnt init` |
| `stage` | Stage files for commit | `tnt stage <files...>` |
| `summ` | Commit with a message | `tnt summ <message>` |
| `stats` | Show repository status | `tnt stats` |
| `branch` | List or create branches | `tnt branch [name]` |
| `checkout` | Switch branches | `tnt checkout <branch>` |
| `log` | Show commit history | `tnt log` |
| `merge` | Merge branches | `tnt -m <target> -u <source>` |
| `migrate` | Migrate to Git | `tnt migrate -git` |
| `shell` | Open interactive shell | `tnt shell` |
| `help` | Show help | `tnt help [command]` |

### Flags

| Flag | Description |
|------|-------------|
| `-c` | Create branch |
| `-co` | Checkout branch |
| `-cnc` | Create and checkout branch |
| `-m -u` | Merge branches |

## Branching

```bash
# List all branches
tnt branch

# Create a new branch
tnt -c feature/awesome

# Switch to a branch
tnt checkout feature/awesome

# Create and switch in one command
tnt -cnc feature/quick
```

## Merging

TNT uses a simple version-based merge strategy where the source branch wins on conflicts:

```bash
# Merge 'feature' branch into 'main'
tnt -m main -u feature
```

## Interactive Shell

Launch the TNT shell for a faster workflow:

```bash
tnt shell
```

The shell provides:
- Command aliases (`add` → `stage`, `commit` → `summ`, `st` → `stats`)
- Branch name in prompt
- Tab completion for commands

## .tntignore

TNT automatically creates a `.tntignore` file with sensible defaults when you run `tnt init`. You can customize it to ignore files and directories:

```
# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/

# Environment
.env
*.key

# IDE
.vscode/
.idea/
```

## Repository Structure

```
.tnt/
├── HEAD            # Points to current branch
├── index.json      # Staging area
├── objects/        # Content-addressed blob storage
├── commits/        # Commit metadata files
└── refs/
    └── heads/      # Branch references
        └── main    # Default branch
```

## Migrating to Git

When you're ready to move to a real Git repository:

```bash
tnt migrate -git
```

This will:
1. Initialize a Git repository
2. Replay all TNT commits preserving timestamps and messages
3. Create all branches
4. Backup `.tnt/` to `.tnt.bak/`

## Development

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# The CLI entry point
./dist/index.js
```

## Why "TNT"?

**T**iny **N**ode **T**ooling — because it's small, explosive fun, and built with Node/Bun! 💣

## License

MIT — Do whatever you want with it!

---

<p align="center">
  <i>This is a fun side project. For real version control, please use Git! 😄</i>
</p>