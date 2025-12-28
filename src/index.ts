#!/usr/bin/env node

import { parseArgs } from "./cli/parse";
import { init } from "./commands/init";
import { stage } from "./commands/stage";
import { summ } from "./commands/summ";
import { stats } from "./commands/stats";
import { branch } from "./commands/branch";
import { checkout } from "./commands/checkout";
import { log } from "./commands/log";
import { migrate } from "./commands/migrate";
import { shell } from "./commands/shell";
import { merge } from "./commands/merge";
import { help } from "./commands/help";
import { version } from "./commands/version";
import { upgrade } from "./commands/upgrade";

const { action, target, mergeTarget, mergeUpcoming } = parseArgs(process.argv);

switch (action) {
  case "init":
    init();
    break;

  case "stage":
    stage(process.argv.slice(3));
    break;

  case "summ":
    summ(target);
    break;

  case "stats":
    stats();
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

  case "help":
    help(target);
    break;

  case "version":
    version();
    break;

  case "upgrade":
    upgrade();
    break;

  default:
    help();
}
