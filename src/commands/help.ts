import { spawnSync } from "child_process";
import * as manuals from "../manual";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

const BANNER = `
  ${CYAN}_         _   ${RESET}
 ${CYAN}| |       | |  ${RESET}
 ${CYAN}| |_ _ __ | |_ ${RESET}
 ${CYAN}| __| '_ \\| __|${RESET}
 ${CYAN}| |_| | | | |_ ${RESET}
  ${CYAN}\\__|_| |_|\\__|${RESET}
`;

const commands: Record<string, { desc: string; usage: string }> = {
  init: { desc: "Initialize a new repository", usage: "tnt init" },
  stage: { desc: "Stage files for commit", usage: "tnt stage <files...>" },
  summ: {
    desc: "Commit with a message",
    usage: "tnt summ <message> | tnt summ --amend [message]",
  },
  amend: {
    desc: "Amend the last commit",
    usage: "tnt amend [message]",
  },
  stats: {
    desc: "Show repository status",
    usage: "tnt stats [--patch|-p]",
  },
  diff: {
    desc: "Show unified diffs",
    usage: "tnt diff [--staged] [--stat] [path...]",
  },
  stash: {
    desc: "Park WIP changes",
    usage: "tnt stash [push|list|apply|pop|drop|show|clear]",
  },
  reset: {
    desc: "Move HEAD (soft only)",
    usage: "tnt reset --soft <rev>",
  },
  branch: { desc: "List or create branches", usage: "tnt branch [name]" },
  checkout: { desc: "Switch branches", usage: "tnt checkout <branch>" },
  delete: { desc: "Delete a branch", usage: "tnt delete <branch>" },
  log: { desc: "Show commit history", usage: "tnt log" },
  ls: { desc: "List all snapshots", usage: "tnt ls [-v] [-n <count>] [id]" },
  track: { desc: "Show all files with status", usage: "tnt track" },
  merge: { desc: "Merge branches", usage: "tnt -m <target> -u <upcoming>" },
  migrate: { desc: "Migrate to Git", usage: "tnt migrate -git" },
  convert: { desc: "Convert legacy v1 repo to format 2", usage: "tnt convert" },
  "cat-file": { desc: "Inspect an object", usage: "tnt cat-file [-t|-p] <hash>" },
  "ls-tree": { desc: "List a tree", usage: "tnt ls-tree [tree|commit|HEAD]" },
  "rev-parse": { desc: "Resolve a revision to a commit id", usage: "tnt rev-parse <rev>" },
  graph: { desc: "Show commit parent graph", usage: "tnt graph" },
  blast: { desc: "Remove all TNT configuration", usage: "tnt blast --confirm" },
  shell: { desc: "Open interactive shell", usage: "tnt shell" },
  upgrade: { desc: "Check for updates", usage: "tnt upgrade" },
  help: { desc: "Show help", usage: "tnt help [command]" },
};

const flags: Record<string, string> = {
  "-v, --version": "Show version",
  "-h, --help": "Show help",
  "-c": "Create branch",
  "-co": "Checkout branch",
  "-cnc": "Create and checkout branch",
  "-d": "Delete branch",
  "-m -u": "Merge branches",
  "--explain": "Narrate object-store operations (learner mode)",
};

function printGeneralHelp() {
  console.log(BANNER);
  console.log(
    `${DIM}Tiny Node Tooling — A lightweight version control system${RESET}\n`,
  );

  console.log(`${BOLD}Usage:${RESET} tnt <command> [options]\n`);

  console.log(`${BOLD}Commands:${RESET}`);
  for (const [name, { desc }] of Object.entries(commands)) {
    console.log(`  ${CYAN}${name.padEnd(10)}${RESET} ${DIM}${desc}${RESET}`);
  }

  console.log(`\n${BOLD}Flags:${RESET}`);
  for (const [flag, desc] of Object.entries(flags)) {
    console.log(`  ${YELLOW}${flag.padEnd(14)}${RESET} ${DIM}${desc}${RESET}`);
  }

  console.log(
    `\n${DIM}Run${RESET} tnt help <command> ${DIM}to open the manual${RESET}\n`,
  );
}

function openManual(commandName: string) {
  // allow "cat-file" → catfile export keys
  const key = commandName.replace(/-/g, "") as keyof typeof manuals;
  const manual =
    manuals[commandName as keyof typeof manuals] ?? manuals[key];

  if (!manual) {
    console.log(`\n${YELLOW}Unknown command: ${commandName}${RESET}`);
    console.log(
      `${DIM}Run${RESET} tnt help ${DIM}to see all commands${RESET}\n`,
    );
    return;
  }

  // Try to use 'less' as pager with ANSI color support
  const result = spawnSync("less", ["-R"], {
    input: manual,
    stdio: ["pipe", "inherit", "inherit"],
  });

  // If less failed (not installed), fall back to direct output
  if (result.error) {
    console.log(manual);
  }
}

export function help(commandName?: string) {
  if (commandName) {
    openManual(commandName);
  } else {
    printGeneralHelp();
  }
}
