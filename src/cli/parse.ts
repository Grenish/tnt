export interface ParsedArgs {
  action: string;
  target?: string;
  args?: string[];
  mergeTarget?: string;
  mergeUpcoming?: string;
  explain?: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const raw = argv.slice(2);

  let explain = false;
  const args = raw.filter((a) => {
    if (a === "--explain") {
      explain = true;
      return false;
    }
    return true;
  });

  if (args.length === 0) {
    return { action: "help", explain };
  }

  const [first, second] = args;

  if (first && first.startsWith("-")) {
    return { ...parseFlag(first, second, args), explain };
  }

  if (first === "migrate") {
    return { action: "migrate", target: second, explain };
  }

  if (first === "upgrade") {
    return { action: "upgrade", explain };
  }

  if (first === "version") {
    return { action: "version", explain };
  }

  if (first === "delete") {
    return { action: "delete-branch", target: second, explain };
  }

  if (first === "ls" || first === "list") {
    return { action: "list", args: args.slice(1), explain };
  }

  if (first === "stage") {
    return { action: "stage", args: args.slice(1), explain };
  }

  if (first === "diff") {
    return { action: "diff", args: args.slice(1), explain };
  }

  if (first === "stats") {
    return { action: "stats", args: args.slice(1), explain };
  }

  if (first === "cat-file") {
    return { action: "cat-file", args: args.slice(1), explain };
  }

  if (first === "ls-tree") {
    return { action: "ls-tree", target: second, explain };
  }

  if (first === "rev-parse") {
    return { action: "rev-parse", target: second, explain };
  }

  if (first === "graph") {
    return { action: "graph", explain };
  }

  if (first === "convert") {
    return { action: "convert", explain };
  }

  // summ may receive multi-word message + optional --amend
  if (first === "summ") {
    const rest = args.slice(1);
    const amend = rest.includes("--amend");
    const message =
      rest.filter((a) => a !== "--amend").join(" ") || undefined;
    return {
      action: "summ",
      target: message,
      args: amend ? ["--amend"] : [],
      explain,
    };
  }

  // alias: tnt amend [message]
  if (first === "amend") {
    return {
      action: "summ",
      target: args.slice(1).join(" ") || undefined,
      args: ["--amend"],
      explain,
    };
  }

  if (first === "stash") {
    return { action: "stash", args: args.slice(1), explain };
  }

  if (first === "reset") {
    return { action: "reset", args: args.slice(1), explain };
  }

  return {
    action: first ?? "help",
    target: second,
    explain,
  };
}

function parseMergeArgs(args: string[]): ParsedArgs {
  let mergeTarget: string | undefined;
  let mergeUpcoming: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "-m" && next) {
      mergeTarget = next;
      i++;
    } else if (arg === "-u" && next) {
      mergeUpcoming = next;
      i++;
    }
  }

  return { action: "merge", mergeTarget, mergeUpcoming };
}

function parseFlag(
  flag: string,
  target?: string,
  allArgs?: string[],
): ParsedArgs {
  switch (flag) {
    case "-c":
      return { action: "branch-create", target };

    case "-co":
      return { action: "checkout", target };

    case "-cnc":
      return { action: "branch-create-checkout", target };

    case "-d":
      return { action: "delete-branch", target };

    case "-m":
      return parseMergeArgs(allArgs || []);

    case "-v":
    case "--version":
      return { action: "version" };

    case "-h":
    case "--help":
      return { action: "help", target };

    default:
      return { action: "help" };
  }
}
