import * as readline from "readline";
import { init } from "./init";
import { stage } from "./stage";
import { summ } from "./summ";
import { stats } from "./stats";
import { branch } from "./branch";
import { checkout } from "./checkout";
import { log } from "./log";
import { migrate } from "./migrate";
import { merge } from "./merge";
import { help } from "./help";
import { catFile } from "./cat-file";
import { lsTree } from "./ls-tree";
import { revParse } from "./rev-parse";
import { graph } from "./graph";
import { convert } from "./convert";
import { diffCommand } from "./diff";
import { stashCommand } from "./stash";
import { resetCommand } from "./reset";
import { getCurrentBranch, isRepo, setExplain } from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

function getPrompt(): string {
  const cwd = process.cwd();
  const branchName = getCurrentBranch(cwd) || "detached";
  return `${CYAN}tnt${RESET}(${GREEN}${branchName}${RESET})${BOLD}>${RESET} `;
}

function printWelcome() {
  console.log(`
${CYAN}  _         _   ${RESET}
${CYAN} | |       | |  ${RESET}
${CYAN} | |_ _ __ | |_ ${RESET}
${CYAN} | __| '_ \\| __|${RESET}
${CYAN} | |_| | | | |_ ${RESET}
${CYAN}  \\__|_| |_|\\__|${RESET}

${BOLD}TNT Shell${RESET} ${DIM}— Interactive mode${RESET}

${DIM}Type commands without 'tnt' prefix.${RESET}
${DIM}Type${RESET} help ${DIM}for commands,${RESET} exit ${DIM}or${RESET} Ctrl+D ${DIM}to quit.${RESET}
`);
}

function parseShellCommand(input: string): { cmd: string; args: string[] } {
  const trimmed = input.trim();

  // Handle quoted strings properly
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = "";
    } else if (char === " " && !inQuotes) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  const [cmd = "", ...args] = parts;
  return { cmd: cmd.toLowerCase(), args };
}

function executeCommand(cmd: string, args: string[]): boolean {
  switch (cmd) {
    case "":
      // Empty input, just show new prompt
      return true;

    case "exit":
    case "quit":
    case "/q":
      console.log(`\n${DIM}Goodbye!${RESET}\n`);
      return false;

    case "help":
    case "?":
      if (args[0]) {
        help(args[0]);
      } else {
        printShellHelp();
      }
      return true;

    case "init":
      init();
      return true;

    case "stage":
    case "add":
      if (args.length === 0) {
        console.log(`${YELLOW}Usage: stage <files...>${RESET}`);
      } else {
        stage(args);
      }
      return true;

    case "summ":
    case "commit": {
      const amend = args.includes("--amend");
      const message =
        args.filter((a) => a !== "--amend").join(" ") || undefined;
      summ(message, { amend });
      return true;
    }

    case "amend":
      summ(args.join(" ") || undefined, { amend: true });
      return true;

    case "stats":
    case "status":
    case "st":
      stats(args);
      return true;

    case "diff":
    case "d":
      diffCommand(args);
      return true;

    case "stash":
      stashCommand(args);
      return true;

    case "reset":
      resetCommand(args);
      return true;

    case "branch":
    case "br":
      branch(args[0]);
      return true;

    case "checkout":
    case "co":
      if (args.length === 0) {
        console.log(`${YELLOW}Usage: checkout <branch>${RESET}`);
      } else {
        checkout(args[0]);
      }
      return true;

    case "log":
      log();
      return true;

    case "migrate":
      migrate(args[0]);
      return true;

    case "merge":
      if (args.length < 2) {
        console.log(`${YELLOW}Usage: merge <target> <upcoming>${RESET}`);
        console.log(`${DIM}Example: merge main feature${RESET}`);
      } else {
        merge(args[0], args[1]);
      }
      return true;

    case "cat-file":
      catFile(args);
      return true;

    case "ls-tree":
      lsTree(args[0]);
      return true;

    case "rev-parse":
      revParse(args[0]);
      return true;

    case "graph":
      graph();
      return true;

    case "convert":
      convert();
      return true;

    case "explain":
      // toggle learner narration for subsequent shell commands
      setExplain(args[0] !== "off");
      console.log(
        `${DIM}explain ${args[0] === "off" ? "off" : "on"}${RESET}`,
      );
      return true;

    case "clear":
    case "cls":
      console.clear();
      return true;

    case "pwd":
      console.log(process.cwd());
      return true;

    default:
      console.log(`${RED}Unknown command:${RESET} ${cmd}`);
      console.log(
        `${DIM}Type${RESET} help ${DIM}for available commands${RESET}`,
      );
      return true;
  }
}

function printShellHelp() {
  console.log(`
${BOLD}Available Commands:${RESET}

  ${CYAN}init${RESET}              Initialize a new repository
  ${CYAN}stage${RESET} <files>     Stage files for commit ${DIM}(alias: add)${RESET}
  ${CYAN}summ${RESET} <message>    Commit with a message ${DIM}(alias: commit)${RESET}
  ${CYAN}amend${RESET} [message]   Amend last commit ${DIM}(or summ --amend)${RESET}
  ${CYAN}stats${RESET}             Show repository status ${DIM}(alias: status, st)${RESET}
  ${CYAN}diff${RESET} [opts]       Show unified diffs ${DIM}(alias: d)${RESET}
  ${CYAN}stash${RESET} […]         Park / restore WIP
  ${CYAN}reset --soft${RESET} <r>  Move HEAD, keep worktree
  ${CYAN}branch${RESET} [name]     List or create branches ${DIM}(alias: br)${RESET}
  ${CYAN}checkout${RESET} <branch> Switch branches ${DIM}(alias: co)${RESET}
  ${CYAN}log${RESET}               Show commit history
  ${CYAN}merge${RESET} <t> <u>     Merge branch <u> into <t>
  ${CYAN}migrate -git${RESET}      Migrate to Git
  ${CYAN}help${RESET} [command]    Show help ${DIM}(alias: ?)${RESET}
  ${CYAN}clear${RESET}             Clear the screen ${DIM}(alias: cls)${RESET}
  ${CYAN}pwd${RESET}               Print working directory
  ${CYAN}exit${RESET}              Exit the shell ${DIM}(alias: quit, /q, Ctrl+D)${RESET}

${DIM}Tip: Commands work the same as outside the shell, just without 'tnt' prefix.${RESET}
`);
}

export function shell() {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log(`${RED}tnt: not a repository${RESET}`);
    console.log(
      `${DIM}Run${RESET} tnt init ${DIM}first, or use${RESET} tnt shell ${DIM}inside a TNT repository.${RESET}\n`,
    );
    return;
  }

  printWelcome();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(),
    terminal: true,
  });

  rl.prompt();

  rl.on("line", (line) => {
    const { cmd, args } = parseShellCommand(line);
    const shouldContinue = executeCommand(cmd, args);

    if (shouldContinue) {
      // Update prompt in case branch changed
      rl.setPrompt(getPrompt());
      rl.prompt();
    } else {
      rl.close();
    }
  });

  rl.on("close", () => {
    // Handle Ctrl+D
    console.log(`\n${DIM}Goodbye!${RESET}\n`);
    process.exit(0);
  });
}
