#!/usr/bin/env node

import { parseArgs } from "./cli/parse";
import { setExplain } from "./utils/objects";
import { init } from "./commands/init";
import { stage } from "./commands/stage";
import { summ } from "./commands/summ";
import { stats } from "./commands/stats";
import { branch, deleteBranch } from "./commands/branch";
import { checkout } from "./commands/checkout";
import { log } from "./commands/log";
import { migrate } from "./commands/migrate";
import { shell } from "./commands/shell";
import { merge } from "./commands/merge";
import { help } from "./commands/help";
import { version } from "./commands/version";
import { upgrade } from "./commands/upgrade";
import { blast } from "./commands/blast";
import { list } from "./commands/list";
import { track } from "./commands/track";
import { catFile } from "./commands/cat-file";
import { lsTree } from "./commands/ls-tree";
import { revParse } from "./commands/rev-parse";
import { graph } from "./commands/graph";
import { convert } from "./commands/convert";
import { diffCommand } from "./commands/diff";
import { stashCommand } from "./commands/stash";
import { resetCommand } from "./commands/reset";

const { action, target, args, mergeTarget, mergeUpcoming, explain } =
  parseArgs(process.argv);

setExplain(!!explain);

switch (action) {
  case "init":
    init();
    break;

  case "stage":
    stage(args ?? []);
    break;

  case "summ":
    summ(target, { amend: !!args?.includes("--amend") });
    break;

  case "stats":
    stats(args ?? []);
    break;

  case "diff":
    diffCommand(args ?? []);
    break;

  case "stash":
    stashCommand(args ?? []);
    break;

  case "reset":
    resetCommand(args ?? []);
    break;

  case "branch":
    branch(target);
    break;

  case "log":
    log();
    break;

  case "checkout":
    checkout(target);
    break;

  case "migrate":
    migrate(target);
    break;

  case "shell":
  case "sh":
    shell();
    break;

  case "merge":
    merge(mergeTarget, mergeUpcoming);
    break;

  case "branch-create":
    branch(target);
    break;

  case "branch-create-checkout":
    branch(target);
    checkout(target);
    break;

  case "delete-branch":
    deleteBranch(target);
    break;

  case "help":
    help(target);
    break;

  case "version":
    version();
    break;

  case "upgrade":
    upgrade();
    break;

  case "blast":
    blast(target);
    break;

  case "list":
    list(args);
    break;

  case "track":
    track();
    break;

  case "cat-file":
    catFile(args ?? []);
    break;

  case "ls-tree":
    lsTree(target);
    break;

  case "rev-parse":
    revParse(target);
    break;

  case "graph":
    graph();
    break;

  case "convert":
    convert();
    break;

  default:
    help();
}
